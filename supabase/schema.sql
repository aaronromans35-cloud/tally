-- Enable RLS
alter table auth.users enable row level security;

-- PROFILES
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  age integer,
  annual_income numeric,
  monthly_expenses numeric,
  risk_tolerance text check (risk_tolerance in ('conservative', 'moderate', 'aggressive')),
  retirement_age integer default 65,
  tax_filing_status text check (tax_filing_status in ('single', 'married_filing_jointly', 'married_filing_separately', 'head_of_household')) default 'single',
  state text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "Users can manage own profile" on profiles for all using (auth.uid() = id);

-- GOALS
create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  type text check (type in ('retirement', 'house', 'education', 'emergency_fund', 'travel', 'other')),
  target_amount numeric,
  target_date date,
  current_amount numeric default 0,
  priority integer default 1,
  created_at timestamptz default now()
);
alter table goals enable row level security;
create policy "Users can manage own goals" on goals for all using (auth.uid() = user_id);

-- BUDGET CATEGORIES
create table budget_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  type text check (type in ('income', 'expense')) not null,
  monthly_budget numeric,
  color text default '#6366f1',
  icon text default 'circle',
  created_at timestamptz default now()
);
alter table budget_categories enable row level security;
create policy "Users can manage own categories" on budget_categories for all using (auth.uid() = user_id);

-- TRANSACTIONS
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  category_id uuid references budget_categories(id) on delete set null,
  amount numeric not null,
  type text check (type in ('income', 'expense')) not null,
  description text,
  date date not null default current_date,
  created_at timestamptz default now()
);
alter table transactions enable row level security;
create policy "Users can manage own transactions" on transactions for all using (auth.uid() = user_id);

-- DEBTS
create table debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  type text check (type in ('credit_card', 'student_loan', 'mortgage', 'auto_loan', 'personal_loan', 'medical', 'other')),
  balance numeric not null,
  interest_rate numeric not null,
  minimum_payment numeric not null,
  payoff_strategy text check (payoff_strategy in ('snowball', 'avalanche')) default 'avalanche',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table debts enable row level security;
create policy "Users can manage own debts" on debts for all using (auth.uid() = user_id);

-- PORTFOLIO HOLDINGS
create table holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  ticker text not null,
  name text,
  shares numeric not null,
  avg_cost_basis numeric,
  account_type text check (account_type in ('taxable', 'traditional_ira', 'roth_ira', '401k', 'hsa', 'other')) default 'taxable',
  asset_class text check (asset_class in ('us_equity', 'intl_equity', 'bonds', 'commodities', 'real_estate', 'cash', 'crypto', 'other')) default 'us_equity',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table holdings enable row level security;
create policy "Users can manage own holdings" on holdings for all using (auth.uid() = user_id);

-- WATCHLIST
create table watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  ticker text not null,
  name text,
  added_at timestamptz default now(),
  unique(user_id, ticker)
);
alter table watchlist enable row level security;
create policy "Users can manage own watchlist" on watchlist for all using (auth.uid() = user_id);

-- AI PLAN SNAPSHOTS (cache generated plans)
create table financial_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  plan_json jsonb not null,
  generated_at timestamptz default now()
);
alter table financial_plans enable row level security;
create policy "Users can manage own plans" on financial_plans for all using (auth.uid() = user_id);

-- Insert default budget categories for new users (called via trigger or app code)

-- Add bucket column to budget_categories (run this if upgrading existing DB)
-- alter table budget_categories add column if not exists bucket text default 'variable';
