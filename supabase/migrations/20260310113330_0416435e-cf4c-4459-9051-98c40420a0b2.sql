
-- Drop restrictive UPDATE policy and recreate as permissive
DROP POLICY IF EXISTS "Members can update challenge" ON public.challenge_weeks;

CREATE POLICY "Members can update challenge"
ON public.challenge_weeks FOR UPDATE
TO authenticated
USING (couple_id = get_user_couple_id())
WITH CHECK (couple_id = get_user_couple_id());
