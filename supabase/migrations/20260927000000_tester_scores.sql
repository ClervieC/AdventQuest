-- =====================================================================
-- AdventQuest — les parties de test (testeurs / admin) comptent dans le classement
-- À exécuter dans Supabase : SQL Editor > New query > coller > Run (rejouable).
--
-- Un testeur peut enregistrer une partie sur les jours que l'admin lui a ouverts, un admin sur tous les jours.
-- Ces joueurs sont signalés par 🧪 dans le classement, et l'admin peut réinitialiser leur progression.
-- =====================================================================

-- Marque des testeurs / admins dans le classement (visible par tous)
alter table public.leaderboard add column if not exists is_tester boolean not null default false;

-- Ce joueur peut-il jouer (et enregistrer) ce jour en mode test ?
create or replace function public.can_test_day(p_user uuid, p_day smallint)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = p_user and (role = 'admin' or (role = 'tester' and p_day = any (tester_days)))
  );
$$;

-- Classement : on ajoute la marque 🧪 (le reste est identique)
create or replace function public.refresh_leaderboard(p_user uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_current smallint := public.current_day_for(p_user);
  v_day smallint;
  v_streak smallint := 0;
begin
  v_day := least(v_current, 24);
  if v_day >= 1 and not exists (
    select 1 from public.player_progress where user_id = p_user and day = v_day and fragment_won
  ) then
    v_day := v_day - 1;
  end if;
  while v_day >= 1 and exists (
    select 1 from public.player_progress where user_id = p_user and day = v_day and fragment_won
  ) loop
    v_streak := v_streak + 1;
    v_day := v_day - 1;
  end loop;

  update public.leaderboard l set
    total_score = coalesce((select sum(best_score) from public.player_progress where user_id = p_user), 0),
    fragments_count = (select count(*) from public.player_progress where user_id = p_user and fragment_won),
    streak = v_streak,
    is_tester = exists (select 1 from public.profiles where id = p_user and role in ('tester', 'admin')),
    updated_at = now()
  where l.user_id = p_user;
end;
$$;

-- Enregistrement d'une partie : le jour courant pour tout le monde, ou un jour de test pour les testeurs / admin
create or replace function public.submit_attempt(p_day smallint, p_score integer, p_success boolean)
returns json
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_current smallint;
  v_is_test boolean;
  v_already_won boolean;
  v_score integer := greatest(0, least(coalesce(p_score, 0), 100000));
  v_row public.player_progress;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if not exists (select 1 from public.profiles where id = v_uid) then
    raise exception 'no_profile';
  end if;
  if p_day is null or p_day not between 1 and 24 then
    raise exception 'day_not_playable';
  end if;

  v_current := public.current_day_for(v_uid);
  v_is_test := p_day is distinct from v_current and public.can_test_day(v_uid, p_day);
  if p_day is distinct from v_current and not v_is_test then
    raise exception 'day_not_playable' using hint = format('Jour courant : %s', v_current);
  end if;
  -- Le portail du boss exige 12 fragments, sauf pour une partie de test
  if p_day = 24 and not v_is_test and (
    select count(*) from public.player_progress where user_id = v_uid and fragment_won and day < 24
  ) < 12 then
    raise exception 'boss_locked';
  end if;

  select coalesce(bool_or(fragment_won), false) into v_already_won
  from public.player_progress where user_id = v_uid and day = p_day;

  insert into public.player_progress as pp (user_id, day, fragment_won, best_score, attempts, updated_at)
  values (v_uid, p_day, coalesce(p_success, false), v_score, 1, now())
  on conflict (user_id, day) do update set
    fragment_won = pp.fragment_won or excluded.fragment_won,
    best_score = greatest(pp.best_score, excluded.best_score),
    attempts = pp.attempts + 1,
    updated_at = now()
  returning * into v_row;

  -- Les hints ne se gagnent que sur les vraies parties du jour
  if coalesce(p_success, false) and not v_already_won and not v_is_test then
    perform public.award_hint_for_day(v_uid, p_day);
  end if;
  perform public.refresh_leaderboard(v_uid);

  return json_build_object(
    'progress', json_build_object('day', v_row.day, 'fragment_won', v_row.fragment_won, 'best_score', v_row.best_score, 'attempts', v_row.attempts),
    'hints', (select hints_available from public.player_hints where user_id = v_uid),
    'current_day', v_current
  );
end;
$$;

-- Changer de rôle met aussi à jour la marque 🧪 du classement
create or replace function public.admin_set_role(p_user uuid, p_role text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'not_admin'; end if;
  if p_user = auth.uid() then raise exception 'cannot_change_own_role'; end if;
  if p_role not in ('player', 'tester', 'admin') then raise exception 'invalid_role'; end if;
  update public.profiles set role = p_role where id = p_user;
  perform public.refresh_leaderboard(p_user);
end;
$$;

-- Remise à zéro de la progression d'un joueur (ex. effacer les scores de test avant le lancement)
create or replace function public.admin_reset_progress(p_user uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'not_admin'; end if;
  delete from public.player_progress where user_id = p_user;
  update public.player_hints set hints_available = 1, hints_used = 0 where user_id = p_user;
  perform public.refresh_leaderboard(p_user);
end;
$$;

-- Supprimer un retour de testeur (déjà traité, inutile...)
create or replace function public.admin_delete_feedback(p_id bigint)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'not_admin'; end if;
  delete from public.feedback where id = p_id;
end;
$$;

revoke execute on function public.can_test_day(uuid, smallint) from public, anon, authenticated;
revoke execute on function public.admin_delete_feedback(bigint) from public, anon;
grant execute on function public.admin_delete_feedback(bigint) to authenticated;
revoke execute on function public.admin_reset_progress(uuid) from public, anon;
grant execute on function public.admin_reset_progress(uuid) to authenticated;

-- Marque 🧪 pour les testeurs / admins déjà existants
update public.leaderboard l set is_tester = true
from public.profiles p
where p.id = l.user_id and p.role in ('tester', 'admin');
