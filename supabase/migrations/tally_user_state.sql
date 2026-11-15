-- Tally — cloud copy of a signed-in user's budget.
--
-- One JSON document per user. The app keeps working from localStorage and
-- mirrors every change here (see app/api/tally/state/route.ts), so signing in
-- on a second device shows the same budget.
--
-- Safe to run more than once.

create table if not exists tally_user_state (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  state      jsonb not null,
  version    integer not null default 2,
  updated_at timestamptz not null default now(),
  -- Defence in depth: the API caps the payload too.
  constraint tally_user_state_size check (pg_column_size(state) < 700000)
);

alter table tally_user_state enable row level security;

drop policy if exists "state: read own" on tally_user_state;
create policy "state: read own" on tally_user_state
  for select using (user_id = auth.uid());

drop policy if exists "state: insert own" on tally_user_state;
create policy "state: insert own" on tally_user_state
  for insert with check (user_id = auth.uid());

drop policy if exists "state: update own" on tally_user_state;
create policy "state: update own" on tally_user_state
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "state: delete own" on tally_user_state;
create policy "state: delete own" on tally_user_state
  for delete using (user_id = auth.uid());

-- Signed-in role only; anonymous visitors have no business here.
revoke all on tally_user_state from anon;
grant select, insert, update, delete on tally_user_state to authenticated;
