import { usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ApiError } from '../../services/api';
import { LegalKind, LegalLinks, LegalView } from '../Legal';
import { useGameStore } from '../../store/gameStore';
import { useSettingsStore } from '../../store/settingsStore';

const USERNAME_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9 _-]{3,20}$/;
const MIN_PASSWORD_LENGTH = 6;

// Affiche l'app seulement une fois le joueur connecté et son profil créé
export function StartupGate({ children }: { children: React.ReactNode }) {
  const { status, errorMessage, init, refresh } = useGameStore();
  const pathname = usePathname();
  const [legal, setLegal] = useState<LegalKind | null>(null);

  useEffect(() => {
    init();
    useSettingsStore.getState().loadSettings(); // son coupé ou non (mémorisé sur l'appareil)
  }, [init]);

  // Au retour au premier plan : recharge l'état (le jour a pu changer à minuit) et renvoie les parties en attente
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  // Les pages légales restent lisibles sans compte (liens demandés par les stores)
  if (status === 'ready' || pathname?.startsWith('/legal')) return <>{children}</>;
  if (legal) return <LegalView kind={legal} onBack={() => setLegal(null)} />;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
      {status === 'loading' && <ActivityIndicator size="large" color="#7c3aed" />}
      {status === 'error' && <ErrorPanel message={errorMessage} onRetry={init} />}
      {status === 'needs_profile' && <WelcomeForms onOpenLegal={setLegal} />}
      {status !== 'loading' && <LegalLinks onOpen={setLegal} />}
    </ScrollView>
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
  invalid_credentials: 'Pseudo ou mot de passe incorrect.',
};

// Connexion par défaut ; les nouveaux joueurs passent à la création de compte par le lien en dessous
function WelcomeForms({ onOpenLegal }: { onOpenLegal: (kind: LegalKind) => void }) {
  const [mode, setMode] = useState<'new' | 'login'>('login');
  return (
    <>
      {mode === 'new' ? <UsernameForm onOpenLegal={onOpenLegal} /> : <LoginForm />}
      <Pressable onPress={() => setMode(mode === 'new' ? 'login' : 'new')} style={styles.switchLink} hitSlop={8}>
        <Text style={styles.switchLinkText}>
          {mode === 'new' ? '← J’ai déjà un compte : me connecter' : 'Pas encore de compte ? Créer mon compte →'}
        </Text>
      </Pressable>
    </>
  );
}

function LoginForm() {
  const login = useGameStore((state) => state.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = username.trim().length >= 3 && password.length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await login(username.trim(), password);
    } catch (e) {
      const code = e instanceof ApiError ? e.code : 'network';
      setError(ERROR_MESSAGES[code] ?? 'Connexion impossible, vérifie ta connexion internet.');
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.panel}>
      <Text style={styles.title}>Connexion</Text>
      <Text style={styles.text}>
        Grimnoir a brisé le Cœur de Noël en 24 fragments. Connecte-toi avec ton pseudo et ton mot de passe pour reprendre ta quête.
      </Text>
      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder="Pseudo"
        placeholderTextColor="#8ea6c0"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={handleSubmit}
        placeholder="Mot de passe"
        placeholderTextColor="#8ea6c0"
        secureTextEntry
        autoCapitalize="none"
        style={[styles.input, styles.inputStacked]}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={[styles.button, !canSubmit && styles.buttonDisabled]} onPress={handleSubmit} disabled={!canSubmit}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Se connecter</Text>}
      </Pressable>
    </KeyboardAvoidingView>
  );
}

function UsernameForm({ onOpenLegal }: { onOpenLegal: (kind: LegalKind) => void }) {
  const register = useGameStore((state) => state.register);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const trimmed = username.trim();
  const usernameValid = USERNAME_PATTERN.test(trimmed);
  const passwordValid = password.length >= MIN_PASSWORD_LENGTH;
  const mismatch = confirmation.length > 0 && password !== confirmation;
  const isValid = usernameValid && passwordValid && password === confirmation;

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await register(trimmed, password);
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
        Grimnoir a brisé le Cœur de Noël en 24 fragments. Crée ton compte de Gardien : ton pseudo apparaîtra dans le classement.
      </Text>
      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder="Ton pseudo (3 à 20 caractères)"
        placeholderTextColor="#8ea6c0"
        maxLength={20}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder={`Mot de passe (${MIN_PASSWORD_LENGTH} caractères min.)`}
        placeholderTextColor="#8ea6c0"
        secureTextEntry
        autoCapitalize="none"
        style={[styles.input, styles.inputStacked]}
      />
      <TextInput
        value={confirmation}
        onChangeText={setConfirmation}
        onSubmitEditing={handleSubmit}
        placeholder="Confirme le mot de passe"
        placeholderTextColor="#8ea6c0"
        secureTextEntry
        autoCapitalize="none"
        style={[styles.input, styles.inputStacked]}
      />
      {mismatch && <Text style={styles.error}>Les deux mots de passe ne sont pas identiques.</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={[styles.button, (!isValid || submitting) && styles.buttonDisabled]} onPress={handleSubmit} disabled={!isValid || submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>✦ Commencer l&apos;aventure</Text>}
      </Pressable>
      <Text style={styles.consent}>
        En créant ton compte, tu acceptes les{' '}
        <Text style={styles.consentLink} onPress={() => onOpenLegal('terms')}>
          conditions d’utilisation
        </Text>{' '}
        et la{' '}
        <Text style={styles.consentLink} onPress={() => onOpenLegal('privacy')}>
          politique de confidentialité
        </Text>
        .
      </Text>
      <Text style={styles.hint}>
        Pas besoin d&apos;e-mail : avec ton pseudo et ton mot de passe, tu retrouves ta progression sur ton téléphone, ton ordinateur ou un nouvel appareil. Retiens-les bien, ils ne peuvent pas être récupérés.
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#0c1521',
  },
  screen: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  consent: {
    fontSize: 11,
    lineHeight: 16,
    color: '#b7c8da',
    textAlign: 'center',
    marginTop: 12,
  },
  consentLink: {
    color: '#a78bfa',
    textDecorationLine: 'underline',
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
    color: '#b7c8da',
    textAlign: 'center',
    marginTop: 10,
  },
  detail: {
    fontSize: 11,
    color: '#8ea6c0',
    textAlign: 'center',
    marginTop: 8,
  },
  input: {
    marginTop: 24,
    backgroundColor: '#16233a',
    borderWidth: 1,
    borderColor: '#5b45a0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
  },
  inputStacked: {
    marginTop: 10,
  },
  switchLink: {
    marginTop: 24,
    alignSelf: 'center',
  },
  switchLinkText: {
    color: '#a78bfa',
    fontSize: 13,
    fontWeight: '600',
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
    color: '#8ea6c0',
    textAlign: 'center',
    marginTop: 12,
  },
});
