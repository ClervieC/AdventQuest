-- =====================================================================
-- Jour 13 (Runner) : le score avance moins vite. Les meilleurs scores déjà enregistrés sont ramenés au
-- nouveau barème.
--
--   Ancien : 1 point tous les 10 px + 100 par étoile, temps additionnel compté pareil.
--   Nouveau : 1 point tous les 25 px + 50 par étoile ; temps additionnel compté à 40 %.
--
-- La part distance / étoiles et la part partie normale / temps additionnel ne sont pas enregistrées :
-- estimation à partir d'une course moyenne (difficulté moyenne, 60 s ≈ 26 000 px et une douzaine d'étoiles) :
--   - jusqu'à 3 800 (ce que rapporte une très bonne partie normale) : × 0,44 ;
--   - au-delà (temps additionnel) : × 0,17.
-- Exemples : 1 000 -> 440 · 3 800 -> 1 672 · 6 000 -> 2 046 · 9 500 -> 2 641.
-- Précision : ± 10 % environ selon le nombre d'étoiles ramassées.
--
-- Si le plafond à 2 000 (20261002000000_cap_existing_scores, ancienne version) a déjà été lancé, les scores du
-- jour 13 au-dessus de 2 000 y ont été ramenés à 2 000 : ils deviendront 880 (le détail est perdu).
--
-- À lancer une seule fois (SQL Editor). Protégé : si elle a déjà été lancée, elle ne refait rien.
-- =====================================================================

-- Aperçu (lancer cette requête seule avant la mise à jour)
select best_score as score_actuel,
       round(0.44 * least(best_score, 3800) + 0.17 * greatest(0, best_score - 3800))::int as nouveau_score
from public.player_progress
where day = 13 and best_score > 0
order by best_score desc;

create table if not exists public.score_rebalances (
  name text primary key,
  applied_at timestamptz not null default now()
);
alter table public.score_rebalances enable row level security;

do $$
begin
  if exists (select 1 from public.score_rebalances where name = 'runner_v2') then
    raise notice 'Remise à niveau du Runner déjà faite : rien à changer.';
    return;
  end if;

  update public.player_progress
  set best_score = round(0.44 * least(best_score, 3800) + 0.17 * greatest(0, best_score - 3800))::int,
      updated_at = now()
  where day = 13 and best_score > 0;

  insert into public.score_rebalances (name) values ('runner_v2');
end $$;

-- Total, fragments et série de chaque joueur recalculés à partir de sa progression
select public.refresh_leaderboard(p.id)
from public.profiles p
where exists (select 1 from public.leaderboard l where l.user_id = p.id);
