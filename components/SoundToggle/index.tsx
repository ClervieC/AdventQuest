import { Pressable, StyleSheet, Text } from 'react-native';
import { useSettingsStore } from '../../store/settingsStore';

/** Petit bouton 🔊 / 🔇 : coupe ou remet tous les sons de l'app (mémorisé sur l'appareil) */
export function SoundToggle({ style }: { style?: object }) {
  const { muted, toggleMuted } = useSettingsStore();
  return (
    <Pressable
      onPress={toggleMuted}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={muted ? 'Activer le son' : 'Couper le son'}
      style={[styles.button, style]}
    >
      <Text style={styles.icon}>{muted ? '🔇' : '🔊'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#090e18',
    borderWidth: 1,
    borderColor: '#1a3050',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 16,
  },
});
