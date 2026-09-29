import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LanguageToggle } from '../../components/LanguageToggle';
import { LegalLinks } from '../../components/Legal';
import { SurveyInvite } from '../../components/SurveyInvite';
import { ApiError } from '../../services/api';
import { Localized, useI18n } from '../../services/i18n';
import { pageColumn } from '../../constants/layout';
import { FRAGMENT_THRESHOLD, useGameStore } from '../../store/gameStore';

const MIN_PASSWORD_LENGTH = 6;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { tr, locale } = useI18n();
  const { username, timezone, hints, days, totalFragments, role, testerDays } = useGameStore();
  const fragments = totalFragments();
  const totalScore = Object.values(days).reduce((sum, day) => sum + day.bestScore, 0);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.container, pageColumn(20), { paddingTop: insets.top + 24 }]}>
      <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>{username ?? tr('Gardien des Fêtes', 'Keeper of the Holidays')}</Text>
      {role !== 'player' && (
        <Text style={styles.roleBadge}>
          {role === 'admin'
            ? tr('🛠️ Administrateur', '🛠️ Administrator')
            : tr(
                `🧪 Testeur · ${testerDays.length} jour${testerDays.length > 1 ? 's' : ''} ouvert${testerDays.length > 1 ? 's' : ''} en avance`,
                `🧪 Tester · ${testerDays.length} day${testerDays.length === 1 ? '' : 's'} open early`
              )}
        </Text>
      )}
      {role === 'admin' && (
        <Pressable style={styles.adminButton} onPress={() => router.push('/admin')}>
          <Text style={styles.adminButtonText}>{tr('🛠️ Administration : utilisateurs et retours', '🛠️ Admin: users and feedback')}</Text>
        </Pressable>
      )}

      <View style={styles.stats}>
        <Stat value={`${fragments} / 24`} label={tr('fragments', 'shards')} />
        <Stat value={totalScore.toLocaleString(locale)} label="points" />
        <Stat value={`${hints}`} label="hints" />
      </View>

      <Text style={styles.info}>
        {fragments >= FRAGMENT_THRESHOLD
          ? tr('✅ Le portail du boss s’ouvrira pour toi le jour 24.', '✅ The boss portal will open for you on day 24.')
          : tr(
              `Encore ${FRAGMENT_THRESHOLD - fragments} fragment${FRAGMENT_THRESHOLD - fragments > 1 ? 's' : ''} pour pouvoir affronter Grimnoir le jour 24.`,
              `${FRAGMENT_THRESHOLD - fragments} more shard${FRAGMENT_THRESHOLD - fragments === 1 ? '' : 's'} to be able to face Grimnoir on day 24.`
            )}
      </Text>
      {timezone && (
        <Text style={styles.detail}>
          {tr(`Une nouvelle case s'ouvre chaque jour à minuit (${timezone}).`, `A new door opens every day at midnight (${timezone}).`)}
        </Text>
      )}

      <View style={styles.survey}>
        <SurveyInvite place="profile" />
      </View>

      <View style={styles.languageCard}>
        <Text style={styles.languageTitle}>{tr('🌍 Langue', '🌍 Language')}</Text>
        <LanguageToggle />
      </View>

      <AccountSection />
      <DeleteAccountSection />
      <LegalLinks onOpen={(kind) => router.push(`/legal/${kind}`)} />
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

const ACCOUNT_ERRORS: Partial<Record<string, Localized>> = {
  weak_password: {
    fr: `Mot de passe trop faible : au moins ${MIN_PASSWORD_LENGTH} caractères.`,
    en: `Password too weak: at least ${MIN_PASSWORD_LENGTH} characters.`,
  },
  email_confirmation_enabled: {
    fr: 'La protection des comptes n’est pas encore activée sur le serveur (réglage « Confirm email » à désactiver dans Supabase).',
    en: 'Account protection isn’t enabled on the server yet (the “Confirm email” setting must be turned off in Supabase).',
  },
};

