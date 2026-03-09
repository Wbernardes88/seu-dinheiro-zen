
-- Drop all RESTRICTIVE policies and recreate as PERMISSIVE

-- couples
DROP POLICY IF EXISTS "Authenticated can create couple" ON public.couples;
DROP POLICY IF EXISTS "Members can update couple" ON public.couples;
DROP POLICY IF EXISTS "Members can view couple" ON public.couples;

CREATE POLICY "Authenticated can create couple" ON public.couples FOR INSERT TO authenticated WITH CHECK (NOT EXISTS (SELECT 1 FROM couple_members WHERE couple_members.user_id = auth.uid()));
CREATE POLICY "Members can update couple" ON public.couples FOR UPDATE USING (id = get_user_couple_id());
CREATE POLICY "Members can view couple" ON public.couples FOR SELECT USING (id = get_user_couple_id());

-- couple_members
DROP POLICY IF EXISTS "Authenticated can join couple" ON public.couple_members;
DROP POLICY IF EXISTS "Members can delete self" ON public.couple_members;
DROP POLICY IF EXISTS "Members can view couple members" ON public.couple_members;

CREATE POLICY "Authenticated can join couple" ON public.couple_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Members can delete self" ON public.couple_members FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Members can view couple members" ON public.couple_members FOR SELECT USING (couple_id = get_user_couple_id());

-- couple_invites
DROP POLICY IF EXISTS "Creator can view invites" ON public.couple_invites;
DROP POLICY IF EXISTS "Invite can be claimed" ON public.couple_invites;
DROP POLICY IF EXISTS "Members can create invites" ON public.couple_invites;

CREATE POLICY "Creator can view invites" ON public.couple_invites FOR SELECT USING ((created_by = auth.uid()) OR (couple_id = get_user_couple_id()));
CREATE POLICY "Invite can be claimed" ON public.couple_invites FOR UPDATE TO authenticated USING ((used_by IS NULL) AND (expires_at > now())) WITH CHECK (used_by = auth.uid());
CREATE POLICY "Members can create invites" ON public.couple_invites FOR INSERT TO authenticated WITH CHECK (couple_id = get_user_couple_id());

-- categories
DROP POLICY IF EXISTS "Members can delete categories" ON public.categories;
DROP POLICY IF EXISTS "Members can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Members can update categories" ON public.categories;
DROP POLICY IF EXISTS "Members can view categories" ON public.categories;

CREATE POLICY "Members can delete categories" ON public.categories FOR DELETE USING (couple_id = get_user_couple_id());
CREATE POLICY "Members can insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (couple_id = get_user_couple_id());
CREATE POLICY "Members can update categories" ON public.categories FOR UPDATE USING (couple_id = get_user_couple_id());
CREATE POLICY "Members can view categories" ON public.categories FOR SELECT USING (couple_id = get_user_couple_id());

-- transactions
DROP POLICY IF EXISTS "Members can delete own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Members can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Members can view transactions" ON public.transactions;

CREATE POLICY "Members can delete own transactions" ON public.transactions FOR DELETE USING ((couple_id = get_user_couple_id()) AND (user_id = auth.uid()));
CREATE POLICY "Members can insert transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK ((couple_id = get_user_couple_id()) AND (user_id = auth.uid()));
CREATE POLICY "Members can view transactions" ON public.transactions FOR SELECT USING (couple_id = get_user_couple_id());

-- budget_limits
DROP POLICY IF EXISTS "Members can delete budgets" ON public.budget_limits;
DROP POLICY IF EXISTS "Members can insert budgets" ON public.budget_limits;
DROP POLICY IF EXISTS "Members can update budgets" ON public.budget_limits;
DROP POLICY IF EXISTS "Members can view budgets" ON public.budget_limits;

CREATE POLICY "Members can delete budgets" ON public.budget_limits FOR DELETE USING (couple_id = get_user_couple_id());
CREATE POLICY "Members can insert budgets" ON public.budget_limits FOR INSERT TO authenticated WITH CHECK (couple_id = get_user_couple_id());
CREATE POLICY "Members can update budgets" ON public.budget_limits FOR UPDATE USING (couple_id = get_user_couple_id());
CREATE POLICY "Members can view budgets" ON public.budget_limits FOR SELECT USING (couple_id = get_user_couple_id());

-- savings_goals
DROP POLICY IF EXISTS "Members can delete goals" ON public.savings_goals;
DROP POLICY IF EXISTS "Members can insert goals" ON public.savings_goals;
DROP POLICY IF EXISTS "Members can update goals" ON public.savings_goals;
DROP POLICY IF EXISTS "Members can view goals" ON public.savings_goals;

CREATE POLICY "Members can delete goals" ON public.savings_goals FOR DELETE USING (couple_id = get_user_couple_id());
CREATE POLICY "Members can insert goals" ON public.savings_goals FOR INSERT TO authenticated WITH CHECK (couple_id = get_user_couple_id());
CREATE POLICY "Members can update goals" ON public.savings_goals FOR UPDATE USING (couple_id = get_user_couple_id());
CREATE POLICY "Members can view goals" ON public.savings_goals FOR SELECT USING (couple_id = get_user_couple_id());

-- challenge_weeks
DROP POLICY IF EXISTS "Members can insert challenge" ON public.challenge_weeks;
DROP POLICY IF EXISTS "Members can update challenge" ON public.challenge_weeks;
DROP POLICY IF EXISTS "Members can view challenge" ON public.challenge_weeks;

CREATE POLICY "Members can insert challenge" ON public.challenge_weeks FOR INSERT TO authenticated WITH CHECK (couple_id = get_user_couple_id());
CREATE POLICY "Members can update challenge" ON public.challenge_weeks FOR UPDATE USING (couple_id = get_user_couple_id());
CREATE POLICY "Members can view challenge" ON public.challenge_weeks FOR SELECT USING (couple_id = get_user_couple_id());

-- profiles
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
