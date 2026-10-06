-- =====================================================================
-- Nouveau barème du calendrier (voir constants/scoring.ts) : tous les jours valent autant.
--   Jour gagné : 1 000 à 2 000 points selon la performance (score du jeu / meilleur score possible du jour)
--                + bonus de 0 à 1 000 pour ce qui est fait après l'objectif.
--   Jour raté  : 0 point (on ne perd rien, on ne gagne rien).
--
-- Les meilleurs scores déjà enregistrés (parties de test) sont convertis : le score enregistré est découpé en
-- partie normale (jusqu'au meilleur score possible du jour) et bonus (ce qui dépasse, pour les jours qui ont un
-- bonus), puis converti exactement comme dans l'appli. Approché pour les parties jouées avec l'ancien barème
-- (par exemple le Mémoire du jour 8, joué avec un objectif de 7 couleurs), plutôt favorable au joueur.
--
-- À lancer une seule fois (SQL Editor). Protégé : si elle a déjà été lancée, elle ne refait rien.
-- Ne concerne pas les records de l'onglet Jeux.
-- =====================================================================

-- Trace des remises à niveau déjà faites
create table if not exists public.score_rebalances (
  name text primary key,
  applied_at timestamptz not null default now()
);
alter table public.score_rebalances enable row level security;

do $$
begin
  if exists (select 1 from public.score_rebalances where name = 'day_points_v1') then
    raise notice 'Nouveau barème déjà appliqué : rien à changer.';
    return;
  end if;

  -- Meilleur score possible de chaque jour (base_max) et score bonus qui donne le bonus maximum (bonus_full)
  with day_scale(day, base_max, bonus_full) as (
    -- types explicites : la 1re ligne contient un NULL
    values
      (1, 2000, null::int), (2, 2000, 1000), (3, 1500, null), (4, 2000, null), (5, 1500, 1000), (6, 800, null),
      (7, 1300, 600), (8, 900, 875), (9, 2000, null), (10, 1000, null), (11, 1300, null), (12, 1500, null),
      (13, 2000, 800), (14, 1450, null), (15, 900, null), (16, 1600, 400), (17, 1500, null), (18, 1200, 1000),
      (19, 2000, 500), (20, 1200, null), (21, 2000, null), (22, 2000, 600), (23, 2000, 625), (24, 2000, 500)
  )
  update public.player_progress p
  set best_score = case
        when not p.fragment_won then 0
        else
          -- partie : 1 000 + 1 000 × performance, arrondi à la dizaine
          (round((1000 + 1000 * least(1.0, least(p.best_score, s.base_max)::numeric / s.base_max)) / 10) * 10)::int
          -- bonus : 1 000 × (bonus / bonus_full), plafonné, arrondi à la dizaine ; 0 si le jour n'a pas de bonus
          -- (attention : least() ignore les NULL, d'où le case explicite)
          + case
              when s.bonus_full is null then 0
              else (round(1000 * least(1.0, greatest(0, p.best_score - s.base_max)::numeric / s.bonus_full) / 10) * 10)::int
            end
      end,
      updated_at = now()
  from day_scale s
  where s.day = p.day;

  insert into public.score_rebalances (name) values ('day_points_v1');
end $$;

-- Total, fragments et série de chaque joueur recalculés à partir de sa progression
select public.refresh_leaderboard(p.id)
from public.profiles p
where exists (select 1 from public.leaderboard l where l.user_id = p.id);
