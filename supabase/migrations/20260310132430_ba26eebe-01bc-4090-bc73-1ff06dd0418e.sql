-- Allow couple members to view each other's profiles
CREATE POLICY "Couple members can view each other profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT cm.user_id FROM couple_members cm 
    WHERE cm.couple_id = get_user_couple_id()
  )
);