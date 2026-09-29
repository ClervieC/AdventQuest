import type { Localized } from '../services/i18n';
import { DAYS_CONFIG, GameType } from './days';

// Onglet Jeux : une sélection de jeux rejouables à l'infini (sans fin qui accélère, ou par niveaux).
// Un jeu apparaît quand son premier jour dans le calendrier est débloqué.

export type SudokuLevel = 'easy' | 'medium' | 'hard' | 'very_hard';

export interface ArcadeGame {
  id: string;
  game: GameType;
  unlockDay: number;
  icon: string;
  name: Localized;
  description: Localized;
  difficulty: 'easy' | 'medium' | 'hard' | 'very_hard'; // difficulté de départ (sans effet pour les jeux à niveaux)
}

export const ARCADE_GAMES: ArcadeGame[] = [
  { id: 'stack', game: 'stack', unlockDay: 2, icon: '🧱', difficulty: 'medium', name: { fr: 'Stack', en: 'Stack' }, description: { fr: 'Empile sans fin : chaque bloc va plus vite.', en: 'Stack forever: every block moves faster.' } },
  { id: 'sudoku', game: 'sudoku', unlockDay: 3, icon: '🔢', difficulty: 'medium', name: { fr: 'Sudoku', en: 'Sudoku' }, description: { fr: 'Choisis ton niveau, une nouvelle grille à chaque fois.', en: 'Pick your level, a new grid every time.' } },
  { id: 'spaceinvaders', game: 'spaceinvaders', unlockDay: 4, icon: '👾', difficulty: 'medium', name: { fr: 'Space Invaders', en: 'Space Invaders' }, description: { fr: 'Des vagues sans fin, de plus en plus rapides.', en: 'Endless waves, faster and faster.' } },
  { id: 'snake', game: 'snake', unlockDay: 5, icon: '🎀', difficulty: 'easy', name: { fr: 'Snake', en: 'Snake' }, description: { fr: 'Mange un maximum de pommes sans te mordre la queue.', en: 'Eat as many apples as you can without biting your tail.' } },
  { id: 'fruitninja', game: 'fruitninja', unlockDay: 7, icon: '🍎', difficulty: 'easy', name: { fr: 'Fruit Ninja', en: 'Fruit Ninja' }, description: { fr: 'Tranche tout jusqu’à la première bombe : ça accélère.', en: 'Slice everything until the first bomb: it speeds up.' } },
  { id: 'memory', game: 'memory_sequence', unlockDay: 8, icon: '🎨', difficulty: 'medium', name: { fr: 'Mémoire des couleurs', en: 'Colour memory' }, description: { fr: 'Va aussi loin que possible dans la séquence.', en: 'Go as far as you can in the sequence.' } },
  { id: 'bubbleshooter', game: 'bubbleshooter', unlockDay: 9, icon: '🫧', difficulty: 'easy', name: { fr: 'Bubble Shooter', en: 'Bubble Shooter' }, description: { fr: 'Vide la grille pour passer au niveau suivant.', en: 'Clear the grid to reach the next level.' } },
  { id: 'solitaire', game: 'solitaire', unlockDay: 11, icon: '🃏', difficulty: 'medium', name: { fr: 'Solitaire', en: 'Solitaire' }, description: { fr: 'Une nouvelle donne gagnable à chaque partie.', en: 'A new winnable deal every game.' } },
  { id: 'runner', game: 'runner', unlockDay: 13, icon: '🏃', difficulty: 'medium', name: { fr: 'Runner', en: 'Runner' }, description: { fr: 'Cours jusqu’à ta dernière vie : ça accélère.', en: 'Run until your last life: it speeds up.' } },
  { id: 'whackamole', game: 'whackamole', unlockDay: 16, icon: '👺', difficulty: 'medium', name: { fr: 'Tape-gobelins', en: 'Whack-a-goblin' }, description: { fr: 'Jusqu’à ta dernière vie, de plus en plus vite.', en: 'Until your last life, faster and faster.' } },
  { id: 'dodgeball', game: 'dodgeball', unlockDay: 19, icon: '🛡️', difficulty: 'medium', name: { fr: 'Dodge Ball', en: 'Dodge Ball' }, description: { fr: 'Esquive jusqu’au premier coup reçu : ça accélère.', en: 'Dodge until the first hit: it speeds up.' } },
  { id: 'cassebriques', game: 'cassebriques', unlockDay: 20, icon: '🧊', difficulty: 'medium', name: { fr: 'Casse-briques', en: 'Brick Breaker' }, description: { fr: 'Brise chaque mur pour passer au niveau suivant.', en: 'Break each wall to reach the next level.' } },
  { id: 'match3', game: 'match3', unlockDay: 22, icon: '🍬', difficulty: 'medium', name: { fr: 'Friandises à aligner', en: 'Treat match' }, description: { fr: 'Comme Candy Crush : aligne 3 friandises identiques et réussis les niveaux.', en: 'Like Candy Crush: line up 3 identical treats and clear the levels.' } },
  { id: 'pairs', game: 'pairs', unlockDay: 23, icon: '🃏', difficulty: 'medium', name: { fr: 'Paires', en: 'Pairs' }, description: { fr: 'Retrouve toutes les paires le plus vite possible.', en: 'Find every pair as fast as you can.' } },
  { id: 'flappy', game: 'flappy', unlockDay: 23, icon: '🦌', difficulty: 'medium', name: { fr: 'Envol du renne', en: 'Reindeer flight' }, description: { fr: 'Vole le plus loin possible entre les colonnes de glace.', en: 'Fly as far as you can between the ice columns.' } },
  { id: 'game2048', game: 'game2048', unlockDay: 24, icon: '❤️‍🔥', difficulty: 'medium', name: { fr: '2048 de Noël', en: 'Christmas 2048' }, description: { fr: 'Fusionne les objets jusqu’à ce que la grille soit bloquée.', en: 'Merge the items until the grid locks up.' } },
];

