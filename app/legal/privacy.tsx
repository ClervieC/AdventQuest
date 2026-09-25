import { router } from 'expo-router';
import { LegalView } from '../../components/Legal';

// Accessible sans être connecté (voir StartupGate) : adresse à donner aux stores
export default function PrivacyScreen() {
  return <LegalView kind="privacy" onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} />;
}
