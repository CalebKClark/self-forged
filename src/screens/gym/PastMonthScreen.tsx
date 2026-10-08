import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLayoutEffect } from 'react';
import { StyleSheet, Text } from 'react-native';

import { completedGymDates } from '../../lib/gymLogic';
import { formatLongDate, formatMonthTitle } from '../../lib/dates';
import { GymStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppProvider';
import { CalendarMonth } from '../../ui/CalendarMonth';
import { Card } from '../../ui/Card';
import { Screen } from '../../ui/Screen';
import { colors } from '../../ui/theme';

type Nav = NativeStackNavigationProp<GymStackParamList, 'PastMonth'>;
type Route = RouteProp<GymStackParamList, 'PastMonth'>;

export function PastMonthScreen() {
  const navigation = useNavigation<Nav>();
  const { year, monthIndex } = useRoute<Route>().params;
  const { state } = useApp();
  const prefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  const completed = new Set(
    [...completedGymDates(state)].filter((date) => date.startsWith(prefix))
  );

  useLayoutEffect(() => {
    navigation.setOptions({ title: formatMonthTitle(year, monthIndex) });
  }, [navigation, year, monthIndex]);

  return (
    <Screen>
      <Card style={{ marginBottom: 16 }}>
        <CalendarMonth
          year={year}
          monthIndex={monthIndex}
          completedDates={completed}
          accent={colors.gym}
          showTitle={false}
        />
      </Card>
      {state.splitDays.map((day) => {
        const hits = state.gymVisits.filter(
          (visit) => visit.completed && visit.dayId === day.id && visit.date.startsWith(prefix)
        );
        const last = hits.map((item) => item.date).sort().slice(-1)[0];
        return (
          <Card key={day.id} style={{ marginBottom: 10 }} onPress={() => navigation.navigate('DayCharts', { dayId: day.id })}>
            <Text style={styles.name}>{day.name}</Text>
            <Text style={styles.meta}>
              {hits.length === 1 ? '1 time worked out' : `${hits.length} times worked out`}
            </Text>
            <Text style={styles.meta}>Last hit: {last ? formatLongDate(last) : 'never'}</Text>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { color: colors.text, fontSize: 18, fontWeight: '800' },
  meta: { color: colors.muted, marginTop: 4 },
});
