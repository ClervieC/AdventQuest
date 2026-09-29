-- =====================================================================
-- Nouveau barème du temps additionnel (bonus réduit, ≈ 1 000 points au plus) : les meilleurs scores déjà
-- enregistrés des jours 2, 5, 7, 8 et 18 sont recalculés comme s'ils avaient été faits avec le nouveau barème.
--
--   Jour 2  Stack        ancien : 1 600 + 150 par bloc bonus + largeur (0 à 500)   nouveau : 40 par bloc bonus
--                        La largeur n'est pas connue : on la suppose moyenne (250) pour retrouver le nombre de
--                        blocs bonus -> précis à ± 2 blocs environ (± 220 points).
--   Jour 5  Snake        ancien : 100 par pomme                                   nouveau : 40 après la 15e (exact)
--   Jour 7  Fruit Ninja  ancien : 30 par friandise                                nouveau : 10 en bonus
--                        La partie normale n'est pas connue : ce qui dépasse 1 300 est compté comme bonus
--                        (approché, plutôt favorable au joueur).
--   Jour 8  Mémoire (objectif 7 couleurs)   ancien : 250 par couleur en plus   nouveau : 125 (exact sans indice)
--   Jour 18 Mémoire (objectif 10 couleurs)  ancien : 250 par couleur en plus   nouveau : 125 (exact sans indice)
--
-- À lancer une seule fois (SQL Editor). Protégé : si elle a déjà été lancée, elle ne refait rien (sinon les
-- scores baisseraient à chaque fois). Ne concerne pas les records de l'onglet Jeux.
-- =====================================================================

-- Aperçu (lancer cette requête seule pour voir ce qui va changer, avant la mise à jour)
select day, count(*) as parties, max(best_score) as meilleur_score_actuel
from public.player_progress
where (day = 2 and best_score > 2100)
   or (day = 5 and best_score > 1500)
   or (day = 7 and best_score > 1300)
   or (day = 8 and best_score > 1050)
   or (day = 18 and best_score > 1500)
group by day
order by day;

-- Trace des remises à niveau déjà faites
create table if not exists public.score_rebalances (
  name text primary key,
  applied_at timestamptz not null default now()
);
alter table public.score_rebalances enable row level security;

do $$
begin
  if exists (select 1 from public.score_rebalances where name = 'bonus_v2') then
    raise notice 'Remise à niveau déjà faite : rien à changer.';
    return;
  end if;

  -- Jour 2 : blocs bonus retrouvés (largeur supposée 250), 25 au plus ; chacun passe de 150 à 40
  update public.player_progress
  set best_score = best_score - 110 * least(25, greatest(0, round((best_score - 1600 - 250) / 150.0)))::int,
      updated_at = now()
  where day = 2 and best_score > 2100;

  -- Jour 5 : les pommes après la 15e passent de 100 à 40
  update public.player_progress
  set best_score = 1500 + round((best_score - 1500) * 0.4)::int, updated_at = now()
  where day = 5 and best_score > 1500;

  -- Jour 7 : ce qui dépasse 1 300 compte pour un tiers (30 -> 10 par friandise)
  update public.player_progress
  set best_score = 1300 + round((best_score - 1300) / 3.0)::int, updated_at = now()
  where day = 7 and best_score > 1300;

  -- Jours 8 et 18 : chaque couleur au-delà de l'objectif passe de 250 à 125
  update public.player_progress
  set best_score = 1050 + round((best_score - 1050) / 2.0)::int, updated_at = now()
  where day = 8 and best_score > 1050;

  update public.player_progress
  set best_score = 1500 + round((best_score - 1500) / 2.0)::int, updated_at = now()
  where day = 18 and best_score > 1500;

  insert into public.score_rebalances (name) values ('bonus_v2');
end $$;

-- Total, fragments et série de chaque joueur recalculés à partir de sa progression
select public.refresh_leaderboard(p.id)
from public.profiles p
where exists (select 1 from public.leaderboard l where l.user_id = p.id);
