import { GameComponentProps } from '../../components/GameWrapper/types';
import { MarathonGame, MarathonStage } from '../../components/MarathonGame';
import { gameRecordKey } from '../../store/recordsStore';
import { FlappyGame } from '../extra_flappy';
import { PairsGame } from '../extra_pairs';
import { WordSearchGame } from '../extra_wordsearch';

// Bout du pont : le dernier barrage de Grimnoir, trois épreuves à la suite sans droit à l'erreur
const STAGES: MarathonStage[] = [
  { label: { fr: 'Envol du renne', en: 'Reindeer flight' }, icon: '🦌', component: FlappyGame, recordKey: gameRecordKey('flappy') },
  { label: { fr: 'Paires', en: 'Pairs' }, icon: '🃏', component: PairsGame, preload: false, recordKey: gameRecordKey('pairs') },
  { label: { fr: 'Mots mêlés', en: 'Word search' }, icon: '🔤', component: WordSearchGame, preload: false, recordKey: gameRecordKey('wordsearch') },
];

export function Day23MarathonGame(props: GameComponentProps & { isStarted: boolean }) {
  return <MarathonGame {...props} stages={STAGES} />;
}
