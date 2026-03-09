
CREATE OR REPLACE FUNCTION public.auto_create_couple(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_couple_id uuid;
  v_existing_couple_id uuid;
BEGIN
  -- Check if user already has a couple
  SELECT couple_id INTO v_existing_couple_id 
  FROM couple_members WHERE user_id = p_user_id LIMIT 1;
  
  IF v_existing_couple_id IS NOT NULL THEN
    RETURN v_existing_couple_id;
  END IF;

  -- Create couple
  INSERT INTO couples (name) VALUES ('Meu Espaço') RETURNING id INTO v_couple_id;
  
  -- Add member
  INSERT INTO couple_members (couple_id, user_id, role) VALUES (v_couple_id, p_user_id, 'owner');
  
  -- Seed categories
  INSERT INTO categories (couple_id, name, icon, type) VALUES
    (v_couple_id, 'Salário', '💰', 'income'),
    (v_couple_id, 'Freelance', '💻', 'income'),
    (v_couple_id, 'Investimentos', '📈', 'income'),
    (v_couple_id, 'Outros', '📦', 'income'),
    (v_couple_id, 'Alimentação', '🍔', 'expense'),
    (v_couple_id, 'Transporte', '🚗', 'expense'),
    (v_couple_id, 'Moradia', '🏠', 'expense'),
    (v_couple_id, 'Saúde', '💊', 'expense'),
    (v_couple_id, 'Educação', '📚', 'expense'),
    (v_couple_id, 'Lazer', '🎮', 'expense'),
    (v_couple_id, 'Compras', '🛒', 'expense'),
    (v_couple_id, 'Assinaturas', '📱', 'expense');

  -- Seed 52 weeks challenge
  INSERT INTO challenge_weeks (couple_id, week, amount, completed)
  SELECT v_couple_id, w, w * 5, false FROM generate_series(1, 52) AS w;

  RETURN v_couple_id;
END;
$$;
