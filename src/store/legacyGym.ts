import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppState, GymVisit, RestDaySetting, SplitDay, Workout, WorkoutHistoryPoint } from '../types';

const MIGRATED_KEY = 'ultimate.gymMigrated.v1';

const SPLIT_KEYS = ['workout.split', 'workout.splits', 'split'];
const VISIT_KEYS = ['workout.checkins', 'workout.checkIns', 'workout.visits'];
const HISTORY_KEYS = ['workout.history', 'workout.workoutHistory'];
const REST_KEYS = ['workout.restdays', 'workout.restDays', 'workout.rest-days'];

export type GymSnapshot = {
  splitDays: SplitDay[];
  gymVisits: GymVisit[];
  workoutHistory: WorkoutHistoryPoint[];
  restDaySettings: RestDaySetting[];
};

export type StorageScan = GymSnapshot & {
  keys: string[];
  foundLegacy: boolean;
};

export async function scanDeviceStorage(): Promise<StorageScan> {
  const keys = (await AsyncStorage.getAllKeys()).slice().sort();
  const pairs = await AsyncStorage.multiGet(keys);
  const map = new Map(pairs.map(([key, value]) => [key, value]));

  const splitDays = firstArray(map, SPLIT_KEYS).map(normalizeSplitDay).filter(Boolean) as SplitDay[];
  const gymVisits = firstArray(map, VISIT_KEYS).map(normalizeVisit).filter(Boolean) as GymVisit[];
  const workoutHistory = firstArray(map, HISTORY_KEYS).map(normalizeHistory).filter(Boolean) as WorkoutHistoryPoint[];
  const restDaySettings = firstArray(map, REST_KEYS).map(normalizeRest).filter(Boolean) as RestDaySetting[];

  return {
    keys,
    splitDays,
    gymVisits,
    workoutHistory,
    restDaySettings,
    foundLegacy:
      splitDays.length > 0 || gymVisits.length > 0 || workoutHistory.length > 0 || restDaySettings.length > 0,
  };
}

export async function exportStorageBackup(): Promise<string> {
  const keys = await AsyncStorage.getAllKeys();
  const pairs = await AsyncStorage.multiGet(keys);
  const data: Record<string, unknown> = {};
  for (const [key, value] of pairs) {
    if (!value) {
      continue;
    }
    try {
      data[key] = JSON.parse(value);
    } catch {
      data[key] = value;
    }
  }
  return JSON.stringify(data, null, 2);
}

export function gymSnapshotFromBackup(raw: string): GymSnapshot | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    const record = parsed as Record<string, unknown>;
    const map = new Map<string, string>();
    for (const [key, value] of Object.entries(record)) {
      map.set(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
    const splitDays = firstArray(map, [...SPLIT_KEYS, 'splitDays']).map(normalizeSplitDay).filter(Boolean) as SplitDay[];
    const gymVisits = firstArray(map, [...VISIT_KEYS, 'gymVisits']).map(normalizeVisit).filter(Boolean) as GymVisit[];
    const workoutHistory = firstArray(map, [...HISTORY_KEYS, 'workoutHistory'])
      .map(normalizeHistory)
      .filter(Boolean) as WorkoutHistoryPoint[];
    const restDaySettings = firstArray(map, [...REST_KEYS, 'restDaySettings'])
      .map(normalizeRest)
      .filter(Boolean) as RestDaySetting[];
    if (
      splitDays.length === 0 &&
      gymVisits.length === 0 &&
      workoutHistory.length === 0 &&
      restDaySettings.length === 0
    ) {
      return null;
    }
    return { splitDays, gymVisits, workoutHistory, restDaySettings };
  } catch {
    return null;
  }
}

export function applyGymSnapshot(state: AppState, snapshot: GymSnapshot): AppState {
  return {
    ...state,
    splitDays: snapshot.splitDays,
    gymVisits: snapshot.gymVisits,
    workoutHistory: snapshot.workoutHistory,
    restDaySettings: snapshot.restDaySettings,
    activeSession: null,
  };
}

