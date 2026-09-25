import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MENTIONS, PRIVACY, TERMS } from './content';

export type LegalKind = 'terms' | 'privacy' | 'mentions';

/** Affiche les CGU ou la politique de confidentialité, avec un bouton retour */
export function LegalView({ kind, onBack }: { kind: LegalKind; onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const doc = kind === 'terms' ? TERMS : kind === 'privacy' ? PRIVACY : MENTIONS;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <Pressable onPress={onBack} hitSlop={12} style={styles.back}>
        <Text style={styles.backText}>‹ Retour</Text>
      </Pressable>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <Text style={styles.title}>{doc.title}</Text>
        <Text style={styles.updated}>Dernière mise à jour : {doc.updatedAt}</Text>
        {doc.sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.paragraphs.map((paragraph, i) => (
              <Text key={i} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

/** Liens vers les deux documents (écran de connexion, profil) */
export function LegalLinks({ onOpen }: { onOpen: (kind: LegalKind) => void }) {
  return (
    <View style={styles.links}>
      <Pressable onPress={() => onOpen('terms')} hitSlop={8}>
        <Text style={styles.link}>Conditions d’utilisation</Text>
      </Pressable>
      <Text style={styles.linkSeparator}>·</Text>
      <Pressable onPress={() => onOpen('privacy')} hitSlop={8}>
        <Text style={styles.link}>Confidentialité</Text>
      </Pressable>
      <Text style={styles.linkSeparator}>·</Text>
      <Pressable onPress={() => onOpen('mentions')} hitSlop={8}>
        <Text style={styles.link}>Mentions légales</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0c1521',
  },
  back: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#b7c8da',
    fontSize: 15,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
  },
  updated: {
    fontSize: 11,
    color: '#8ea6c0',
    marginTop: 4,
    marginBottom: 12,
  },
  section: {
    marginTop: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#c4b5fd',
  },
  paragraph: {
    fontSize: 13,
    lineHeight: 20,
    color: '#cdd9e5',
  },
  links: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  link: {
    fontSize: 12,
    color: '#b7c8da',
    textDecorationLine: 'underline',
  },
  linkSeparator: {
    color: '#8ea6c0',
  },
});
