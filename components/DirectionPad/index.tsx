import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Localized, useI18n } from '../../services/i18n';
import { useSettingsStore } from '../../store/settingsStore';

export type PadDirection = 'up' | 'down' | 'left' | 'right';

const PAD_BUTTON = 58;
const ARROWS: Record<PadDirection, string> = { up: '▲', down: '▼', left: '◀', right: '▶' };
const ARROW_LABELS: Record<PadDirection, Localized> = {
  up: { fr: 'Haut', en: 'Up' },
  down: { fr: 'Bas', en: 'Down' },
  left: { fr: 'Gauche', en: 'Left' },
  right: { fr: 'Droite', en: 'Right' },
};

/**
 * Croix directionnelle. Sur téléphone, glisser depuis le bord de l'écran peut ramener à la page précédente du
 * navigateur : la croix évite ce souci. Les boutons réagissent dès qu'on pose le doigt (onPressIn).
 */
export function DirectionPad({ onPress }: { onPress: (direction: PadDirection) => void }) {
  return (
    <View style={styles.pad}>
      <DirectionButton direction="up" onPress={onPress} />
      <View style={styles.padRow}>
        <DirectionButton direction="left" onPress={onPress} />
        <View style={styles.padCenter} />
        <DirectionButton direction="right" onPress={onPress} />
      </View>
      <DirectionButton direction="down" onPress={onPress} />
    </View>
  );
}

function DirectionButton({ direction, onPress }: { direction: PadDirection; onPress: (d: PadDirection) => void }) {
  const { l } = useI18n();
  return (
    <Pressable
      onPressIn={() => onPress(direction)}
      // Sur le web, un Pressable sans onPress ne réagit pas du tout (même pas onPressIn)
      onPress={() => {}}
      accessibilityRole="button"
      accessibilityLabel={l(ARROW_LABELS[direction])}
      hitSlop={6}
      style={({ pressed }) => [styles.padButton, pressed && styles.padButtonPressed]}
    >
      <Text style={styles.padArrow}>{ARROWS[direction]}</Text>
    </Pressable>
  );
}

/** Choix des commandes avant de lancer la partie : avec la croix directionnelle ou en glissant le doigt */
export function ControlChoice({ onChoose }: { onChoose: (directionPad: boolean) => void }) {
  const { tr } = useI18n();
  const last = useSettingsStore((s) => s.directionPad);
  const setDirectionPad = useSettingsStore((s) => s.setDirectionPad);
  const choose = (directionPad: boolean) => {
    setDirectionPad(directionPad);
    onChoose(directionPad);
  };
  const option = (directionPad: boolean, icon: string, title: string, text: string) => (
    <Pressable
      onPress={() => choose(directionPad)}
      accessibilityRole="button"
      style={({ pressed }) => [styles.option, last === directionPad && styles.optionLast, pressed && styles.optionPressed]}
    >
      <Text style={styles.optionIcon}>{icon}</Text>
      <View style={styles.optionBody}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionText}>{text}</Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.choice}>
      <Text style={styles.choiceTitle}>{tr('Comment veux-tu jouer ?', 'How do you want to play?')}</Text>
      {option(
        true,
        '🎮',
        tr('Avec joystick', 'With joystick'),
        tr('Des flèches à l’écran sous le jeu. Conseillé sur téléphone.', 'On-screen arrows under the game. Recommended on phones.')
      )}
      {option(
        false,
        '👆',
        tr('Sans joystick', 'Without joystick'),
        tr('Glisse le doigt sur le jeu pour te diriger.', 'Swipe on the game to steer.')
      )}
      <Text style={styles.choiceNote}>{tr('Sur ordinateur, les flèches du clavier marchent toujours.', 'On a computer, the arrow keys always work.')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: {
    marginTop: 14,
    alignItems: 'center',
    gap: 6,
  },
  padRow: {
    flexDirection: 'row',
    gap: 6,
  },
  padCenter: {
    width: PAD_BUTTON,
    height: PAD_BUTTON,
  },
  padButton: {
    width: PAD_BUTTON,
    height: PAD_BUTTON,
    borderRadius: 16,
    backgroundColor: '#16233a',
    borderWidth: 1,
    borderColor: '#3a5a82',
    alignItems: 'center',
    justifyContent: 'center',
  },
  padButtonPressed: {
    backgroundColor: '#2e1a5c',
    borderColor: '#a78bfa',
  },
  padArrow: {
    fontSize: 22,
    color: '#c4b5fd',
  },
  choice: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    gap: 12,
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  choiceTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#16233a',
    borderWidth: 1,
    borderColor: '#3a5a82',
    borderRadius: 14,
    padding: 14,
  },
  optionLast: {
    borderColor: '#a78bfa',
    borderWidth: 2,
  },
  optionPressed: {
    backgroundColor: '#2e1a5c',
  },
  optionIcon: {
    fontSize: 30,
  },
  optionBody: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  optionText: {
    fontSize: 12,
    color: '#b7c8da',
  },
  choiceNote: {
    fontSize: 11,
    color: '#8ea6c0',
    textAlign: 'center',
  },
});