export const SUDOKU_LEVELS: { level: SudokuLevel; label: Localized }[] = [
  { level: 'easy', label: { fr: 'Facile', en: 'Easy' } },
  { level: 'medium', label: { fr: 'Moyen', en: 'Medium' } },
  { level: 'hard', label: { fr: 'Difficile', en: 'Hard' } },
  { level: 'very_hard', label: { fr: 'Très difficile', en: 'Very hard' } },
];

export function getArcadeGame(id: string): ArcadeGame | undefined {
  return ARCADE_GAMES.find((g) => g.id === id);
}

/** Clé du record personnel d'un jeu de l'onglet (le Sudoku a un record par niveau) */
export function arcadeRecordKey(id: string, level?: SudokuLevel): string {
  return level ? `arcade:${id}-${level}` : `arcade:${id}`;
}

const DAY_DIFFICULTY: Record<string, SudokuLevel> = { easy: 'easy', medium: 'medium', hard: 'hard', very_hard: 'very_hard', boss: 'hard' };

/** Toutes les clés de record qui comptent pour un jeu (onglet Jeux, jours du calendrier, épreuve) */
export function arcadeRecordKeys(game: ArcadeGame, level?: SudokuLevel): string[] {
  const keys = [arcadeRecordKey(game.id, level), `game:${game.game}`];
  DAYS_CONFIG.forEach((config) => {
    if (config.game !== game.game) return;
    if (level && (config.gameDifficulty ?? DAY_DIFFICULTY[config.difficulty]) !== level) return;
    keys.push(`day${config.day}`);
  });
  return keys;
}

/**
 * Record d'un jeu : le meilleur entre l'onglet Jeux, les vraies parties du calendrier où ce jeu était le jeu
 * du jour (pour le Sudoku : les jours de ce niveau) et les scores d'épreuve des jours 22 à 24.
 */
export function arcadeRecord(
  game: ArcadeGame,
  records: Record<string, number>,
  dayBest: (day: number) => number,
  level?: SudokuLevel
): number {
  let best = records[arcadeRecordKey(game.id, level)] ?? 0;
  DAYS_CONFIG.forEach((config) => {
    if (config.game !== game.game) return;
    if (level && (config.gameDifficulty ?? DAY_DIFFICULTY[config.difficulty]) !== level) return;
    best = Math.max(best, dayBest(config.day), records[`day${config.day}`] ?? 0);
  });
  return Math.max(best, records[`game:${game.game}`] ?? 0);
}
