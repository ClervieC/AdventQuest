import { QUESTIONS_PER_GAME, QuizQuestion } from './questions';

export const POINTS_PER_CORRECT_ANSWER = 200;
export const SUCCESS_RATIO = 0.6; // 60 % de bonnes réponses pour gagner
// 6 bonnes réponses sur 10 → 1200 points (suit automatiquement le nombre de questions par partie)
export const SUCCESS_THRESHOLD = Math.ceil(QUESTIONS_PER_GAME * SUCCESS_RATIO) * 200;

export function calculateScore(correctAnswersCount: number): number {
  return correctAnswersCount * POINTS_PER_CORRECT_ANSWER;
}

export function isSuccess(finalScore: number): boolean {
  return finalScore >= SUCCESS_THRESHOLD;
}

export function isAnswerCorrect(question: QuizQuestion, selectedIndex: number): boolean {
  return selectedIndex === question.correctIndex;
}

export function eliminateWrongAnswers(question: QuizQuestion, count: number = 2): number[] {
  const wrongIndexes = question.options
    .map((_, i) => i)
    .filter((i) => i !== question.correctIndex);

  // Mélange et prend les N premiers
  return wrongIndexes.sort(() => Math.random() - 0.5).slice(0, count);
}