
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  currency TEXT NOT NULL DEFAULT 'NGN',
  savings_goal NUMERIC(14,2) NOT NULL DEFAULT 0,
  dark_mode BOOLEAN NOT NULL DEFAULT false,
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own_profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own_profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own_profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Categories (default + user custom)
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Tag',
  color TEXT NOT NULL DEFAULT '#028090',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_select" ON public.categories FOR SELECT
  USING (is_default = true OR user_id = auth.uid());
CREATE POLICY "categories_insert_own" ON public.categories FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_default = false);
CREATE POLICY "categories_update_own" ON public.categories FOR UPDATE
  USING (auth.uid() = user_id AND is_default = false);
CREATE POLICY "categories_delete_own" ON public.categories FOR DELETE
  USING (auth.uid() = user_id AND is_default = false);

-- Seed default categories
INSERT INTO public.categories (user_id, name, icon, color, is_default) VALUES
(NULL, 'Food & Groceries', 'UtensilsCrossed', '#EF4444', true),
(NULL, 'Transportation', 'Car', '#F59E0B', true),
(NULL, 'Housing & Rent', 'Home', '#8B5CF6', true),
(NULL, 'Entertainment & Leisure', 'Music', '#EC4899', true),
(NULL, 'Education', 'GraduationCap', '#3B82F6', true),
(NULL, 'Health & Medical', 'Heart', '#10B981', true),
(NULL, 'Utilities & Bills', 'Zap', '#F97316', true),
(NULL, 'Clothing & Fashion', 'Shirt', '#A855F7', true),
(NULL, 'Data & Airtime', 'Smartphone', '#06B6D4', true),
(NULL, 'Savings & Investment', 'PiggyBank', '#22C55E', true),
(NULL, 'Miscellaneous', 'MoreHorizontal', '#64748B', true),
(NULL, 'Income', 'TrendingUp', '#028090', true);

-- Transactions
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  type TEXT NOT NULL CHECK (type IN ('income','expense')),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_anomaly BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tx_select_own" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tx_insert_own" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tx_update_own" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tx_delete_own" ON public.transactions FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_tx_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX idx_tx_user_cat ON public.transactions(user_id, category_id);

-- Budgets
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  monthly_limit NUMERIC(14,2) NOT NULL CHECK (monthly_limit >= 0),
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, category_id, month, year)
);
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bg_select_own" ON public.budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bg_insert_own" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bg_update_own" ON public.budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "bg_delete_own" ON public.budgets FOR DELETE USING (auth.uid() = user_id);

-- AI insights
CREATE TABLE public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_text TEXT NOT NULL,
  insight_type TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false
);
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_select_own" ON public.ai_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ai_insert_own" ON public.ai_insights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ai_update_own" ON public.ai_insights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ai_delete_own" ON public.ai_insights FOR DELETE USING (auth.uid() = user_id);

-- Alerts
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "al_select_own" ON public.alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "al_insert_own" ON public.alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "al_update_own" ON public.alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "al_delete_own" ON public.alerts FOR DELETE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger for profiles
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
