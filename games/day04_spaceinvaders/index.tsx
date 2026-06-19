import { GameComponentProps } from '../../components/GameWrapper/types';
import { PhaserGameWrapper } from '../../components/PhaserGameWrapper';

export function SpaceInvadersGame(props: GameComponentProps) {
  return (
    <PhaserGameWrapper
      {...props}
      htmlSource={require('./game.html')}
    />
  );
}