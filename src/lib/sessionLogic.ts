import { ActiveSession, SessionPhase, Workout, WorkoutProgress } from '../types';

export function createActiveSession(dayId: string, workoutIds: string[]): ActiveSession {
  return {
    dayId,
    currentWorkoutId: workoutIds[0] ?? '',
    progress: workoutIds.map((workoutId) => ({
      workoutId,
      setIndex: 0,
      phase: 'working',
      restEndsAt: null,
    })),
  };
}

export function hydrateSession(stored: ActiveSession | null, workouts: Workout[]): ActiveSession | null {
  if (!stored || workouts.length === 0) {
    return null;
  }
  const byId = new Map(stored.progress.map((item) => [item.workoutId, item]));
  const progress = workouts.map(
    (workout) =>
      byId.get(workout.id) ?? {
        workoutId: workout.id,
        setIndex: 0,
        phase: 'working' as const,
        restEndsAt: null,
      }
  );
  const currentStillOpen = workouts.some(
    (workout) =>
      workout.id === stored.currentWorkoutId && byId.get(workout.id)?.phase !== 'complete'
  );
  const currentWorkoutId = currentStillOpen
    ? stored.currentWorkoutId
    : workouts.find((workout) => byId.get(workout.id)?.phase !== 'complete')?.id ?? workouts[0].id;
  return {
    dayId: stored.dayId,
    currentWorkoutId,
    progress,
  };
}

export function sessionCompletedCount(session: ActiveSession | null): number {
  if (!session) {
    return 0;
  }
  return session.progress.filter((item) => item.phase === 'complete').length;
}

export function nextIncompleteWorkoutId(
  session: ActiveSession,
  workoutIds: string[],
  fromWorkoutId: string
): string | null {
  if (workoutIds.length === 0) {
    return null;
  }
  const start = Math.max(0, workoutIds.indexOf(fromWorkoutId));
  for (let offset = 1; offset <= workoutIds.length; offset += 1) {
    const workoutId = workoutIds[(start + offset) % workoutIds.length];
    const item = session.progress.find((entry) => entry.workoutId === workoutId);
    if (item?.phase !== 'complete') {
      return workoutId;
    }
  }
  return null;
}

export function isSessionComplete(session: ActiveSession | null): boolean {
  return Boolean(
    session && session.progress.length > 0 && session.progress.every((item) => item.phase === 'complete')
  );
}

export function patchProgress(
  progress: WorkoutProgress[],
  workoutId: string,
  patch: Partial<WorkoutProgress>
): WorkoutProgress[] {
  return progress.map((item) => (item.workoutId === workoutId ? { ...item, ...patch } : item));
}

export function canSwitchDuring(phase: SessionPhase | 'complete'): boolean {
  return phase === 'working' || phase === 'resting' || phase === 'askComplete' || phase === 'askMoveUp' || phase === 'askWeight';
}
