import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Lang, useSettingsStore } from '../../store/settingsStore';

const OPTIONS: { lang: Lang; label: string }[] = [
  { lang: 'fr', label: '🇫🇷 Français' },
  { lang: 'en', label: '🇬🇧 English' },
];

/** Choix de la langue de l'app (mémorisé sur l'appareil) : écran de connexion et Profil */
export function LanguageToggle({ style }: { style?: object }) {
  const lang = useSettingsStore((state) => state.lang);
  const setLang = useSettingsStore((state) => state.setLang);

  return (
    <View style={[styles.row, style]} accessibilityRole="radiogroup">
      {OPTIONS.map((option) => {
        const on = option.lang === lang;
        return (
          <Pressable
            key={option.lang}
            onPress={() => setLang(option.lang)}
            style={[styles.chip, on && styles.chipOn]}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            hitSlop={4}
          >
            <Text style={[styles.text, on && styles.textOn]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Petit bouton rond FR / EN (accueil, à côté du bouton du son) : un appui passe à l'autre langue */
export function LanguageButton({ style }: { style?: object }) {
  const lang = useSettingsStore((state) => state.lang);
  const setLang = useSettingsStore((state) => state.setLang);
  const next: Lang = lang === 'fr' ? 'en' : 'fr';

  return (
    <Pressable
      onPress={() => setLang(next)}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={lang === 'fr' ? 'Passer en anglais' : 'Switch to French'}
      style={[styles.round, style]}
    >
      <Text style={styles.roundText}>{lang.toUpperCase()}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  round: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#16233a',
    borderWidth: 1,
    borderColor: '#3a5a82',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#c4b5fd',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#3a5a82',
    backgroundColor: '#16233a',
  },
  chipOn: {
    borderColor: '#a78bfa',
    backgroundColor: '#2e1a5c',
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8ea6c0',
  },
  textOn: {
    color: '#c4b5fd',
  },
});
