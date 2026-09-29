import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GameComponentProps } from '../../components/GameWrapper/types';
import { useGameKeys } from '../../hooks/use-game-keys';
import { useI18n } from '../../services/i18n';
import { playSfx } from '../../services/sfx';
import { calculateScore, eliminateWrongAnswers, isAnswerCorrect, isSuccess } from './logic';
import { pickQuizQuestions, quizQuestionsFor } from './questions';


export function QuizGame({ onGameEnd, hintsAvailable, onUseHint }: GameComponentProps) {
  const { lang, tr } = useI18n();
  // 10 questions tirées au hasard dans la langue du joueur, à chaque partie (le composant est recréé à chaque "Jouer")
  const [questions] = useState(() => pickQuizQuestions(undefined, quizQuestionsFor(lang)));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleAnswer = (index: number) => {
    if (selectedIndex !== null) return; // déjà répondu, on bloque double-clic

    setSelectedIndex(index);
    const isCorrect = isAnswerCorrect(currentQuestion, index);
    playSfx(isCorrect ? 'correct' : 'wrong');
    const newScore = isCorrect ? score + 200 : score;
    const newCorrectCount = isCorrect ? correctAnswersCount + 1 : correctAnswersCount;

    setTimeout(() => {
      if (isLastQuestion) {
        const finalScore = calculateScore(newCorrectCount);
        const success = isSuccess(finalScore);
        onGameEnd({ success, score: finalScore });
      } else {
        setScore(newScore);
        setCorrectAnswersCount(newCorrectCount);
        setCurrentIndex(currentIndex + 1);
        setSelectedIndex(null);
        setEliminatedOptions([]);
      }
    }, 900);
  };

  // Sur ordi : touches 1 à 4 (ou A à D) pour répondre
  useGameKeys((key) => {
    const index = '1234'.indexOf(key) >= 0 ? '1234'.indexOf(key) : 'abcd'.indexOf(key.toLowerCase());
    if (index < 0 || index >= currentQuestion.options.length || eliminatedOptions.includes(index)) return false;
    handleAnswer(index);
  });

  const handleHint = () => {
    if (hintsAvailable === 0 || eliminatedOptions.length > 0) return;
    onUseHint();
    playSfx('tap');
    // élimine 2 mauvaises réponses au hasard
    const toEliminate = eliminateWrongAnswers(currentQuestion);

    setEliminatedOptions(toEliminate);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.progress}>Question {currentIndex + 1} / {questions.length}</Text>
      <Text style={styles.question}>{currentQuestion.question}</Text>

      <View style={styles.options}>
        {currentQuestion.options.map((option, index) => {
          const isEliminated = eliminatedOptions.includes(index);
          const isSelected = selectedIndex === index;
          const isCorrectAnswer = selectedIndex !== null && index === currentQuestion.correctIndex;
          const isWrongSelected = isSelected && index !== currentQuestion.correctIndex;

          return (
            <Pressable
              key={index}
              disabled={isEliminated || selectedIndex !== null}
              onPress={() => handleAnswer(index)}
              style={[
                styles.option,
                isEliminated && styles.optionEliminated,
                isCorrectAnswer && styles.optionCorrect,
                isWrongSelected && styles.optionWrong,
              ]}
            >
              <Text style={[styles.optionText, isEliminated && styles.optionTextEliminated]}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={[styles.hintButton, (hintsAvailable === 0 || eliminatedOptions.length > 0) && styles.hintButtonDisabled]}
        onPress={handleHint}
        disabled={hintsAvailable === 0 || eliminatedOptions.length > 0}
      >
        <Text style={styles.hintButtonText}>{tr('💡 Éliminer 2 mauvaises réponses', '💡 Remove 2 wrong answers')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // Sur grand écran, le quiz reste une colonne centrée au lieu de prendre toute la largeur
  container: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  progress: {
    fontSize: 11,
    color: '#8ea6c0',
    textAlign: 'center',
    marginBottom: 12,
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 26,
  },
  options: {
    gap: 10,
  },
  option: {
    backgroundColor: '#16233a',
    borderWidth: 1,
    borderColor: '#3a5a82',
    borderRadius: 12,
    padding: 16,
  },
  optionEliminated: {
    opacity: 0.3,
  },
  optionCorrect: {
    backgroundColor: '#12301f',
    borderColor: '#34d399',
  },
  optionWrong: {
    backgroundColor: '#1a0d0d',
    borderColor: '#f87171',
  },
  optionText: {
    color: '#c0d4e8',
    fontSize: 14,
    textAlign: 'center',
  },
  optionTextEliminated: {
    color: '#8ea6c0',
  },
  hintButton: {
    marginTop: 24,
    backgroundColor: '#2a2208',
    borderColor: '#6b5410',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  hintButtonDisabled: {
    opacity: 0.3,
  },
  hintButtonText: {
    color: '#f59e0b',
    fontSize: 12,
  },
});