export async function importLegacyGymIfNeeded(state: AppState): Promise<AppState> {
  try {
    const already = await AsyncStorage.getItem(MIGRATED_KEY);
    if (already) {
      return state;
    }
    const scan = await scanDeviceStorage();
    if (!scan.foundLegacy) {
      return state;
    }
    await AsyncStorage.setItem(MIGRATED_KEY, new Date().toISOString());
    const gymAlreadyUsed =
      (state.splitDays?.length ?? 0) > 0 ||
      (state.gymVisits?.length ?? 0) > 0 ||
      (state.workoutHistory?.length ?? 0) > 0 ||
      (state.restDaySettings?.length ?? 0) > 0;
    if (gymAlreadyUsed) {
      return state;
    }
    return applyGymSnapshot(state, scan);
  } catch {
    return state;
  }
}

export async function markGymMigrated() {
  await AsyncStorage.setItem(MIGRATED_KEY, new Date().toISOString());
}

function firstArray(map: Map<string, string | null>, keys: string[]): unknown[] {
  for (const key of keys) {
    const raw = map.get(key);
    if (!raw) {
      continue;
    }
    const parsed = parseJson<unknown>(raw, null);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  }
  return [];
}

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalizeSplitDay(value: unknown): SplitDay | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const day = value as SplitDay;
  if (typeof day.id !== 'string' || typeof day.name !== 'string' || !Array.isArray(day.workouts)) {
    return null;
  }
  return {
    id: day.id,
    name: day.name,
    workouts: day.workouts.map(normalizeWorkout).filter(Boolean) as Workout[],
  };
}

function normalizeWorkout(value: unknown): Workout | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const workout = value as Workout;
  if (typeof workout.id !== 'string' || typeof workout.name !== 'string') {
    return null;
  }
  return {
    id: workout.id,
    name: workout.name,
    weight: typeof workout.weight === 'number' ? workout.weight : 0,
    sets: Number(workout.sets) || 0,
    reps: Number(workout.reps) || 0,
    restMinutes: Number(workout.restMinutes) || 0,
    restSeconds: Number(workout.restSeconds) || 0,
  };
}

function normalizeVisit(value: unknown): GymVisit | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const visit = value as GymVisit;
  if (typeof visit.id !== 'string' || typeof visit.date !== 'string' || typeof visit.dayId !== 'string') {
    return null;
  }
  return {
    id: visit.id,
    date: visit.date,
    checkedInAt: typeof visit.checkedInAt === 'string' ? visit.checkedInAt : visit.date,
    completed: Boolean(visit.completed),
    dayId: visit.dayId,
    dayName: typeof visit.dayName === 'string' ? visit.dayName : 'Workout',
  };
}

function normalizeHistory(value: unknown): WorkoutHistoryPoint | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const point = value as WorkoutHistoryPoint;
  if (typeof point.id !== 'string' || typeof point.date !== 'string' || typeof point.workoutId !== 'string') {
    return null;
  }
  return {
    id: point.id,
    dayId: typeof point.dayId === 'string' ? point.dayId : '',
    workoutId: point.workoutId,
    workoutName: typeof point.workoutName === 'string' ? point.workoutName : 'Workout',
    date: point.date,
    checkedInAt: typeof point.checkedInAt === 'string' ? point.checkedInAt : point.date,
    weight: typeof point.weight === 'number' ? point.weight : 0,
    increased: Boolean(point.increased),
  };
}

function normalizeRest(value: unknown): RestDaySetting | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const setting = value as RestDaySetting;
  if (typeof setting.weekStart !== 'string' || typeof setting.restDays !== 'number') {
    return null;
  }
  return {
    restDays: setting.restDays,
    weekStart: setting.weekStart,
  };
}
