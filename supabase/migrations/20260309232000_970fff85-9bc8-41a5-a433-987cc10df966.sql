
-- Fix overly permissive policies

-- 1. Fix couples INSERT: only allow if user is inserting and will become a member
DROP POLICY "Authenticated can create couple" ON public.couples;
CREATE POLICY "Authenticated can create couple" ON public.couples 
  FOR INSERT TO authenticated 
  WITH CHECK (
    NOT EXISTS (SELECT 1 FROM public.couple_members WHERE user_id = auth.uid())
  );

-- 2. Fix couple_invites UPDATE: only allow marking as used by the accepting user
DROP POLICY "Invite can be updated" ON public.couple_invites;
CREATE POLICY "Invite can be claimed" ON public.couple_invites 
  FOR UPDATE TO authenticated 
  USING (used_by IS NULL AND expires_at > now())
  WITH CHECK (used_by = auth.uid());
