-- Stock Market Simulation tables

CREATE TABLE IF NOT EXISTS sim_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  start_cash NUMERIC DEFAULT 10000,
  end_date TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sim_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES sim_games(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  cash NUMERIC DEFAULT 10000,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, user_id)
);

CREATE TABLE IF NOT EXISTS sim_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES sim_games(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  ticker TEXT NOT NULL,
  shares NUMERIC NOT NULL DEFAULT 0,
  avg_cost NUMERIC NOT NULL DEFAULT 0,
  UNIQUE(game_id, user_id, ticker)
);

CREATE TABLE IF NOT EXISTS sim_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES sim_games(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  ticker TEXT NOT NULL,
  action TEXT NOT NULL,
  shares NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE sim_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE sim_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sim_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sim_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sim_games_all" ON sim_games FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "sim_participants_all" ON sim_participants FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "sim_holdings_all" ON sim_holdings FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "sim_transactions_all" ON sim_transactions FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
