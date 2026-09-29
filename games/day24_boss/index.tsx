import { GameComponentProps } from '../../components/GameWrapper/types';
import { MarathonGame, MarathonStage } from '../../components/MarathonGame';
import { QuizGame } from '../day01_quiz';
import { StackGame } from '../day02_stack';
import { CasseBriquesGame } from '../day20_cassebriques';

// Boss final : les 3 épreuves à la suite, un seul échec et Grimnoir l'emporte
const STAGES: MarathonStage[] = [
  { label: { fr: 'Stack', en: 'Stack' }, icon: '🧱', component: StackGame },
  { label: { fr: 'Casse-briques', en: 'Brick Breaker' }, icon: '🧊', component: CasseBriquesGame },
  { label: { fr: 'Quiz final', en: 'Final quiz' }, icon: '❓', component: QuizGame, preload: false },
];

export function BossGame(props: GameComponentProps & { isStarted: boolean }) {
  return <MarathonGame {...props} stages={STAGES} />;
}
