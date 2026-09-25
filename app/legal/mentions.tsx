import { router } from 'expo-router';
import { LegalView } from '../../components/Legal';

// Accessible sans être connecté (voir StartupGate)
export default function MentionsScreen() {
  return <LegalView kind="mentions" onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} />;
}
