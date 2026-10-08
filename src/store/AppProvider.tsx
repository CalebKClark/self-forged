import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState as RNAppState } from 'react-native';

import {
  addDays,
  createId,
  localDateKey,
  mondayKey,
  nextMondayKey,
} from '../lib/dates';
import { applyPendingDiet, requestDietSwitch, switchDietNow } from '../lib/dietLogic';
import { hydrateSession, isSessionComplete } from '../lib/sessionLogic';
import { importLegacyGymIfNeeded, markGymMigrated, type GymSnapshot, applyGymSnapshot } from './legacyGym';
import {
  ActiveSession,
  AppState,
  DailySchedule,
  Diet,
  Habit,
  HabitScope,
  initialAppState,
  MealEntry,
  SavedMeal,
  SplitDay,
  Workout,
} from '../types';

const STORAGE_KEY = 'ultimate.v1';

type AppContextValue = {
  ready: boolean;
  state: AppState;
  refreshDate: () => void;
  today: string;
  createDiet: (input: {
    name: string;
    currentWeight: number;
    calorieTarget: number;
    proteinGoal: number | null;
  }) => void;
  switchDiet: (dietId: string) => void;
  addMeal: (input: { calories: number; protein: number; savedMealId?: string; name?: string }) => void;
  updateMeal: (mealId: string, input: { calories: number; protein: number }) => void;
  deleteMeal: (mealId: string) => void;
  upsertSavedMeal: (meal: Omit<SavedMeal, 'id'> & { id?: string }) => void;
  deleteSavedMeal: (id: string) => void;
  logWeight: (weight: number, date?: string) => void;
  dismissWeightPrompt: () => void;
  addSplitDay: (name: string) => SplitDay;
  renameSplitDay: (id: string, name: string) => void;
  deleteSplitDay: (id: string) => void;
  addWorkout: (dayId: string, workout: Omit<Workout, 'id'>) => void;
  updateWorkout: (dayId: string, workout: Workout) => void;
  deleteWorkout: (dayId: string, workoutId: string) => void;
  addWeightToWorkout: (dayId: string, workoutId: string, amount: number) => void;
  setRestDays: (restDays: number) => void;
  startCheckIn: (dayId: string) => ActiveSession | null;
  saveSession: (session: ActiveSession | null) => void;
  completeCheckIn: (dayId: string) => void;
  discardSession: () => void;
  logWorkoutHit: (input: {
    dayId: string;
    workoutId: string;
    workoutName: string;
    weight: number;
    increased: boolean;
    delta: number;
  }) => void;
  createHabit: (input: {
    name: string;
    scope: HabitScope;
    schedule: DailySchedule | null;
    recurring: boolean;
  }) => void;
  updateHabit: (id: string, input: { name: string; schedule: DailySchedule | null; recurring: boolean }) => void;
  deleteHabit: (id: string) => void;
  setHabitCompletion: (habitId: string, periodKey: string, completed: boolean) => void;
  markRecapShown: (weekStart: string, recap: AppState['weeklyRecaps'][number]) => void;
  replaceGymData: (snapshot: GymSnapshot) => void;
  exportAllData: () => string;
  resetAllData: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

function sanitizeState(raw: AppState): AppState {
  let next = applyPendingDiet(raw);
  if (next.activeSession) {
    const day = next.splitDays.find((item) => item.id === next.activeSession?.dayId);
    if (!day || day.workouts.length === 0) {
      next = { ...next, activeSession: null };
    } else {
      const hydrated = hydrateSession(next.activeSession, day.workouts);
      next = { ...next, activeSession: isSessionComplete(hydrated) ? null : hydrated };
    }
  }
  return next;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<AppState>(initialAppState);
  const [today, setToday] = useState(localDateKey());
  const stateRef = useRef(state);
  stateRef.current = state;

  const persist = useCallback(async (next: AppState) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const commit = useCallback(
    (updater: (current: AppState) => AppState) => {
      setState((current) => {
        const next = updater(current);
        stateRef.current = next;
        void persist(next);
        return next;
      });
    },
    [persist]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) {
          return;
        }
        let loaded = initialAppState;
        if (raw) {
          try {
            loaded = sanitizeState({ ...initialAppState, ...(JSON.parse(raw) as AppState) });
          } catch {
            loaded = initialAppState;
          }
        }
        const imported = await importLegacyGymIfNeeded(loaded);
        const migrated = sanitizeState(imported);
        setState(migrated);
        stateRef.current = migrated;
        if (raw || imported !== loaded) {
          await persist(migrated);
        }
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [persist]);

  const refreshDate = useCallback(() => {
    const nextToday = localDateKey();
    setToday(nextToday);
    commit((current) => sanitizeState(current));
  }, [commit]);

  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (status) => {
      if (status === 'active') {
        refreshDate();
      }
      if (status === 'background' || status === 'inactive') {
        void persist(stateRef.current);
      }
    });
    return () => sub.remove();
  }, [persist, refreshDate]);

  const actions = useMemo<Omit<AppContextValue, 'ready' | 'state' | 'today' | 'refreshDate'>>(
    () => ({
      createDiet: ({ name, currentWeight, calorieTarget, proteinGoal }) => {
        const id = createId();
        const createdAt = new Date().toISOString();
        commit((current) => {
          const diet: Diet = {
            id,
            name: name.trim(),
            calorieTarget,
            proteinGoal,
            createdAt,
          };
          const withDiet: AppState = {
            ...current,
            diets: [...current.diets, diet],
          };
          const next = current.activeDietId
            ? requestDietSwitch(withDiet, id, today)
            : switchDietNow(withDiet, id, today, true);
          const existingWeight = next.weights.find((item) => item.date === today);
          return {
            ...next,
            weights: existingWeight
              ? next.weights.map((item) => (item.date === today ? { ...item, weight: currentWeight } : item))
              : [...next.weights, { date: today, weight: currentWeight }],
          };
        });
      },
      switchDiet: (dietId) => {
        commit((current) => requestDietSwitch(current, dietId, today));
      },
      addMeal: ({ calories, protein, savedMealId, name }) => {
        commit((current) => {
          const resolved = applyPendingDiet(current, today);
          const dietId = resolved.activeDietId;
          if (!dietId) {
            return resolved;
          }
          const meal: MealEntry = {
            id: createId(),
            date: today,
            dietId,
            calories,
            protein,
            savedMealId,
            name,
            createdAt: new Date().toISOString(),
          };
          return { ...resolved, meals: [...resolved.meals, meal] };
        });
      },
      updateMeal: (mealId, input) => {
        commit((current) => ({
          ...current,
          meals: current.meals.map((meal) =>
            meal.id === mealId ? { ...meal, calories: input.calories, protein: input.protein } : meal
          ),
        }));
      },
      deleteMeal: (mealId) => {
        commit((current) => ({
          ...current,
          meals: current.meals.filter((meal) => meal.id !== mealId),
        }));
      },
      upsertSavedMeal: (meal) => {
        commit((current) => {
          if (meal.id) {
            return {
              ...current,
              savedMeals: current.savedMeals.map((item) =>
                item.id === meal.id ? { ...item, ...meal, id: meal.id } : item
              ),
            };
          }
          return {
            ...current,
            savedMeals: [
              ...current.savedMeals,
              {
                id: createId(),
                name: meal.name.trim(),
                calories: meal.calories,
                protein: meal.protein,
                note: meal.note,
              },
            ],
          };
        });
      },
      deleteSavedMeal: (id) => {
        commit((current) => ({
          ...current,
          savedMeals: current.savedMeals.filter((item) => item.id !== id),
        }));
      },
      logWeight: (weight, date = today) => {
        commit((current) => {
          const exists = current.weights.some((item) => item.date === date);
          return {
            ...current,
            weights: exists
              ? current.weights.map((item) => (item.date === date ? { ...item, weight } : item))
              : [...current.weights, { date, weight }],
            weightPromptDismissedOn: date,
          };
        });
      },
      dismissWeightPrompt: () => {
        commit((current) => ({ ...current, weightPromptDismissedOn: today }));
      },
      addSplitDay: (name) => {
        const day: SplitDay = { id: createId(), name: name.trim(), workouts: [] };
        commit((current) => ({ ...current, splitDays: [...current.splitDays, day] }));
        return day;
      },
      renameSplitDay: (id, name) => {
        commit((current) => ({
          ...current,
          splitDays: current.splitDays.map((day) => (day.id === id ? { ...day, name: name.trim() } : day)),
        }));
      },
      deleteSplitDay: (id) => {
        commit((current) => ({
          ...current,
          splitDays: current.splitDays.filter((day) => day.id !== id),
          activeSession: current.activeSession?.dayId === id ? null : current.activeSession,
        }));
      },
      addWorkout: (dayId, workout) => {
        const created: Workout = { ...workout, id: createId() };
        commit((current) => ({
          ...current,
          splitDays: current.splitDays.map((day) =>
            day.id === dayId ? { ...day, workouts: [...day.workouts, created] } : day
          ),
        }));
      },
      updateWorkout: (dayId, workout) => {
        commit((current) => ({
          ...current,
          splitDays: current.splitDays.map((day) =>
            day.id === dayId
              ? { ...day, workouts: day.workouts.map((item) => (item.id === workout.id ? workout : item)) }
              : day
          ),
        }));
      },
      deleteWorkout: (dayId, workoutId) => {
        commit((current) => ({
          ...current,
          splitDays: current.splitDays.map((day) =>
            day.id === dayId
              ? { ...day, workouts: day.workouts.filter((item) => item.id !== workoutId) }
              : day
          ),
        }));
      },
      addWeightToWorkout: (dayId, workoutId, amount) => {
        commit((current) => ({
          ...current,
          splitDays: current.splitDays.map((day) =>
            day.id === dayId
              ? {
                  ...day,
                  workouts: day.workouts.map((item) =>
                    item.id === workoutId
                      ? { ...item, weight: Math.max(0, Number((item.weight + amount).toFixed(2))) }
                      : item
                  ),
                }
              : day
          ),
        }));
      },
      setRestDays: (restDays) => {
        commit((current) => {
          const weekStart = current.restDaySettings.length === 0 ? mondayKey() : nextMondayKey();
          return {
            ...current,
            restDaySettings: [
              ...current.restDaySettings.filter((item) => item.weekStart !== weekStart),
              { restDays, weekStart },
            ].sort((a, b) => a.weekStart.localeCompare(b.weekStart)),
          };
        });
      },
      startCheckIn: (dayId) => {
        const current = stateRef.current;
        if (current.gymVisits.some((visit) => visit.completed && visit.date === today)) {
          return null;
        }
        const day = current.splitDays.find((item) => item.id === dayId);
        if (!day || day.workouts.length === 0) {
          return null;
        }
        const session = {
          dayId,
          currentWorkoutId: day.workouts[0].id,
          progress: day.workouts.map((workout) => ({
            workoutId: workout.id,
            setIndex: 0,
            phase: 'working' as const,
            restEndsAt: null,
          })),
        };
        const visit = {
          id: createId(),
          date: today,
          checkedInAt: new Date().toISOString(),
          completed: false,
          dayId,
          dayName: day.name,
        };
        commit((prev) => ({
          ...prev,
          gymVisits: [...prev.gymVisits.filter((item) => !(item.date === today && !item.completed)), visit],
          activeSession: session,
        }));
        return session;
      },
      saveSession: (session) => {
        commit((current) => ({
          ...current,
          activeSession: session && isSessionComplete(session) ? null : session,
        }));
      },
      completeCheckIn: (dayId) => {
        commit((current) => ({
          ...current,
          activeSession: null,
          gymVisits: current.gymVisits.map((visit) =>
            visit.dayId === dayId && visit.date === today && !visit.completed
              ? { ...visit, completed: true }
              : visit
          ),
        }));
      },
      discardSession: () => {
        commit((current) => ({
          ...current,
          activeSession: null,
          gymVisits: current.gymVisits.filter((visit) => !(visit.date === today && !visit.completed)),
        }));
      },
      logWorkoutHit: ({ dayId, workoutId, workoutName, weight, increased, delta }) => {
        const visit = stateRef.current.gymVisits.find((item) => item.date === today && item.dayId === dayId);
        commit((current) => ({
          ...current,
          workoutHistory: [
            ...current.workoutHistory,
            {
              id: createId(),
              dayId,
              workoutId,
              workoutName,
              date: today,
              checkedInAt: visit?.checkedInAt ?? new Date().toISOString(),
              weight,
              increased,
              delta,
            },
          ],
        }));
      },
      createHabit: ({ name, scope, schedule, recurring }) => {
        commit((current) => {
          const habit: Habit = {
            id: createId(),
            name: name.trim(),
            scope,
            schedule,
            recurring,
            createdOn: today,
            deletedOn: null,
            scheduleHistory:
              scope === 'daily' && schedule
                ? [{ from: today, to: null, schedule }]
                : [],
          };
          return { ...current, habits: [...current.habits, habit] };
        });
      },
      updateHabit: (id, { name, schedule, recurring }) => {
        commit((current) => ({
          ...current,
          habits: current.habits.map((habit) => {
            if (habit.id !== id) {
              return habit;
            }
            let scheduleHistory = habit.scheduleHistory;
            if (habit.scope === 'daily' && schedule) {
              const last = scheduleHistory[scheduleHistory.length - 1];
              if (last && JSON.stringify(last.schedule) !== JSON.stringify(schedule)) {
                scheduleHistory = [
                  ...scheduleHistory.slice(0, -1),
                  { ...last, to: addDays(today, -1) < last.from ? last.from : addDays(today, -1) },
                  { from: today, to: null, schedule },
                ];
              } else if (!last) {
                scheduleHistory = [{ from: today, to: null, schedule }];
              }
            }
            return {
              ...habit,
              name: name.trim(),
              schedule,
              recurring,
              scheduleHistory,
            };
          }),
        }));
      },
      deleteHabit: (id) => {
        commit((current) => ({
          ...current,
          habits: current.habits.map((habit) =>
            habit.id === id ? { ...habit, deletedOn: today } : habit
          ),
        }));
      },
      setHabitCompletion: (habitId, periodKey, completed) => {
        commit((current) => {
          const existing = current.completions.find(
            (item) => item.habitId === habitId && item.periodKey === periodKey
          );
          if (existing) {
            return {
              ...current,
              completions: current.completions.map((item) =>
                item.habitId === habitId && item.periodKey === periodKey
                  ? { ...item, completed, updatedAt: new Date().toISOString() }
                  : item
              ),
            };
          }
          return {
            ...current,
            completions: [
              ...current.completions,
              {
                habitId,
                periodKey,
                completed,
                updatedAt: new Date().toISOString(),
              },
            ],
          };
        });
      },
      markRecapShown: (weekStart, recap) => {
        commit((current) => ({
          ...current,
          lastRecapPromptWeekStart: mondayKey(),
          weeklyRecaps: current.weeklyRecaps.some((item) => item.weekStart === weekStart)
            ? current.weeklyRecaps
            : [...current.weeklyRecaps, recap],
        }));
      },
      replaceGymData: (snapshot) => {
        void markGymMigrated();
        commit((current) => applyGymSnapshot(current, snapshot));
      },
      exportAllData: () => JSON.stringify(stateRef.current, null, 2),
      resetAllData: () => {
        commit(() => initialAppState);
      },
    }),
    [commit, today]
  );

  const value = useMemo<AppContextValue>(
    () => ({ ready, state, today, refreshDate, ...actions }),
    [ready, state, today, refreshDate, actions]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error('useApp must be used within AppProvider');
  }
  return value;
}
