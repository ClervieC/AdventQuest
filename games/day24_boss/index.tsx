import { GameComponentProps } from '../../components/GameWrapper/types';
import { MarathonGame, MarathonStage } from '../../components/MarathonGame';
import { gameRecordKey } from '../../store/recordsStore';
import { QuizGame } from '../day01_quiz';
import { CasseBriquesGame } from '../day20_cassebriques';
import { Game2048 } from '../extra_2048';

// Boss final : les 3 épreuves à la suite, un seul échec et Grimnoir l'emporte
const STAGES: MarathonStage[] = [
  { label: { fr: 'Casse-briques', en: 'Brick Breaker' }, icon: '🧊', component: CasseBriquesGame },
  { label: { fr: 'Cœur à reconstruire', en: 'Rebuild the Heart' }, icon: '❤️‍🔥', component: Game2048, preload: false, recordKey: gameRecordKey('game2048') },
  { label: { fr: 'Quiz final', en: 'Final quiz' }, icon: '❓', component: QuizGame, preload: false },
];

export function BossGame(props: GameComponentProps & { isStarted: boolean }) {
  return <MarathonGame {...props} stages={STAGES} />;
}
