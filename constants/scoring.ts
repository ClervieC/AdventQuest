import type { Localized } from '../services/i18n';

// Points d'une partie du calendrier : tous les jours pèsent pareil dans le classement, quel que soit le jeu.
// - Jour gagné : de 1 000 à 2 000 points selon la performance (score du jeu comparé au meilleur score possible ce jour-là),
//   plus un bonus de 0 à +1 000 pour ce qui est fait après l'objectif (temps additionnel, blocs en plus...).
// - Jour raté (partie perdue, ou jour pas joué) : on ne perd pas de points, mais on n'en gagne pas non plus.
// L'onglet Jeux (hors classement) garde le score brut du jeu, sans barème.

export const WIN_MIN_POINTS = 1000;
export const WIN_MAX_POINTS = 2000;
export const BONUS_MAX_POINTS = 1000;

export interface DayPoints {
  total: number;
  base: number; // points de la partie (1 000 à 2 000 si gagné, 0 sinon)
  bonus: number; // points bonus (0 à 1 000)
  performance: number; // 0 à 1 : score du jeu / meilleur score possible du jour
}

/**
 * Ce que vaut chaque jour, affiché sur l'écran d'intro et utilisé pour le barème :
 * - baseMax : meilleur score possible du jeu ce jour-là (hors bonus) = performance de 100 % ;
 * - approx : jeu en temps limité, le meilleur score dépend de ce qui apparaît (friandises, bulles...) ;
 * - bonusFull : score bonus du jeu qui donne le bonus maximum (+1 000) ;
 * - bonus : ce qui rapporte du bonus, s'il y en a ;
 * - how : comment le jeu calcule son score (affiché dans « Comment jouer »).
 */
export interface DayScoreInfo {
  baseMax: number;
  approx?: boolean;
  bonusFull?: number;
  bonus?: Localized;
  how: Localized;
}

const sudokuHow = (minutes: number, maxPenalty: string): Localized => ({
  fr: `1 500 pts, −1 par seconde après les ${minutes} premières minutes (−${maxPenalty} au plus), −100 par case révélée.`,
  en: `1,500 pts, −1 per second after the first ${minutes} minutes (−${maxPenalty} at most), −100 per revealed square.`,
});

