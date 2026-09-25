-- =====================================================================
-- AdventQuest — amis, rôles (joueur / testeur / admin), retours des testeurs, suppression de compte
-- À exécuter dans Supabase : SQL Editor > New query > coller > Run (rejouable).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Rôles
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists role text not null default 'player';
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('player', 'tester', 'admin'));
-- Jours qu'un testeur peut ouvrir en avance (mode test, rien n'est enregistré). Un admin a accès à tout.
alter table public.profiles add column if not exists tester_days smallint[] not null default '{}';

create or replace function public.is_admin(p_user uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = p_user and role = 'admin');
$$;

-- ---------------------------------------------------------------------
-- 2. Amis : "suivre" un joueur (comme sur un réseau social, sans validation)
-- ---------------------------------------------------------------------
create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
alter table public.follows enable row level security;
drop policy if exists "Chacun voit qui il suit" on public.follows;
create policy "Chacun voit qui il suit" on public.follows
  for select to authenticated using (follower_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- 3. Retours des testeurs (lus uniquement par les admins)
-- ---------------------------------------------------------------------
create table if not exists public.feedback (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles (id) on delete set null,
  username text not null,
  day smallint not null check (day between 1 and 24),
  liked text not null default '',
  to_change text not null default '',
  rating smallint check (rating between 1 and 5),
  created_at timestamptz not null default now()
);
alter table public.feedback enable row level security;
-- Aucune policy : lecture et écriture uniquement via les fonctions ci-dessous

-- ---------------------------------------------------------------------
-- 4. État du joueur : on ajoute son rôle et ses jours de test
-- ---------------------------------------------------------------------
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
               else json_build_object(
                 'id', v_profile.id, 'username', v_profile.username, 'timezone', v_profile.timezone,
                 'role', v_profile.role, 'tester_days', to_json(v_profile.tester_days)
               ) end,
    'current_day', public.current_day_for(v_uid),
    'hints', coalesce((select hints_available from public.player_hints where user_id = v_uid), 0),
    'progress', coalesce((
      select json_agg(json_build_object('day', day, 'fragment_won', fragment_won, 'best_score', best_score, 'attempts', attempts) order by day)
      from public.player_progress where user_id = v_uid
    ), '[]'::json)
  );
end;
$$;

-- ---------------------------------------------------------------------
-- 5. Amis
-- ---------------------------------------------------------------------
-- Recherche de joueurs par pseudo (au moins 2 caractères), sans soi-même
create or replace function public.search_users(p_query text)
returns table (user_id uuid, username text, is_followed boolean)
language sql stable security definer set search_path = ''
as $$
  select p.id, p.username,
         exists (select 1 from public.follows f where f.follower_id = auth.uid() and f.followee_id = p.id)
  from public.profiles p
  where auth.uid() is not null
    and char_length(trim(p_query)) >= 2
    and p.id <> auth.uid()
    and position(lower(trim(p_query)) in lower(p.username)) > 0
  order by (lower(p.username) = lower(trim(p_query))) desc, p.username
  limit 20;
$$;

