export type GameType = 'quiz' | 'stack' | 'sudoku' | 'snake' | 'memory_sequence' | 'whackamole' | 'labyrinthe' | 'pipepuzzle' | 'spaceinvaders';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'very_hard' | 'boss';


export interface DayConfig {
  day: number;
  game: GameType;
  difficulty: Difficulty;
  fragmentName: string;
  fragmentIcon: string;
  storyIntro: string;
  zone: string;
  gameDifficulty?: 'easy' | 'medium' | 'hard' | 'very_hard';
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
    game: 'spaceinvaders',
    difficulty: 'medium',
    fragmentName: 'Fragments de vaisseau',
    fragmentIcon: '🛸',
    storyIntro: "Un vaisseau spatial est échoué dans la forêt. Récupère les fragments pour le réparer.",
    zone: '🌲 La Forêt de Grimnoir',
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
  {
    day: 8,
    game: 'memory_sequence',
    difficulty: 'easy',
    fragmentName: 'Souffle hivernal',
    fragmentIcon: '〜',
    storyIntro: "Les premiers lutins de Grimnoir arrivent. Repousse-les en suivant le bon rythme.",
    zone: '🎄 Le Village Englouti',
  },
  {
    day: 10,
    game: 'pipepuzzle',
    difficulty: 'medium',
    fragmentName: 'Éclat de cristal',
    fragmentIcon: '🔹',
    storyIntro: "Un puzzle magique bloque l'accès au fragment. Résous-le pour avancer.",
    zone: '🌲 La Forêt de Grimnoir',
  },
  {
    day: 14,
    game: 'labyrinthe',
    difficulty: 'medium',
    fragmentName: 'Âme de l\'explorateur',
    fragmentIcon: '🧭',
    storyIntro: "Un labyrinthe magique protège un précieux fragment. Trouve la sortie avant que le temps ne s'écoule !",
    zone: '🌲 La Forêt de Grimnoir',
  },
  {
    day: 16,
    game: 'whackamole',
    difficulty: 'medium',
    fragmentName: 'Cœur de la forêt',
    fragmentIcon: '❤️',
    storyIntro: "Des créatures magiques surgissent des buissons. Tapote-les pour les calmer et récupérer le fragment.",
    zone: '🌲 La Forêt de Grimnoir',
  }
  // Jours 6-24 à compléter progressivement — on n'a pas besoin de tout remplir
  // maintenant, seulement assez pour développer et tester le squelette
];

export function getDayConfig(day: number): DayConfig | undefined {
  return DAYS_CONFIG.find((d) => d.day === day);
}