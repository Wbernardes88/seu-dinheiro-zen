CREATE POLICY "Anyone authenticated can find valid invites"
ON public.couple_invites
FOR SELECT
TO authenticated
USING (
  used_by IS NULL 
  AND expires_at > now()
);