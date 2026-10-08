import { WorkoutHistoryPoint } from '../types';

export type ChartPoint = {
  id: string;
  date: string;
  weight: number;
  increased?: boolean;
};

export function pickChartPoints<T extends ChartPoint>(points: T[]): T[] {
  const unique = collapseToDates(points);
  if (unique.length <= 5) {
    return unique;
  }

  const first = unique[0];
  const last = unique[unique.length - 1];
  const middle = unique.slice(1, -1);
  const needed = 3;
  const used = new Set<string>([first.date, last.date]);
  const selected: T[] = [];

  const increases = middle.filter((point) => point.increased);
  for (const point of evenlyByTime(increases, Math.min(needed, increases.length))) {
    selected.push(point);
    used.add(point.date);
  }

  const remainingSlots = needed - selected.length;
  if (remainingSlots > 0) {
    const rest = middle.filter((point) => !used.has(point.date));
    selected.push(...evenlyByTime(rest, remainingSlots));
  }

  return [first, ...selected.sort((a, b) => a.date.localeCompare(b.date)), last];
}

function collapseToDates<T extends ChartPoint>(points: T[]): T[] {
  const byDate = new Map<string, T>();
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  for (const point of sorted) {
    const existing = byDate.get(point.date);
    if (!existing) {
      byDate.set(point.date, point);
    } else {
      byDate.set(point.date, {
        ...point,
        increased: Boolean(existing.increased || point.increased),
      });
    }
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function evenlyByTime<T extends ChartPoint>(points: T[], count: number): T[] {
  if (count <= 0 || points.length === 0) {
    return [];
  }
  if (points.length <= count) {
    return points;
  }
  const times = points.map((point) => new Date(`${point.date}T12:00:00`).getTime());
  const start = times[0];
  const end = times[times.length - 1];
  const picked: T[] = [];
  const used = new Set<number>();
  for (let i = 0; i < count; i += 1) {
    const target = count === 1 ? (start + end) / 2 : start + (i / (count - 1)) * (end - start);
    let best = -1;
    let bestDistance = Infinity;
    for (let index = 0; index < points.length; index += 1) {
      if (used.has(index)) {
        continue;
      }
      const distance = Math.abs(times[index] - target);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    }
    if (best >= 0) {
      used.add(best);
      picked.push(points[best]);
    }
  }
  return picked.sort((a, b) => a.date.localeCompare(b.date));
}

export function asChartPoints(history: WorkoutHistoryPoint[]): ChartPoint[] {
  return history;
}
