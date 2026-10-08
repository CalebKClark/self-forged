export function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function localDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(dateKey: string, amount: number): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + amount);
  return localDateKey(date);
}

export function mondayKey(date: Date = new Date()): string {
  return mondayKeyFromDateKey(localDateKey(date));
}

export function mondayKeyFromDateKey(dateKey: string): string {
  const date = parseDateKey(dateKey);
  const day = date.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + offset);
  return localDateKey(date);
}

export function nextMondayKey(date: Date = new Date()): string {
  return addDays(mondayKey(date), 7);
}

export function sundayKeyFromMonday(weekStart: string): string {
  return addDays(weekStart, 6);
}

export function monthKey(dateKey: string): string {
  return dateKey.slice(0, 7);
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function weekdayFromDateKey(dateKey: string): number {
  return parseDateKey(dateKey).getDay();
}

export function formatMonthTitle(year: number, monthIndex: number): string {
  return new Date(year, monthIndex, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

export function formatShortDate(dateKey: string): string {
  return parseDateKey(dateKey).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function formatLongDate(dateKey: string): string {
  return parseDateKey(dateKey).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatMonthDay(dateKey: string): string {
  return parseDateKey(dateKey).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function formatRange(start: string, end: string): string {
  const startDate = parseDateKey(start);
  const endDate = parseDateKey(end);
  const startLabel = startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const endLabel = endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${startLabel} – ${endLabel}`;
}

export function formatRest(minutes: number, seconds: number): string {
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatWeight(weight: number): string {
  if (Number.isInteger(weight)) {
    return `${weight} lbs`;
  }
  return `${trimNumber(weight)} lbs`;
}

export function trimNumber(value: number): string {
  return String(Number(value.toFixed(2))).replace(/\.0+$/, '');
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function parseDecimal(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return null;
  }
  return Number(trimmed);
}

export function parsePositiveInt(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const parsed = Number(trimmed);
  return parsed > 0 ? parsed : null;
}

export function eachDate(start: string, end: string): string[] {
  if (end < start) {
    return [];
  }
  const dates: string[] = [];
  for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
    dates.push(cursor);
  }
  return dates;
}

export function lastDayOfMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const last = daysInMonth(year, month - 1);
  return `${yearMonth}-${String(last).padStart(2, '0')}`;
}

export function firstDayOfMonth(yearMonth: string): string {
  return `${yearMonth}-01`;
}

export function previousMonthKey(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(year, month - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