create or replace function public.follow_user(p_user uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_user = auth.uid() then raise exception 'cannot_follow_self'; end if;
  insert into public.follows (follower_id, followee_id) values (auth.uid(), p_user) on conflict do nothing;
end;
$$;

create or replace function public.unfollow_user(p_user uuid)
returns void
language sql security definer set search_path = ''
as $$
  delete from public.follows where follower_id = auth.uid() and followee_id = p_user;
$$;

-- ---------------------------------------------------------------------
-- 6. Retours des testeurs
-- ---------------------------------------------------------------------
create or replace function public.submit_feedback(p_day smallint, p_liked text, p_to_change text, p_rating smallint)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_profile public.profiles;
begin
  select * into v_profile from public.profiles where id = auth.uid();
  if v_profile.id is null then raise exception 'not_authenticated'; end if;
  if v_profile.role not in ('tester', 'admin') then raise exception 'not_tester'; end if;
  if coalesce(trim(p_liked), '') = '' and coalesce(trim(p_to_change), '') = '' and p_rating is null then
    raise exception 'empty_feedback';
  end if;
  insert into public.feedback (user_id, username, day, liked, to_change, rating)
  values (v_profile.id, v_profile.username, p_day, left(coalesce(trim(p_liked), ''), 2000), left(coalesce(trim(p_to_change), ''), 2000), p_rating);
end;
$$;

-- ---------------------------------------------------------------------
-- 7. Administration (réservée aux admins)
-- ---------------------------------------------------------------------
create or replace function public.admin_list_users()
returns table (
  user_id uuid, username text, role text, tester_days smallint[],
  fragments_count smallint, total_score integer, has_password boolean, created_at timestamptz
)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'not_admin'; end if;
  return query
    select p.id, p.username, p.role, p.tester_days,
           coalesce(l.fragments_count, 0::smallint), coalesce(l.total_score, 0),
           not coalesce(u.is_anonymous, true), p.created_at
    from public.profiles p
    left join public.leaderboard l on l.user_id = p.id
    left join auth.users u on u.id = p.id
    order by p.created_at desc;
end;
$$;

create or replace function public.admin_set_role(p_user uuid, p_role text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'not_admin'; end if;
  if p_user = auth.uid() then raise exception 'cannot_change_own_role'; end if; -- évite de se retirer ses propres droits
  if p_role not in ('player', 'tester', 'admin') then raise exception 'invalid_role'; end if;
  update public.profiles set role = p_role where id = p_user;
end;
$$;

create or replace function public.admin_set_tester_days(p_user uuid, p_days smallint[])
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'not_admin'; end if;
  update public.profiles
  set tester_days = coalesce((select array_agg(distinct d order by d) from unnest(p_days) d where d between 1 and 24), '{}')
  where id = p_user;
end;
$$;

create or replace function public.admin_delete_user(p_user uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'not_admin'; end if;
  if p_user = auth.uid() then raise exception 'cannot_delete_self_here'; end if;
  delete from auth.users where id = p_user; -- supprime tout en cascade (profil, progression, classement, amis)
end;
$$;

create or replace function public.admin_list_feedback(p_limit integer default 200)
returns setof public.feedback
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'not_admin'; end if;
  return query select * from public.feedback order by created_at desc limit least(greatest(p_limit, 1), 1000);
end;
$$;

-- ---------------------------------------------------------------------
-- 8. Suppression de son propre compte (RGPD) : tout est effacé, sauf les retours déjà envoyés (anonymisés)
-- ---------------------------------------------------------------------
create or replace function public.delete_my_account()
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  update public.feedback set username = 'Compte supprimé' where user_id = auth.uid();
  delete from auth.users where id = auth.uid();
end;
$$;

-- ---------------------------------------------------------------------
-- 9. Droits d'exécution
-- ---------------------------------------------------------------------
revoke execute on function public.is_admin(uuid) from public, anon, authenticated;
revoke execute on function public.search_users(text) from public, anon;
revoke execute on function public.follow_user(uuid) from public, anon;
revoke execute on function public.unfollow_user(uuid) from public, anon;
revoke execute on function public.submit_feedback(smallint, text, text, smallint) from public, anon;
revoke execute on function public.admin_list_users() from public, anon;
revoke execute on function public.admin_set_role(uuid, text) from public, anon;
revoke execute on function public.admin_set_tester_days(uuid, smallint[]) from public, anon;
revoke execute on function public.admin_delete_user(uuid) from public, anon;
revoke execute on function public.admin_list_feedback(integer) from public, anon;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.search_users(text) to authenticated;
grant execute on function public.follow_user(uuid) to authenticated;
grant execute on function public.unfollow_user(uuid) to authenticated;
grant execute on function public.submit_feedback(smallint, text, text, smallint) to authenticated;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_set_role(uuid, text) to authenticated;
grant execute on function public.admin_set_tester_days(uuid, smallint[]) to authenticated;
grant execute on function public.admin_delete_user(uuid) to authenticated;
grant execute on function public.admin_list_feedback(integer) to authenticated;
grant execute on function public.delete_my_account() to authenticated;

-- ---------------------------------------------------------------------
-- 10. Premier admin : le compte "Clervie"
-- (ne fait rien si le compte n'existe pas encore : relancer cette ligne après l'avoir créé)
-- ---------------------------------------------------------------------
update public.profiles set role = 'admin' where lower(username) = 'clervie';
