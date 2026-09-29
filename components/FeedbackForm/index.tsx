import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { submitFeedback } from '../../services/api';
import { useI18n } from '../../services/i18n';

/** Commentaire de testeur après une partie : ce qui a plu, ce qui peut changer, une note. Envoyé à l'admin. */
export function FeedbackForm({ day }: { day: number }) {
  const { tr } = useI18n();
  const [rating, setRating] = useState<number | null>(null);
  const [liked, setLiked] = useState('');
  const [toChange, setToChange] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const canSend = (rating !== null || liked.trim() !== '' || toChange.trim() !== '') && status !== 'sending';

  const handleSend = async () => {
    if (!canSend) return;
    setStatus('sending');
    try {
      await submitFeedback(day, liked, toChange, rating);
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <View style={styles.card}>
        <Text style={styles.sent}>{tr('✅ Merci ! Ton retour a été envoyé à l’admin.', '✅ Thanks! Your feedback has been sent to the admin.')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{tr('🧪 Ton avis de testeur', '🧪 Your tester feedback')}</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setRating(rating === n ? null : n)} hitSlop={6} accessibilityLabel={tr(`${n} étoile${n > 1 ? 's' : ''}`, `${n} star${n > 1 ? 's' : ''}`)}>
            <Text style={[styles.star, rating !== null && n <= rating && styles.starOn]}>★</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        value={liked}
        onChangeText={setLiked}
        placeholder={tr('Ce qui t’a plu', 'What you liked')}
        placeholderTextColor="#8ea6c0"
        multiline
        maxLength={2000}
        style={styles.input}
      />
      <TextInput
        value={toChange}
        onChangeText={setToChange}
        placeholder={tr('Ce qui peut être changé ou amélioré', 'What could be changed or improved')}
        placeholderTextColor="#8ea6c0"
        multiline
        maxLength={2000}
        style={styles.input}
      />
      {status === 'error' && <Text style={styles.error}>{tr('Envoi impossible, vérifie ta connexion et réessaie.', 'Couldn’t send, check your connection and try again.')}</Text>}
      <Pressable style={[styles.button, !canSend && styles.disabled]} onPress={handleSend} disabled={!canSend}>
        {status === 'sending' ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{tr('Envoyer mon retour', 'Send my feedback')}</Text>}
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
    borderColor: '#5b45a0',
    padding: 14,
    gap: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#c4b5fd',
  },
  stars: {
    flexDirection: 'row',
    gap: 6,
  },
  star: {
    fontSize: 26,
    color: '#3a5a82',
  },
  starOn: {
    color: '#fbbf24',
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
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.4,
  },
  sent: {
    fontSize: 13,
    color: '#34d399',
    textAlign: 'center',
  },
});
