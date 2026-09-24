import { ComponentType, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GameComponentProps, GameResult } from '../GameWrapper/types';
import { applyStageResult, continueMarathon, initialMarathonState, isFinished, MarathonState, totalScore } from './logic';

export interface MarathonStage {
  label: string;
  icon: string;
  component: ComponentType<any>;
  difficulty?: GameComponentProps['difficulty'];
  // false pour les jeux React Native qui démarrent leur chrono au montage : sinon le temps
  // passé sur l'écran d'entracte compterait dans leur score. Les jeux Phaser, eux, attendent INIT.
  preload?: boolean;
}

interface MarathonGameProps extends GameComponentProps {
  stages: MarathonStage[];
  isStarted: boolean;
}

export function MarathonGame({ stages, isStarted, onGameEnd, hintsAvailable, onUseHint, difficulty }: MarathonGameProps) {
  const [state, setState] = useState<MarathonState>(initialMarathonState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // "Rejouer" : GameWrapper garde ce composant monté, on repart de la première épreuve
  const wasStartedRef = useRef(isStarted);
  useEffect(() => {
    if (isStarted && !wasStartedRef.current && isFinished(stateRef.current)) {
      setState(initialMarathonState());
    }
    wasStartedRef.current = isStarted;
  }, [isStarted]);

  const handleStageEnd = (result: GameResult) => {
    const next = applyStageResult(stateRef.current, result, stages.length);
    if (next === stateRef.current) return;
    stateRef.current = next;
    setState(next);
    if (isFinished(next)) {
      onGameEnd({ success: next.status === 'won', score: totalScore(next) });
    }
  };

  const handleContinue = () => setState((current) => continueMarathon(current));

  const current = stages[state.stageIndex];
  const next = stages[state.stageIndex + 1];
  const lastScore = state.stageScores[state.stageScores.length - 1] ?? 0;

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        <View style={styles.stepsRow}>
          {stages.map((stage, i) => {
            const done = i < state.stageIndex || (i === state.stageIndex && (state.status === 'interlude' || state.status === 'won'));
            const active = i === state.stageIndex && state.status === 'playing';
            return (
              <View key={stage.label} style={[styles.step, done && styles.stepDone, active && styles.stepActive]}>
                <Text style={styles.stepText}>{stage.icon}</Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.progressText}>
          Épreuve {Math.min(state.stageIndex + 1, stages.length)}/{stages.length} · {current?.label}
        </Text>
        <Text style={styles.totalText}>Total : {totalScore(state)}</Text>
      </View>

      <View style={styles.stageArea}>
        {stages.map((stage, i) => {
          const isActive = i === state.stageIndex && state.status === 'playing';
          // Pendant l'entracte, l'épreuve suivante se charge en arrière-plan (même taille : pas de redimensionnement)
          const isPreloading = i === state.stageIndex + 1 && state.status === 'interlude' && stage.preload !== false;
          if (!isActive && !isPreloading) return null;

          const Stage = stage.component;
          return (
            <View key={`stage-${i}`} style={[StyleSheet.absoluteFill, !isActive && styles.hidden]}>
              <Stage
                onGameEnd={isActive ? handleStageEnd : () => {}}
                hintsAvailable={hintsAvailable}
                onUseHint={onUseHint}
                difficulty={stage.difficulty ?? difficulty}
                isStarted={isStarted && isActive}
              />
            </View>
          );
        })}

        {state.status === 'interlude' && next && (
          <View style={styles.interlude}>
            <Text style={styles.interludeIcon}>✅</Text>
            <Text style={styles.interludeTitle}>Épreuve {state.stageIndex + 1} réussie !</Text>
            <Text style={styles.interludeScore}>+{lastScore} points · total {totalScore(state)}</Text>
            <View style={styles.nextCard}>
              <Text style={styles.nextLabel}>Épreuve suivante</Text>
              <Text style={styles.nextName}>{next.icon} {next.label}</Text>
            </View>
            <Pressable style={styles.continueButton} onPress={handleContinue}>
              <Text style={styles.continueButtonText}>▶ Continuer</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  stepsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  step: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0a1420',
    borderWidth: 1,
    borderColor: '#1a3050',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  stepActive: {
    borderColor: '#7c3aed',
    borderWidth: 2,
    opacity: 1,
  },
  stepDone: {
    borderColor: '#34d399',
    backgroundColor: '#0d2218',
    opacity: 1,
  },
  stepText: {
    fontSize: 12,
  },
  progressText: {
    flex: 1,
    color: '#c4b5fd',
    fontSize: 12,
    fontWeight: '600',
  },
  totalText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '700',
  },
  stageArea: {
    flex: 1,
  },
  hidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
  interlude: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0c1521',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  interludeIcon: {
    fontSize: 44,
  },
  interludeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 12,
  },
  interludeScore: {
    fontSize: 14,
    color: '#34d399',
    marginTop: 6,
  },
  nextCard: {
    marginTop: 28,
    backgroundColor: '#090e18',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3b2a6b',
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  nextLabel: {
    fontSize: 11,
    letterSpacing: 2,
    color: '#3a5a7a',
    textTransform: 'uppercase',
  },
  nextName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginTop: 6,
  },
  continueButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 14,
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: 28,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
