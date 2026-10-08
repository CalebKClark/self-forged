export function streakTier(count: number): 0 | 1 | 2 | 3 | 4 | 5 | 10 | 20 | 30 {
  if (count >= 30) {
    return 30;
  }
  if (count >= 20) {
    return 20;
  }
  if (count >= 10) {
    return 10;
  }
  if (count >= 5) {
    return 5;
  }
  if (count >= 4) {
    return 4;
  }
  if (count >= 3) {
    return 3;
  }
  if (count >= 2) {
    return 2;
  }
  if (count >= 1) {
    return 1;
  }
  return 0;
}

export function streakLabel(count: number, locked?: boolean, emptyBest?: boolean): string {
  if (locked) {
    return 'Locked';
  }
  if (emptyBest && count <= 0) {
    return 'None';
  }
  return String(count);
}
