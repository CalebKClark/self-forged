import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { addDays, formatPercent } from '../../lib/dates';
import {
  dailyHabitsForDate,
  dailyProgress,
  describeSchedule,
  isCompleted,
  monthlyProgress,
  periodKeyFor,
  visibleHabits,
  weeklyProgress,
} from '../../lib/habitLogic';
import { TasksStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppProvider';
import { Habit, HabitScope } from '../../types';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { CircularProgress } from '../../ui/CircularProgress';
import { EmptyState, Kicker } from '../../ui/Copy';
import { PromptModal } from '../../ui/PromptModal';
import { Screen } from '../../ui/Screen';
import { colors } from '../../ui/theme';

type Nav = NativeStackNavigationProp<TasksStackParamList, 'TasksHome'>;
type TabKey = HabitScope;

export function TasksHomeScreen() {
  const navigation = useNavigation<Nav>();
  const { state, today, setHabitCompletion } = useApp();
  const [tab, setTab] = useState<TabKey>('daily');
  const [pending, setPending] = useState<{ habit: Habit; periodKey: string } | null>(null);
  const daily = dailyProgress(state, today);
  const weekly = weeklyProgress(state, today);
  const monthly = monthlyProgress(state, today);
  const yesterday = addDays(today, -1);

  const habits = useMemo(() => {
    if (tab === 'daily') {
      return dailyHabitsForDate(state, today);
    }
    return visibleHabits(state, tab, today);
  }, [state, tab, today]);

  const progress = tab === 'daily' ? daily : tab === 'weekly' ? weekly : monthly;
  const accent = tab === 'daily' ? colors.tasks : tab === 'weekly' ? colors.weekly : colors.monthly;
  const periodKey = periodKeyFor(tab, today);

  return (
    <Screen safeTop>
      <Kicker text="Daily Tasks" color={colors.tasks} />
      <Text style={styles.title}>Your daily habits</Text>
      <View style={styles.tabs}>
        {(['daily', 'weekly', 'monthly'] as TabKey[]).map((key) => (
          <Pressable key={key} onPress={() => setTab(key)} style={[styles.tab, tab === key && { borderColor: accent }]}>
            <Text style={[styles.tabText, tab === key && { color: accent }]}>
              {key === 'daily' ? 'Daily Goals' : key === 'weekly' ? 'Weekly Goals' : 'Monthly Goals'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.hero}>
        <CircularProgress
          progress={progress.percent}
          color={accent}
          value={progress.total === 0 ? '—' : `${progress.done}/${progress.total}`}
          label={formatPercent(progress.percent)}
          complete={progress.percent >= 100 && progress.total > 0}
        />
      </View>
      {progress.percent >= 100 && progress.total > 0 ? (
        <Text style={[styles.perfect, { color: accent }]}>100% — locked in.</Text>
      ) : null}

      <Button
        label="Create Habit"
        color={accent}
        onPress={() => navigation.navigate('CreateHabit', { scope: tab })}
        style={{ marginBottom: 14 }}
      />

      {tab === 'daily' ? (
        <Button
          label="Review yesterday"
          variant="secondary"
          onPress={() => navigation.navigate('DailyHistory', { date: yesterday })}
          style={{ marginBottom: 14 }}
        />
      ) : null}

      {habits.length === 0 ? (
        <EmptyState title="Nothing here yet" body="Create a habit to start tracking this period." />
      ) : (
        habits.map((habit) => {
          const done = isCompleted(state, habit.id, periodKey);
          const oneTime = habit.schedule?.type === 'oneTime';
          return (
            <Card key={habit.id} style={{ marginBottom: 10 }} accent={done ? accent : undefined}>
              <Pressable onPress={() => setPending({ habit, periodKey })}>
                <Text style={styles.habitName}>{habit.name}</Text>
                <Text style={styles.habitMeta}>
                  {describeSchedule(habit.schedule, habit.scope)}
                  {done ? ' · Done' : ''}
                </Text>
              </Pressable>
              {!oneTime || habit.scope !== 'daily' ? (
                <Pressable onPress={() => navigation.navigate('HabitDetail', { habitId: habit.id })}>
                  <Text style={[styles.link, { color: accent }]}>Stats</Text>
                </Pressable>
              ) : (
                <Pressable onPress={() => navigation.navigate('CreateHabit', { habitId: habit.id, scope: habit.scope })}>
                  <Text style={[styles.link, { color: accent }]}>Edit</Text>
                </Pressable>
              )}
            </Card>
          );
        })
      )}

      <PromptModal
        visible={pending !== null}
        title="Task completed?"
        confirmLabel="Yes"
        cancelLabel="No"
        confirmColor={accent}
        onCancel={() => {
          if (pending) {
            setHabitCompletion(pending.habit.id, pending.periodKey, false);
          }
          setPending(null);
        }}
        onConfirm={() => {
          if (pending) {
            setHabitCompletion(pending.habit.id, pending.periodKey, true);
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          setPending(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 32, fontWeight: '800', marginBottom: 14 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  tabText: { color: colors.muted, fontWeight: '800', fontSize: 11, textAlign: 'center' },
  hero: { alignItems: 'center', marginBottom: 8 },
  perfect: { textAlign: 'center', fontWeight: '800', marginBottom: 12, letterSpacing: 1 },
  habitName: { color: colors.text, fontSize: 18, fontWeight: '800' },
  habitMeta: { color: colors.muted, marginTop: 4 },
  link: { marginTop: 10, fontWeight: '800' },
});