// Compte : protéger par un mot de passe (pour jouer sur plusieurs appareils), ou se déconnecter
function AccountSection() {
  const { username, hasAccount, passwordSetupFailed, protectAccount, logout } = useGameStore();
  const { tr, l } = useI18n();
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
      const known = ACCOUNT_ERRORS[code];
      setError(known ? l(known) : tr('Impossible d’enregistrer le mot de passe, vérifie ta connexion.', 'Couldn’t save the password, check your connection.'));
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
        <Text style={styles.accountTitle}>{tr('🔒 Compte protégé', '🔒 Protected account')}</Text>
        <Text style={styles.accountText}>
          {tr(
            `Sur un autre téléphone ou ordinateur, choisis « J’ai déjà un compte » et connecte-toi avec le pseudo « ${username} » et ton mot de passe.`,
            `On another phone or computer, choose “I already have an account” and log in with the username “${username}” and your password.`
          )}
        </Text>
        {!confirmLogout ? (
          <Pressable style={styles.secondaryButton} onPress={() => setConfirmLogout(true)}>
            <Text style={styles.secondaryButtonText}>{tr('Se déconnecter', 'Log out')}</Text>
          </Pressable>
        ) : (
          <View style={styles.confirmRow}>
            <Pressable style={[styles.secondaryButton, styles.flex]} onPress={() => setConfirmLogout(false)} disabled={busy}>
              <Text style={styles.secondaryButtonText}>{tr('Annuler', 'Cancel')}</Text>
            </Pressable>
            <Pressable style={[styles.dangerButton, styles.flex]} onPress={handleLogout} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{tr('Oui, me déconnecter', 'Yes, log me out')}</Text>}
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.accountCard}>
      <Text style={styles.accountTitle}>{tr('🔓 Protéger mon compte', '🔓 Protect my account')}</Text>
      {passwordSetupFailed && (
        <Text style={styles.error}>
          {tr('Ton mot de passe n’a pas pu être enregistré à l’inscription : choisis-le à nouveau ici.', 'Your password couldn’t be saved when you signed up: choose it again here.')}
        </Text>
      )}
      <Text style={styles.accountText}>
        {tr(
          'Pour l’instant, ta progression n’existe que sur cet appareil. Choisis un mot de passe pour jouer sur ton téléphone et ton ordinateur, ou changer de téléphone sans rien perdre.',
          'For now, your progress only exists on this device. Choose a password to play on your phone and your computer, or switch phones without losing anything.'
        )}
      </Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder={tr(`Mot de passe (${MIN_PASSWORD_LENGTH} caractères min.)`, `Password (at least ${MIN_PASSWORD_LENGTH} characters)`)}
        placeholderTextColor="#8ea6c0"
        secureTextEntry
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        value={confirmation}
        onChangeText={setConfirmation}
        onSubmitEditing={handleProtect}
        placeholder={tr('Confirme le mot de passe', 'Confirm your password')}
        placeholderTextColor="#8ea6c0"
        secureTextEntry
        autoCapitalize="none"
        style={styles.input}
      />
      {mismatch && <Text style={styles.error}>{tr('Les deux mots de passe ne sont pas identiques.', 'The two passwords don’t match.')}</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={[styles.primaryButton, !canProtect && styles.disabled]} onPress={handleProtect} disabled={!canProtect}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{tr('🔒 Protéger mon compte', '🔒 Protect my account')}</Text>}
      </Pressable>
      <Text style={styles.accountHint}>{tr('Retiens bien ton mot de passe : sans e-mail, il ne peut pas être récupéré.', 'Remember your password well: without an email, it can’t be recovered.')}</Text>
    </View>
  );
}

// Suppression définitive du compte : il faut retaper son pseudo pour confirmer
function DeleteAccountSection() {
  const { username, deleteAccount } = useGameStore();
  const { tr } = useI18n();
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
      setError(tr('Suppression impossible, vérifie ta connexion et réessaie.', 'Couldn’t delete, check your connection and try again.'));
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <Pressable style={styles.deleteLink} onPress={() => setOpen(true)}>
        <Text style={styles.deleteLinkText}>{tr('Supprimer mon compte', 'Delete my account')}</Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.accountCard, styles.dangerCard]}>
      <Text style={[styles.accountTitle, styles.dangerTitle]}>{tr('🗑️ Supprimer mon compte', '🗑️ Delete my account')}</Text>
      <Text style={styles.accountText}>
        {tr(
          `Ton profil, tes fragments, tes scores et tes amis seront effacés définitivement. Cette action est irréversible. Pour confirmer, tape ton pseudo « ${username} ».`,
          `Your profile, shards, scores and friends will be permanently erased. This can’t be undone. To confirm, type your username “${username}”.`
        )}
      </Text>
      <TextInput
        value={typed}
        onChangeText={setTyped}
        placeholder={username ?? ''}
        placeholderTextColor="#8ea6c0"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.confirmRow}>
        <Pressable style={[styles.secondaryButton, styles.flex]} onPress={() => { setOpen(false); setTyped(''); }} disabled={busy}>
          <Text style={styles.secondaryButtonText}>{tr('Annuler', 'Cancel')}</Text>
        </Pressable>
        <Pressable style={[styles.dangerButton, styles.flex, !matches && styles.disabled]} onPress={handleDelete} disabled={!matches || busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{tr('Supprimer', 'Delete')}</Text>}
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
  languageCard: {
    alignSelf: 'stretch',
    marginTop: 20,
    gap: 10,
  },
  languageTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#c4b5fd',
    textAlign: 'center',
  },
  survey: {
    alignSelf: 'stretch',
    marginTop: 20,
  },
  adminButton: {
    marginTop: 14,
    alignSelf: 'stretch',
    backgroundColor: '#2e1a5c',
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
    backgroundColor: '#16233a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2c4262',
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
    color: '#8ea6c0',
    marginTop: 4,
  },
  info: {
    fontSize: 13,
    color: '#b7c8da',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 20,
  },
  detail: {
    fontSize: 11,
    color: '#8ea6c0',
    textAlign: 'center',
    marginTop: 12,
  },
  accountCard: {
    alignSelf: 'stretch',
    marginTop: 28,
    backgroundColor: '#16233a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#5b45a0',
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
    color: '#b7c8da',
  },
  accountHint: {
    fontSize: 11,
    color: '#8ea6c0',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#0c1521',
    borderWidth: 1,
    borderColor: '#3a5a82',
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
    backgroundColor: '#243a5a',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#b7c8da',
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
