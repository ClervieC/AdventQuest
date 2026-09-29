-- =====================================================================
-- Nouvelle règle de score : la partie normale d'un jour est plafonnée à 2 000 points, le temps additionnel
-- s'ajoute par-dessus (calculé par l'appli, voir constants/scoring.ts).
--
-- Les parties déjà jouées ont été enregistrées avec leur total, sans le détail « partie normale / bonus ».
-- Remise à niveau, jour par jour, selon ce qu'on peut en déduire :
--
-- 1. Jeux SANS temps additionnel (jours 1, 3, 4, 6, 9, 10, 11, 12, 14, 15, 17, 20, 21) : tout le score est de la
--    partie normale -> ramené à 2 000 s'il dépasse. Calcul exact.
-- 2. Jeux avec bonus dont la partie normale ne peut pas dépasser 2 000 (jours 2, 5, 7, 8, 18) : tout ce qui
--    dépasse est forcément du bonus -> le score ne change pas. Calcul exact (à 100 points près pour le Stack).
-- 3. Jeux où la partie normale seule peut dépasser 2 000 (jours 16, 19, 22, 23, 24) : impossible de savoir
--    quelle part était du bonus. Règle prudente choisie : ramené à 2 000 (le bonus de ces anciennes parties est
--    perdu, les prochaines parties le comptent). Pour les laisser tels quels, retirer ces jours de la liste.
--    Le jour 13 (Runner) n'est pas ici : son barème a changé, il est recalculé par 20261003000001_rebalance_runner_scores.
--
-- À lancer une fois (SQL Editor). Rejouable sans risque. Ne concerne pas les records de l'onglet Jeux.
-- =====================================================================

-- Aperçu (lancer cette requête seule pour voir ce qui va changer, avant la mise à jour)
select day, count(*) as parties, max(best_score) as meilleur_score_actuel
from public.player_progress
where best_score > 2000
  and day in (1, 3, 4, 6, 9, 10, 11, 12, 14, 15, 17, 20, 21, 16, 19, 22, 23, 24)
group by day
order by day;

update public.player_progress
set best_score = 2000, updated_at = now()
where best_score > 2000
  and day in (
    1, 3, 4, 6, 9, 10, 11, 12, 14, 15, 17, 20, 21, -- 1. sans temps additionnel : exact
    16, 19, 22, 23, 24                              -- 3. bonus impossible à séparer : règle prudente
  );
-- Jours 2, 5, 7, 8, 18 : non touchés (ce qui dépasse 2 000 est forcément du bonus)

-- Total, fragments et série de chaque joueur recalculés à partir de sa progression
select public.refresh_leaderboard(p.id)
from public.profiles p
where exists (select 1 from public.leaderboard l where l.user_id = p.id);
