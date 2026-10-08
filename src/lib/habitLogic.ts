import { AppState, DailySchedule, Habit, HabitCompletion, HabitScope } from '../types';
import {
  addDays,
  daysInMonth,
  eachDate,
  localDateKey,
  mondayKeyFromDateKey,
  monthKey,
  parseDateKey,
  weekdayFromDateKey,
} from './dates';

export function isDailyScheduled(schedule: DailySchedule, date: string): boolean {
  const weekday = weekdayFromDateKey(date);
  switch (schedule.type) {
    case 'everyDay':
      return true;
    case 'weekdays':
      return weekday >= 1 && weekday <= 5;
    case 'weekends':
      return weekday === 0 || weekday === 6;
    case 'dailyExcept':
      return !schedule.weekdays.includes(weekday);
    case 'weekday':
      return weekday === schedule.weekday;
    case 'oneTime':
      return date === schedule.date;
    case 'dayOfMonth': {
      const parsed = parseDateKey(date);
      const last = daysInMonth(parsed.getFullYear(), parsed.getMonth());
      const target = Math.min(schedule.day, last);
      return parsed.getDate() === target;
    }
    default:
      return false;
  }
}

export function scheduleForDate(habit: Habit, date: string): DailySchedule | null {
  if (habit.scope !== 'daily') {
    return habit.schedule;
  }
  const period = habit.scheduleHistory.find(
    (item) => item.from <= date && (item.to === null || item.to >= date)
  );
  return period?.schedule ?? habit.schedule;
}

export function isHabitActiveOn(habit: Habit, date: string): boolean {
  if (habit.createdOn > date) {
    return false;
  }
  if (habit.deletedOn && habit.deletedOn <= date) {
    return false;
  }
  if (habit.scope === 'daily') {
    const schedule = scheduleForDate(habit, date);
    if (!schedule) {
      return false;
    }
    if (schedule.type === 'oneTime') {
      return date === schedule.date;
    }
    return isDailyScheduled(schedule, date);
  }
  if (!habit.recurring) {
    if (habit.scope === 'weekly') {
      return mondayKeyFromDateKey(habit.createdOn) === mondayKeyFromDateKey(date);
    }
    return monthKey(habit.createdOn) === monthKey(date);
  }
  return true;
}

export function dailyHabitsForDate(state: AppState, date: string): Habit[] {
  return visibleHabits(state, 'daily').filter((habit) => isHabitActiveOn(habit, date));
}

export function visibleHabits(state: AppState, scope: HabitScope, today: string = localDateKey()): Habit[] {
  return state.habits.filter((habit) => {
    if (habit.scope !== scope) {
      return false;
    }
    if (habit.deletedOn) {
      return false;
    }
    if (scope === 'daily' && habit.schedule?.type === 'oneTime' && habit.schedule.date < today) {
      return false;
    }
    if (!habit.recurring) {
      if (scope === 'weekly' && mondayKeyFromDateKey(habit.createdOn) !== mondayKeyFromDateKey(today)) {
        return false;
      }
      if (scope === 'monthly' && monthKey(habit.createdOn) !== monthKey(today)) {
        return false;
      }
    }
    return true;
  });
}

export function periodKeyFor(scope: HabitScope, date: string): string {
  if (scope === 'daily') {
    return date;
  }
  if (scope === 'weekly') {
    return mondayKeyFromDateKey(date);
  }
  return monthKey(date);
}

export function completionFor(state: AppState, habitId: string, periodKey: string): HabitCompletion | undefined {
  return state.completions.find((item) => item.habitId === habitId && item.periodKey === periodKey);
}

export function isCompleted(state: AppState, habitId: string, periodKey: string): boolean {
  return completionFor(state, habitId, periodKey)?.completed === true;
}

export function dailyProgress(state: AppState, date: string): { done: number; total: number; percent: number } {
  const habits = dailyHabitsForDate(state, date);
  const total = habits.length;
  const done = habits.filter((habit) => isCompleted(state, habit.id, date)).length;
  return { done, total, percent: total === 0 ? 0 : (done / total) * 100 };
}

export function isDailyDaySuccessful(state: AppState, date: string): boolean {
  const habits = dailyHabitsForDate(state, date);
  if (habits.length === 0) {
    return false;
  }
  return habits.every((habit) => isCompleted(state, habit.id, date));
}

