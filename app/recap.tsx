import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pageColumn } from '../constants/layout';
import { fetchLeaderboard, getMyUserId } from '../services/api';
import { useI18n } from '../services/i18n';
import { buildRecap, recapShareText } from '../services/recap';
import { useGameStore } from '../store/gameStore';

const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

// Récap de la saison (à partir du 25 décembre ; testeurs et admin : à tout moment), à partager sur les réseaux
export default function RecapScreen() {
  const insets = useSafeAreaInsets();
  const { tr, l, lang, locale } = useI18n();
  const days = useGameStore((state) => state.days);
  const username = useGameStore((state) => state.username);
  const recap = useMemo(() => buildRecap(days), [days]);
  const [rank, setRank] = useState<number | null>(null);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  // Place au classement général (si le joueur est dans les 500 premiers)
  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchLeaderboard(500), getMyUserId()])
      .then(([entries, me]) => {
        const index = entries.findIndex((entry) => entry.user_id === me);
        if (!cancelled && index >= 0) setRank(index + 1);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleShare = async () => {
    const url = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : null;
    const text = recapShareText(recap, { lang, locale, rank, url });
    try {
      if (Platform.OS !== 'web') {
        await Share.share({ message: text });
        return;
      }
      // Navigateur : menu de partage du téléphone si disponible, sinon copie dans le presse-papiers
      const nav = navigator as Navigator & { share?: (data: { text: string; title?: string }) => Promise<void> };
      if (nav.share) {
        await nav.share({ title: 'AdventQuest', text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setShareStatus('copied');
    } catch (error) {
      // Partage annulé par le joueur : rien à signaler
      if (error instanceof Error && error.name === 'AbortError') return;
      setShareStatus('error');
    }
  };

  const nothingPlayed = recap.daysPlayed === 0;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.column}>
        <Pressable onPress={goBack} hitSlop={12} style={styles.back}>
          <Text style={styles.backText}>{tr('‹ Retour', '‹ Back')}</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={[styles.column, styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <Text style={styles.icon}>🎄</Text>
        <Text style={styles.title}>{tr('Ta saison AdventQuest', 'Your AdventQuest season')}</Text>
        {username && <Text style={styles.subtitle}>{username}</Text>}

        {nothingPlayed ? (
          <Text style={styles.empty}>
            {tr('Tu n’as joué aucun jour cette saison… Rendez-vous l’an prochain !', 'You didn’t play any day this season… See you next year!')}
          </Text>
        ) : (
          <>
            <View style={styles.stats}>
              <Stat value={`${recap.fragments}/24`} label={tr('fragments', 'shards')} />
              <Stat value={recap.totalPoints.toLocaleString(locale)} label={tr('points', 'points')} />
              <Stat value={rank ? `${rank}${lang === 'fr' ? (rank === 1 ? 'er' : 'e') : ''}` : '–'} label={tr('au classement', 'rank')} />
            </View>
            <Text style={styles.detail}>
              {tr(
                `${recap.daysPlayed} jours joués · ${recap.wonFirstTry} gagnés du premier coup · ${recap.totalAttempts} parties en tout`,
                `${recap.daysPlayed} days played · ${recap.wonFirstTry} won on the first try · ${recap.totalAttempts} games in total`
              )}
            </Text>

            {/* Grille des 24 jours */}
            <View style={styles.card}>
              <Text style={styles.grid}>{recap.grid}</Text>
              <Text style={styles.legend}>
                {tr(
                  '🟩 gagné du premier coup · 🟨 gagné après plusieurs essais · 🟥 tenté sans réussir · ⬛ pas joué',
                  '🟩 won on the first try · 🟨 won after several tries · 🟥 tried without success · ⬛ not played'
                )}
              </Text>
            </View>

            {recap.best.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{tr('⭐ Là où tu as brillé', '⭐ Where you shone')}</Text>
                {recap.best.map((day, index) => (
                  <View key={day.day} style={styles.row}>
                    <Text style={styles.rowRank}>{['🥇', '🥈', '🥉'][index]}</Text>
                    <Text style={styles.rowText}>
                      {tr('Jour', 'Day')} {day.day} · {l(day.game)}
                    </Text>
                    <Text style={styles.rowScore}>{day.bestScore.toLocaleString(locale)} pts</Text>
                  </View>
                ))}
              </View>
            )}

            {recap.toughest && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{tr('💪 Celui qui t’a donné du fil à retordre', '💪 The one that gave you a hard time')}</Text>
                <Text style={styles.rowText}>
                  {tr('Jour', 'Day')} {recap.toughest.day} · {l(recap.toughest.game)}
                </Text>
                <Text style={styles.detailLeft}>
                  {recap.toughest.won
                    ? tr(
                        `${recap.toughest.attempts} essais avant de le gagner : bravo pour la persévérance !`,
                        `${recap.toughest.attempts} tries before winning it: well done for not giving up!`
                      )
                    : tr(`${recap.toughest.attempts} essais… il te résiste encore !`, `${recap.toughest.attempts} tries… it still resists you!`)}
                </Text>
              </View>
            )}

            <Pressable style={styles.shareButton} onPress={handleShare} accessibilityRole="button">
              <Text style={styles.shareButtonText}>{tr('📤 Partager mon récap', '📤 Share my recap')}</Text>
            </Pressable>
            {shareStatus === 'copied' && (
              <Text style={styles.shareInfo}>{tr('✅ Copié ! Colle-le où tu veux.', '✅ Copied! Paste it wherever you like.')}</Text>
            )}
            {shareStatus === 'error' && (
              <Text style={styles.shareError}>{tr('Partage impossible sur cet appareil.', 'Sharing isn’t available on this device.')}</Text>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0c1521',
  },
  column: pageColumn(20),
  content: {
    alignItems: 'center',
    gap: 14,
  },
  back: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  backText: {
    color: '#b7c8da',
    fontSize: 15,
    fontWeight: '600',
  },
  icon: {
    fontSize: 48,
    marginTop: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#c4b5fd',
    fontWeight: '700',
    marginTop: -8,
  },
  empty: {
    fontSize: 14,
    color: '#b7c8da',
    textAlign: 'center',
    marginTop: 12,
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'stretch',
  },
  stat: {
    flex: 1,
    backgroundColor: '#16233a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2c4262',
    paddingVertical: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fbbf24',
  },
  statLabel: {
    fontSize: 11,
    color: '#b7c8da',
    marginTop: 2,
  },
  detail: {
    fontSize: 12,
    color: '#8ea6c0',
    textAlign: 'center',
  },
  detailLeft: {
    fontSize: 13,
    color: '#b7c8da',
    lineHeight: 19,
  },
  card: {
    alignSelf: 'stretch',
    backgroundColor: '#16233a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2c4262',
    padding: 14,
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#c4b5fd',
    marginBottom: 2,
  },
  grid: {
    fontSize: 26,
    lineHeight: 34,
    textAlign: 'center',
    letterSpacing: 2,
  },
  legend: {
    fontSize: 11,
    color: '#8ea6c0',
    textAlign: 'center',
    lineHeight: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowRank: {
    fontSize: 18,
    width: 26,
  },
  rowText: {
    flex: 1,
    fontSize: 14,
    color: '#e2e8f0',
    fontWeight: '600',
  },
  rowScore: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fbbf24',
  },
  shareButton: {
    alignSelf: 'stretch',
    backgroundColor: '#7c3aed',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  shareInfo: {
    fontSize: 13,
    color: '#34d399',
  },
  shareError: {
    fontSize: 13,
    color: '#f87171',
  },
});
