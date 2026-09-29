-- =====================================================================
-- Remise à zéro de la saison, avant le vrai début du 1er décembre.
-- Fonction réservée aux admins, lancée depuis la page Administration (bouton avec confirmation) :
--   - la progression de TOUS les joueurs est effacée (fragments, scores, essais) ;
--   - chacun repart avec 1 hint ;
--   - les testeurs redeviennent de simples joueurs (les admins restent admins) ;
--   - le classement repart de zéro.
-- Sont conservés : les comptes, les amis, les retours des testeurs, les réponses au sondage et les records
-- personnels de l'onglet Jeux. Idempotente : peut être rejouée sans erreur.
-- =====================================================================

create or replace function public.admin_reset_season()
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  v_players integer;
begin
  if not public.is_admin(auth.uid()) then raise exception 'not_admin'; end if;

  delete from public.player_progress where true;
  update public.player_hints set hints_available = 1, hints_used = 0 where true;
  update public.profiles set role = 'player', tester_days = '{}' where role = 'tester';
  update public.leaderboard l set
    total_score = 0,
    fragments_count = 0,
    streak = 0,
    is_tester = exists (select 1 from public.profiles p where p.id = l.user_id and p.role = 'admin'),
    updated_at = now()
  where true;

  select count(*) into v_players from public.profiles;
  return v_players;
end;
$$;

revoke execute on function public.admin_reset_season() from public, anon;
grant execute on function public.admin_reset_season() to authenticated;
