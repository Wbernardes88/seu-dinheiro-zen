
CREATE OR REPLACE FUNCTION public.reset_challenge_weeks(p_couple_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_couple_id uuid;
BEGIN
  SELECT couple_id INTO v_user_couple_id
  FROM couple_members WHERE user_id = auth.uid() AND couple_id = p_couple_id LIMIT 1;
  
  IF v_user_couple_id IS NULL THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  UPDATE challenge_weeks
  SET completed = false, completed_at = NULL
  WHERE couple_id = p_couple_id;
END;
$$;
