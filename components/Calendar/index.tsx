import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { DAYS_CONFIG } from '../../constants/days';
import { ZONES } from '../../constants/zones';
import { playSfx } from '../../services/sfx';
import { useGameStore } from '../../store/gameStore';
import { DayCell } from '../DayCell';

export function Calendar() {
  const { currentDay, days, canTest } = useGameStore();

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
                  : canTest(config.day)
                  ? 'test'
                  : 'locked';

                return (
                  <View key={config.day} style={styles.cellWrapper}>
                    <DayCell
                      day={config.day}
                      icon={config.fragmentIcon}
                      status={status}
                      isGolden={config.day === 24}
                      bestScore={dayState?.bestScore}
                      onOpenStart={() => playSfx('open')}
                      onOpen={() => router.push(`/game/${config.day}`)}
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
    backgroundColor: '#221647',
    borderColor: '#5b45a0',
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
    color: '#8ea6c0',
  },
  zoneDays: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: '#8ea6c0',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  zoneBanner: {
    fontSize: 12,
    lineHeight: 18,
    color: '#bcb2e3',
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
