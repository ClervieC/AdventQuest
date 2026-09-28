import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SeasonSurvey } from '../components/SeasonSurvey';
import { pageColumn } from '../constants/layout';

const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

// Sondage de fin de saison, ouvert depuis l'accueil ou le profil (à partir du 24 décembre au soir)
export default function SurveyScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.column}>
        <Pressable onPress={goBack} hitSlop={12} style={styles.back}>
          <Text style={styles.backText}>‹ Retour</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={[styles.column, { paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled">
        <SeasonSurvey />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0c1521',
  },
  column: pageColumn(20),
  back: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  backText: {
    color: '#b7c8da',
    fontSize: 15,
    fontWeight: '600',
  },
});
