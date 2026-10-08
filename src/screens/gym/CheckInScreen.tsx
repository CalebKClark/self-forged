import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';

import { formatDayWorkoutMeta } from '../../lib/dayDuration';
import { hasCompletedGymOn } from '../../lib/gymLogic';
import { GymStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppProvider';
import { Card } from '../../ui/Card';
import { EmptyState } from '../../ui/Copy';
import { Screen } from '../../ui/Screen';
import { colors } from '../../ui/theme';

type Nav = NativeStackNavigationProp<GymStackParamList, 'CheckIn'>;

export function CheckInScreen() {
  const navigation = useNavigation<Nav>();
  const { state, today, startCheckIn } = useApp();
  const completedToday = hasCompletedGymOn(state, today);

  useEffect(() => {
    if (completedToday) {
      navigation.goBack();
    }
  }, [completedToday, navigation]);

  if (completedToday) {
    return null;
  }

  if (state.splitDays.length === 0) {
    return (
      <Screen>
        <EmptyState title="No split yet" body="Add days in View Split first, then check in." />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>What are you hitting today?</Text>
      <Text style={styles.sub}>Pick a split day to start.</Text>
      {state.splitDays.map((day) => {
        const empty = day.workouts.length === 0;
        return (
          <Card
            key={day.id}
            style={{ marginBottom: 10, opacity: empty ? 0.45 : 1 }}
            onPress={
              empty
                ? undefined
                : () => {
                    const session = startCheckIn(day.id);
                    if (session) {
                      navigation.replace('Session', { dayId: day.id });
                    }
                  }
            }
          >
            <Text style={styles.name}>{day.name}</Text>
            <Text style={styles.meta}>
              {empty ? 'Add workouts to this day first' : formatDayWorkoutMeta(day.workouts)}
            </Text>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  sub: { color: colors.muted, marginTop: 6, marginBottom: 16, fontSize: 16 },
  name: { color: colors.text, fontSize: 20, fontWeight: '800' },
  meta: { color: colors.muted, marginTop: 4, fontWeight: '600' },
});
