import { AppState, RestDaySetting } from '../types';
import { addDays, eachDate, localDateKey, mondayKeyFromDateKey } from './dates';

export function computeGymStreak(
  completedDates: Iterable<string>,
  settings: RestDaySetting[],
  today: string = localDateKey()
): { current: number; best: number } {
  const completed = new Set(completedDates);
  const sorted = [...completed].sort();
  if (sorted.length === 0) {
    return { current: 0, best: 0 };
  }
  const lastCounted = completed.has(today) ? today : addDays(today, -1);
  const first = sorted[0];
  if (lastCounted < first) {
    return { current: 0, best: 0 };
  }
  let streak = 0;
  let best = 0;
  const restUsed = new Map<string, number>();
  for (const dateKey of eachDate(first, lastCounted)) {
    if (completed.has(dateKey)) {
      streak += 1;
      if (streak > best) {
        best = streak;
      }
      continue;
    }
    const weekStart = mondayKeyFromDateKey(dateKey);
    const allowed = restDaysForWeek(settings, weekStart);
    const used = restUsed.get(weekStart) ?? 0;
    if (used < allowed) {
      restUsed.set(weekStart, used + 1);
    } else {
      streak = 0;
    }
  }
  return { current: streak, best };
}

export function restDaysForWeek(settings: RestDaySetting[], weekStart: string): number {
  let allowed = 0;
  const sorted = [...settings].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  for (const setting of sorted) {
    if (setting.weekStart <= weekStart) {
      allowed = setting.restDays;
    }
  }
  return allowed;
}

export function restDaysUsedThisWeek(
  completedDates: Iterable<string>,
  settings: RestDaySetting[],
  today: string = localDateKey()
): number {
  const weekStart = mondayKeyFromDateKey(today);
  const completed = new Set(completedDates);
  const sorted = [...completed].sort();
  if (sorted.length === 0 || settings.length === 0) {
    return 0;
  }
  const first = sorted[0];
  const lastCounted = completed.has(today) ? today : addDays(today, -1);
  if (lastCounted < first) {
    return 0;
  }
  const restUsed = new Map<string, number>();
  let streak = 0;
  for (const dateKey of eachDate(first, lastCounted)) {
    if (completed.has(dateKey)) {
      streak += 1;
      continue;
    }
    const monday = mondayKeyFromDateKey(dateKey);
    const allowed = restDaysForWeek(settings, monday);
    const used = restUsed.get(monday) ?? 0;
    if (used < allowed && streak > 0) {
      restUsed.set(monday, used + 1);
    } else {
      streak = 0;
    }
  }
  return restUsed.get(weekStart) ?? 0;
}

export function completedGymDates(state: AppState): Set<string> {
  return new Set(state.gymVisits.filter((visit) => visit.completed).map((visit) => visit.date));
}

export function hasCompletedGymOn(state: AppState, date: string): boolean {
  return state.gymVisits.some((visit) => visit.completed && visit.date === date);
}

export function gymPercentForRange(
  state: AppState,
  start: string,
  end: string
): number {
  const dates = eachDate(start, end);
  const completed = dates.filter((date) => hasCompletedGymOn(state, date)).length;
  const weekStart = mondayKeyFromDateKey(start);
  const rest = restDaysForWeek(state.restDaySettings, weekStart);
  const expected = Math.max(1, dates.length - rest);
  return Math.min(100, (completed / expected) * 100);
}
