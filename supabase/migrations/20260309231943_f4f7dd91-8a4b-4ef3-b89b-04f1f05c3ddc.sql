
-- ============================================
-- FinançaJá Database Schema
-- ============================================

-- 1. Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 2. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Couples table (the shared "household")
CREATE TABLE public.couples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Nosso Casal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;

-- 4. Couple members (links users to a couple)
CREATE TABLE public.couple_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.couple_members ENABLE ROW LEVEL SECURITY;

-- 5. Couple invites
CREATE TABLE public.couple_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE DEFAULT upper(substr(md5(random()::text), 1, 6)),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.couple_invites ENABLE ROW LEVEL SECURITY;

-- 6. Categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📦',
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 7. Transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  payment_method TEXT NOT NULL DEFAULT '',
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 8. Budget limits
CREATE TABLE public.budget_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  budget NUMERIC(12,2) NOT NULL CHECK (budget >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.budget_limits ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_budget_limits_updated_at
  BEFORE UPDATE ON public.budget_limits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Savings goals
CREATE TABLE public.savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target NUMERIC(12,2) NOT NULL CHECK (target > 0),
  current NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (current >= 0),
  icon TEXT NOT NULL DEFAULT '🎯',
  deadline DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_savings_goals_updated_at
  BEFORE UPDATE ON public.savings_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Challenge 52 weeks progress
CREATE TABLE public.challenge_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  week INT NOT NULL CHECK (week >= 1 AND week <= 52),
  amount NUMERIC(12,2) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(couple_id, week)
);
ALTER TABLE public.challenge_weeks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Helper function: get user's couple_id
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_couple_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ============================================
-- RLS Policies
-- ============================================

-- Profiles: users see own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());

-- Couples: members can view their couple
CREATE POLICY "Members can view couple" ON public.couples FOR SELECT USING (id = public.get_user_couple_id());
CREATE POLICY "Authenticated can create couple" ON public.couples FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Members can update couple" ON public.couples FOR UPDATE USING (id = public.get_user_couple_id());

-- Couple members: members can see other members in their couple
CREATE POLICY "Members can view couple members" ON public.couple_members FOR SELECT USING (couple_id = public.get_user_couple_id());
CREATE POLICY "Authenticated can join couple" ON public.couple_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Members can delete self" ON public.couple_members FOR DELETE USING (user_id = auth.uid());

-- Couple invites: creator can manage, anyone authenticated can view by code
CREATE POLICY "Creator can view invites" ON public.couple_invites FOR SELECT USING (created_by = auth.uid() OR couple_id = public.get_user_couple_id());
CREATE POLICY "Members can create invites" ON public.couple_invites FOR INSERT TO authenticated WITH CHECK (couple_id = public.get_user_couple_id());
CREATE POLICY "Invite can be updated" ON public.couple_invites FOR UPDATE TO authenticated USING (true);

-- Categories: couple members see their categories
CREATE POLICY "Members can view categories" ON public.categories FOR SELECT USING (couple_id = public.get_user_couple_id());
CREATE POLICY "Members can insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (couple_id = public.get_user_couple_id());
CREATE POLICY "Members can update categories" ON public.categories FOR UPDATE USING (couple_id = public.get_user_couple_id());
CREATE POLICY "Members can delete categories" ON public.categories FOR DELETE USING (couple_id = public.get_user_couple_id());

-- Transactions: couple members see all couple transactions
CREATE POLICY "Members can view transactions" ON public.transactions FOR SELECT USING (couple_id = public.get_user_couple_id());
CREATE POLICY "Members can insert transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (couple_id = public.get_user_couple_id() AND user_id = auth.uid());
CREATE POLICY "Members can delete own transactions" ON public.transactions FOR DELETE USING (couple_id = public.get_user_couple_id() AND user_id = auth.uid());

-- Budget limits
CREATE POLICY "Members can view budgets" ON public.budget_limits FOR SELECT USING (couple_id = public.get_user_couple_id());
CREATE POLICY "Members can insert budgets" ON public.budget_limits FOR INSERT TO authenticated WITH CHECK (couple_id = public.get_user_couple_id());
CREATE POLICY "Members can update budgets" ON public.budget_limits FOR UPDATE USING (couple_id = public.get_user_couple_id());
CREATE POLICY "Members can delete budgets" ON public.budget_limits FOR DELETE USING (couple_id = public.get_user_couple_id());

-- Savings goals
CREATE POLICY "Members can view goals" ON public.savings_goals FOR SELECT USING (couple_id = public.get_user_couple_id());
CREATE POLICY "Members can insert goals" ON public.savings_goals FOR INSERT TO authenticated WITH CHECK (couple_id = public.get_user_couple_id());
CREATE POLICY "Members can update goals" ON public.savings_goals FOR UPDATE USING (couple_id = public.get_user_couple_id());
CREATE POLICY "Members can delete goals" ON public.savings_goals FOR DELETE USING (couple_id = public.get_user_couple_id());

-- Challenge weeks
CREATE POLICY "Members can view challenge" ON public.challenge_weeks FOR SELECT USING (couple_id = public.get_user_couple_id());
CREATE POLICY "Members can insert challenge" ON public.challenge_weeks FOR INSERT TO authenticated WITH CHECK (couple_id = public.get_user_couple_id());
CREATE POLICY "Members can update challenge" ON public.challenge_weeks FOR UPDATE USING (couple_id = public.get_user_couple_id());

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX idx_transactions_couple_date ON public.transactions(couple_id, date DESC);
CREATE INDEX idx_transactions_couple_type ON public.transactions(couple_id, type);
CREATE INDEX idx_categories_couple ON public.categories(couple_id);
CREATE INDEX idx_couple_members_user ON public.couple_members(user_id);
CREATE INDEX idx_couple_invites_code ON public.couple_invites(invite_code);
