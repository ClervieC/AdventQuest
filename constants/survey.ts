import { ComeBack } from '../services/api';

// Choix proposés dans le sondage de fin de saison (jour 24), partagés avec le résumé de l'admin

/** Jeux proposés dans « tes jeux préférés » : la clé est le type de jeu enregistré */
export const SURVEY_GAMES: { key: string; label: string }[] = [
  { key: 'quiz', label: '❓ Quiz' },
  { key: 'stack', label: '🧱 Stack' },
  { key: 'sudoku', label: '🔢 Sudoku' },
  { key: 'spaceinvaders', label: '👾 Space Invaders' },
  { key: 'snake', label: '🎀 Snake' },
  { key: 'dessinconnecte', label: '✍️ Relier les points' },
  { key: 'fruitninja', label: '🍎 Fruit Ninja' },
  { key: 'memory_sequence', label: '🎨 Mémoire des couleurs' },
  { key: 'bubbleshooter', label: '🫧 Bubble Shooter' },
  { key: 'pipepuzzle', label: '💧 Tuyaux' },
  { key: 'solitaire', label: '🃏 Solitaire' },
  { key: 'runner', label: '🏃 Runner' },
  { key: 'labyrinthe', label: '🧭 Labyrinthe' },
  { key: 'nonogram', label: '💎 Nonogram' },
  { key: 'whackamole', label: '👺 Tape-gobelins' },
  { key: 'dodgeball', label: '🛡️ Dodge Ball' },
  { key: 'cassebriques', label: '🧊 Casse-briques' },
  { key: 'rythme', label: '🔔 Rythme' },
  { key: 'boss', label: '❤️‍🔥 Combat final' },
];

/** Envies pour l'année prochaine (plusieurs choix possibles) */
export const SURVEY_WISHES: string[] = [
  'Plus de jeux différents',
  'Des jeux à plusieurs',
  'Des défis entre amis',
  'Une histoire plus longue',
  'Des jeux plus difficiles',
  'Des jeux plus faciles',
  'Plus de récompenses à collectionner',
  'Un autre thème que Noël',
];

export const COME_BACK_LABELS: Record<ComeBack, string> = {
  yes: '😍 Oui !',
  maybe: '🤔 Peut-être',
  no: '😕 Non',
};

export const gameLabel = (key: string) => SURVEY_GAMES.find((g) => g.key === key)?.label ?? key;
