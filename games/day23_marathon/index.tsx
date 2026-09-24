import { GameComponentProps } from '../../components/GameWrapper/types';
import { MarathonGame, MarathonStage } from '../../components/MarathonGame';
import { NonogramGame } from '../day15_nonogram';
import { NONOGRAM_TREE } from '../day15_nonogram/puzzles';
import { DodgeBallGame } from '../day19_dodgeball';

// Le Nonogram du marathon dessine toujours le sapin de Noël
function TreeNonogramGame(props: GameComponentProps) {
  return <NonogramGame {...props} puzzle={NONOGRAM_TREE} />;
}

const STAGES: MarathonStage[] = [
  { label: 'Dodge Ball', icon: '🛡️', component: DodgeBallGame },
  { label: 'Nonogram', icon: '🎄', component: TreeNonogramGame, preload: false },
];

export function Day23MarathonGame(props: GameComponentProps & { isStarted: boolean }) {
  return <MarathonGame {...props} stages={STAGES} />;
}