export const DAY_SCORE_INFO: Record<number, DayScoreInfo> = {
  1: { baseMax: 2000, how: { fr: '200 pts par bonne réponse (10 questions).', en: '200 pts per correct answer (10 questions).' } },
  2: {
    baseMax: 2000,
    bonusFull: 1000,
    bonus: { fr: 'chaque bloc posé après l’objectif', en: 'every block placed after the goal' },
    how: { fr: '100 pts par bloc empilé jusqu’à l’objectif, plus des points si la tour reste large.', en: '100 pts per block stacked up to the goal, plus points if the tower stays wide.' },
  },
  3: { baseMax: 1500, how: sudokuHow(5, '800') },
  4: { baseMax: 2000, approx: true, how: { fr: '20 à 40 pts par ennemi, 300 pts pour le traîneau, 100 pts par vie restante à chaque vague terminée.', en: '20 to 40 pts per enemy, 300 pts for the sleigh, 100 pts per life left at the end of each wave.' } },
  5: {
    baseMax: 1500,
    bonusFull: 1000,
    bonus: { fr: 'chaque pomme après l’objectif', en: 'every apple after the goal' },
    how: { fr: '100 pts par pomme jusqu’à l’objectif.', en: '100 pts per apple up to the goal.' },
  },
  6: { baseMax: 800, how: { fr: '800 pts, −5 par seconde après les 15 premières (−300 au plus), −30 par point touché dans le désordre.', en: '800 pts, −5 per second after the first 15 (−300 at most), −30 per dot touched out of order.' } },
  7: {
    baseMax: 1300,
    approx: true,
    bonusFull: 600,
    bonus: { fr: 'les friandises coupées pendant le temps additionnel', en: 'treats sliced during extra time' },
    how: { fr: '30 pts par friandise coupée pendant les 60 s.', en: '30 pts per treat sliced during the 60 s.' },
  },
  8: {
    baseMax: 900,
    bonusFull: 875,
    bonus: { fr: 'chaque couleur au-delà de l’objectif', en: 'every colour past the goal' },
    how: { fr: '150 pts par couleur retenue jusqu’à l’objectif (6 couleurs), −80 par indice.', en: '150 pts per colour remembered up to the goal (6 colours), −80 per hint.' },
  },
  9: {
    baseMax: 2000,
    how: {
      fr: 'Le moins de bulles tirées, le mieux. Grille vidée : 2 000 pts, −40 par bulle tirée au-delà de l’objectif (environ 1 tir pour 3 bulles de la grille, affiché en jeu ; 500 pts au moins). Temps écoulé : jusqu’à 800 pts selon la part de la grille vidée.',
      en: 'The fewer bubbles shot, the better. Grid cleared: 2,000 pts, −40 per bubble shot beyond the target (about 1 shot per 3 bubbles in the grid, shown in game; at least 500 pts). Time up: up to 800 pts depending on how much of the grid you cleared.',
    },
  },
  10: { baseMax: 1000, how: { fr: '1 000 pts, −20 par rotation au-delà du minimum nécessaire (+4 de marge), −100 par indice.', en: '1,000 pts, −20 per rotation beyond the minimum needed (+4 spare), −100 per hint.' } },
  11: { baseMax: 1300, how: { fr: '25 pts par carte rangée (1 300), −1 toutes les 5 s après les 3 premières minutes (−200 au plus), −50 par indice.', en: '25 pts per card put away (1,300), −1 every 5 s after the first 3 minutes (−200 at most), −50 per hint.' } },
  12: { baseMax: 1500, how: sudokuHow(10, '1 000') },
  13: {
    baseMax: 2000,
    approx: true,
    bonusFull: 800,
    bonus: { fr: 'la distance et les étoiles pendant le temps additionnel', en: 'distance and stars during extra time' },
    how: { fr: 'Des points pour la distance parcourue et les étoiles ramassées pendant les 60 s.', en: 'Points for the distance run and the stars collected during the 60 s.' },
  },
  14: { baseMax: 1450, approx: true, how: { fr: '1 000 pts, −15 par case parcourue en trop, +5 par seconde de torche restante.', en: '1,000 pts, −15 per extra square walked, +5 per second of torch left.' } },
  15: { baseMax: 900, how: { fr: '900 pts, −3 par seconde après les 45 premières (−300 au plus), −15 par case mal noircie, −80 par indice.', en: '900 pts, −3 per second after the first 45 (−300 at most), −15 per wrongly filled square, −80 per hint.' } },
  16: {
    baseMax: 1600,
    approx: true,
    bonusFull: 400,
    bonus: { fr: 'les gobelins tapés pendant le temps additionnel', en: 'goblins whacked during extra time' },
    how: { fr: '35 pts par gobelin tapé pendant les 45 s, −50 si tu tapes un faux fragment.', en: '35 pts per goblin whacked during the 45 s, −50 if you hit a fake shard.' },
  },
  17: { baseMax: 1500, how: sudokuHow(20, '1 000') },
  18: {
    baseMax: 1200,
    bonusFull: 1000,
    bonus: { fr: 'chaque couleur au-delà de l’objectif', en: 'every colour past the goal' },
    how: { fr: '150 pts par couleur retenue jusqu’à l’objectif (8 couleurs), −80 par indice.', en: '150 pts per colour remembered up to the goal (8 colours), −80 per hint.' },
  },
  19: {
    baseMax: 2000,
    approx: true,
    bonusFull: 500,
    bonus: { fr: 'la survie et les cadeaux pendant le temps additionnel', en: 'survival and presents during extra time' },
    how: { fr: '8 pts par seconde survécue (plus avec le multiplicateur), 60 pts par cadeau attrapé.', en: '8 pts per second survived (more with the multiplier), 60 pts per present caught.' },
  },
  20: { baseMax: 1200, approx: true, how: { fr: '10 pts par brique, multipliés par le combo, +5 par seconde restante à la fin.', en: '10 pts per brick, multiplied by the combo, +5 per second left at the end.' } },
  21: { baseMax: 2000, approx: true, how: { fr: '100 pts par note parfaite, 50 par note correcte, ×2 à ×4 avec le combo.', en: '100 pts per perfect note, 50 per good note, ×2 to ×4 with the combo.' } },
  22: {
    baseMax: 2000,
    approx: true,
    bonusFull: 600,
    bonus: { fr: 'les friandises marquées après l’objectif', en: 'treats scored after the goal' },
    how: { fr: 'Les points de chaque épreuve s’additionnent.', en: 'The points of each challenge add up.' },
  },
  23: {
    baseMax: 2000,
    approx: true,
    bonusFull: 625,
    bonus: { fr: 'les colonnes passées par le renne pendant le temps additionnel', en: 'columns passed by the reindeer during extra time' },
    how: { fr: 'Les points de chaque épreuve s’additionnent.', en: 'The points of each challenge add up.' },
  },
  24: {
    baseMax: 2000,
    approx: true,
    bonusFull: 500,
    bonus: { fr: 'les points du 2048 marqués après le sapin 🎄', en: '2048 points scored after the tree 🎄' },
    how: { fr: 'Les points de chaque épreuve s’additionnent.', en: 'The points of each challenge add up.' },
  },
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const roundTo10 = (value: number) => Math.round(value / 10) * 10;

/**
 * Points du calendrier pour une partie : `score` = score brut du jeu (bonus compris), `bonus` = la part du score brut
 * gagnée après l'objectif. Le résultat ne dépend que de la performance, pas de l'échelle de points propre à chaque jeu.
 */
export function dayPoints(day: number, score: number, bonus: number, success: boolean): DayPoints {
  const info: Pick<DayScoreInfo, 'baseMax' | 'bonusFull'> = DAY_SCORE_INFO[day] ?? { baseMax: 2000 };
  const rawBonus = Math.max(0, Math.min(bonus, score));
  const rawBase = Math.max(0, score - rawBonus);
  const performance = clamp01(rawBase / info.baseMax);

  // Jour raté : ni points perdus, ni points gagnés
  if (!success) return { total: 0, base: 0, bonus: 0, performance };
  const base = roundTo10(WIN_MIN_POINTS + (WIN_MAX_POINTS - WIN_MIN_POINTS) * performance);
  const bonusPoints = info.bonusFull ? roundTo10(BONUS_MAX_POINTS * clamp01(rawBonus / info.bonusFull)) : 0;
  return { total: base + bonusPoints, base, bonus: bonusPoints, performance };
}
