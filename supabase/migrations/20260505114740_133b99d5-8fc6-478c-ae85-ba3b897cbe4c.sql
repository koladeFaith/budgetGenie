
-- 1) Seed Nigerian-first default categories (skip duplicates)
INSERT INTO public.categories (name, icon, color, is_default, user_id) VALUES
  ('Aso-ebi', 'Shirt', '#D946EF', true, NULL),
  ('Family Support', 'Users', '#F59E0B', true, NULL),
  ('Tithe & Offering', 'HeartHandshake', '#8B5CF6', true, NULL),
  ('POS Charges', 'CreditCard', '#64748B', true, NULL),
  ('Black Tax', 'HandCoins', '#EF4444', true, NULL),
  ('Owambe', 'PartyPopper', '#EC4899', true, NULL)
ON CONFLICT DO NOTHING;

-- 2) Category corrections (adaptive learning)
CREATE TABLE public.category_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  keyword text NOT NULL,
  category_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, keyword)
);

ALTER TABLE public.category_corrections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cc_select_own" ON public.category_corrections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cc_insert_own" ON public.category_corrections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cc_update_own" ON public.category_corrections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cc_delete_own" ON public.category_corrections FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_cc_user ON public.category_corrections (user_id);

CREATE TRIGGER cc_touch_updated_at
BEFORE UPDATE ON public.category_corrections
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3) Irregular income flag on profile
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS irregular_income boolean NOT NULL DEFAULT false;
