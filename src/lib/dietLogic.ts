import { AppState, Diet, MealEntry } from '../types';
import { addDays, eachDate, localDateKey } from './dates';

export const CALORIE_TOLERANCE = 200;
export const PROTEIN_UNDER_RATIO = 0.1;

export const DIET_HIT_COPY =
  'Hit the day: calories within 200 of goal. Protein can go over — it only has to stay within 10% under.';

export function applyPendingDiet(state: AppState, today: string = localDateKey()): AppState {
  if (!state.pendingDietId || !state.pendingDietStartsOn || state.pendingDietStartsOn > today) {
    return state;
  }
  return switchDietNow(state, state.pendingDietId, today, true);
}

export function dietForDate(state: AppState, date: string): Diet | null {
  const usage = [...state.dietUsages]
    .reverse()
    .find((item) => item.startDate <= date && (item.endDate === null || item.endDate >= date));
  const dietId = usage?.dietId ?? state.activeDietId;
  return state.diets.find((diet) => diet.id === dietId) ?? null;
}

export function mealsOnDate(meals: MealEntry[], date: string): MealEntry[] {
  return meals.filter((meal) => meal.date === date).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function dayTotals(meals: MealEntry[], date: string): { calories: number; protein: number } {
  return mealsOnDate(meals, date).reduce(
    (sum, meal) => ({
      calories: sum.calories + meal.calories,
      protein: sum.protein + meal.protein,
    }),
    { calories: 0, protein: 0 }
  );
}

export function hasLoggedMacrosToday(state: AppState, today: string = localDateKey()): boolean {
  const totals = dayTotals(state.meals, today);
  return totals.calories > 0 || totals.protein > 0 || mealsOnDate(state.meals, today).length > 0;
}

export function isDietDaySuccessful(state: AppState, date: string): boolean {
  const diet = dietForDate(state, date);
  if (!diet) {
    return false;
  }
  const totals = dayTotals(state.meals, date);
  const caloriesOk = Math.abs(totals.calories - diet.calorieTarget) <= CALORIE_TOLERANCE;
  if (!caloriesOk) {
    return false;
  }
  if (diet.proteinGoal == null) {
    return true;
  }
  return totals.protein >= diet.proteinGoal * (1 - PROTEIN_UNDER_RATIO);
}

export function dietProgress(state: AppState, date: string): {
  calories: number;
  protein: number;
  calorieTarget: number;
  proteinGoal: number | null;
  caloriePct: number;
  proteinPct: number | null;
} | null {
  const diet = dietForDate(state, date);
  if (!diet) {
    return null;
  }
  const totals = dayTotals(state.meals, date);
  return {
    calories: totals.calories,
    protein: totals.protein,
    calorieTarget: diet.calorieTarget,
    proteinGoal: diet.proteinGoal,
    caloriePct: diet.calorieTarget > 0 ? Math.min(100, (totals.calories / diet.calorieTarget) * 100) : 0,
    proteinPct:
      diet.proteinGoal && diet.proteinGoal > 0
        ? Math.min(100, (totals.protein / diet.proteinGoal) * 100)
        : null,
  };
}

export function firstDietDate(state: AppState): string | null {
  const usageStarts = state.dietUsages.map((item) => item.startDate).sort();
  return usageStarts[0] ?? null;
}

export function computeDietStreak(
  state: AppState,
  today: string = localDateKey()
): { current: number; best: number } {
  const start = firstDietDate(state);
  if (!start) {
    return { current: 0, best: 0 };
  }
  const todaySuccess = isDietDaySuccessful(state, today);
  const lastCounted = todaySuccess ? today : addDays(today, -1);
  if (lastCounted < start) {
    return { current: 0, best: 0 };
  }
  let streak = 0;
  let best = 0;
  for (const date of eachDate(start, lastCounted)) {
    if (isDietDaySuccessful(state, date)) {
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

export function switchDietNow(
  state: AppState,
  dietId: string,
  today: string,
  clearPending: boolean
): AppState {
  const usages = state.dietUsages.map((usage) => {
    if (usage.endDate === null && usage.dietId !== dietId) {
      const endDate = usage.startDate > addDays(today, -1) ? usage.startDate : addDays(today, -1);
      return { ...usage, endDate: endDate < usage.startDate ? usage.startDate : endDate };
    }
    return usage;
  });
  const hasOpen = usages.some((usage) => usage.dietId === dietId && usage.endDate === null);
  const nextUsages = hasOpen
    ? usages
    : [...usages, { dietId, startDate: today, endDate: null }];
  return {
    ...state,
    activeDietId: dietId,
    pendingDietId: clearPending ? null : state.pendingDietId,
    pendingDietStartsOn: clearPending ? null : state.pendingDietStartsOn,
    dietUsages: nextUsages,
  };
}

export function requestDietSwitch(state: AppState, dietId: string, today: string = localDateKey()): AppState {
  if (dietId === state.activeDietId && !state.pendingDietId) {
    return state;
  }
  if (hasLoggedMacrosToday(state, today)) {
    return {
      ...state,
      pendingDietId: dietId,
      pendingDietStartsOn: addDays(today, 1),
    };
  }
  return switchDietNow(state, dietId, today, true);
}

export function currentWeight(state: AppState): number | null {
  if (state.weights.length === 0) {
    return null;
  }
  const sorted = [...state.weights].sort((a, b) => a.date.localeCompare(b.date));
  return sorted[sorted.length - 1].weight;
}

export function weightOnOrAfter(state: AppState, date: string): number | null {
  const match = [...state.weights].sort((a, b) => a.date.localeCompare(b.date)).find((item) => item.date >= date);
  return match?.weight ?? null;
}

export function weightOnOrBefore(state: AppState, date: string): number | null {
  const match = [...state.weights]
    .sort((a, b) => b.date.localeCompare(a.date))
    .find((item) => item.date <= date);
  return match?.weight ?? null;
}

export function dietUsageSummary(state: AppState, diet: Diet, today: string = localDateKey()) {
  const usages = state.dietUsages.filter((item) => item.dietId === diet.id);
  if (usages.length === 0) {
    return {
      lastUsed: diet.createdAt.slice(0, 10),
      start: diet.createdAt.slice(0, 10),
      end: today,
      startWeight: null as number | null,
      endWeight: null as number | null,
    };
  }
  const start = usages.map((item) => item.startDate).sort()[0];
  const open = usages.some((item) => item.endDate === null);
  const end = open
    ? today
    : usages.map((item) => item.endDate ?? item.startDate).sort().slice(-1)[0];
  const lastUsed = open ? today : end;
  return {
    lastUsed,
    start,
    end,
    startWeight: weightOnOrAfter(state, start),
    endWeight: weightOnOrBefore(state, end),
  };
}

export function daysSinceLastWeight(state: AppState, today: string = localDateKey()): number | null {
  if (state.weights.length === 0) {
    return null;
  }
  const last = [...state.weights].sort((a, b) => a.date.localeCompare(b.date)).slice(-1)[0];
  const lastDate = new Date(last.date + 'T12:00:00');
  const todayDate = new Date(today + 'T12:00:00');
  return Math.round((todayDate.getTime() - lastDate.getTime()) / 86400000);
}

export function shouldPromptWeight(state: AppState, today: string = localDateKey()): boolean {
  const elapsed = daysSinceLastWeight(state, today);
  if (elapsed === null) {
    return false;
  }
  if (elapsed < 7) {
    return false;
  }
  return state.weightPromptDismissedOn !== today;
}

export function successfulDietDatesInRange(state: AppState, start: string, end: string): string[] {
  return eachDate(start, end).filter((date) => isDietDaySuccessful(state, date));
}
