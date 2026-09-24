import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { DAYS_CONFIG } from '../../constants/days';
import { ZONES } from '../../constants/zones';
import { useSoundEffect } from '../../hooks/use-sound-effect';
import { useGameStore } from '../../store/gameStore';
import { DayCell } from '../DayCell';

export function Calendar() {
  const { currentDay, days, isLocked } = useGameStore();
  const playOpenSound = useSoundEffect(require('../../assets/sounds/open.wav'));

  const handleDayPress = (day: number) => {
    if (isLocked(day)) {
      // on gérera le shake + message en étape 1.6
      return;
    }
    playOpenSound();
    router.push(`/game/${day}`);
  };

  return (
    <View style={styles.container}>
      {ZONES.map((zone) => {
        const zoneDays = DAYS_CONFIG.filter((config) => config.day >= zone.firstDay && config.day <= zone.lastDay);
        const isCurrentZone = currentDay >= zone.firstDay && currentDay <= zone.lastDay;
        const isFutureZone = currentDay < zone.firstDay;

        return (
          <View key={zone.id} style={styles.zone}>
            <View style={[styles.zoneHeader, isCurrentZone && styles.zoneHeaderCurrent]}>
              <Text style={[styles.zoneName, isFutureZone && styles.zoneNameFuture]}>
                {zone.icon} {zone.name}
              </Text>
              <Text style={styles.zoneDays}>
                {zone.firstDay === zone.lastDay ? `Jour ${zone.firstDay}` : `Jours ${zone.firstDay}–${zone.lastDay}`}
              </Text>
              {/* Le texte narratif n'est affiché que pour la zone en cours, pour ne rien dévoiler de la suite */}
              {isCurrentZone && <Text style={styles.zoneBanner}>{zone.banner}</Text>}
            </View>

            <View style={styles.grid}>
              {zoneDays.map((config) => {
                const dayState = days[config.day];
                const status = dayState?.fragmentWon
                  ? 'done'
                  : config.day === currentDay
                  ? 'today'
                  : config.day < currentDay
                  ? 'missed'
                  : 'locked';

                return (
                  <View key={config.day} style={styles.cellWrapper}>
                    <DayCell
                      day={config.day}
                      icon={config.fragmentIcon}
                      status={status}
                      isGolden={config.day === 24}
                      bestScore={dayState?.bestScore}
                      onPress={() => handleDayPress(config.day)}
                    />
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingBottom: 24,
    gap: 18,
  },
  zone: {
    gap: 8,
  },
  zoneHeader: {
    paddingHorizontal: 4,
  },
  zoneHeaderCurrent: {
    backgroundColor: '#130d2a',
    borderColor: '#3b2a6b',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  zoneName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#c4b5fd',
  },
  zoneNameFuture: {
    color: '#3a5a7a',
  },
  zoneDays: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: '#3a5a7a',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  zoneBanner: {
    fontSize: 12,
    lineHeight: 18,
    color: '#8a7ab8',
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  cellWrapper: {
    width: '23%', // 4 colonnes avec gap
  },
});
