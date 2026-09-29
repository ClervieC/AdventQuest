import type { Localized } from '../services/i18n';
import { ComeBack } from '../services/api';

// Choix proposés dans le sondage de fin de saison (jour 24), partagés avec le résumé de l'admin

/** Jeux proposés dans « tes jeux préférés » : la clé est le type de jeu enregistré */
export const SURVEY_GAMES: { key: string; label: Localized }[] = [
  { key: 'quiz', label: { fr: '❓ Quiz', en: '❓ Quiz' } },
  { key: 'stack', label: { fr: '🧱 Stack', en: '🧱 Stack' } },
  { key: 'sudoku', label: { fr: '🔢 Sudoku', en: '🔢 Sudoku' } },
  { key: 'spaceinvaders', label: { fr: '👾 Space Invaders', en: '👾 Space Invaders' } },
  { key: 'snake', label: { fr: '🎀 Snake', en: '🎀 Snake' } },
  { key: 'dessinconnecte', label: { fr: '✍️ Relier les points', en: '✍️ Join the dots' } },
  { key: 'fruitninja', label: { fr: '🍎 Fruit Ninja', en: '🍎 Fruit Ninja' } },
  { key: 'memory_sequence', label: { fr: '🎨 Mémoire des couleurs', en: '🎨 Colour memory' } },
  { key: 'bubbleshooter', label: { fr: '🫧 Bubble Shooter', en: '🫧 Bubble Shooter' } },
  { key: 'pipepuzzle', label: { fr: '💧 Tuyaux', en: '💧 Pipes' } },
  { key: 'solitaire', label: { fr: '🃏 Solitaire', en: '🃏 Solitaire' } },
  { key: 'runner', label: { fr: '🏃 Runner', en: '🏃 Runner' } },
  { key: 'labyrinthe', label: { fr: '🧭 Labyrinthe', en: '🧭 Maze' } },
  { key: 'nonogram', label: { fr: '💎 Nonogram', en: '💎 Nonogram' } },
  { key: 'whackamole', label: { fr: '👺 Tape-gobelins', en: '👺 Whack-a-goblin' } },
  { key: 'dodgeball', label: { fr: '🛡️ Dodge Ball', en: '🛡️ Dodge Ball' } },
  { key: 'cassebriques', label: { fr: '🧊 Casse-briques', en: '🧊 Brick Breaker' } },
  { key: 'rythme', label: { fr: '🔔 Rythme', en: '🔔 Rhythm' } },
  { key: 'boss', label: { fr: '❤️‍🔥 Combat final', en: '❤️‍🔥 Final battle' } },
];

/** Envies pour l'année prochaine (plusieurs choix possibles).
 *  `value` (en français) est ce qui est enregistré : les réponses des deux langues se regroupent dans le résumé de l'admin. */
export const SURVEY_WISHES: { value: string; label: Localized }[] = [
  { value: 'Plus de jeux différents', label: { fr: 'Plus de jeux différents', en: 'More different games' } },
  { value: 'Des jeux à plusieurs', label: { fr: 'Des jeux à plusieurs', en: 'Multiplayer games' } },
  { value: 'Des défis entre amis', label: { fr: 'Des défis entre amis', en: 'Challenges between friends' } },
  { value: 'Une histoire plus longue', label: { fr: 'Une histoire plus longue', en: 'A longer story' } },
  { value: 'Des jeux plus difficiles', label: { fr: 'Des jeux plus difficiles', en: 'Harder games' } },
  { value: 'Des jeux plus faciles', label: { fr: 'Des jeux plus faciles', en: 'Easier games' } },
  { value: 'Plus de récompenses à collectionner', label: { fr: 'Plus de récompenses à collectionner', en: 'More rewards to collect' } },
  { value: 'Un autre thème que Noël', label: { fr: 'Un autre thème que Noël', en: 'A theme other than Christmas' } },
];

export const COME_BACK_LABELS: Record<ComeBack, Localized> = {
  yes: { fr: '😍 Oui !', en: '😍 Yes!' },
  maybe: { fr: '🤔 Peut-être', en: '🤔 Maybe' },
  no: { fr: '😕 Non', en: '😕 No' },
};

export const gameLabel = (key: string): Localized => SURVEY_GAMES.find((g) => g.key === key)?.label ?? { fr: key, en: key };
