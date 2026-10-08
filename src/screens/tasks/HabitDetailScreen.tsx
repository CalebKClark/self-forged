import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert, StyleSheet, Text } from 'react-native';

import { describeSchedule, habitStats } from '../../lib/habitLogic';
import { formatPercent } from '../../lib/dates';
import { TasksStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppProvider';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { EmptyState } from '../../ui/Copy';
import { Screen } from '../../ui/Screen';
import { colors } from '../../ui/theme';

type Nav = NativeStackNavigationProp<TasksStackParamList, 'HabitDetail'>;
type Route = RouteProp<TasksStackParamList, 'HabitDetail'>;

export function HabitDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { habitId } = useRoute<Route>().params;
  const { state, deleteHabit } = useApp();
  const habit = state.habits.find((item) => item.id === habitId);

  if (!habit) {
    return (
      <Screen>
        <EmptyState title="This habit is gone." />
      </Screen>
    );
  }

  const oneTime = habit.schedule?.type === 'oneTime';
  const stats = habitStats(state, habit);

  return (
    <Screen>
      <Text style={styles.name}>{habit.name}</Text>
      <Text style={styles.meta}>{describeSchedule(habit.schedule, habit.scope)}</Text>
      {!oneTime ? (
        <Card style={{ marginTop: 16 }}>
          <Text style={styles.stat}>You completed this habit {stats.completed} times</Text>
          <Text style={styles.stat}>You complete this habit {formatPercent(stats.percent)} of the time</Text>
          <Text style={styles.big}>
            {stats.completed} / {stats.opportunities}
          </Text>
        </Card>
      ) : (
        <Text style={[styles.meta, { marginTop: 16 }]}>One-time habits do not have recurring statistics.</Text>
      )}
      <Button
        label="Edit habit"
        color={colors.tasks}
        onPress={() => navigation.navigate('CreateHabit', { habitId: habit.id, scope: habit.scope })}
        style={{ marginTop: 16 }}
      />
      <Button
        label="Delete habit"
        variant="ghost"
        color={colors.danger}
        onPress={() =>
          Alert.alert('Delete this habit?', 'History and statistics will be kept.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => {
                deleteHabit(habit.id);
                navigation.goBack();
              },
            },
          ])
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { color: colors.text, fontSize: 28, fontWeight: '800' },
  meta: { color: colors.muted, marginTop: 6, fontSize: 15 },
  stat: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 8 },
  big: { color: colors.tasks, fontSize: 28, fontWeight: '800', marginTop: 8 },
});
