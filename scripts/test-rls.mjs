/**
 * RLS proof harness.
 *
 * Loads supabase/migrations/tally_core.sql into a real Postgres (PGlite, WASM)
 * and asserts the access-control model actually holds. This exists because
 * "RLS is enabled" is not the same claim as "RLS isolates users" — the
 * published Supabase breaches were all apps that believed the first and never
 * tested the second.
 *
 *   node scripts/test-rls.mjs
 *
 * Exits non-zero if any isolation guarantee is violated.
 */
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'

const ALICE = '11111111-1111-1111-1111-111111111111' // adult
const BOB = '22222222-2222-2222-2222-222222222222' // unrelated adult
const GUARD = '33333333-3333-3333-3333-333333333333' // guardian
const TEEN = '44444444-4444-4444-4444-444444444444' // teen linked to GUARD

let pass = 0
let fail = 0

function check(name, ok, detail = '') {
  if (ok) {
    pass++
    console.log(`  \x1b[32m✓\x1b[0m ${name}`)
  } else {
    fail++
    console.log(`  \x1b[31m✗ ${name}\x1b[0m ${detail}`)
  }
}

/**
 * Run as a given logged-in user, the way Supabase sets the JWT claim.
 *
 * NOTE: `SET LOCAL` is a no-op outside an explicit transaction, which silently
 * leaves you as the (superuser) owner — and the owner bypasses RLS, so every
 * assertion passes for the wrong reason. Session-level SET ROLE is required.
 */
async function asUser(db, uid, fn) {
  await db.exec(`reset role; set role authenticated;`)
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [uid])
  try {
    return await fn()
  } finally {
    await db.exec('reset role')
  }
}

/** Returns row count, or 'DENIED' if the statement was refused outright. */
async function count(db, sql) {
  try {
    const r = await db.query(sql)
    return r.rows.length
  } catch {
    return 'DENIED'
  }
}

/** Runs a statement (or several) and reports whether Postgres allowed it. */
async function attempt(db, sql) {
  try {
    await db.exec(sql)
    return 'ALLOWED'
  } catch (e) {
    return `DENIED: ${e.message.slice(0, 70)}`
  }
}

const db = await PGlite.create()

// ---------------------------------------------------------------------------
// Stand in for the parts of Supabase that aren't Postgres itself.
// ---------------------------------------------------------------------------
await db.exec(`
  create schema if not exists auth;

  create table auth.users (
    id    uuid primary key,
    email text
  );

  -- Mirrors Supabase's real auth.uid() implementation.
  create or replace function auth.uid() returns uuid
  language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;

  -- The roles PostgREST uses, named exactly as Supabase names them so the
  -- migration's own conditional grants are exercised here too. Critically
  -- NEITHER is the table owner — the owner bypasses RLS, which would make
  -- every assertion below pass for the wrong reason.
  create role authenticated nologin;
  create role anon nologin;
  create role service_role nologin bypassrls;
`)

await db.exec(`
  insert into auth.users (id, email) values
    ('${ALICE}', 'alice@example.com'),
    ('${BOB}',   'bob@example.com'),
    ('${GUARD}', 'guardian@example.com'),
    ('${TEEN}',  'teen@example.com');
`)

// ---------------------------------------------------------------------------
// The migration under test
// ---------------------------------------------------------------------------
const migration = readFileSync(
  new URL('../supabase/migrations/tally_core.sql', import.meta.url),
  'utf8',
)
try {
  await db.exec(migration)
  console.log('\n\x1b[1mMigration applied cleanly.\x1b[0m\n')
} catch (e) {
  console.error('\n\x1b[31mMIGRATION FAILED:\x1b[0m', e.message)
  process.exit(1)
}

