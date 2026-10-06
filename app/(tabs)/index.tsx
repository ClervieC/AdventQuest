import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AllFragmentsCelebration, hasCelebratedAllFragments, markAllFragmentsCelebrated } from '../../components/AllFragmentsCelebration';
import { Calendar } from '../../components/Calendar';
import { FragmentProgress } from '../../components/FragmentProgress';
import { Snowfall } from '../../components/Snowfall';
import { LanguageButton } from '../../components/LanguageToggle';
import { SoundToggle } from '../../components/SoundToggle';
import { RecapInvite } from '../../components/RecapInvite';
import { SurveyInvite } from '../../components/SurveyInvite';
import { TesterWelcome } from '../../components/TesterWelcome';
import { WelcomeIntro } from '../../components/WelcomeIntro';
import { contentColumn } from '../../constants/layout';
import { useI18n } from '../../services/i18n';
import { useGameStore } from '../../store/gameStore';

export default function CalendarScreen() {
  const { currentDay, totalFragments, username, offline } = useGameStore();
  const insets = useSafeAreaInsets();
  const { tr } = useI18n();
  const fragments = totalFragments();

  // 24 fragments réunis (par exemple sur un autre appareil) et pas encore fêtés ici : on fait la fête
  const [celebrate, setCelebrate] = useState(false);
  // Message d'accueil d'abord (première visite), puis celui des testeurs
  const [welcomeDone, setWelcomeDone] = useState(false);
  useEffect(() => {
    if (fragments < 24) return;
    let cancelled = false;
    hasCelebratedAllFragments(username).then((done) => {
      if (cancelled || done) return;
      markAllFragmentsCelebrated(username);
      setCelebrate(true);
    });
    return () => {
      cancelled = true;
    };
  }, [fragments, username]);

  return (
    <View style={styles.container}>
      <Snowfall />
      {/* En haut à droite : langue et son */}
      <View style={[styles.topButtons, { top: insets.top + 10 }]}>
        <LanguageButton />
        <SoundToggle />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={[{ paddingTop: insets.top + TOP_BUTTONS_SPACE }, contentColumn]}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>{tr('Avent magique · Décembre 2026', 'Magical Advent · December 2026')}</Text>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.subtitle}>
          {currentDay >= 1 && currentDay <= 24 ? `${tr('Jour', 'Day')} ${currentDay} · ` : ''}
          {tr(
            `${fragments} fragment${fragments > 1 ? 's' : ''} collecté${fragments > 1 ? 's' : ''}`,
            `${fragments} shard${fragments === 1 ? '' : 's'} collected`
          )}
        </Text>
      </View>

      {offline && (
        <View style={[styles.seasonBanner, styles.offlineBanner]}>
          <Text style={styles.seasonText}>
            {tr(
              '📴 Hors ligne : tu peux jouer, tes parties seront envoyées dès le retour du réseau.',
              '📴 Offline: you can play, your games will be sent as soon as you’re back online.'
            )}
          </Text>
        </View>
      )}
      {currentDay === 0 && (
        <View style={styles.seasonBanner}>
          <Text style={styles.seasonText}>{tr("🎄 L'aventure commence le 1er décembre : la première case s'ouvrira à minuit.", '🎄 The adventure starts on 1 December: the first door opens at midnight.')}</Text>
        </View>
      )}
      {currentDay > 24 && (
        <View style={styles.seasonBanner}>
          <Text style={styles.seasonText}>{tr("✨ L'Avent est terminé ! Tu peux rejouer toutes les cases pour t'entraîner.", '✨ Advent is over! You can replay every door for practice.')}</Text>
        </View>
      )}

      {/* À partir du 25 décembre : le récap de la saison, en haut de l'accueil */}
      <RecapInvite place="home" />

      <FragmentProgress fragments={fragments} />

      <Calendar />

      {/* Sondage de fin de saison : tout en bas, après le jour 24 */}
      <View style={styles.surveyBottom}>
        <SurveyInvite place="home" />
      </View>
      </ScrollView>
      <AllFragmentsCelebration visible={celebrate} onClose={() => setCelebrate(false)} />
      <WelcomeIntro onDone={() => setWelcomeDone(true)} />
      {welcomeDone && <TesterWelcome />}
    </View>
  );
}

// Place réservée en haut pour les boutons langue / son : le titre commence juste en dessous
const TOP_BUTTONS_SPACE = 40;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c1521',
  },
  topButtons: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    gap: 8,
  },
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  hero: {
    padding: 20,
    alignItems: 'center',
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    color: '#8ea6c0',
    textTransform: 'uppercase',
  },
  logo: {
    width: 140,
    height: 140,
    marginVertical: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#8ea6c0',
    marginTop: 4,
  },
  // Les marges sur les côtés viennent de la carte elle-même (SurveyInvite, place="home")
  surveyBottom: {
    marginTop: 8,
    marginBottom: 8,
  },
  offlineBanner: {
    backgroundColor: '#1f2937',
    borderColor: '#4b5563',
  },
  seasonBanner: {
    backgroundColor: '#221647',
    borderColor: '#5b45a0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  seasonText: {
    color: '#c4b5fd',
    fontSize: 12,
    textAlign: 'center',
  },
});