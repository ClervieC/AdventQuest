import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LegalLinks } from '../../components/Legal';
import { ApiError } from '../../services/api';
import { FRAGMENT_THRESHOLD, useGameStore } from '../../store/gameStore';

const MIN_PASSWORD_LENGTH = 6;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { username, timezone, hints, days, totalFragments, role, testerDays } = useGameStore();
  const fragments = totalFragments();
  const totalScore = Object.values(days).reduce((sum, day) => sum + day.bestScore, 0);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.container, { paddingTop: insets.top + 24 }]}>
      <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>{username ?? 'Gardien des Fêtes'}</Text>
      {role !== 'player' && (
        <Text style={styles.roleBadge}>
          {role === 'admin' ? '🛠️ Administrateur' : `🧪 Testeur · ${testerDays.length} jour${testerDays.length > 1 ? 's' : ''} ouvert${testerDays.length > 1 ? 's' : ''} en avance`}
        </Text>
      )}
      {role === 'admin' && (
        <Pressable style={styles.adminButton} onPress={() => router.push('/admin')}>
          <Text style={styles.adminButtonText}>🛠️ Administration : utilisateurs et retours</Text>
        </Pressable>
      )}

      <View style={styles.stats}>
        <Stat value={`${fragments} / 24`} label="fragments" />
        <Stat value={totalScore.toLocaleString('fr-FR')} label="points" />
        <Stat value={`${hints}`} label="hints" />
      </View>

      <Text style={styles.info}>
        {fragments >= FRAGMENT_THRESHOLD
          ? '✅ Le portail du boss s’ouvrira pour toi le jour 24.'
          : `Encore ${FRAGMENT_THRESHOLD - fragments} fragment${FRAGMENT_THRESHOLD - fragments > 1 ? 's' : ''} pour pouvoir affronter Grimnoir le jour 24.`}
      </Text>
      {timezone && <Text style={styles.detail}>Une nouvelle case s&apos;ouvre chaque jour à minuit ({timezone}).</Text>}

      <AccountSection />
      <DeleteAccountSection />
      <LegalLinks onOpen={(kind) => router.push(kind === 'terms' ? '/legal/terms' : '/legal/privacy')} />
    </ScrollView>
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

const ACCOUNT_ERRORS: Partial<Record<string, string>> = {
  weak_password: `Mot de passe trop faible : au moins ${MIN_PASSWORD_LENGTH} caractères.`,
  email_confirmation_enabled:
    'La protection des comptes n’est pas encore activée sur le serveur (réglage « Confirm email » à désactiver dans Supabase).',
};

