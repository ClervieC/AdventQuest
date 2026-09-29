-- =====================================================================
-- Records personnels (onglet Jeux) gardés sur le serveur : ils suivent le joueur sur tous ses appareils,
-- et permettent un classement par jeu entre amis. Hors classement officiel de la saison.
-- Clés : 'arcade:<jeu>[-<niveau>]', 'day<N>' (jeu du jour N), 'game:<type>' (épreuve des jours 22 à 24).
-- Idempotente : peut être rejouée sans erreur.
-- =====================================================================

create table if not exists public.arcade_records (
  user_id uuid not null references public.profiles (id) on delete cascade,
  record_key text not null check (record_key ~ '^[a-z0-9:_-]{2,40}$'),
  score integer not null check (score > 0 and score <= 10000000),
  updated_at timestamptz not null default now(),
  primary key (user_id, record_key)
);
alter table public.arcade_records enable row level security;
-- Aucune policy : lecture et écriture uniquement via les fonctions ci-dessous

-- Enregistre un score : on ne garde que le meilleur
create or replace function public.submit_arcade_record(p_key text, p_score integer)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid()) then raise exception 'no_profile'; end if;
  insert into public.arcade_records (user_id, record_key, score) values (auth.uid(), p_key, p_score)
  on conflict (user_id, record_key) do update
    set score = greatest(public.arcade_records.score, excluded.score),
        updated_at = case when excluded.score > public.arcade_records.score then now() else public.arcade_records.updated_at end;
end;
$$;

-- Tous mes records (au démarrage de l'app)
create or replace function public.my_arcade_records()
returns table (record_key text, score integer)
language sql stable security definer set search_path = ''
as $$
  select r.record_key, r.score from public.arcade_records r where r.user_id = auth.uid();
$$;

-- Classement d'un jeu entre moi et les joueurs que je suis : le meilleur score de chacun parmi les clés données
-- (ex. pour le Sudoku difficile : 'arcade:sudoku-hard' et 'day12')
create or replace function public.friends_arcade_records(p_keys text[])
returns table (user_id uuid, username text, score integer, is_me boolean)
language sql stable security definer set search_path = ''
as $$
  select p.id, p.username, max(r.score)::integer, p.id = auth.uid()
  from public.arcade_records r
  join public.profiles p on p.id = r.user_id
  where r.record_key = any (p_keys)
    and (r.user_id = auth.uid() or r.user_id in (select f.followee_id from public.follows f where f.follower_id = auth.uid()))
  group by p.id, p.username
  order by 3 desc
  limit 50;
$$;

revoke execute on function public.submit_arcade_record(text, integer) from public, anon;
revoke execute on function public.my_arcade_records() from public, anon;
revoke execute on function public.friends_arcade_records(text[]) from public, anon;
grant execute on function public.submit_arcade_record(text, integer) to authenticated;
grant execute on function public.my_arcade_records() to authenticated;
grant execute on function public.friends_arcade_records(text[]) to authenticated;
