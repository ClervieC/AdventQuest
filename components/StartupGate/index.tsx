import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ApiError } from '../../services/api';
import { useGameStore } from '../../store/gameStore';

const USERNAME_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9 _-]{3,20}$/;

// Affiche l'app seulement une fois le joueur connecté et son profil créé
export function StartupGate({ children }: { children: React.ReactNode }) {
  const { status, errorMessage, init, refresh } = useGameStore();

  useEffect(() => {
    init();
  }, [init]);

  // Au retour au premier plan : recharge l'état (le jour a pu changer à minuit) et renvoie les parties en attente
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  if (status === 'ready') return <>{children}</>;

  return (
    <View style={styles.screen}>
      <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
      {status === 'loading' && <ActivityIndicator size="large" color="#7c3aed" />}
      {status === 'error' && <ErrorPanel message={errorMessage} onRetry={init} />}
      {status === 'needs_profile' && <UsernameForm />}
    </View>
  );
}

function ErrorPanel({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Connexion impossible</Text>
      <Text style={styles.text}>
        Le calendrier a besoin d&apos;internet pour savoir quel jour ouvrir et garder ta progression.
      </Text>
      {message && <Text style={styles.detail}>{message}</Text>}
      <Pressable style={styles.button} onPress={onRetry}>
        <Text style={styles.buttonText}>↻ Réessayer</Text>
      </Pressable>
    </View>
  );
}

const ERROR_MESSAGES: Partial<Record<string, string>> = {
  username_taken: 'Ce pseudo est déjà pris, essaie-en un autre.',
  invalid_username: 'Entre 3 et 20 caractères : lettres, chiffres, espaces, - et _.',
};

function UsernameForm() {
  const register = useGameStore((state) => state.register);
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const trimmed = username.trim();
  const isValid = USERNAME_PATTERN.test(trimmed);

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await register(trimmed);
    } catch (e) {
      const code = e instanceof ApiError ? e.code : 'network';
      setError(ERROR_MESSAGES[code] ?? 'Impossible de créer ton profil, vérifie ta connexion.');
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.panel}>
      <Text style={styles.title}>Bienvenue, Gardien des Fêtes !</Text>
      <Text style={styles.text}>
        Grimnoir a brisé le Cœur de Noël en 24 fragments. Choisis ton nom de Gardien : il apparaîtra dans le classement.
      </Text>
      <TextInput
        value={username}
        onChangeText={setUsername}
        onSubmitEditing={handleSubmit}
        placeholder="Ton pseudo"
        placeholderTextColor="#3a5a7a"
        maxLength={20}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={[styles.button, (!isValid || submitting) && styles.buttonDisabled]} onPress={handleSubmit} disabled={!isValid || submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>✦ Commencer l&apos;aventure</Text>}
      </Pressable>
      <Text style={styles.hint}>Pas besoin d&apos;e-mail : ta progression est liée à ce téléphone.</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0c1521',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  panel: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'stretch',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  text: {
    fontSize: 13,
    lineHeight: 20,
    color: '#7a9ab8',
    textAlign: 'center',
    marginTop: 10,
  },
  detail: {
    fontSize: 11,
    color: '#3a5a7a',
    textAlign: 'center',
    marginTop: 8,
  },
  input: {
    marginTop: 24,
    backgroundColor: '#090e18',
    borderWidth: 1,
    borderColor: '#3b2a6b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
  },
  error: {
    fontSize: 12,
    color: '#f87171',
    marginTop: 8,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  hint: {
    fontSize: 11,
    color: '#3a5a7a',
    textAlign: 'center',
    marginTop: 12,
  },
});
