import { RestDaySetting } from '../types';
import { mondayKey, nextMondayKey } from './dates';
import { restDaysForWeek } from './gymLogic';

export function getActiveRestDays(settings: RestDaySetting[], today: Date = new Date()): number {
  return restDaysForWeek(settings, mondayKey(today));
}

export function getPendingRestDays(settings: RestDaySetting[], today: Date = new Date()): RestDaySetting | null {
  const pendingWeek = nextMondayKey(today);
  return settings.find((setting) => setting.weekStart === pendingWeek) ?? null;
}
