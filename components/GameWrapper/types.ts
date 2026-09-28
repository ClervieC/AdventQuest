export interface GameResult {
  success: boolean;
  score: number;
}

export interface GameComponentProps {
  onGameEnd: (result: GameResult) => void;
  hintsAvailable: number;
  onUseHint: () => void;
  difficulty?: 'easy' | 'medium' | 'hard' | 'very_hard';
  saveId?: string; // identifiant de sauvegarde de la partie en cours (ex. "day3"), pour les jeux qui reprennent là où on s'est arrêté
}