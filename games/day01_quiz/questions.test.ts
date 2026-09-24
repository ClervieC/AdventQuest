/// <reference types="jest" />
import { pickQuizQuestions, QUESTIONS_PER_GAME, QUIZ_QUESTIONS } from './questions';

describe('Quiz - banque de questions', () => {
  test('au moins 50 questions', () => {
    expect(QUIZ_QUESTIONS.length).toBeGreaterThanOrEqual(50);
  });

  test('chaque question a 4 réponses différentes et une bonne réponse valide', () => {
    QUIZ_QUESTIONS.forEach((q) => {
      expect(q.question.trim().length).toBeGreaterThan(10);
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options.map((o) => o.toLowerCase())).size).toBe(4);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(4);
    });
  });

  test('aucune question en double', () => {
    const texts = QUIZ_QUESTIONS.map((q) => q.question.toLowerCase());
    expect(new Set(texts).size).toBe(texts.length);
  });

  test('pas de réponse ambiguë du type « toutes ces réponses »', () => {
    QUIZ_QUESTIONS.forEach((q) => {
      q.options.forEach((o) => expect(o.toLowerCase()).not.toMatch(/toutes ces réponses|aucune de ces réponses/));
    });
  });

  test('la bonne réponse est répartie équitablement entre A, B, C et D', () => {
    const counts = [0, 0, 0, 0];
    QUIZ_QUESTIONS.forEach((q) => counts[q.correctIndex]++);
    const min = Math.min(...counts);
    const max = Math.max(...counts);
    expect(max - min).toBeLessThanOrEqual(1);
  });
});

describe('Quiz - tirage des questions', () => {
  test('tire 10 questions différentes par partie', () => {
    const picked = pickQuizQuestions();
    expect(picked).toHaveLength(QUESTIONS_PER_GAME);
    expect(new Set(picked.map((q) => q.question)).size).toBe(QUESTIONS_PER_GAME);
    picked.forEach((q) => expect(QUIZ_QUESTIONS).toContain(q));
  });

  test('deux parties ne tombent (presque) jamais sur les mêmes questions', () => {
    const series = Array.from({ length: 20 }, () => pickQuizQuestions().map((q) => q.question).sort().join('|'));
    expect(new Set(series).size).toBeGreaterThan(15);
  });

  test('ne plante pas si la banque est plus petite que demandé', () => {
    expect(pickQuizQuestions(10, QUIZ_QUESTIONS.slice(0, 3))).toHaveLength(3);
  });
});
