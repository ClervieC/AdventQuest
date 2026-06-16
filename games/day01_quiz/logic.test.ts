import { calculateScore, eliminateWrongAnswers, isAnswerCorrect, isSuccess } from './logic';
import { QuizQuestion } from './questions';

describe('Quiz - calculateScore', () => {
  test('0 bonnes réponses = 0 points', () => {
    expect(calculateScore(0)).toBe(0);
  });

  test('3 bonnes réponses = 600 points', () => {
    expect(calculateScore(3)).toBe(600);
  });

  test('5 bonnes réponses = 1000 points', () => {
    expect(calculateScore(5)).toBe(1000);
  });
});

describe('Quiz - isSuccess', () => {
  test('600 points = succès (seuil exact)', () => {
    expect(isSuccess(600)).toBe(true);
  });

  test('599 points = échec (juste sous le seuil)', () => {
    expect(isSuccess(599)).toBe(false);
  });

  test('1000 points = succès', () => {
    expect(isSuccess(1000)).toBe(true);
  });

  test('0 points = échec', () => {
    expect(isSuccess(0)).toBe(false);
  });
});

describe('Quiz - isAnswerCorrect', () => {
  const mockQuestion: QuizQuestion = {
    question: 'Question test',
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 2,
  };

  test('index correct retourne true', () => {
    expect(isAnswerCorrect(mockQuestion, 2)).toBe(true);
  });

  test('index incorrect retourne false', () => {
    expect(isAnswerCorrect(mockQuestion, 0)).toBe(false);
  });
});

describe('Quiz - eliminateWrongAnswers', () => {
  const mockQuestion: QuizQuestion = {
    question: 'Question test',
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 1,
  };

  test('élimine bien 2 réponses par défaut', () => {
    const eliminated = eliminateWrongAnswers(mockQuestion);
    expect(eliminated).toHaveLength(2);
  });

  test("n'élimine jamais la bonne réponse", () => {
    // on lance 20 fois pour être sûr (aléatoire)
    for (let i = 0; i < 20; i++) {
      const eliminated = eliminateWrongAnswers(mockQuestion);
      expect(eliminated).not.toContain(mockQuestion.correctIndex);
    }
  });

  test('peut éliminer un nombre différent si demandé', () => {
    const eliminated = eliminateWrongAnswers(mockQuestion, 1);
    expect(eliminated).toHaveLength(1);
  });
});