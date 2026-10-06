import { StyleSheet, Text, View } from 'react-native';
import {
  BONUS_MAX_POINTS,
  DAY_SCORE_INFO,
  WIN_MAX_POINTS,
  WIN_MIN_POINTS,
} from '../../constants/scoring';
import { useI18n } from '../../services/i18n';

/** Explication complète des points d'un jour du calendrier (dans « Comment jouer ») */
export function ScoreRules({ day }: { day: number }) {
  const { tr, l, locale } = useI18n();
  const info = DAY_SCORE_INFO[day];
  if (!info) return null;
  const max = info.baseMax.toLocaleString(locale);

  return (
    <View style={styles.box}>
      <Text style={styles.title}>{tr('🧮 Les points', '🧮 Points')}</Text>

      <Text style={styles.label}>{tr('Score du jeu', 'Game score')}</Text>
      <Text style={styles.text}>{l(info.how)}</Text>

      <Text style={styles.label}>{tr('Points au classement', 'Leaderboard points')}</Text>
      <Text style={styles.text}>
        {tr(
          `✅ Gagné : de ${WIN_MIN_POINTS} à ${WIN_MAX_POINTS} pts selon ta performance, c’est-à-dire ton score du jeu comparé au meilleur score possible (${info.approx ? 'environ ' : ''}${max} pts = ${WIN_MAX_POINTS}).`,
          `✅ Won: ${WIN_MIN_POINTS} to ${WIN_MAX_POINTS} pts depending on your performance, i.e. your game score compared with the best possible score (${info.approx ? 'about ' : ''}${max} pts = ${WIN_MAX_POINTS}).`
        )}
      </Text>
      <Text style={styles.text}>
        {info.bonus
          ? tr(
              `⏱️ Bonus : jusqu’à +${BONUS_MAX_POINTS} pts pour ${l(info.bonus)}.`,
              `⏱️ Bonus: up to +${BONUS_MAX_POINTS} pts for ${l(info.bonus)}.`
            )
          : tr('⏱️ Pas de bonus sur ce jeu.', '⏱️ No bonus in this game.')}
      </Text>
      <Text style={styles.text}>
        {tr(
          '❌ Raté : tu ne perds aucun point, mais tu n’en gagnes pas non plus (et pas de fragment). Tu peux réessayer tant que le jour est ouvert.',
          '❌ Failed: you lose no points, but you don’t earn any either (and no shard). You can try again while the day is open.'
        )}
      </Text>
      <Text style={styles.note}>
        {tr(
          'Tous les jours valent autant : un jeu à gros scores ne compte pas plus qu’un autre.',
          'Every day is worth the same: a high-scoring game does not count more than another.'
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#0c1521',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2c4262',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fbbf24',
    marginBottom: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#c4b5fd',
    marginTop: 4,
  },
  text: {
    fontSize: 12,
    lineHeight: 17,
    color: '#dbe6f1',
  },
  note: {
    fontSize: 11,
    color: '#8ea6c0',
    marginTop: 4,
  },
});