// Compte : protéger par un mot de passe (pour jouer sur plusieurs appareils), ou se déconnecter
function AccountSection() {
  const { username, hasAccount, passwordSetupFailed, protectAccount, logout } = useGameStore();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const mismatch = confirmation.length > 0 && password !== confirmation;
  const canProtect = password.length >= MIN_PASSWORD_LENGTH && password === confirmation && !busy;

  const handleProtect = async () => {
    if (!canProtect) return;
    setBusy(true);
    setError(null);
    try {
      await protectAccount(password);
      setPassword('');
      setConfirmation('');
    } catch (e) {
      const code = e instanceof ApiError ? e.code : 'network';
      setError(ACCOUNT_ERRORS[code] ?? 'Impossible d’enregistrer le mot de passe, vérifie ta connexion.');
    }
    setBusy(false);
  };

  const handleLogout = async () => {
    setBusy(true);
    await logout();
  };

  if (hasAccount) {
    return (
      <View style={styles.accountCard}>
        <Text style={styles.accountTitle}>🔒 Compte protégé</Text>
        <Text style={styles.accountText}>
          Sur un autre téléphone ou ordinateur, choisis « J’ai déjà un compte » et connecte-toi avec le pseudo « {username} » et ton mot de passe.
        </Text>
        {!confirmLogout ? (
          <Pressable style={styles.secondaryButton} onPress={() => setConfirmLogout(true)}>
            <Text style={styles.secondaryButtonText}>Se déconnecter</Text>
          </Pressable>
        ) : (
          <View style={styles.confirmRow}>
            <Pressable style={[styles.secondaryButton, styles.flex]} onPress={() => setConfirmLogout(false)} disabled={busy}>
              <Text style={styles.secondaryButtonText}>Annuler</Text>
            </Pressable>
            <Pressable style={[styles.dangerButton, styles.flex]} onPress={handleLogout} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Oui, me déconnecter</Text>}
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.accountCard}>
      <Text style={styles.accountTitle}>🔓 Protéger mon compte</Text>
      {passwordSetupFailed && (
        <Text style={styles.error}>Ton mot de passe n’a pas pu être enregistré à l’inscription : choisis-le à nouveau ici.</Text>
      )}
      <Text style={styles.accountText}>
        Pour l’instant, ta progression n’existe que sur cet appareil. Choisis un mot de passe pour jouer sur ton téléphone et ton ordinateur, ou changer de téléphone sans rien perdre.
      </Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder={`Mot de passe (${MIN_PASSWORD_LENGTH} caractères min.)`}
        placeholderTextColor="#3a5a7a"
        secureTextEntry
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        value={confirmation}
        onChangeText={setConfirmation}
        onSubmitEditing={handleProtect}
        placeholder="Confirme le mot de passe"
        placeholderTextColor="#3a5a7a"
        secureTextEntry
        autoCapitalize="none"
        style={styles.input}
      />
      {mismatch && <Text style={styles.error}>Les deux mots de passe ne sont pas identiques.</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={[styles.primaryButton, !canProtect && styles.disabled]} onPress={handleProtect} disabled={!canProtect}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>🔒 Protéger mon compte</Text>}
      </Pressable>
      <Text style={styles.accountHint}>Retiens bien ton mot de passe : sans e-mail, il ne peut pas être récupéré.</Text>
    </View>
  );
}

// Suppression définitive du compte : il faut retaper son pseudo pour confirmer
function DeleteAccountSection() {
  const { username, deleteAccount } = useGameStore();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matches = !!username && typed.trim().toLowerCase() === username.toLowerCase();

  const handleDelete = async () => {
    if (!matches || busy) return;
    setBusy(true);
    setError(null);
    try {
      await deleteAccount();
    } catch {
      setError('Suppression impossible, vérifie ta connexion et réessaie.');
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <Pressable style={styles.deleteLink} onPress={() => setOpen(true)}>
        <Text style={styles.deleteLinkText}>Supprimer mon compte</Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.accountCard, styles.dangerCard]}>
      <Text style={[styles.accountTitle, styles.dangerTitle]}>🗑️ Supprimer mon compte</Text>
      <Text style={styles.accountText}>
        Ton profil, tes fragments, tes scores et tes amis seront effacés définitivement. Cette action est irréversible. Pour confirmer, tape ton pseudo « {username} ».
      </Text>
      <TextInput
        value={typed}
        onChangeText={setTyped}
        placeholder={username ?? ''}
        placeholderTextColor="#3a5a7a"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.confirmRow}>
        <Pressable style={[styles.secondaryButton, styles.flex]} onPress={() => { setOpen(false); setTyped(''); }} disabled={busy}>
          <Text style={styles.secondaryButtonText}>Annuler</Text>
        </Pressable>
        <Pressable style={[styles.dangerButton, styles.flex, !matches && styles.disabled]} onPress={handleDelete} disabled={!matches || busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Supprimer</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  roleBadge: {
    fontSize: 12,
    color: '#a78bfa',
    marginTop: 6,
  },
  adminButton: {
    marginTop: 14,
    alignSelf: 'stretch',
    backgroundColor: '#1e0d40',
    borderWidth: 1,
    borderColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  adminButtonText: {
    color: '#c4b5fd',
    fontSize: 14,
    fontWeight: '700',
  },
  deleteLink: {
    marginTop: 24,
    paddingVertical: 8,
  },
  deleteLinkText: {
    color: '#f87171',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  dangerCard: {
    borderColor: '#7f1d1d',
  },
  dangerTitle: {
    color: '#f87171',
  },
  screen: {
    flex: 1,
    backgroundColor: '#0c1521',
  },
  container: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
    alignSelf: 'stretch',
  },
  stat: {
    flex: 1,
    backgroundColor: '#090e18',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#141e2a',
    paddingVertical: 14,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#c4b5fd',
  },
  statLabel: {
    fontSize: 11,
    color: '#3a5a7a',
    marginTop: 4,
  },
  info: {
    fontSize: 13,
    color: '#7a9ab8',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 20,
  },
  detail: {
    fontSize: 11,
    color: '#3a5a7a',
    textAlign: 'center',
    marginTop: 12,
  },
  accountCard: {
    alignSelf: 'stretch',
    marginTop: 28,
    backgroundColor: '#090e18',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3b2a6b',
    padding: 16,
    gap: 10,
  },
  accountTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#c4b5fd',
  },
  accountText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#7a9ab8',
  },
  accountHint: {
    fontSize: 11,
    color: '#3a5a7a',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#0c1521',
    borderWidth: 1,
    borderColor: '#1a3050',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#fff',
  },
  error: {
    fontSize: 12,
    color: '#f87171',
  },
  primaryButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.4,
  },
  secondaryButton: {
    backgroundColor: '#162540',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#7a9ab8',
    fontSize: 14,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#991b1b',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmRow: {
    flexDirection: 'row',
    gap: 10,
  },
  flex: {
    flex: 1,
  },
});
