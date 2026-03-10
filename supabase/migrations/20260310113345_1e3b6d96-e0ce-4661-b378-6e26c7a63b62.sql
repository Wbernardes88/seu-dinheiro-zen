
-- Fix SELECT policy for challenge_weeks to be permissive and target authenticated
DROP POLICY IF EXISTS "Members can view challenge" ON public.challenge_weeks;
CREATE POLICY "Members can view challenge"
ON public.challenge_weeks FOR SELECT
TO authenticated
USING (couple_id = get_user_couple_id());

-- Fix INSERT policy (already targets authenticated, just ensure permissive)
DROP POLICY IF EXISTS "Members can insert challenge" ON public.challenge_weeks;
CREATE POLICY "Members can insert challenge"
ON public.challenge_weeks FOR INSERT
TO authenticated
WITH CHECK (couple_id = get_user_couple_id());
