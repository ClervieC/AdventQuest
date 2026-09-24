-- =====================================================================
-- AdventQuest — schéma initial (Phase 5)
-- À exécuter une fois dans Supabase : SQL Editor > New query > coller > Run.
-- Le script est rejouable (create if not exists / create or replace / drop policy if exists).
--
-- Principe anti-triche : l'app ne peut RIEN écrire directement dans les tables.
-- Toutes les écritures passent par des fonctions "security definer" qui vérifient
-- que le jour joué est bien le jour courant calculé par le SERVEUR.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Réglages de la saison (une seule ligne)
-- ---------------------------------------------------------------------
create table if not exists public.game_settings (
  id boolean primary key default true check (id),
  season_start date not null default date '2026-12-01',
  -- Pour tester hors saison : mettre un jour 1..24 ici (Table Editor). NULL en production.
  dev_day_override smallint check (dev_day_override between 1 and 24)
);
insert into public.game_settings (id) values (true) on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 2. Tables des joueurs
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null check (char_length(username) between 3 and 20 and username ~ '^[A-Za-zÀ-ÖØ-öø-ÿ0-9 _-]+$'),
  -- Fuseau choisi à l'inscription (heure locale du joueur) puis figé : changer le fuseau
  -- du téléphone ne permet pas d'avancer ou de reculer d'un jour.
  timezone text not null,
  created_at timestamptz not null default now()
);
create unique index if not exists profiles_username_lower_key on public.profiles (lower(username));