// Grant table privileges the way Supabase does. RLS then narrows from there.
await db.exec(`
  grant usage on schema public to authenticated, anon;
  -- Real Supabase grants anon/authenticated access to auth.uid().
  grant usage on schema auth to authenticated, anon;
  grant execute on function auth.uid() to authenticated, anon;
  grant select, insert, update, delete on all tables in schema public
    to authenticated;
  grant select on all tables in schema public to anon;
  -- NOTE: execute on tally_can_view is deliberately NOT granted here. The
  -- migration must grant it itself, or a real deployment breaks. Leaving it
  -- out keeps that a tested property rather than an assumption.
`)

// ---------------------------------------------------------------------------
// Seed as owner (bypasses RLS, which is what a service role would do).
// ---------------------------------------------------------------------------
await db.exec(`
  insert into tally_profiles (id, display_name, date_of_birth, role, tier) values
    ('${ALICE}', 'Alice', '1996-04-02', 'adult',    'plus'),
    ('${BOB}',   'Bob',   '1994-07-19', 'adult',    'free'),
    ('${GUARD}', 'Dana',  '1983-01-11', 'guardian', 'family');

  insert into tally_profiles (id, display_name, date_of_birth, role, guardian_id, tier)
    values ('${TEEN}', 'Max', '2010-06-15', 'teen', '${GUARD}', 'free');

  insert into tally_buckets (user_id, name, kind, limit_cents) values
    ('${ALICE}', 'Food',   'spend', 20000),
    ('${BOB}',   'Gas',    'spend', 15000),
    ('${TEEN}',  'Snacks', 'spend',  4000);

  insert into tally_transactions (user_id, amount_cents, merchant) values
    ('${ALICE}', -1250, 'Cafe'),
    ('${BOB}',   -3000, 'Shell'),
    ('${TEEN}',   -650, 'Vending');

  insert into tally_ai_messages (user_id, role, content) values
    ('${TEEN}', 'user', 'how do I stop overspending on snacks');

  insert into tally_plaid_items (user_id, plaid_item_id, plaid_access_token)
    values ('${ALICE}', 'item-alice', 'access-sandbox-SECRET-TOKEN');

  insert into tally_goals (user_id, name, target_cents) values
    ('${TEEN}', 'Concert ticket', 9000);

  insert into tally_streaks (user_id, current_days) values ('${TEEN}', 5);

  -- Seeded so the "anon sees nothing" checks can't pass just by being empty.
  insert into tally_subscriptions (user_id, name, amount_cents) values
    ('${TEEN}', 'Spotify', 1099);

  insert into tally_bank_accounts (user_id, plaid_account_id, institution_name, mask)
    values ('${ALICE}', 'acct-alice', 'Chase', '4321');
`)

console.log('\x1b[1m1. Tenant isolation — strangers must not see each other\x1b[0m')
await asUser(db, ALICE, async () => {
  check('Alice sees only her own bucket', (await count(db, 'select * from tally_buckets')) === 1)
  check(
    'Alice sees only her own transaction',
    (await count(db, 'select * from tally_transactions')) === 1,
  )
  const r = await db.query('select name from tally_buckets')
  check("Alice cannot see Bob's 'Gas' bucket", !JSON.stringify(r.rows).includes('Gas'))
})
await asUser(db, BOB, async () => {
  const r = await db.query('select merchant from tally_transactions')
  check("Bob cannot see Alice's 'Cafe' transaction", !JSON.stringify(r.rows).includes('Cafe'))
})

console.log('\n\x1b[1m2. IDOR — targeting a known row id must still fail\x1b[0m')
const teenBucket = (await db.query(`select id from tally_buckets where user_id='${TEEN}'`)).rows[0].id
await asUser(db, BOB, async () => {
  check(
    "Bob cannot read the teen's bucket by its exact id",
    (await count(db, `select * from tally_buckets where id='${teenBucket}'`)) === 0,
  )
  await attempt(db, `update tally_buckets set limit_cents=999999 where id='${teenBucket}'`)
  await attempt(db, `delete from tally_buckets where id='${teenBucket}'`)
})
const afterBob = (
  await db.query(`select limit_cents from tally_buckets where id='${teenBucket}'`)
).rows
check("Bob's blind DELETE did not remove the teen's bucket", afterBob.length === 1)
check(
  "teen's bucket limit is unchanged after Bob's UPDATE",
  afterBob[0]?.limit_cents === 4000,
  `got ${afterBob[0]?.limit_cents}`,
)

