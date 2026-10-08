import { StyleSheet, Text } from 'react-native';

import { addDays, formatPercent, formatRange } from '../../lib/dates';
import { formatSignedPounds } from '../../lib/workoutChange';
import { useApp } from '../../store/AppProvider';
import { Card } from '../../ui/Card';
import { EmptyState } from '../../ui/Copy';
import { Screen } from '../../ui/Screen';
import { colors } from '../../ui/theme';

export function RecapHistoryScreen() {
  const { state } = useApp();
  const recaps = [...state.weeklyRecaps].sort((a, b) => b.weekStart.localeCompare(a.weekStart));

  return (
    <Screen>
      {recaps.length === 0 ? (
        <EmptyState title="No recaps yet" body="A full weekly recap appears the first time you open the app on Monday." />
      ) : (
        recaps.map((recap) => (
          <Card key={recap.weekStart} style={{ marginBottom: 12 }}>
            <Text style={styles.range}>{formatRange(recap.weekStart, addDays(recap.weekStart, 6))}</Text>
            <Text style={styles.score}>Weekly Score {formatPercent(recap.overall)}</Text>
            <Text style={styles.meta}>
              Diet {formatPercent(recap.dietPercent)} · Gym {formatPercent(recap.gymPercent)} · Daily Goals{' '}
              {formatPercent(recap.dailyPercent)}
            </Text>
            {recap.weightChange !== undefined ? (
              <Text style={styles.meta}>
                {recap.weightChange == null
                  ? 'No weigh-in that week'
                  : `Weight ${formatSignedPounds(recap.weightChange)}`}
              </Text>
            ) : null}
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  range: { color: colors.muted, fontWeight: '700' },
  score: { color: colors.gold, fontSize: 22, fontWeight: '800', marginTop: 6 },
  meta: { color: colors.muted, marginTop: 6 },
});
