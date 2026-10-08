import { RouteProp, useRoute } from '@react-navigation/native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { canEditDailyDate, dailyHabitsForDate, isCompleted } from '../../lib/habitLogic';
import { formatLongDate } from '../../lib/dates';
import { TasksStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppProvider';
import { Habit } from '../../types';
import { Card } from '../../ui/Card';
import { EmptyState } from '../../ui/Copy';
import { PromptModal } from '../../ui/PromptModal';
import { Screen } from '../../ui/Screen';
import { colors } from '../../ui/theme';

type Route = RouteProp<TasksStackParamList, 'DailyHistory'>;

export function DailyHistoryScreen() {
  const { date } = useRoute<Route>().params;
  const { state, today, setHabitCompletion } = useApp();
  const editable = canEditDailyDate(date, today);
  const habits = dailyHabitsForDate(state, date);
  const [pending, setPending] = useState<Habit | null>(null);

  return (
    <Screen>
      <Text style={styles.title}>{formatLongDate(date)}</Text>
      {!editable ? (
        <Text style={styles.lock}>The one-day correction window has closed for this date.</Text>
      ) : (
        <Text style={styles.lock}>You can still correct yesterday’s Daily Goals.</Text>
      )}
      {habits.length === 0 ? (
        <EmptyState title="No Daily Goals were scheduled this day." />
      ) : (
        habits.map((habit) => {
          const done = isCompleted(state, habit.id, date);
          return (
            <Card key={habit.id} style={{ marginBottom: 10 }}>
              <Pressable disabled={!editable} onPress={() => setPending(habit)}>
                <Text style={styles.name}>{habit.name}</Text>
                <Text style={styles.meta}>{done ? 'Completed' : 'Not completed'}</Text>
              </Pressable>
            </Card>
          );
        })
      )}
      <PromptModal
        visible={pending !== null}
        title="Task completed?"
        confirmLabel="Yes"
        cancelLabel="No"
        confirmColor={colors.tasks}
        onCancel={() => {
          if (pending) {
            setHabitCompletion(pending.id, date, false);
          }
          setPending(null);
        }}
        onConfirm={() => {
          if (pending) {
            setHabitCompletion(pending.id, date, true);
          }
          setPending(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 24, fontWeight: '800', marginBottom: 8 },
  lock: { color: colors.muted, marginBottom: 16, lineHeight: 20 },
  name: { color: colors.text, fontSize: 18, fontWeight: '800' },
  meta: { color: colors.muted, marginTop: 4 },
});