console.log('\n\x1b[1m3. Guardian model — view yes, edit no\x1b[0m')
await asUser(db, GUARD, async () => {
  check(
    "Guardian CAN see the linked teen's buckets",
    (await count(db, `select * from tally_buckets where user_id='${TEEN}'`)) === 1,
  )
  check(
    "Guardian CAN see the teen's transactions",
    (await count(db, `select * from tally_transactions where user_id='${TEEN}'`)) === 1,
  )
  check(
    "Guardian CAN see the teen's goals",
    (await count(db, `select * from tally_goals where user_id='${TEEN}'`)) === 1,
  )
  check(
    "Guardian CAN see the teen's profile",
    (await count(db, `select * from tally_profiles where id='${TEEN}'`)) === 1,
  )

  await db.query(`update tally_buckets set limit_cents=1 where user_id='${TEEN}'`)
  const row = (await db.query(`select limit_cents from tally_buckets where user_id='${TEEN}'`)).rows[0]
  check("Guardian CANNOT edit the teen's bucket", row.limit_cents === 4000, `limit became ${row.limit_cents}`)

  check(
    "Guardian CANNOT read the teen's AI coach messages (privacy)",
    (await count(db, `select * from tally_ai_messages where user_id='${TEEN}'`)) === 0,
  )
})

console.log('\n\x1b[1m4. Unrelated adult must not inherit guardian powers\x1b[0m')
await asUser(db, ALICE, async () => {
  check(
    "Alice (not the guardian) cannot see the teen's buckets",
    (await count(db, `select * from tally_buckets where user_id='${TEEN}'`)) === 0,
  )
  check(
    "Alice cannot see the teen's profile",
    (await count(db, `select * from tally_profiles where id='${TEEN}'`)) === 0,
  )
})

console.log('\n\x1b[1m5. Plaid access tokens must be unreadable by ANY client\x1b[0m')
for (const [label, uid] of [['owner Alice', ALICE], ['guardian', GUARD], ['stranger Bob', BOB]]) {
  await asUser(db, uid, async () => {
    check(
      `${label} cannot read tally_plaid_items`,
      (await count(db, 'select * from tally_plaid_items')) === 0,
    )
  })
}
await asUser(db, ALICE, async () => {
  const res = await attempt(
    db,
    `insert into tally_plaid_items (user_id, plaid_item_id, plaid_access_token)
     values ('${ALICE}','forged','stolen')`,
  )
  check('Nobody can forge a Plaid item row', res.startsWith('DENIED'), res)
})

console.log('\n\x1b[1m6. Anonymous (no JWT) must see nothing\x1b[0m')
await db.exec(`reset role; set role anon;`)
await db.query(`select set_config('request.jwt.claim.sub', '', false)`)
for (const t of [
  'tally_profiles',
  'tally_buckets',
  'tally_transactions',
  'tally_goals',
  'tally_subscriptions',
  'tally_streaks',
  'tally_bank_accounts',
  'tally_plaid_items',
  'tally_ai_messages',
]) {
  check(`anon reads 0 rows from ${t}`, (await count(db, `select * from ${t}`)) === 0)
}
await db.exec('reset role')

