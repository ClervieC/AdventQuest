import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useI18n } from '../../services/i18n';

const CONFIRM_WINDOW_MS = 3000;

/**
 * « Nouvelle partie » en deux temps : un premier appui demande confirmation (la partie en cours sera perdue),
 * un second appui dans les 3 secondes lance la nouvelle partie.
 */
export function NewGameButton({ onConfirm }: { onConfirm: () => void }) {
  const { tr } = useI18n();
  const [confirming, setConfirming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const handlePress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (confirming) {
      setConfirming(false);
      onConfirm();
      return;
    }
    setConfirming(true);
    timerRef.current = setTimeout(() => setConfirming(false), CONFIRM_WINDOW_MS);
  };

  return (
    <Pressable
      style={[styles.button, confirming && styles.buttonConfirm]}
      onPress={handlePress}
      accessibilityLabel={confirming ? tr('Confirmer : abandonner cette partie et en commencer une nouvelle', 'Confirm: give up this game and start a new one') : tr('Nouvelle partie', 'New game')}
    >
      <Text style={[styles.text, confirming && styles.textConfirm]}>
        {confirming ? tr('⚠️ Touche encore pour abandonner cette partie', '⚠️ Tap again to give up this game') : tr('🔄 Nouvelle partie', '🔄 New game')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a5a82',
    backgroundColor: '#16233a',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  buttonConfirm: {
    borderColor: '#f87171',
    backgroundColor: '#3a1414',
  },
  text: {
    color: '#b7c8da',
    fontSize: 12,
    fontWeight: '600',
  },
  textConfirm: {
    color: '#fca5a5',
  },
});
