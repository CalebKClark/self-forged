import { AppState, WorkoutHistoryPoint } from '../types';
import { addDays, trimNumber } from './dates';

function sortHistory(points: WorkoutHistoryPoint[]): WorkoutHistoryPoint[] {
  return [...points].sort((a, b) => {
    const date = a.date.localeCompare(b.date);
    if (date !== 0) {
      return date;
    }
    return a.checkedInAt.localeCompare(b.checkedInAt);
  });
}

function sameLift(a: WorkoutHistoryPoint, b: WorkoutHistoryPoint): boolean {
  return a.workoutId === b.workoutId || (a.dayId === b.dayId && a.workoutName === b.workoutName);
}

export function changeForHistoryPoint(
  point: WorkoutHistoryPoint,
  history: WorkoutHistoryPoint[],
  currentWeight?: number
): number | null {
  if (typeof point.delta === 'number') {
    return point.delta;
  }
  const ordered = sortHistory(history.filter((item) => sameLift(item, point)));
  const index = ordered.findIndex((item) => item.id === point.id);
  const next = index >= 0 ? ordered[index + 1] : undefined;
  if (next) {
    return Number((next.weight - point.weight).toFixed(2));
  }
  if (currentWeight != null) {
    return Number((currentWeight - point.weight).toFixed(2));
  }
  return point.increased ? null : 0;
}

export function lastWorkoutChange(
  history: WorkoutHistoryPoint[],
  workoutId: string,
  workoutName?: string
): { delta: number | null; increased: boolean } | null {
  const ordered = sortHistory(
    history.filter((item) => item.workoutId === workoutId || (workoutName && item.workoutName === workoutName))
  );
  const last = ordered[ordered.length - 1];
  if (!last) {
    return null;
  }
  return {
    delta: changeForHistoryPoint(last, history),
    increased: last.increased,
  };
}

export function formatSignedPounds(delta: number): string {
  const abs = Math.abs(delta);
  const unit = abs === 1 ? 'pound' : 'pounds';
  if (delta > 0) {
    return `+${trimNumber(abs)} ${unit}`;
  }
  if (delta < 0) {
    return `-${trimNumber(abs)} ${unit}`;
  }
  return `0 ${unit}`;
}

export function lastWeekLabel(change: { delta: number | null; increased: boolean } | null): string | null {
  if (!change) {
    return null;
  }
  if (change.delta === 0) {
    return 'Last week: Stayed same';
  }
  if (change.delta != null && change.delta > 0) {
    return `Last week: +${trimNumber(change.delta)} Pounds`;
  }
  if (change.delta != null) {
    return `Last week: -${trimNumber(Math.abs(change.delta))} Pounds`;
  }
  return change.increased ? 'Last week: Moved up' : 'Last week: Stayed same';
}

export type GymProgressDay = {
  key: string;
  dayName: string;
  lifts: { name: string; delta: number }[];
};

export function gymProgressDays(state: AppState, weekStart: string): GymProgressDay[] {
  const weekEnd = addDays(weekStart, 6);
  const weekPoints = sortHistory(
    state.workoutHistory.filter((point) => point.date >= weekStart && point.date <= weekEnd)
  );
  const groups = new Map<string, GymProgressDay>();

  for (const point of weekPoints) {
    const current = state.splitDays
      .find((day) => day.id === point.dayId)
      ?.workouts.find((workout) => workout.id === point.workoutId)?.weight;
    const delta = changeForHistoryPoint(point, state.workoutHistory, current);
    if (delta == null || delta <= 0) {
      continue;
    }
    const key = `${point.date}:${point.dayId}`;
    const existing = groups.get(key) ?? {
      key,
      dayName:
        state.gymVisits.find((visit) => visit.date === point.date && visit.dayId === point.dayId)?.dayName ??
        state.splitDays.find((day) => day.id === point.dayId)?.name ??
        'Workout',
      lifts: [],
    };
    groups.set(key, existing);
    existing.lifts.push({ name: point.workoutName, delta });
  }

  return [...groups.values()].filter((group) => group.lifts.length > 0);
}

export function weightChangeForWeek(state: AppState, weekStart: string): number | null {
  const weekEnd = addDays(weekStart, 6);
  const before = [...state.weights].filter((item) => item.date < weekStart).sort((a, b) => a.date.localeCompare(b.date));
  const during = [...state.weights]
    .filter((item) => item.date >= weekStart && item.date <= weekEnd)
    .sort((a, b) => a.date.localeCompare(b.date));
  const lastBefore = before[before.length - 1];
  const lastDuring = during[during.length - 1];
  if (!lastBefore || !lastDuring) {
    return null;
  }
  return Number((lastDuring.weight - lastBefore.weight).toFixed(2));
}
