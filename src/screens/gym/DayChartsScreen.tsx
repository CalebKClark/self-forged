import { RouteProp, useRoute } from '@react-navigation/native';
import { StyleSheet, Text } from 'react-native';

import { GymStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppProvider';
import { EmptyState } from '../../ui/Copy';
import { Screen } from '../../ui/Screen';
import { WeightChart } from '../../ui/WeightChart';
import { colors } from '../../ui/theme';

type Route = RouteProp<GymStackParamList, 'DayCharts'>;

export function DayChartsScreen() {
  const { dayId } = useRoute<Route>().params;
  const { state } = useApp();
  const day = state.splitDays.find((item) => item.id === dayId);

  if (!day) {
    return (
      <Screen>
        <EmptyState title="This day was deleted." />
      </Screen>
    );
  }

  if (day.workouts.length === 0) {
    return (
      <Screen>
        <EmptyState title="No workouts on this day yet." />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>{day.name}</Text>
      {day.workouts.map((workout) => {
        const points = state.workoutHistory
          .filter((point) => point.dayId === dayId && point.workoutId === workout.id)
          .map((point) => ({
            id: point.id,
            date: point.date,
            weight: point.weight,
            increased: point.increased,
          }));
        return (
          <WeightChart
            key={workout.id}
            title={workout.name}
            points={points}
            accent={colors.gym}
            emptyText="No data yet!"
          />
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 24, fontWeight: '800', marginBottom: 16 },
});
