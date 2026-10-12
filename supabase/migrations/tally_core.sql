-- ============================================================================
-- Tally — core schema
-- ============================================================================
-- Design rules enforced here (see docs/LAUNCH-PLAN.md for the why):
--
--  1. RLS is enabled on EVERY table, in the same statement block that creates
--     it. Research on vibe-coded Supabase apps found 57% allowed
--     unauthenticated table reads; the cause is always a table that shipped
--     without RLS. There is no table in this file without a policy decision.
--
--  2. RLS answers ONE question: "who owns this row." Paywall/entitlement
--     checks are deliberately NOT in RLS — they live in server route handlers.
--     Mixing the two makes both harder to audit.
--
--  3. Money is stored as integer CENTS. Never floats.
--
--  4. Guardians can VIEW a linked teen's data but not EDIT it. The teen owns
--     their own budget; the parent gets visibility. That's the product stance
--     and the legal one (see the Guardian Model decision).
--
--  5. Plaid access tokens live in a table with RLS on and ZERO policies, so
--     no browser-side key can ever read them. Only the service role can.
--
--  6. Under-13 signups are refused by a trigger, not just by app code.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
do $$ begin
  create type tally_role   as enum ('teen', 'guardian', 'adult');
exception when duplicate_object then null; end $$;

do $$ begin
  -- free | $5 | $10 | $20
  create type tally_tier   as enum ('free', 'starter', 'plus', 'family');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tally_bucket_kind as enum ('spend', 'save');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tally_txn_source  as enum ('manual', 'csv', 'plaid');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tally_sub_status   as enum ('active', 'trialing', 'canceled');
exception when duplicate_object then null; end $$;


-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table if not exists tally_profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  display_name   text,
  -- Collected solely for age assurance (COPPA/state-law age gating). This is
  -- the minimum viable datum for that purpose; do not add more identity data.
  date_of_birth  date not null,
  role           tally_role not null default 'adult',
  -- A teen's entitlements resolve through their guardian. Null for adults.
  guardian_id    uuid references tally_profiles(id) on delete set null,
  tier           tally_tier not null default 'free',
  -- 'default' | 'master' (seeded test account) | 'stripe' | 'comp'
  tier_source    text not null default 'default',
  tier_renews_on date,
  onboarded_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- A profile can never be its own guardian.
  constraint tally_profiles_no_self_guardian check (guardian_id is null or guardian_id <> id)
);

-- Refuse under-13 accounts at the database boundary. App-layer age gating can
-- be bypassed by anyone calling the API directly; this cannot.
create or replace function tally_reject_under_13()
returns trigger
language plpgsql
as $$
begin
  if new.date_of_birth > (current_date - interval '13 years') then
    raise exception 'TALLY_UNDER_13: accounts are not available under 13';
  end if;
  return new;
end $$;

drop trigger if exists tally_profiles_age_gate on tally_profiles;
create trigger tally_profiles_age_gate
  before insert or update of date_of_birth on tally_profiles
  for each row execute function tally_reject_under_13();

-- Keep updated_at honest.
create or replace function tally_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Privilege-escalation guard  (found by scripts/test-rls.mjs)
-- ---------------------------------------------------------------------------
-- RLS decides WHICH ROWS you may update, never WHICH COLUMNS. Without this
-- trigger, "update own profile" lets any signed-in user run
--     update tally_profiles set tier='family' where id = auth.uid()
-- straight against the REST API with their own token, and hand themselves the
-- $20 plan for free. Billing-controlled and identity-controlled columns are
-- therefore writable only by trusted server code.
--
-- The test: a normal session always has a JWT subject claim, so auth.uid()
-- is non-null and equals the row being edited. The service role (used by our
-- own route handlers) and the migration owner carry no such claim, so they
-- pass through.
-- SECURITY DEFINER so the guard never depends on the calling role holding
-- privileges on the auth schema. If auth.uid() were to raise instead of
-- return, the guard would fail open on some paths and block legitimate
-- self-service edits on others.
create or replace function tally_guard_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if auth.uid() is not null and auth.uid() = old.id then
    if new.tier           is distinct from old.tier
    or new.tier_source    is distinct from old.tier_source
    or new.tier_renews_on is distinct from old.tier_renews_on
    or new.role           is distinct from old.role
    or new.guardian_id    is distinct from old.guardian_id
    or new.date_of_birth  is distinct from old.date_of_birth then
      raise exception
        'TALLY_PROTECTED_COLUMN: tier, tier_source, tier_renews_on, role, guardian_id and date_of_birth cannot be changed by the account holder';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists tally_profiles_guard_privileged on tally_profiles;
create trigger tally_profiles_guard_privileged
  before update on tally_profiles
  for each row execute function tally_guard_privileged_columns();

