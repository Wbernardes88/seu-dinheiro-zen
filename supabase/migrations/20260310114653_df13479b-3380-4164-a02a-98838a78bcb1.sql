
CREATE OR REPLACE FUNCTION public.toggle_challenge_week(p_couple_id uuid, p_week integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current boolean;
  v_user_couple_id uuid;
BEGIN
  -- Verify the user belongs to this couple
  SELECT couple_id INTO v_user_couple_id
  FROM couple_members WHERE user_id = auth.uid() AND couple_id = p_couple_id LIMIT 1;
  
  IF v_user_couple_id IS NULL THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Get current state
  SELECT completed INTO v_current
  FROM challenge_weeks WHERE couple_id = p_couple_id AND week = p_week;
  
  IF v_current IS NULL THEN
    RAISE EXCEPTION 'Week not found';
  END IF;

  -- Toggle
  UPDATE challenge_weeks
  SET completed = NOT v_current,
      completed_at = CASE WHEN v_current THEN NULL ELSE now() END
  WHERE couple_id = p_couple_id AND week = p_week;

  RETURN NOT v_current;
END;
$$;
