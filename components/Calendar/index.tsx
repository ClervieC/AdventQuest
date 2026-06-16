import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { DAYS_CONFIG } from '../../constants/days';
import { useGameStore } from '../../store/gameStore';
import { DayCell } from '../DayCell';

export function Calendar() {
  const { currentDay, days, isLocked } = useGameStore();

  const handleDayPress = (day: number) => {
    if (isLocked(day)) {
      // on gérera le shake + message en étape 1.6
      return;
    }
    router.push(`/game/${day}`);
  };

  return (
    <View style={styles.grid}>
      {DAYS_CONFIG.map((config) => {
        const dayState = days[config.day];
        const status = dayState?.fragmentWon
          ? 'done'
          : config.day === currentDay
          ? 'today'
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
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 7,
  },
  cellWrapper: {
    width: '23%', // 4 colonnes avec gap
  },
});