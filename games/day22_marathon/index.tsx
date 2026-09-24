import { GameComponentProps } from '../../components/GameWrapper/types';
import { MarathonGame, MarathonStage } from '../../components/MarathonGame';
import { SpaceInvadersGame } from '../day04_spaceinvaders';
import { BubbleShooterGame } from '../day09_bubbleshooter';

const STAGES: MarathonStage[] = [
  { label: 'Space Invaders', icon: '🛸', component: SpaceInvadersGame },
  { label: 'Bubble Shooter', icon: '🫧', component: BubbleShooterGame },
];

export function Day22MarathonGame(props: GameComponentProps & { isStarted: boolean }) {
  return <MarathonGame {...props} stages={STAGES} />;
}