drop trigger if exists tally_profiles_touch on tally_profiles;
create trigger tally_profiles_touch
  before update on tally_profiles
  for each row execute function tally_touch_updated_at();

alter table tally_profiles enable row level security;

-- Note: these policies compare columns on the SAME row only. They must never
-- sub-query tally_profiles, or the policy would recurse into itself.
drop policy if exists "profile: read own or own teen" on tally_profiles;
create policy "profile: read own or own teen" on tally_profiles
  for select using (id = auth.uid() or guardian_id = auth.uid());

drop policy if exists "profile: insert self only" on tally_profiles;
create policy "profile: insert self only" on tally_profiles
  for insert with check (id = auth.uid());

drop policy if exists "profile: update self only" on tally_profiles;
create policy "profile: update self only" on tally_profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "profile: delete self only" on tally_profiles;
create policy "profile: delete self only" on tally_profiles
  for delete using (id = auth.uid());


-- ---------------------------------------------------------------------------
-- Visibility helper
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER so it can read tally_profiles without being filtered by
-- that table's own RLS (which would otherwise make guardian lookups fail).
-- search_path is pinned to defeat search_path-hijack attacks.
create or replace function tally_can_view(p_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p_owner = auth.uid()
      or exists (
           select 1 from tally_profiles
            where tally_profiles.id = p_owner
              and tally_profiles.guardian_id = auth.uid()
         );
$$;

-- Drop the implicit PUBLIC execute grant, then hand it back to exactly the two
-- PostgREST roles. This matters: every policy below calls this function, so if
-- the signed-in role cannot execute it, every query errors instead of simply
-- returning no rows — the whole app breaks. `anon` needs it too, so its
-- queries evaluate to "no rows" rather than a permission error.
revoke all on function tally_can_view(uuid) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant execute on function tally_can_view(uuid) to authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant execute on function tally_can_view(uuid) to anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function tally_can_view(uuid) to service_role;
  end if;
end $$;


-- ---------------------------------------------------------------------------
-- Buckets
-- ---------------------------------------------------------------------------
create table if not exists tally_buckets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references tally_profiles(id) on delete cascade,
  name        text not null check (length(trim(name)) between 1 and 40),
  kind        tally_bucket_kind not null default 'spend',
  limit_cents integer not null default 0 check (limit_cents >= 0),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists tally_buckets_user_idx on tally_buckets(user_id);
alter table tally_buckets enable row level security;

drop policy if exists "bucket: view own or teen" on tally_buckets;
create policy "bucket: view own or teen" on tally_buckets
  for select using (tally_can_view(user_id));

drop policy if exists "bucket: write own" on tally_buckets;
create policy "bucket: write own" on tally_buckets
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());


-- ---------------------------------------------------------------------------
-- Transactions
-- ---------------------------------------------------------------------------
create table if not exists tally_transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references tally_profiles(id) on delete cascade,
  bucket_id    uuid references tally_buckets(id) on delete set null,
  -- Negative = money out, positive = money in.
  amount_cents integer not null,
  merchant     text not null default '' check (length(merchant) <= 120),
  note         text check (length(note) <= 280),
  occurred_on  date not null default current_date,
  source       tally_txn_source not null default 'manual',
  -- Set only for Plaid-sourced rows; makes re-sync idempotent.
  plaid_txn_id text,
  created_at   timestamptz not null default now(),
  unique (user_id, plaid_txn_id)
);
create index if not exists tally_txn_user_date_idx on tally_transactions(user_id, occurred_on desc);
alter table tally_transactions enable row level security;

drop policy if exists "txn: view own or teen" on tally_transactions;
create policy "txn: view own or teen" on tally_transactions
  for select using (tally_can_view(user_id));

drop policy if exists "txn: write own" on tally_transactions;
create policy "txn: write own" on tally_transactions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());


-- ---------------------------------------------------------------------------
-- Goals
-- ---------------------------------------------------------------------------
create table if not exists tally_goals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references tally_profiles(id) on delete cascade,
  name         text not null check (length(trim(name)) between 1 and 60),
  target_cents integer not null check (target_cents > 0),
  saved_cents  integer not null default 0 check (saved_cents >= 0),
  target_date  date,
  created_at   timestamptz not null default now()
);
create index if not exists tally_goals_user_idx on tally_goals(user_id);
alter table tally_goals enable row level security;

drop policy if exists "goal: view own or teen" on tally_goals;
create policy "goal: view own or teen" on tally_goals
  for select using (tally_can_view(user_id));

drop policy if exists "goal: write own" on tally_goals;
create policy "goal: write own" on tally_goals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());


