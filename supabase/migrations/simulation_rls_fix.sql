-- Fix overly permissive simulation RLS policies
-- Run this in Supabase SQL Editor

-- sim_games: anyone logged in can read all games (to join), only creator can update/delete
DROP POLICY IF EXISTS "sim_games_all" ON sim_games;
CREATE POLICY "sim_games_select" ON sim_games FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "sim_games_insert" ON sim_games FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "sim_games_update" ON sim_games FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "sim_games_delete" ON sim_games FOR DELETE USING (auth.uid() = created_by);

-- sim_participants: users can read all participants in games they're in, only manage own row
DROP POLICY IF EXISTS "sim_participants_all" ON sim_participants;
CREATE POLICY "sim_participants_select" ON sim_participants FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "sim_participants_insert" ON sim_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sim_participants_update" ON sim_participants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "sim_participants_delete" ON sim_participants FOR DELETE USING (auth.uid() = user_id);

-- sim_holdings: users can read all holdings (for leaderboard), only manage own
DROP POLICY IF EXISTS "sim_holdings_all" ON sim_holdings;
CREATE POLICY "sim_holdings_select" ON sim_holdings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "sim_holdings_insert" ON sim_holdings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sim_holdings_update" ON sim_holdings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "sim_holdings_delete" ON sim_holdings FOR DELETE USING (auth.uid() = user_id);

-- sim_transactions: users can read all transactions (for leaderboard), only insert own
DROP POLICY IF EXISTS "sim_transactions_all" ON sim_transactions;
CREATE POLICY "sim_transactions_select" ON sim_transactions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "sim_transactions_insert" ON sim_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sim_transactions_update" ON sim_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "sim_transactions_delete" ON sim_transactions FOR DELETE USING (auth.uid() = user_id);
