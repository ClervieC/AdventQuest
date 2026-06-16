import { Image, StyleSheet, Text, View } from 'react-native';
import { useGameStore } from '../../store/gameStore';

export default function ProfileScreen() {
  const { hints, totalFragments } = useGameStore();

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Mon profil</Text>
      <Text style={styles.stat}>{totalFragments()} / 24 fragments</Text>
      <Text style={styles.stat}>{hints} hints disponibles</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c1521',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  stat: {
    fontSize: 13,
    color: '#7a9ab8',
    marginTop: 8,
  },
});