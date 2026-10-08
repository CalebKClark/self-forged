import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLayoutEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DailySchedule, HabitScope } from '../../types';
import { TasksStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppProvider';
import { Button } from '../../ui/Button';
import { FieldInput } from '../../ui/FieldInput';
import { Screen } from '../../ui/Screen';
import { colors } from '../../ui/theme';

type Nav = NativeStackNavigationProp<TasksStackParamList, 'CreateHabit'>;
type Route = RouteProp<TasksStackParamList, 'CreateHabit'>;

const WEEKDAYS = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
];

export function CreateHabitScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { createHabit, updateHabit, state } = useApp();
  const existing = state.habits.find((habit) => habit.id === route.params?.habitId);
  const scope: HabitScope = existing?.scope ?? route.params?.scope ?? 'daily';
  const [name, setName] = useState(existing?.name ?? '');
  const [mode, setMode] = useState<string>(existing ? scheduleMode(existing.schedule) : 'everyDay');
  const [except, setExcept] = useState<number[]>(
    existing?.schedule?.type === 'dailyExcept' ? existing.schedule.weekdays : []
  );
  const [weekday, setWeekday] = useState(
    existing?.schedule?.type === 'weekday' ? existing.schedule.weekday : 1
  );
  const [oneDate, setOneDate] = useState(
    existing?.schedule?.type === 'oneTime' ? existing.schedule.date : ''
  );
  const [monthDay, setMonthDay] = useState(
    existing?.schedule?.type === 'dayOfMonth' ? String(existing.schedule.day) : '1'
  );
  const [recurring, setRecurring] = useState(existing?.recurring ?? true);

  useLayoutEffect(() => {
    navigation.setOptions({ title: existing ? 'Edit Habit' : 'Create Habit' });
  }, [existing, navigation]);

  function buildSchedule(): DailySchedule | null {
    if (scope !== 'daily') {
      return null;
    }
    if (mode === 'everyDay') {
      return { type: 'everyDay' };
    }
    if (mode === 'weekdays') {
      return { type: 'weekdays' };
    }
    if (mode === 'weekends') {
      return { type: 'weekends' };
    }
    if (mode === 'dailyExcept') {
      return { type: 'dailyExcept', weekdays: except };
    }
    if (mode.startsWith('weekday-')) {
      return { type: 'weekday', weekday: Number(mode.split('-')[1]) };
    }
    if (mode === 'weekday') {
      return { type: 'weekday', weekday };
    }
    if (mode === 'oneTime') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(oneDate)) {
        return null;
      }
      return { type: 'oneTime', date: oneDate };
    }
    const day = Number(monthDay);
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      return null;
    }
    return { type: 'dayOfMonth', day };
  }

  const schedule = buildSchedule();
  const canSave =
    name.trim().length > 0 && (scope !== 'daily' || schedule !== null);

  return (
    <Screen>
      <FieldInput label="Habit name" placeholder="e.g. Read 20 minutes" value={name} onChangeText={setName} />
      {scope === 'daily' ? (
        <>
          <Text style={styles.label}>Schedule</Text>
          {option('everyDay', 'Every day', mode, setMode)}
          {option('weekdays', 'Weekdays (Mon–Fri)', mode, setMode)}
          {option('weekends', 'Weekends', mode, setMode)}
          {option('dailyExcept', 'Every day except selected weekdays', mode, setMode)}
          {WEEKDAYS.map((day) => option(`weekday-${day.value}`, `Every ${day.label}`, mode, setMode))}
          {option('oneTime', 'One-time habit on a specific date', mode, setMode)}
          {option('dayOfMonth', 'Specific day of the month (1–31)', mode, setMode)}
          {mode === 'dailyExcept' ? (
            <View style={styles.except}>
              {WEEKDAYS.map((day) => {
                const on = except.includes(day.value);
                return (
                  <Pressable
                    key={day.value}
                    onPress={() =>
                      setExcept((current) =>
                        on ? current.filter((item) => item !== day.value) : [...current, day.value]
                      )
                    }
                    style={[styles.chip, on && styles.chipOn]}
                  >
                    <Text style={styles.chipText}>{day.label.slice(0, 3)}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          {mode === 'oneTime' ? (
            <FieldInput
              label="Date (YYYY-MM-DD)"
              placeholder="e.g. 2026-09-20"
              value={oneDate}
              onChangeText={setOneDate}
            />
          ) : null}
          {mode === 'dayOfMonth' ? (
            <FieldInput
              label="Day of month"
              placeholder="1-31"
              keyboardType="number-pad"
              value={monthDay}
              onChangeText={setMonthDay}
            />
          ) : null}
        </>
      ) : (
        <>
          <Text style={styles.label}>{scope === 'weekly' ? 'This week or every week?' : 'This month or every month?'}</Text>
          <Pressable onPress={() => setRecurring(true)} style={[styles.choice, recurring && styles.choiceOn]}>
            <Text style={styles.choiceText}>{scope === 'weekly' ? 'Every week' : 'Every month'}</Text>
          </Pressable>
          <Pressable onPress={() => setRecurring(false)} style={[styles.choice, !recurring && styles.choiceOn]}>
            <Text style={styles.choiceText}>{scope === 'weekly' ? 'Just this week' : 'Just this month'}</Text>
          </Pressable>
        </>
      )}
      <Button
        label={existing ? 'Save changes' : 'Create Habit'}
        color={colors.tasks}
        disabled={!canSave}
        onPress={() => {
          if (!canSave) {
            return;
          }
          if (existing) {
            updateHabit(existing.id, { name: name.trim(), schedule, recurring });
          } else {
            createHabit({ name: name.trim(), scope, schedule, recurring });
          }
          navigation.goBack();
        }}
      />
    </Screen>
  );
}

function option(value: string, label: string, mode: string, setMode: (value: string) => void) {
  const on = mode === value;
  return (
    <Pressable key={value} onPress={() => setMode(value)} style={[styles.choice, on && styles.choiceOn]}>
      <Text style={styles.choiceText}>{label}</Text>
    </Pressable>
  );
}

function scheduleMode(schedule: DailySchedule | null): string {
  if (!schedule) {
    return 'everyDay';
  }
  if (schedule.type === 'weekday') {
    return `weekday-${schedule.weekday}`;
  }
  return schedule.type;
}

const styles = StyleSheet.create({
  label: {
    color: colors.muted,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontSize: 12,
    marginBottom: 8,
    marginTop: 8,
  },
  choice: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  choiceOn: { borderColor: colors.tasks },
  choiceText: { color: colors.text, fontWeight: '700' },
  except: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { borderColor: colors.tasks },
  chipText: { color: colors.text, fontWeight: '700' },
});
