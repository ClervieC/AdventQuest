import { GameComponentProps } from '../../components/GameWrapper/types';
import { MarathonGame, MarathonStage } from '../../components/MarathonGame';
import { gameRecordKey } from '../../store/recordsStore';
import { Match3Game } from '../extra_match3';
import { SlidingPuzzleGame } from '../extra_slidingpuzzle';

// Milieu du pont : deux épreuves à la suite, sans droit à l'erreur.
// Jeux React Native (chrono lancé au montage) : chacun ne s'affiche qu'à son tour, après « Jouer ».
const STAGES: MarathonStage[] = [
  { label: { fr: 'Taquin', en: 'Sliding puzzle' }, icon: '🧩', component: SlidingPuzzleGame, preload: false, recordKey: gameRecordKey('slidingpuzzle') },
  { label: { fr: 'Friandises', en: 'Treats' }, icon: '🍬', component: Match3Game, preload: false, recordKey: gameRecordKey('match3') },
];

export function Day22MarathonGame(props: GameComponentProps & { isStarted: boolean }) {
  return <MarathonGame {...props} stages={STAGES} />;
}
