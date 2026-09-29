-- =====================================================================
-- Phase de test : jusqu'au 15 novembre 2026 inclus (heure de Paris), tout nouveau compte
-- est testeur avec les 24 jours ouverts. Les comptes existants passent aussi testeurs.
-- Après le 15 novembre, les nouveaux comptes sont de simples joueurs ; les testeurs déjà
-- créés le restent (l'admin peut les repasser joueurs et remettre leurs scores à zéro).
-- Idempotente : peut être rejouée sans erreur.
-- =====================================================================

create or replace function public.auto_tester_on_signup()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if now() < timestamptz '2026-11-16 00:00:00 Europe/Paris' and new.role = 'player' then
    new.role := 'tester';
    new.tester_days := array(select generate_series(1, 24))::smallint[];
  end if;
  return new;
end;
$$;

revoke execute on function public.auto_tester_on_signup() from public, anon, authenticated;

drop trigger if exists auto_tester_on_signup on public.profiles;
create trigger auto_tester_on_signup
  before insert on public.profiles
  for each row execute function public.auto_tester_on_signup();

-- Comptes déjà créés : joueurs et testeurs passent testeurs avec les 24 jours (les admins ne changent pas)
update public.profiles
set role = 'tester', tester_days = array(select generate_series(1, 24))::smallint[]
where role in ('player', 'tester')
  and now() < timestamptz '2026-11-16 00:00:00 Europe/Paris';

-- Marque 🧪 du classement pour ces testeurs
update public.leaderboard l set is_tester = true
from public.profiles p
where p.id = l.user_id and p.role in ('tester', 'admin');
