
CREATE OR REPLACE FUNCTION public.dissolve_couple(p_couple_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_couple_id uuid;
  v_member_ids uuid[];
BEGIN
  -- Verify the caller belongs to this couple
  SELECT couple_id INTO v_user_couple_id
  FROM couple_members WHERE user_id = auth.uid() AND couple_id = p_couple_id LIMIT 1;
  
  IF v_user_couple_id IS NULL THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Collect all member user_ids before removing
  SELECT array_agg(user_id) INTO v_member_ids
  FROM couple_members WHERE couple_id = p_couple_id;

  -- Invalidate all pending invites for this couple
  UPDATE couple_invites
  SET used_at = now(), used_by = auth.uid()
  WHERE couple_id = p_couple_id AND used_by IS NULL;

  -- Remove ALL members from the couple (dissolves for both)
  DELETE FROM couple_members WHERE couple_id = p_couple_id;

  -- Delete the couple record itself
  DELETE FROM couples WHERE id = p_couple_id;

  -- Each former member will get a new solo couple via auto_create_couple on next login/refresh
END;
$$;
