import type { Localized } from '../services/i18n';

// Score d'une partie du calendrier : la partie normale (le temps imparti, l'objectif du jour) est plafonnée à
// 2 000 points pour que tous les jours pèsent pareil dans le classement. Les points gagnés en temps additionnel /
// bonus (après l'objectif) s'ajoutent par-dessus, sans plafond : c'est tout l'intérêt du bonus.
// L'onglet Jeux (hors classement) n'est pas plafonné.

export const BASE_SCORE_CAP = 2000;

export interface CappedScore {
  total: number;
  base: number; // partie normale, après plafond
  bonus: number; // temps additionnel
  capped: boolean; // la partie normale dépassait le plafond
}

export function capScore(score: number, bonus = 0): CappedScore {
  const safeBonus = Math.max(0, Math.min(bonus, score));
  const rawBase = Math.max(0, score - safeBonus);
  const base = Math.min(BASE_SCORE_CAP, rawBase);
  return { total: Math.round(base + safeBonus), base: Math.round(base), bonus: Math.round(safeBonus), capped: rawBase > BASE_SCORE_CAP };
}

/**
 * Ce qu'on peut marquer au maximum chaque jour, affiché sur l'écran d'intro du jeu :
 * - baseMax : maximum de la partie normale (le plafond de 2 000, ou moins si le jeu ne peut pas l'atteindre) ;
 * - approx : maximum estimé (jeu en temps limité : dépend du nombre de friandises, bulles... qui apparaissent) ;
 * - bonus : ce que rapporte le temps additionnel (sans plafond), s'il y en a.
 */
export interface DayScoreInfo {
  baseMax: number;
  approx?: boolean;
  bonus?: Localized;
}

const TIME_BONUS = (seconds: number, what: Localized): Localized => ({
  fr: `${what.fr} pendant ${seconds} s de temps additionnel au plus`,
  en: `${what.en} during up to ${seconds} s of extra time`,
});

export const DAY_SCORE_INFO: Record<number, DayScoreInfo> = {
  1: { baseMax: 2000 }, // quiz : 10 × 200
  2: { baseMax: 2000, bonus: { fr: '+150 par bloc au-delà de l’objectif, 25 blocs au plus (+3 750)', en: '+150 per block past the goal, up to 25 blocks (+3,750)' } },
  3: { baseMax: 1500 },
  4: { baseMax: 2000 },
  5: { baseMax: 1500, bonus: { fr: '+100 par pomme après la 15e', en: '+100 per apple after the 15th' } },
  6: { baseMax: 800 },
  7: { baseMax: 1300, approx: true, bonus: TIME_BONUS(60, { fr: '+30 par friandise', en: '+30 per treat' }) },
  8: { baseMax: 1050, bonus: { fr: '+250 par couleur au-delà de 7, jusqu’à 14 couleurs (+1 750)', en: '+250 per colour past 7, up to 14 colours (+1,750)' } },
  9: { baseMax: 2000, approx: true },
  10: { baseMax: 1000 },
  11: { baseMax: 1300 },
  12: { baseMax: 1500 },
  13: { baseMax: 2000, bonus: TIME_BONUS(60, { fr: 'Distance et étoiles', en: 'Distance and stars' }) },
  14: { baseMax: 1450, approx: true },
  15: { baseMax: 900 },
  16: { baseMax: 2000, bonus: TIME_BONUS(45, { fr: '+100 par gobelin', en: '+100 per goblin' }) },
  17: { baseMax: 1500 },
  18: { baseMax: 1500, bonus: { fr: '+250 par couleur au-delà de 10, jusqu’à 18 couleurs (+2 000)', en: '+250 per colour past 10, up to 18 colours (+2,000)' } },
  19: { baseMax: 2000, bonus: TIME_BONUS(60, { fr: 'Points de survie et cadeaux', en: 'Survival points and presents' }) },
  20: { baseMax: 2000 },
  21: { baseMax: 2000 },
  22: { baseMax: 2000, bonus: { fr: 'Friandises : les points marqués après l’objectif', en: 'Treats: points scored after the goal' } },
  23: { baseMax: 2000, bonus: TIME_BONUS(60, { fr: 'Renne : +150 par colonne', en: 'Reindeer: +150 per column' }) },
  24: { baseMax: 2000, bonus: { fr: '2048 : les points marqués après le sapin 🎄, sans limite', en: '2048: points scored after the tree 🎄, no limit' } },
};
