export type GameType = 'quiz' | 'stack' | 'sudoku' | 'snake' | 'memory_sequence';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'very_hard' | 'boss';

export interface DayConfig {
  day: number;
  game: GameType;
  difficulty: Difficulty;
  fragmentName: string;
  fragmentIcon: string;
  storyIntro: string;
  zone: string;
}

export const DAYS_CONFIG: DayConfig[] = [
  {
    day: 1,
    game: 'quiz',
    difficulty: 'easy',
    fragmentName: 'Éclat de lumière',
    fragmentIcon: '✦',
    storyIntro: "Une vieille statue gardienne te pose 5 questions pour vérifier que tu es digne...",
    zone: '🎄 Le Village Englouti',
  },
  {
    day: 2,
    game: 'stack',
    difficulty: 'easy',
    fragmentName: 'Graine de givre',
    fragmentIcon: '❄',
    storyIntro: "La fontaine du village est gelée en plusieurs couches. Empile les blocs de glace pour atteindre le fragment.",
    zone: '🎄 Le Village Englouti',
  },
  {
    day: 3,
    game: 'sudoku',
    difficulty: 'easy',
    fragmentName: 'Cristal de nombre',
    fragmentIcon: '◆',
    storyIntro: "L'horloge magique de la mairie est bloquée sur une grille de chiffres.",
    zone: '🎄 Le Village Englouti',
  },
  {
    day: 4,
    game: 'memory_sequence',
    difficulty: 'easy',
    fragmentName: 'Souffle hivernal',
    fragmentIcon: '〜',
    storyIntro: "Les premiers lutins de Grimnoir arrivent. Repousse-les en suivant le bon rythme.",
    zone: '🎄 Le Village Englouti',
  },
  {
    day: 5,
    game: 'snake',
    difficulty: 'easy',
    fragmentName: 'Racine ancienne',
    fragmentIcon: '🌱',
    storyIntro: "À l'orée de la forêt, un mécanisme à pommes de pin enchantées tourne en boucle.",
    zone: '🎄 Le Village Englouti',
  },
  // Jours 6-24 à compléter progressivement — on n'a pas besoin de tout remplir
  // maintenant, seulement assez pour développer et tester le squelette
];

export function getDayConfig(day: number): DayConfig | undefined {
  return DAYS_CONFIG.find((d) => d.day === day);
}