import { usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ApiError, getMyUserId, subscribeMyProfile } from '../../services/api';
import { Localized, useI18n } from '../../services/i18n';
import { LanguageToggle } from '../LanguageToggle';
import { LegalKind, LegalLinks, LegalView } from '../Legal';
import { useGameStore } from '../../store/gameStore';
import { pageColumn } from '../../constants/layout';
import { dayRecordKey, useRecordsStore } from '../../store/recordsStore';
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

  // Rôle ou jours de test changés par l'admin : on recharge tout de suite (le joueur voit ses jours de test sans relancer)
  const username = useGameStore((s) => s.username);
  useEffect(() => {
    if (status !== 'ready') return;
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    getMyUserId().then((userId) => {
      if (userId && !cancelled) unsubscribe = subscribeMyProfile(userId, refresh);
    });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [status, username, refresh]);

  // Records personnels du joueur connecté (onglet Jeux). Les meilleurs scores des vraies parties du calendrier
  // y sont reportés, pour les classements entre amis par jeu.
  useEffect(() => {
    if (status !== 'ready') return;
    useRecordsStore
      .getState()
      .load(username)
      .then(() => {
        Object.entries(useGameStore.getState().days).forEach(([day, state]) => {
          useRecordsStore.getState().submit(dayRecordKey(Number(day)), state.bestScore);
        });
      });
  }, [status, username]);

  // Web : langue de la page (lecteurs d'écran, traduction automatique du navigateur)
  const lang = useSettingsStore((s) => s.lang);
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') document.documentElement.lang = lang;
  }, [lang]);

  // Les pages légales restent lisibles sans compte (liens demandés par les stores)
  if (status === 'ready' || pathname?.startsWith('/legal')) return <>{children}</>;
  if (legal) return <LegalView kind={legal} onBack={() => setLegal(null)} />;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={[styles.screen, pageColumn(24)]} keyboardShouldPersistTaps="handled">
      <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
      {status !== 'loading' && <LanguageToggle style={styles.languages} />}
      {status === 'loading' && <ActivityIndicator size="large" color="#7c3aed" />}
      {status === 'error' && <ErrorPanel message={errorMessage} onRetry={init} />}
      {status === 'needs_profile' && <WelcomeForms onOpenLegal={setLegal} />}
      {status !== 'loading' && <LegalLinks onOpen={setLegal} />}
    </ScrollView>
  );
}

function ErrorPanel({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  const { tr } = useI18n();
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>{tr('Connexion impossible', 'Can’t connect')}</Text>
      <Text style={styles.text}>
        {tr(
          "Le calendrier a besoin d'internet pour savoir quel jour ouvrir et garder ta progression.",
          'The calendar needs the internet to know which day to open and to keep your progress.'
        )}
      </Text>
      {message && <Text style={styles.detail}>{message}</Text>}
      <Pressable style={styles.button} onPress={onRetry}>
        <Text style={styles.buttonText}>{tr('↻ Réessayer', '↻ Try again')}</Text>
      </Pressable>
    </View>
  );
}

const ERROR_MESSAGES: Partial<Record<string, Localized>> = {
  username_taken: { fr: 'Ce pseudo est déjà pris, essaie-en un autre.', en: 'This username is already taken, try another one.' },
  invalid_username: { fr: 'Entre 3 et 20 caractères : lettres, chiffres, espaces, - et _.', en: 'Between 3 and 20 characters: letters, numbers, spaces, - and _.' },
  invalid_credentials: { fr: 'Pseudo ou mot de passe incorrect.', en: 'Wrong username or password.' },
};

// Connexion par défaut ; les nouveaux joueurs passent à la création de compte par le lien en dessous
function WelcomeForms({ onOpenLegal }: { onOpenLegal: (kind: LegalKind) => void }) {
  const { tr } = useI18n();
  const [mode, setMode] = useState<'new' | 'login'>('login');
  return (
    <>
      {mode === 'new' ? <UsernameForm onOpenLegal={onOpenLegal} /> : <LoginForm />}
      <Pressable onPress={() => setMode(mode === 'new' ? 'login' : 'new')} style={styles.switchLink} hitSlop={8}>
        <Text style={styles.switchLinkText}>
          {mode === 'new'
            ? tr('← J’ai déjà un compte : me connecter', '← I already have an account: log in')
            : tr('Pas encore de compte ? Créer mon compte →', 'No account yet? Create my account →')}
        </Text>
      </Pressable>
    </>
  );
}

