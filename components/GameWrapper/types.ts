export interface GameResult {
  success: boolean;
  score: number;
}

export interface GameComponentProps {
  onGameEnd: (result: GameResult) => void;
  hintsAvailable: number;
  onUseHint: () => void;
  difficulty?: 'easy' | 'medium' | 'hard' | 'very_hard';
}