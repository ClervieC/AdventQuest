import { GameComponentProps } from '../../components/GameWrapper/types';
import { PhaserGameWrapper } from '../../components/PhaserGameWrapper';

export function StackGame({ isStarted, ...props }: GameComponentProps & { isStarted: boolean }) {
  return (
    <PhaserGameWrapper
      {...props}
      isStarted={isStarted}
      htmlSource={require('./game.html')}
    />
  );
}