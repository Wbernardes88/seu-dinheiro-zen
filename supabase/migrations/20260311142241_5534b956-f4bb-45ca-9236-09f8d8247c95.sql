
-- Credit cards table
CREATE TABLE public.credit_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  name text NOT NULL,
  brand text NOT NULL DEFAULT 'Visa',
  color text NOT NULL DEFAULT '#1a1a2e',
  credit_limit numeric NOT NULL DEFAULT 0,
  closing_day integer NOT NULL DEFAULT 1,
  due_day integer NOT NULL DEFAULT 10,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Members can view cards" ON public.credit_cards
  FOR SELECT TO authenticated
  USING (couple_id = get_user_couple_id());

CREATE POLICY "Members can insert cards" ON public.credit_cards
  FOR INSERT TO authenticated
  WITH CHECK (couple_id = get_user_couple_id());

CREATE POLICY "Members can update cards" ON public.credit_cards
  FOR UPDATE TO authenticated
  USING (couple_id = get_user_couple_id());

CREATE POLICY "Members can delete cards" ON public.credit_cards
  FOR DELETE TO authenticated
  USING (couple_id = get_user_couple_id());

-- Add credit card columns to transactions
ALTER TABLE public.transactions
  ADD COLUMN credit_card_id uuid REFERENCES public.credit_cards(id) ON DELETE SET NULL,
  ADD COLUMN installment_group_id uuid,
  ADD COLUMN installment_number integer,
  ADD COLUMN total_installments integer;

-- Updated_at trigger for credit_cards
CREATE TRIGGER update_credit_cards_updated_at
  BEFORE UPDATE ON public.credit_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_cards;
