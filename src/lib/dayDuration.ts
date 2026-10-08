import { Workout } from '../types';

const SECONDS_PER_SET = 45;

export function estimateDayDurationSeconds(workouts: Workout[]): number {
  const restBySet: number[] = [];
  for (const workout of workouts) {
    const sets = Math.max(0, Math.floor(workout.sets));
    const rest = Math.max(0, workout.restMinutes) * 60 + Math.max(0, workout.restSeconds);
    for (let index = 0; index < sets; index += 1) {
      restBySet.push(rest);
    }
  }
  if (restBySet.length === 0) {
    return 0;
  }
  const restSeconds = restBySet.slice(0, -1).reduce((sum, value) => sum + value, 0);
  return restSeconds + restBySet.length * SECONDS_PER_SET;
}

export function formatEstimatedDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  if (hours > 0) {
    if (minutes === 0) {
      return plural(hours, 'hour', 'hours');
    }
    return `${plural(hours, 'hour', 'hours')} and ${plural(minutes, 'minute', 'minutes')}`;
  }
  if (minutes === 0) {
    return seconds === 0 ? '0 minutes' : plural(seconds, 'second', 'seconds');
  }
  if (seconds === 0) {
    return plural(minutes, 'minute', 'minutes');
  }
  return `${plural(minutes, 'minute', 'minutes')} ${plural(seconds, 'second', 'seconds')}`;
}

export function formatDayWorkoutMeta(workouts: Workout[]): string {
  const countLabel = workouts.length === 1 ? '1 workout' : `${workouts.length} workouts`;
  const seconds = estimateDayDurationSeconds(workouts);
  if (seconds <= 0) {
    return countLabel;
  }
  return `${countLabel} · ${formatEstimatedDuration(seconds)}`;
}

function plural(count: number, singular: string, pluralLabel: string): string {
  return count === 1 ? `1 ${singular}` : `${count} ${pluralLabel}`;
}
