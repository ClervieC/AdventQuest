import { DAYS_CONFIG } from '../constants/days';
import { gameLabel } from '../constants/survey';
import type { Localized } from './i18n';

// Récap de la saison (à partir du 25 décembre) : ce que le joueur a fait jour par jour, ses meilleurs jeux,
// celui qui lui a donné du fil à retordre, et un texte à partager (grille de 24 cases façon Wordle).

const MARATHON_LABEL: Localized = { fr: '🏁 Marathon', en: '🏁 Marathon' };

export interface DayProgress {
  fragmentWon: boolean;
  bestScore: number;
  attempts: number;
}

export interface DayRecap {
  day: number;
  icon: string;
  game: Localized; // nom du jeu
  won: boolean;
  bestScore: number;
  attempts: number;
}

export interface SeasonRecap {
  fragments: number;
  totalPoints: number;
  daysPlayed: number;
  wonFirstTry: number;
  totalAttempts: number;
  best: DayRecap[]; // jusqu'à 3 jours gagnés, du meilleur score au moins bon
  toughest: DayRecap | null; // le jour le plus rejoué (2 essais au moins)
  grid: string; // 24 cases : 🟩 gagné du premier coup, 🟨 gagné après plusieurs essais, 🟥 tenté sans réussir, ⬛ pas joué
}

/** Case du jour dans la grille partagée */
export function dayEmoji(progress: DayProgress | undefined): string {
  if (!progress || progress.attempts === 0) return '⬛';
  if (!progress.fragmentWon) return '🟥';
  return progress.attempts === 1 ? '🟩' : '🟨';
}

export function buildRecap(days: Record<number, DayProgress>): SeasonRecap {
  const all: DayRecap[] = DAYS_CONFIG.map((config) => {
    const progress = days[config.day];
    return {
      day: config.day,
      icon: config.fragmentIcon,
      game: config.game === 'marathon_22' || config.game === 'marathon_23' ? MARATHON_LABEL : gameLabel(config.game),
      won: !!progress?.fragmentWon,
      bestScore: progress?.bestScore ?? 0,
      attempts: progress?.attempts ?? 0,
    };
  });
  const played = all.filter((d) => d.attempts > 0);
  const won = all.filter((d) => d.won);

  const best = [...won].sort((a, b) => b.bestScore - a.bestScore || a.day - b.day).slice(0, 3);
  const retried = played.filter((d) => d.attempts >= 2);
  const toughest =
    retried.length > 0 ? [...retried].sort((a, b) => b.attempts - a.attempts || a.bestScore - b.bestScore || a.day - b.day)[0] : null;

  // 4 rangées de 6 cases
  const cells = DAYS_CONFIG.map((config) => dayEmoji(days[config.day]));
  const grid = [0, 6, 12, 18].map((start) => cells.slice(start, start + 6).join('')).join('\n');

  return {
    fragments: won.length,
    totalPoints: all.reduce((sum, d) => sum + d.bestScore, 0),
    daysPlayed: played.length,
    wonFirstTry: won.filter((d) => d.attempts === 1).length,
    totalAttempts: played.reduce((sum, d) => sum + d.attempts, 0),
    best,
    toughest,
    grid,
  };
}

/** Texte à partager sur les réseaux (court, avec la grille) */
export function recapShareText(
  recap: SeasonRecap,
  options: { lang: 'fr' | 'en'; locale: string; rank: number | null; url: string | null }
): string {
  const { lang, locale, rank, url } = options;
  const fr = lang === 'fr';
  const points = recap.totalPoints.toLocaleString(locale);
  const rankText = rank ? (fr ? ` · 🏆 ${rank}${rank === 1 ? 'er' : 'e'}` : ` · 🏆 #${rank}`) : '';
  const lines = [
    fr ? '🎄 AdventQuest — mon récap de l’Avent' : '🎄 AdventQuest — my Advent recap',
    `❤️‍🔥 ${recap.fragments}/24 ${fr ? 'fragments' : 'shards'} · ${points} pts${rankText}`,
    recap.grid,
  ];
  const top = recap.best[0];
  if (top) lines.push(`⭐ ${fr ? 'Mon meilleur jeu :' : 'My best game:'} ${top.game[lang]} (${top.bestScore.toLocaleString(locale)} pts)`);
  if (recap.toughest) {
    lines.push(`💪 ${fr ? 'Mon défi :' : 'My challenge:'} ${recap.toughest.game[lang]} (${recap.toughest.attempts} ${fr ? 'essais' : 'tries'})`);
  }
  if (url) lines.push(url);
  return lines.join('\n');
}
