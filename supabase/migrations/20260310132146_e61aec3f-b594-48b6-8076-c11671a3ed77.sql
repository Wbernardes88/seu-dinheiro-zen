ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nickname text NOT NULL DEFAULT '';

-- Update handle_new_user to also store nickname
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name, nickname)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'nickname', SPLIT_PART(COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email), ' ', 1))
  );
  RETURN NEW;
END;
$function$;