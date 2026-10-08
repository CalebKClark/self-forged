import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, Text } from 'react-native';

import { completedGymDates } from '../../lib/gymLogic';
import { formatLongDate } from '../../lib/dates';
import { GymStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppProvider';
import { Button } from '../../ui/Button';
import { CalendarMonth } from '../../ui/CalendarMonth';
import { Card } from '../../ui/Card';
import { EmptyState } from '../../ui/Copy';
import { Screen } from '../../ui/Screen';
import { colors } from '../../ui/theme';

type Nav = NativeStackNavigationProp<GymStackParamList, 'Stats'>;

export function StatsScreen() {
  const navigation = useNavigation<Nav>();
  const { state } = useApp();
  const now = new Date();
  const completed = completedGymDates(state);

  if (completed.size === 0) {
    return (
      <Screen>
        <EmptyState title="No completed workouts saved yet." />
        <Button label="Past months" variant="secondary" onPress={() => navigation.navigate('PastMonths')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Card style={{ marginBottom: 16 }}>
        <CalendarMonth
          year={now.getFullYear()}
          monthIndex={now.getMonth()}
          completedDates={completed}
          accent={colors.gym}
        />
      </Card>
      <Button
        label="View past months"
        variant="secondary"
        onPress={() => navigation.navigate('PastMonths')}
        style={{ marginBottom: 16 }}
      />
      {state.splitDays.map((day) => {
        const hits = state.gymVisits.filter((visit) => visit.completed && visit.dayId === day.id);
        const last = hits.map((item) => item.date).sort().slice(-1)[0];
        return (
          <Card key={day.id} style={{ marginBottom: 10 }} onPress={() => navigation.navigate('DayCharts', { dayId: day.id })}>
            <Text style={styles.name}>{day.name}</Text>
            <Text style={styles.meta}>
              {hits.length === 1 ? '1 time worked out' : `${hits.length} times worked out`}
            </Text>
            <Text style={styles.meta}>Last hit: {last ? formatLongDate(last) : 'never'}</Text>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { color: colors.text, fontSize: 18, fontWeight: '800' },
  meta: { color: colors.muted, marginTop: 4, fontWeight: '600' },
});
