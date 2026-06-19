import { GameComponentProps } from '../../components/GameWrapper/types';
import { PhaserGameWrapper } from '../../components/PhaserGameWrapper';

export function StackGame(props: GameComponentProps) {
  return (
    <PhaserGameWrapper
      {...props}
      htmlSource={require('./game.html')}
    />
  );
}