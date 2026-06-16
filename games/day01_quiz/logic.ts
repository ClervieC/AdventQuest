import { QuizQuestion } from './questions';

export const POINTS_PER_CORRECT_ANSWER = 200;
export const SUCCESS_THRESHOLD = 600; // 3 bonnes réponses sur 5

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