create table if not exists public.player_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day smallint not null check (day between 1 and 24),
  fragment_won boolean not null default false,
  best_score integer not null default 0 check (best_score >= 0),
  attempts integer not null default 0 check (attempts >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

create table if not exists public.player_hints (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  hints_available integer not null default 1 check (hints_available >= 0),
  hints_used integer not null default 0 check (hints_used >= 0)
);

-- Classement : maintenu par le serveur (et publié en temps réel), jamais écrit par l'app
create table if not exists public.leaderboard (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  username text not null,
  total_score integer not null default 0,
  fragments_count smallint not null default 0,
  streak smallint not null default 0,
  updated_at timestamptz not null default now()
);
create index if not exists leaderboard_ranking_idx on public.leaderboard (total_score desc, fragments_count desc);

-- ---------------------------------------------------------------------
-- 3. Sécurité (RLS) : lecture seule, et seulement ce qui nous concerne
-- ---------------------------------------------------------------------
alter table public.game_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.player_progress enable row level security;
alter table public.player_hints enable row level security;
alter table public.leaderboard enable row level security;

drop policy if exists "Réglages lisibles par les joueurs" on public.game_settings;
create policy "Réglages lisibles par les joueurs" on public.game_settings
  for select to authenticated using (true);

drop policy if exists "Chacun lit son profil" on public.profiles;
create policy "Chacun lit son profil" on public.profiles
  for select to authenticated using (id = (select auth.uid()));

drop policy if exists "Chacun lit sa progression" on public.player_progress;
create policy "Chacun lit sa progression" on public.player_progress
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Chacun lit ses hints" on public.player_hints;
create policy "Chacun lit ses hints" on public.player_hints
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Classement lisible par tous les joueurs" on public.leaderboard;
create policy "Classement lisible par tous les joueurs" on public.leaderboard
  for select to authenticated using (true);

-- Aucune policy insert/update/delete : l'app ne peut pas écrire directement.

-- ---------------------------------------------------------------------
-- 4. Fonctions internes
-- ---------------------------------------------------------------------

-- Jour courant d'un joueur : 0 = saison pas commencée, 1..24 = jour jouable, 25 = saison terminée
create or replace function public.current_day_for(p_user uuid)
returns smallint
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_settings public.game_settings;
  v_timezone text;
  v_local_date date;
begin
  select * into v_settings from public.game_settings where id;
  if v_settings.dev_day_override is not null then
    return v_settings.dev_day_override;
  end if;
  select timezone into v_timezone from public.profiles where id = p_user;
  v_local_date := (now() at time zone coalesce(v_timezone, 'Europe/Paris'))::date;
  return greatest(0, least(25, v_local_date - v_settings.season_start + 1))::smallint;
end;
$$;

-- Recalcule la ligne du classement d'un joueur
create or replace function public.refresh_leaderboard(p_user uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_current smallint := public.current_day_for(p_user);
  v_day smallint;
  v_streak smallint := 0;
begin
  -- Série : jours gagnés d'affilée en remontant depuis aujourd'hui
  -- (si aujourd'hui n'est pas encore gagné, on part d'hier : la série n'est pas encore cassée)
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
    updated_at = now()
  where l.user_id = p_user;
end;
$$;

-- Règles des hints du PDF : jours 1-5 → 1 hint par jour réussi ; jours 6-15 → 1 hint tous les 2 jours réussis ; ensuite aucun
create or replace function public.award_hint_for_day(p_user uuid, p_day smallint)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_won_in_range integer;
begin
  if p_day between 1 and 5 then
    update public.player_hints set hints_available = hints_available + 1 where user_id = p_user;
  elsif p_day between 6 and 15 then
    select count(*) into v_won_in_range
    from public.player_progress where user_id = p_user and fragment_won and day between 6 and 15;
    if v_won_in_range % 2 = 0 then
      update public.player_hints set hints_available = hints_available + 1 where user_id = p_user;
    end if;
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 5. Fonctions appelées par l'app (RPC)
-- ---------------------------------------------------------------------

-- Tout l'état du joueur en un seul appel (au lancement de l'app)
create or replace function public.get_player_state()
returns json
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.profiles;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  select * into v_profile from public.profiles where id = v_uid;
  return json_build_object(
    'profile', case when v_profile.id is null then null
               else json_build_object('id', v_profile.id, 'username', v_profile.username, 'timezone', v_profile.timezone) end,
    'current_day', public.current_day_for(v_uid),
    'hints', coalesce((select hints_available from public.player_hints where user_id = v_uid), 0),
    'progress', coalesce((
      select json_agg(json_build_object('day', day, 'fragment_won', fragment_won, 'best_score', best_score, 'attempts', attempts) order by day)
      from public.player_progress where user_id = v_uid
    ), '[]'::json)
  );
end;
$$;

-- Création du profil (pseudo + fuseau horaire du téléphone, figé ensuite)
create or replace function public.create_profile(p_username text, p_timezone text)
returns json
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_username text := trim(p_username);
  v_timezone text := p_timezone;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if exists (select 1 from public.profiles where id = v_uid) then
    raise exception 'profile_exists';
  end if;
  if v_username is null or char_length(v_username) not between 3 and 20
     or v_username !~ '^[A-Za-zÀ-ÖØ-öø-ÿ0-9 _-]+$' then
    raise exception 'invalid_username';
  end if;
  if exists (select 1 from public.profiles where lower(username) = lower(v_username)) then
    raise exception 'username_taken';
  end if;
  if v_timezone is null or not exists (select 1 from pg_catalog.pg_timezone_names where name = v_timezone) then
    v_timezone := 'Europe/Paris';
  end if;

  insert into public.profiles (id, username, timezone) values (v_uid, v_username, v_timezone);
  insert into public.player_hints (user_id) values (v_uid) on conflict (user_id) do nothing;
  insert into public.leaderboard (user_id, username) values (v_uid, v_username) on conflict (user_id) do nothing;
  return public.get_player_state();
exception
  when unique_violation then
    raise exception 'username_taken';
end;
$$;

-- Enregistre une partie. Refusée si ce n'est pas le jour courant du serveur (anti-triche).
create or replace function public.submit_attempt(p_day smallint, p_score integer, p_success boolean)
returns json
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_current smallint;
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

  v_current := public.current_day_for(v_uid);
  if p_day is distinct from v_current then
    raise exception 'day_not_playable' using hint = format('Jour courant : %s', v_current);
  end if;
  if p_day = 24 and (
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

  if coalesce(p_success, false) and not v_already_won then
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

-- Utilise un hint. Interdit contre le boss (jour 24).
create or replace function public.use_hint()
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_left integer;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if public.current_day_for(v_uid) = 24 then
    raise exception 'no_hint_boss';
  end if;
  update public.player_hints
  set hints_available = hints_available - 1, hints_used = hints_used + 1
  where user_id = v_uid and hints_available > 0
  returning hints_available into v_left;
  if not found then
    raise exception 'no_hint_left';
  end if;
  return v_left;
end;
$$;

-- ---------------------------------------------------------------------
-- 6. Droits d'exécution : seules les fonctions RPC sont appelables par les joueurs
-- ---------------------------------------------------------------------
revoke execute on function public.current_day_for(uuid) from public, anon, authenticated;
revoke execute on function public.refresh_leaderboard(uuid) from public, anon, authenticated;
revoke execute on function public.award_hint_for_day(uuid, smallint) from public, anon, authenticated;

revoke execute on function public.get_player_state() from public, anon;
revoke execute on function public.create_profile(text, text) from public, anon;
revoke execute on function public.submit_attempt(smallint, integer, boolean) from public, anon;
revoke execute on function public.use_hint() from public, anon;
grant execute on function public.get_player_state() to authenticated;
grant execute on function public.create_profile(text, text) to authenticated;
grant execute on function public.submit_attempt(smallint, integer, boolean) to authenticated;
grant execute on function public.use_hint() to authenticated;

-- ---------------------------------------------------------------------
-- 7. Temps réel sur le classement
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'leaderboard'
  ) then
    alter publication supabase_realtime add table public.leaderboard;
  end if;
end;
$$;
