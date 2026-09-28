-- =====================================================================
-- Sondage de fin de saison : ce que les joueurs ont aimé et ce qu'ils voudraient l'année prochaine.
-- Ouvert à partir du 24 décembre à 18 h (heure locale du joueur), rempli depuis l'accueil ou le profil.
-- Une réponse par joueur (modifiable).
-- Lu uniquement par les admins. Idempotente : peut être rejouée sans erreur.
-- =====================================================================

create table if not exists public.season_survey (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  username text not null,
  rating smallint check (rating between 1 and 5),         -- note globale de l'appli
  favorite_games text[] not null default '{}',            -- jeux préférés (types de jeu)
  liked text not null default '',                         -- ce qui a plu
  wishes text[] not null default '{}',                    -- envies cochées pour l'an prochain
  next_year text not null default '',                     -- idées libres pour l'an prochain
  come_back text check (come_back in ('yes', 'maybe', 'no')), -- rejouera l'an prochain ?
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.season_survey enable row level security;
-- Aucune policy : lecture et écriture uniquement via les fonctions ci-dessous

-- Garde au plus 30 choix, chacun court et non vide
create or replace function public.clean_choices(p_values text[])
returns text[]
language sql immutable set search_path = ''
as $$
  select coalesce(array_agg(distinct left(trim(v), 60)), '{}')
  from (select unnest(coalesce(p_values, '{}')) as v limit 30) s
  where coalesce(trim(v), '') <> '';
$$;

-- Le sondage est-il ouvert pour ce joueur ? Dès le 24 décembre 18 h dans son fuseau (dernier jour de la saison au soir).
-- Testeurs et admins : toujours ouvert, pour pouvoir le tester. Jour de test forcé (dev_day_override = 24) : ouvert.
create or replace function public.season_survey_open_for(p_user uuid)
returns boolean
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_settings public.game_settings;
  v_profile public.profiles;
begin
  select * into v_profile from public.profiles where id = p_user;
  if v_profile.id is null then return false; end if;
  if v_profile.role in ('tester', 'admin') then return true; end if;
  select * into v_settings from public.game_settings where id;
  if v_settings.dev_day_override is not null then return v_settings.dev_day_override >= 24; end if;
  return (now() at time zone coalesce(v_profile.timezone, 'Europe/Paris'))
         >= (v_settings.season_start + 23)::timestamp + interval '18 hours';
end;
$$;

create or replace function public.submit_season_survey(
  p_rating smallint,
  p_favorite_games text[],
  p_liked text,
  p_wishes text[],
  p_next_year text,
  p_come_back text
)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_profile public.profiles;
  v_games text[] := public.clean_choices(p_favorite_games);
  v_wishes text[] := public.clean_choices(p_wishes);
begin
  select * into v_profile from public.profiles where id = auth.uid();
  if v_profile.id is null then raise exception 'not_authenticated'; end if;
  if not public.season_survey_open_for(v_profile.id) then raise exception 'survey_closed'; end if;
  if p_come_back is not null and p_come_back not in ('yes', 'maybe', 'no') then raise exception 'empty_survey'; end if;
  if p_rating is null and cardinality(v_games) = 0 and cardinality(v_wishes) = 0 and p_come_back is null
     and coalesce(trim(p_liked), '') = '' and coalesce(trim(p_next_year), '') = '' then
    raise exception 'empty_survey';
  end if;

  insert into public.season_survey (user_id, username, rating, favorite_games, liked, wishes, next_year, come_back)
  values (v_profile.id, v_profile.username, p_rating, v_games, left(coalesce(trim(p_liked), ''), 2000),
          v_wishes, left(coalesce(trim(p_next_year), ''), 2000), p_come_back)
  on conflict (user_id) do update set
    username = excluded.username,
    rating = excluded.rating,
    favorite_games = excluded.favorite_games,
    liked = excluded.liked,
    wishes = excluded.wishes,
    next_year = excluded.next_year,
    come_back = excluded.come_back,
    updated_at = now();
end;
$$;

-- État du sondage pour le joueur : ouvert ? déjà répondu ? (pour l'accueil et le profil)
create or replace function public.season_survey_status()
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'open', public.season_survey_open_for(auth.uid()),
    'answered', exists (select 1 from public.season_survey where user_id = auth.uid())
  );
$$;

create or replace function public.admin_list_season_surveys()
returns setof public.season_survey
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'not_admin'; end if;
  return query select * from public.season_survey order by updated_at desc;
end;
$$;

revoke execute on function public.clean_choices(text[]) from public, anon, authenticated;
revoke execute on function public.season_survey_open_for(uuid) from public, anon, authenticated;
revoke execute on function public.submit_season_survey(smallint, text[], text, text[], text, text) from public, anon;
grant execute on function public.submit_season_survey(smallint, text[], text, text[], text, text) to authenticated;
revoke execute on function public.season_survey_status() from public, anon;
grant execute on function public.season_survey_status() to authenticated;
revoke execute on function public.admin_list_season_surveys() from public, anon;
grant execute on function public.admin_list_season_surveys() to authenticated;
