import { GameComponentProps } from '../../components/GameWrapper/types';
import { MarathonGame, MarathonStage } from '../../components/MarathonGame';
import { QuizGame } from '../day01_quiz';
import { StackGame } from '../day02_stack';
import { CasseBriquesGame } from '../day20_cassebriques';

// Boss final : les 3 épreuves à la suite, un seul échec et Grimnoir l'emporte
const STAGES: MarathonStage[] = [
  { label: 'Stack', icon: '🧱', component: StackGame },
  { label: 'Casse-briques', icon: '🧊', component: CasseBriquesGame },
  { label: 'Quiz final', icon: '❓', component: QuizGame, preload: false },
];

export function BossGame(props: GameComponentProps & { isStarted: boolean }) {
  return <MarathonGame {...props} stages={STAGES} />;
}
