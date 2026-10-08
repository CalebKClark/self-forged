import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, Text } from 'react-native';

import { formatMonthTitle } from '../../lib/dates';
import { GymStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppProvider';
import { Card } from '../../ui/Card';
import { EmptyState } from '../../ui/Copy';
import { Screen } from '../../ui/Screen';
import { colors } from '../../ui/theme';

type Nav = NativeStackNavigationProp<GymStackParamList, 'PastMonths'>;

export function PastMonthsScreen() {
  const navigation = useNavigation<Nav>();
  const { state } = useApp();
  const counts = new Map<string, number>();
  for (const visit of state.gymVisits.filter((item) => item.completed)) {
    const key = visit.date.slice(0, 7);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const months = [...counts.keys()].sort((a, b) => b.localeCompare(a));

  if (months.length === 0) {
    return (
      <Screen>
        <EmptyState title="No completed workouts saved yet." />
      </Screen>
    );
  }

  return (
    <Screen>
      {months.map((key) => {
        const [year, month] = key.split('-').map(Number);
        const count = counts.get(key) ?? 0;
        return (
          <Card
            key={key}
            style={{ marginBottom: 10 }}
            onPress={() => navigation.navigate('PastMonth', { year, monthIndex: month - 1 })}
          >
            <Text style={styles.row}>
              {formatMonthTitle(year, month - 1)} · {count === 1 ? '1 gym day' : `${count} gym days`}
            </Text>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { color: colors.text, fontWeight: '800', fontSize: 16 },
});
