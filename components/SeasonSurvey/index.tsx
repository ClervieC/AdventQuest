import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { COME_BACK_LABELS, SURVEY_GAMES, SURVEY_WISHES } from '../../constants/survey';
import { ComeBack, fetchSeasonSurveyStatus, submitSeasonSurvey } from '../../services/api';
import { useI18n } from '../../services/i18n';

type Status = 'loading' | 'closed' | 'idle' | 'sending' | 'sent' | 'error';

/**
 * Petit sondage de fin de saison (page /survey, ouverte depuis l'accueil ou le profil) : ce qui a plu,
 * les jeux préférés, ce que le joueur aimerait l'année prochaine. Ouvert à partir du 24 décembre au soir.
 * Une réponse par joueur (un nouvel envoi la remplace).
 */
export function SeasonSurvey({ onSent }: { onSent?: () => void }) {
  const { tr, l } = useI18n();
  const [status, setStatus] = useState<Status>('loading');
  const [alreadyAnswered, setAlreadyAnswered] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [favoriteGames, setFavoriteGames] = useState<string[]>([]);
  const [liked, setLiked] = useState('');
  const [wishes, setWishes] = useState<string[]>([]);
  const [nextYear, setNextYear] = useState('');
  const [comeBack, setComeBack] = useState<ComeBack | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchSeasonSurveyStatus()
      .then(({ open, answered }) => {
        if (cancelled) return;
        setAlreadyAnswered(answered);
        setStatus(!open ? 'closed' : answered ? 'sent' : 'idle');
      })
      .catch(() => {
        if (!cancelled) setStatus('idle');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (list: string[], value: string, setList: (next: string[]) => void) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const canSend =
    status !== 'sending' &&
    (rating !== null || favoriteGames.length > 0 || wishes.length > 0 || comeBack !== null || liked.trim() !== '' || nextYear.trim() !== '');

  const handleSend = async () => {
    if (!canSend) return;
    setStatus('sending');
    try {
      await submitSeasonSurvey({ rating, favoriteGames, liked, wishes, nextYear, comeBack });
      setStatus('sent');
      onSent?.();
    } catch {
      setStatus('error');
    }
  };

  if (status === 'loading') {
    return (
      <View style={styles.card}>
        <ActivityIndicator color="#a78bfa" />
      </View>
    );
  }

  if (status === 'closed') {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>{tr('🎁 Sondage de fin de saison', '🎁 End-of-season survey')}</Text>
        <Text style={styles.thanks}>{tr('Le sondage ouvrira le 24 décembre au soir, après la dernière épreuve. À bientôt !', 'The survey opens on the evening of 24 December, after the last trial. See you soon!')}</Text>
      </View>
    );
  }

  if (status === 'sent') {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>{tr('🎁 Sondage de fin de saison', '🎁 End-of-season survey')}</Text>
        <Text style={styles.thanks}>
          {alreadyAnswered
            ? tr('Tu as déjà répondu au sondage, merci ! 💜', 'You’ve already answered the survey, thank you! 💜')
            : tr('Merci pour tes réponses ! 💜 Elles vont aider à préparer l’an prochain.', 'Thanks for your answers! 💜 They’ll help us prepare next year.')}
        </Text>
        <Pressable onPress={() => { setAlreadyAnswered(false); setStatus('idle'); }} hitSlop={8}>
          <Text style={styles.link}>{tr('Répondre à nouveau (remplace ta réponse)', 'Answer again (replaces your answer)')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{tr('🎁 Sondage de fin de saison', '🎁 End-of-season survey')}</Text>
      <Text style={styles.intro}>{tr('Quelques questions pour préparer l’année prochaine. Tout est facultatif.', 'A few questions to help prepare next year. Everything is optional.')}</Text>

      <Text style={styles.question}>{tr('Ta note pour AdventQuest', 'Your rating for AdventQuest')}</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setRating(rating === n ? null : n)} hitSlop={6} accessibilityLabel={tr(`${n} étoile${n > 1 ? 's' : ''}`, `${n} star${n > 1 ? 's' : ''}`)}>
            <Text style={[styles.star, rating !== null && n <= rating && styles.starOn]}>★</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.question}>{tr('Tes jeux préférés', 'Your favourite games')}</Text>
      <View style={styles.chips}>
        {SURVEY_GAMES.map((game) => {
          const on = favoriteGames.includes(game.key);
          return (
            <Pressable key={game.key} onPress={() => toggle(favoriteGames, game.key, setFavoriteGames)} style={[styles.chip, on && styles.chipOn]}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{l(game.label)}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.question}>{tr('Ce que tu as le plus apprécié', 'What you enjoyed most')}</Text>
      <TextInput
        value={liked}
        onChangeText={setLiked}
        placeholder={tr('L’histoire, un jeu en particulier, le classement…', 'The story, a particular game, the leaderboard…')}
        placeholderTextColor="#8ea6c0"
        multiline
        maxLength={2000}
        style={styles.input}
      />

      <Text style={styles.question}>{tr('L’année prochaine, tu aimerais…', 'Next year, you’d like…')}</Text>
      <View style={styles.chips}>
        {SURVEY_WISHES.map((wish) => {
          const on = wishes.includes(wish.value);
          return (
            <Pressable key={wish.value} onPress={() => toggle(wishes, wish.value, setWishes)} style={[styles.chip, on && styles.chipOn]}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{l(wish.label)}</Text>
            </Pressable>
          );
        })}
      </View>
      <TextInput
        value={nextYear}
        onChangeText={setNextYear}
        placeholder={tr('D’autres idées pour l’an prochain ?', 'Any other ideas for next year?')}
        placeholderTextColor="#8ea6c0"
        multiline
        maxLength={2000}
        style={styles.input}
      />

      <Text style={styles.question}>{tr('Tu rejoueras l’année prochaine ?', 'Will you play again next year?')}</Text>
      <View style={styles.chips}>
        {(Object.keys(COME_BACK_LABELS) as ComeBack[]).map((value) => {
          const on = comeBack === value;
          return (
            <Pressable key={value} onPress={() => setComeBack(on ? null : value)} style={[styles.chip, on && styles.chipOn]}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{l(COME_BACK_LABELS[value])}</Text>
            </Pressable>
          );
        })}
      </View>

      {status === 'error' && <Text style={styles.error}>{tr('Envoi impossible, vérifie ta connexion et réessaie.', 'Couldn’t send, check your connection and try again.')}</Text>}
      <Pressable style={[styles.button, !canSend && styles.disabled]} onPress={handleSend} disabled={!canSend}>
        {status === 'sending' ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{tr('Envoyer mes réponses', 'Send my answers')}</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    marginTop: 20,
    backgroundColor: '#16233a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#b45309',
    padding: 14,
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fbbf24',
  },
  intro: {
    fontSize: 12,
    color: '#b7c8da',
  },
  question: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    marginTop: 6,
  },
  stars: {
    flexDirection: 'row',
    gap: 6,
  },
  star: {
    fontSize: 28,
    color: '#3a5a82',
  },
  starOn: {
    color: '#fbbf24',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3a5a82',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  chipOn: {
    backgroundColor: '#3a2e08',
    borderColor: '#fbbf24',
  },
  chipText: {
    fontSize: 12,
    color: '#b7c8da',
  },
  chipTextOn: {
    color: '#fbbf24',
    fontWeight: '700',
  },
  input: {
    minHeight: 60,
    backgroundColor: '#0c1521',
    borderWidth: 1,
    borderColor: '#3a5a82',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#fff',
    textAlignVertical: 'top',
  },
  error: {
    fontSize: 12,
    color: '#f87171',
  },
  button: {
    marginTop: 4,
    backgroundColor: '#b45309',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  thanks: {
    fontSize: 13,
    color: '#dbe6f1',
    lineHeight: 19,
  },
  link: {
    fontSize: 12,
    color: '#b7c8da',
    textDecorationLine: 'underline',
  },
});