-- ---------------------------------------------------------------------------
-- Subscriptions (recurring charges Tally tracks for the user)
-- ---------------------------------------------------------------------------
create table if not exists tally_subscriptions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references tally_profiles(id) on delete cascade,
  name           text not null check (length(trim(name)) between 1 and 60),
  amount_cents   integer not null check (amount_cents >= 0),
  cadence        text not null default 'monthly'
                   check (cadence in ('weekly','monthly','yearly')),
  next_charge_on date,
  status         tally_sub_status not null default 'active',
  trial_ends_on  date,
  created_at     timestamptz not null default now()
);
create index if not exists tally_subs_user_idx on tally_subscriptions(user_id);
alter table tally_subscriptions enable row level security;

drop policy if exists "sub: view own or teen" on tally_subscriptions;
create policy "sub: view own or teen" on tally_subscriptions
  for select using (tally_can_view(user_id));

drop policy if exists "sub: write own" on tally_subscriptions;
create policy "sub: write own" on tally_subscriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());


-- ---------------------------------------------------------------------------
-- Streak
-- ---------------------------------------------------------------------------
create table if not exists tally_streaks (
  user_id           uuid primary key references tally_profiles(id) on delete cascade,
  current_days      integer not null default 0 check (current_days >= 0),
  longest_days      integer not null default 0 check (longest_days >= 0),
  last_counted_on   date,
  freezes_remaining integer not null default 1 check (freezes_remaining >= 0),
  freeze_week_of    date,
  updated_at        timestamptz not null default now()
);
alter table tally_streaks enable row level security;

drop policy if exists "streak: view own or teen" on tally_streaks;
create policy "streak: view own or teen" on tally_streaks
  for select using (tally_can_view(user_id));

drop policy if exists "streak: write own" on tally_streaks;
create policy "streak: write own" on tally_streaks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());


-- ---------------------------------------------------------------------------
-- Plaid: linked accounts (safe to read) + items (NEVER client-readable)
-- ---------------------------------------------------------------------------
create table if not exists tally_bank_accounts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references tally_profiles(id) on delete cascade,
  plaid_account_id  text not null,
  institution_name  text not null default '',
  -- Last 4 only. Never store a full account number.
  mask              text check (length(mask) <= 4),
  account_type      text,
  current_cents     integer,
  available_cents   integer,
  last_synced_at    timestamptz,
  created_at        timestamptz not null default now(),
  unique (user_id, plaid_account_id)
);
create index if not exists tally_bank_user_idx on tally_bank_accounts(user_id);
alter table tally_bank_accounts enable row level security;

drop policy if exists "bank: view own or teen" on tally_bank_accounts;
create policy "bank: view own or teen" on tally_bank_accounts
  for select using (tally_can_view(user_id));

drop policy if exists "bank: write own" on tally_bank_accounts;
create policy "bank: write own" on tally_bank_accounts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());


-- Access tokens. RLS is ON and there are intentionally ZERO policies, which
-- means every anon/authenticated query returns nothing and every write is
-- refused. Only the service role (BYPASSRLS) can touch this table, and the
-- service role key exists only on the server. Do not add a policy here.
create table if not exists tally_plaid_items (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references tally_profiles(id) on delete cascade,
  plaid_item_id      text not null unique,
  plaid_access_token text not null,
  institution_name   text,
  created_at         timestamptz not null default now()
);
alter table tally_plaid_items enable row level security;


-- ---------------------------------------------------------------------------
-- AI coach transcript
-- ---------------------------------------------------------------------------
create table if not exists tally_ai_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references tally_profiles(id) on delete cascade,
  role       text not null check (role in ('user', 'assistant')),
  content    text not null check (length(content) <= 8000),
  created_at timestamptz not null default now()
);
create index if not exists tally_ai_user_idx on tally_ai_messages(user_id, created_at desc);
alter table tally_ai_messages enable row level security;

-- Deliberately NOT visible to guardians. A teen asking an AI coach "how do I
-- stop overspending" should not be surveilled; that chills the whole feature.
-- Guardians see budget data, not conversations.
drop policy if exists "ai: own only" on tally_ai_messages;
create policy "ai: own only" on tally_ai_messages
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());


-- ---------------------------------------------------------------------------
-- Guardian invites
-- ---------------------------------------------------------------------------
create table if not exists tally_guardian_invites (
  id           uuid primary key default gen_random_uuid(),
  guardian_id  uuid not null references tally_profiles(id) on delete cascade,
  teen_email   text not null,
  code         text not null unique,
  expires_at   timestamptz not null,
  accepted_at  timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists tally_invite_code_idx on tally_guardian_invites(code);
alter table tally_guardian_invites enable row level security;

drop policy if exists "invite: guardian manages own" on tally_guardian_invites;
create policy "invite: guardian manages own" on tally_guardian_invites
  for all using (guardian_id = auth.uid()) with check (guardian_id = auth.uid());
