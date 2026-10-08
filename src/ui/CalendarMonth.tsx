import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatMonthTitle, localDateKey } from '../lib/dates';
import { colors } from './theme';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type CalendarMonthProps = {
  year: number;
  monthIndex: number;
  completedDates: Set<string>;
  showTitle?: boolean;
  accent?: string;
  onPressDate?: (dateKey: string) => void;
};

export function CalendarMonth({
  year,
  monthIndex,
  completedDates,
  showTitle = true,
  accent = colors.success,
  onPressDate,
}: CalendarMonthProps) {
  const todayKey = localDateKey();
  const cells = buildCells(year, monthIndex);

  return (
    <View style={styles.wrap}>
      {showTitle ? <Text style={styles.title}>{formatMonthTitle(year, monthIndex)}</Text> : null}
      <View style={styles.weekRow}>
        {WEEKDAYS.map((label, index) => (
          <Text key={`${label}-${index}`} style={styles.weekday}>
            {label}
          </Text>
        ))}
      </View>
      {chunk(cells, 7).map((row, rowIndex) => (
        <View key={rowIndex} style={styles.weekRow}>
          {row.map((day, cellIndex) => {
            if (day === null) {
              return <View key={`empty-${cellIndex}`} style={styles.cell} />;
            }
            const dateKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const completed = completedDates.has(dateKey);
            const isToday = dateKey === todayKey;
            const inner = (
              <View style={[styles.dayInner, isToday && styles.todayRing]}>
                <Text style={[styles.dayNumber, isToday && { color: accent }]}>{day}</Text>
                <Text style={[styles.check, { color: completed ? accent : 'transparent' }]}>
                  {completed ? '✓' : ' '}
                </Text>
              </View>
            );
            if (!onPressDate) {
              return (
                <View key={dateKey} style={styles.cell}>
                  {inner}
                </View>
              );
            }
            return (
              <Pressable key={dateKey} style={styles.cell} onPress={() => onPressDate(dateKey)}>
                {inner}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function buildCells(year: number, monthIndex: number): Array<number | null> {
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: Array<number | null> = [];
  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 4,
    paddingBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    color: colors.text,
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: colors.muted,
    marginBottom: 8,
    letterSpacing: 0.6,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    minHeight: 50,
    paddingVertical: 2,
  },
  dayInner: {
    alignItems: 'center',
    width: 36,
    borderRadius: 10,
    paddingVertical: 2,
  },
  todayRing: {
    backgroundColor: colors.surface2,
  },
  dayNumber: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
  },
  check: {
    marginTop: 1,
    fontSize: 13,
    fontWeight: '800',
    height: 16,
  },
});