function LoginForm() {
  const login = useGameStore((state) => state.login);
  const { tr, l } = useI18n();
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
      const known = ERROR_MESSAGES[code];
      setError(known ? l(known) : tr('Connexion impossible, vérifie ta connexion internet.', 'Couldn’t log in, check your internet connection.'));
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.panel}>
      <Text style={styles.title}>{tr('Connexion', 'Log in')}</Text>
      <Text style={styles.text}>
        {tr(
          'Grimnoir a brisé le Cœur de Noël en 24 fragments. Connecte-toi avec ton pseudo et ton mot de passe pour reprendre ta quête.',
          'Grimnoir has shattered the Heart of Christmas into 24 shards. Log in with your username and password to resume your quest.'
        )}
      </Text>
      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder={tr('Pseudo', 'Username')}
        placeholderTextColor="#8ea6c0"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={handleSubmit}
        placeholder={tr('Mot de passe', 'Password')}
        placeholderTextColor="#8ea6c0"
        secureTextEntry
        autoCapitalize="none"
        style={[styles.input, styles.inputStacked]}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={[styles.button, !canSubmit && styles.buttonDisabled]} onPress={handleSubmit} disabled={!canSubmit}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{tr('Se connecter', 'Log in')}</Text>}
      </Pressable>
    </KeyboardAvoidingView>
  );
}

function UsernameForm({ onOpenLegal }: { onOpenLegal: (kind: LegalKind) => void }) {
  const register = useGameStore((state) => state.register);
  const { tr, l } = useI18n();
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
      const known = ERROR_MESSAGES[code];
      setError(known ? l(known) : tr('Impossible de créer ton profil, vérifie ta connexion.', 'Couldn’t create your profile, check your connection.'));
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.panel}>
      <Text style={styles.title}>{tr('Bienvenue, Gardien des Fêtes !', 'Welcome, Keeper of the Holidays!')}</Text>
      <Text style={styles.text}>
        {tr(
          'Grimnoir a brisé le Cœur de Noël en 24 fragments. Crée ton compte de Gardien : ton pseudo apparaîtra dans le classement.',
          'Grimnoir has shattered the Heart of Christmas into 24 shards. Create your Keeper account: your username will appear in the leaderboard.'
        )}
      </Text>
      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder={tr('Ton pseudo (3 à 20 caractères)', 'Your username (3 to 20 characters)')}
        placeholderTextColor="#8ea6c0"
        maxLength={20}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder={tr(`Mot de passe (${MIN_PASSWORD_LENGTH} caractères min.)`, `Password (at least ${MIN_PASSWORD_LENGTH} characters)`)}
        placeholderTextColor="#8ea6c0"
        secureTextEntry
        autoCapitalize="none"
        style={[styles.input, styles.inputStacked]}
      />
      <TextInput
        value={confirmation}
        onChangeText={setConfirmation}
        onSubmitEditing={handleSubmit}
        placeholder={tr('Confirme le mot de passe', 'Confirm your password')}
        placeholderTextColor="#8ea6c0"
        secureTextEntry
        autoCapitalize="none"
        style={[styles.input, styles.inputStacked]}
      />
      {mismatch && <Text style={styles.error}>{tr('Les deux mots de passe ne sont pas identiques.', 'The two passwords don’t match.')}</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={[styles.button, (!isValid || submitting) && styles.buttonDisabled]} onPress={handleSubmit} disabled={!isValid || submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{tr("✦ Commencer l'aventure", '✦ Start the adventure')}</Text>}
      </Pressable>
      <Text style={styles.consent}>
        {tr('En créant ton compte, tu acceptes les', 'By creating your account, you accept the')}{' '}
        <Text style={styles.consentLink} onPress={() => onOpenLegal('terms')}>
          {tr('conditions d’utilisation', 'terms of use')}
        </Text>{' '}
        {tr('et la', 'and the')}{' '}
        <Text style={styles.consentLink} onPress={() => onOpenLegal('privacy')}>
          {tr('politique de confidentialité', 'privacy policy')}
        </Text>
        .
      </Text>
      <Text style={styles.hint}>
        {tr(
          "Pas besoin d'e-mail : avec ton pseudo et ton mot de passe, tu retrouves ta progression sur ton téléphone, ton ordinateur ou un nouvel appareil. Retiens-les bien, ils ne peuvent pas être récupérés.",
          'No email needed: with your username and password, you get your progress back on your phone, your computer or a new device. Remember them well, they can’t be recovered.'
        )}
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
  languages: {
    marginBottom: 16,
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