console.log('\n\x1b[1m7. Privilege escalation — can a user hand themselves a paid tier?\x1b[0m')
let tierAttempt = ''
await asUser(db, TEEN, async () => {
  tierAttempt = await attempt(db, `update tally_profiles set tier='family' where id='${TEEN}'`)
})
const teenTier = (await db.query(`select tier from tally_profiles where id='${TEEN}'`)).rows[0].tier
check(
  'self-upgrading tier is refused by the database',
  teenTier === 'free' && tierAttempt.includes('TALLY_PROTECTED_COLUMN'),
  `tier='${teenTier}', result=${tierAttempt}`,
)

// The other billing/identity columns must be equally locked down.
for (const [col, val] of [
  ['role', `'guardian'`],
  ['tier_source', `'stripe'`],
  ['date_of_birth', `'1990-01-01'`],
]) {
  let r = ''
  await asUser(db, TEEN, async () => {
    r = await attempt(db, `update tally_profiles set ${col}=${val} where id='${TEEN}'`)
  })
  check(`self-editing ${col} is refused`, r.includes('TALLY_PROTECTED_COLUMN'), r)
}

// A teen must not be able to re-parent themselves to a different guardian.
let reparent = ''
await asUser(db, TEEN, async () => {
  reparent = await attempt(db, `update tally_profiles set guardian_id='${ALICE}' where id='${TEEN}'`)
})
check('teen cannot reassign their own guardian', reparent.includes('TALLY_PROTECTED_COLUMN'), reparent)

// But harmless self-service edits must still work, or the app is broken.
let rename = ''
await asUser(db, TEEN, async () => {
  rename = await attempt(db, `update tally_profiles set display_name='Maxwell' where id='${TEEN}'`)
})
const newName = (await db.query(`select display_name from tally_profiles where id='${TEEN}'`)).rows[0]
  .display_name
check('teen CAN still rename themselves', rename === 'ALLOWED' && newName === 'Maxwell', `${rename} name=${newName}`)

console.log('\n\x1b[1m8. Age gate is enforced by the database, not just the app\x1b[0m')
const tooYoung = new Date()
tooYoung.setFullYear(tooYoung.getFullYear() - 11)
const res11 = await attempt(
  db,
  `insert into auth.users (id,email) values ('55555555-5555-5555-5555-555555555555','kid@example.com');
   insert into tally_profiles (id, display_name, date_of_birth)
   values ('55555555-5555-5555-5555-555555555555','Kid','${tooYoung.toISOString().slice(0, 10)}')`,
)
check('an 11-year-old cannot be inserted', res11.includes('TALLY_UNDER_13'), res11)

const ok14 = new Date()
ok14.setFullYear(ok14.getFullYear() - 14)
const res14 = await attempt(
  db,
  `insert into auth.users (id,email) values ('66666666-6666-6666-6666-666666666666','t14@example.com');
   insert into tally_profiles (id, display_name, date_of_birth, role)
   values ('66666666-6666-6666-6666-666666666666','Fourteen','${ok14.toISOString().slice(0, 10)}','teen')`,
)
check('a 14-year-old CAN be inserted', res14 === 'ALLOWED', res14)

console.log('\n\x1b[1m9. Constraint sanity\x1b[0m')
check(
  'a profile cannot be its own guardian',
  (await attempt(db, `update tally_profiles set guardian_id=id where id='${TEEN}'`)).startsWith('DENIED'),
)
check(
  'money cannot be stored as a float (integer column)',
  (await attempt(db, `insert into tally_goals (user_id,name,target_cents) values ('${ALICE}','x',10.57)`))
    !== 'ALLOWED' ||
    (await db.query(`select target_cents from tally_goals where name='x'`)).rows[0]?.target_cents === 11,
)
check(
  'a goal with a zero target is refused',
  (await attempt(db, `insert into tally_goals (user_id,name,target_cents) values ('${ALICE}','z',0)`)).startsWith('DENIED'),
)

console.log(
  `\n${'─'.repeat(58)}\n\x1b[1mRESULT\x1b[0m  ${pass} passed, ${fail} failed\n${'─'.repeat(58)}\n`,
)
process.exit(fail > 0 ? 1 : 0)