export function hasDailyRequirements(state: AppState, date: string): boolean {
  return dailyHabitsForDate(state, date).length > 0;
}

export function weeklyProgress(state: AppState, date: string = localDateKey()): {
  done: number;
  total: number;
  percent: number;
} {
  const weekStart = mondayKeyFromDateKey(date);
  const habits = visibleHabits(state, 'weekly', date).filter((habit) => isHabitActiveOn(habit, date));
  const total = habits.length;
  const done = habits.filter((habit) => isCompleted(state, habit.id, weekStart)).length;
  return { done, total, percent: total === 0 ? 0 : (done / total) * 100 };
}

export function monthlyProgress(state: AppState, date: string = localDateKey()): {
  done: number;
  total: number;
  percent: number;
} {
  const key = monthKey(date);
  const habits = visibleHabits(state, 'monthly', date).filter((habit) => isHabitActiveOn(habit, date));
  const total = habits.length;
  const done = habits.filter((habit) => isCompleted(state, habit.id, key)).length;
  return { done, total, percent: total === 0 ? 0 : (done / total) * 100 };
}

export function isWeeklyWeekSuccessful(state: AppState, weekStart: string): boolean {
  const sample = weekStart;
  const habits = state.habits.filter(
    (habit) => habit.scope === 'weekly' && isHabitActiveOn(habit, sample)
  );
  if (habits.length === 0) {
    return false;
  }
  return habits.every((habit) => isCompleted(state, habit.id, weekStart));
}

export function isMonthlyMonthSuccessful(state: AppState, yearMonth: string): boolean {
  const sample = `${yearMonth}-15`;
  const habits = state.habits.filter(
    (habit) => habit.scope === 'monthly' && isHabitActiveOn(habit, sample)
  );
  if (habits.length === 0) {
    return false;
  }
  return habits.every((habit) => isCompleted(state, habit.id, yearMonth));
}

export function firstDailyOpportunity(state: AppState): string | null {
  const dates = state.habits
    .filter((habit) => habit.scope === 'daily')
    .map((habit) => habit.createdOn)
    .sort();
  return dates[0] ?? null;
}

export function computeDailyStreak(
  state: AppState,
  today: string = localDateKey()
): { current: number; best: number } {
  const start = firstDailyOpportunity(state);
  if (!start) {
    return { current: 0, best: 0 };
  }
  const todaySuccess = hasDailyRequirements(state, today) && isDailyDaySuccessful(state, today);
  const lastCounted = todaySuccess ? today : addDays(today, -1);
  if (lastCounted < start) {
    return { current: 0, best: 0 };
  }
  let streak = 0;
  let best = 0;
  for (const date of eachDate(start, lastCounted)) {
    if (!hasDailyRequirements(state, date)) {
      continue;
    }
    if (isDailyDaySuccessful(state, date)) {
      streak += 1;
      if (streak > best) {
        best = streak;
      }
    } else {
      streak = 0;
    }
  }
  return { current: streak, best };
}

export function computeWeeklyStreak(
  state: AppState,
  today: string = localDateKey()
): { current: number; best: number } {
  const created = state.habits
    .filter((habit) => habit.scope === 'weekly')
    .map((habit) => mondayKeyFromDateKey(habit.createdOn))
    .sort();
  if (created.length === 0) {
    return { current: 0, best: 0 };
  }
  const firstWeek = created[0];
  const thisWeek = mondayKeyFromDateKey(today);
  const thisWeekDone = isWeeklyWeekSuccessful(state, thisWeek);
  const lastWeek = thisWeekDone ? thisWeek : addDays(thisWeek, -7);
  if (lastWeek < firstWeek) {
    return { current: 0, best: 0 };
  }
  let streak = 0;
  let best = 0;
  for (let week = firstWeek; week <= lastWeek; week = addDays(week, 7)) {
    if (isWeeklyWeekSuccessful(state, week)) {
      streak += 1;
      if (streak > best) {
        best = streak;
      }
    } else {
      streak = 0;
    }
  }
  return { current: streak, best };
}

