-- =====================================================================
-- AdventQuest — connexion par pseudo + mot de passe (multi-appareils)
-- À exécuter dans Supabase : SQL Editor > New query > coller > Run (rejouable).
--
-- Supabase n'accepte les mots de passe qu'avec une adresse e-mail. Chaque joueur reçoit donc
-- une adresse technique, jamais montrée ni utilisée pour envoyer des e-mails :
--   u<identifiant du joueur>@joueurs.adventquest.app
-- Elle dépend de l'identifiant (pas du pseudo) : unique, stable, valide quel que soit le pseudo.
--
-- Réglage requis dans le dashboard : Authentication > Sign In / Providers > Email
--   → désactiver « Confirm email » (sinon Supabase essaierait d'envoyer un e-mail à cette adresse).
-- =====================================================================

create or replace function public.login_email_for_id(p_user uuid)
returns text
language sql immutable
as $$
  select 'u' || p_user::text || '@joueurs.adventquest.app';
$$;

-- Adresse de connexion d'un pseudo (sans tenir compte des majuscules). NULL si le pseudo n'existe pas.
-- Appelable sans être connecté : c'est la première étape de la connexion sur un nouvel appareil.
create or replace function public.get_login_email(p_username text)
returns text
language sql stable security definer set search_path = ''
as $$
  select public.login_email_for_id(id)
  from public.profiles
  where lower(username) = lower(trim(p_username));
$$;

revoke execute on function public.get_login_email(text) from public;
grant execute on function public.get_login_email(text) to anon, authenticated;
grant execute on function public.login_email_for_id(uuid) to anon, authenticated;
