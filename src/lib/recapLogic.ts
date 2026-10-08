import { AppState, WeeklyRecap } from '../types';
import { successfulDietDatesInRange } from './dietLogic';
import { gymPercentForRange } from './gymLogic';
import { dailyPercentForRange } from './habitLogic';
import { addDays, eachDate, localDateKey, mondayKeyFromDateKey } from './dates';
import { weightChangeForWeek } from './workoutChange';

export function buildWeeklyRecap(state: AppState, weekStart: string): WeeklyRecap {
  const weekEnd = addDays(weekStart, 6);
  const dietDays = eachDate(weekStart, weekEnd);
  const dietSuccess = successfulDietDatesInRange(state, weekStart, weekEnd).length;
  const dietPercent = dietDays.length === 0 ? 0 : (dietSuccess / dietDays.length) * 100;
  const gymPercent = gymPercentForRange(state, weekStart, weekEnd);
  const dailyPercent = dailyPercentForRange(state, weekStart, weekEnd);
  const overall = (dietPercent + gymPercent + dailyPercent) / 3;
  return {
    weekStart,
    dietPercent,
    gymPercent,
    dailyPercent,
    overall,
    weightChange: weightChangeForWeek(state, weekStart),
    shownAt: new Date().toISOString(),
  };
}

export function recapDue(state: AppState, today: string = localDateKey()): string | null {
  const weekday = new Date(`${today}T12:00:00`).getDay();
  if (weekday !== 1) {
    return null;
  }
  const thisMonday = mondayKeyFromDateKey(today);
  const previousMonday = addDays(thisMonday, -7);
  if (state.lastRecapPromptWeekStart === thisMonday) {
    return null;
  }
  if (state.weeklyRecaps.some((item) => item.weekStart === previousMonday)) {
    return null;
  }
  return previousMonday;
}