export function computeMonthlyStreak(
  state: AppState,
  today: string = localDateKey()
): { current: number; best: number } {
  const created = state.habits
    .filter((habit) => habit.scope === 'monthly')
    .map((habit) => monthKey(habit.createdOn))
    .sort();
  if (created.length === 0) {
    return { current: 0, best: 0 };
  }
  const firstMonth = created[0];
  const thisMonth = monthKey(today);
  const thisMonthDone = isMonthlyMonthSuccessful(state, thisMonth);
  const lastMonth = thisMonthDone ? thisMonth : previousMonth(thisMonth);
  if (lastMonth < firstMonth) {
    return { current: 0, best: 0 };
  }
  let streak = 0;
  let best = 0;
  for (let month = firstMonth; month <= lastMonth; month = nextMonth(month)) {
    if (isMonthlyMonthSuccessful(state, month)) {
      streak += 1;
      if (streak > best) {
        best = streak;
      }
    } else {
      streak = 0;
    }
  }
  return { current: streak, best };
}

function previousMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(year, month - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function nextMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(year, month, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function habitStats(state: AppState, habit: Habit, today: string = localDateKey()) {
  if (habit.scope !== 'daily' || habit.schedule?.type === 'oneTime') {
    if (habit.scope === 'weekly') {
      return periodStats(state, habit, 'weekly', today);
    }
    if (habit.scope === 'monthly') {
      return periodStats(state, habit, 'monthly', today);
    }
    return { completed: 0, opportunities: 0, percent: 0 };
  }
  let opportunities = 0;
  let completed = 0;
  const end = today;
  for (const date of eachDate(habit.createdOn, end)) {
    if (!isHabitActiveOn(habit, date)) {
      continue;
    }
    const schedule = scheduleForDate(habit, date);
    if (!schedule || !isDailyScheduled(schedule, date)) {
      continue;
    }
    opportunities += 1;
    if (isCompleted(state, habit.id, date)) {
      completed += 1;
    }
  }
  return {
    completed,
    opportunities,
    percent: opportunities === 0 ? 0 : (completed / opportunities) * 100,
  };
}

function periodStats(state: AppState, habit: Habit, scope: 'weekly' | 'monthly', today: string) {
  let opportunities = 0;
  let completed = 0;
  if (scope === 'weekly') {
    const first = mondayKeyFromDateKey(habit.createdOn);
    const last = mondayKeyFromDateKey(today);
    for (let week = first; week <= last; week = addDays(week, 7)) {
      if (!isHabitActiveOn(habit, week)) {
        continue;
      }
      opportunities += 1;
      if (isCompleted(state, habit.id, week)) {
        completed += 1;
      }
    }
  } else {
    const first = monthKey(habit.createdOn);
    const last = monthKey(today);
    for (let month = first; month <= last; month = nextMonth(month)) {
      if (!isHabitActiveOn(habit, `${month}-15`)) {
        continue;
      }
      opportunities += 1;
      if (isCompleted(state, habit.id, month)) {
        completed += 1;
      }
    }
  }
  return {
    completed,
    opportunities,
    percent: opportunities === 0 ? 0 : (completed / opportunities) * 100,
  };
}

export function canEditDailyDate(date: string, today: string = localDateKey()): boolean {
  return date === today || date === addDays(today, -1);
}

export function dailyPercentForRange(state: AppState, start: string, end: string): number {
  const requiredDays = eachDate(start, end).filter((date) => hasDailyRequirements(state, date));
  if (requiredDays.length === 0) {
    return 100;
  }
  const success = requiredDays.filter((date) => isDailyDaySuccessful(state, date)).length;
  return (success / requiredDays.length) * 100;
}

export function describeSchedule(schedule: DailySchedule | null, scope: HabitScope): string {
  if (scope === 'weekly') {
    return 'Once each week';
  }
  if (scope === 'monthly') {
    return 'Once each month';
  }
  if (!schedule) {
    return 'Unscheduled';
  }
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  switch (schedule.type) {
    case 'everyDay':
      return 'Every day';
    case 'weekdays':
      return 'Weekdays';
    case 'weekends':
      return 'Weekends';
    case 'weekday':
      return `Every ${names[schedule.weekday]}`;
    case 'dailyExcept': {
      if (schedule.weekdays.length === 0) {
        return 'Every day';
      }
      return `Every day except ${schedule.weekdays.map((day) => names[day].slice(0, 3)).join(', ')}`;
    }
    case 'oneTime':
      return `One-time · ${schedule.date}`;
    case 'dayOfMonth':
      return `Day ${schedule.day} of each month`;
    default:
      return 'Custom';
  }
}
