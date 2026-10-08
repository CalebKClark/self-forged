import { LinearGradient } from 'expo-linear-gradient';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { addDays, formatPercent, formatRange } from '../../lib/dates';
import { buildWeeklyRecap } from '../../lib/recapLogic';
import { formatSignedPounds, gymProgressDays } from '../../lib/workoutChange';
import { RootStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppProvider';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { ConfettiBurst } from '../../ui/ConfettiBurst';
import { colors } from '../../ui/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'WeeklyRecap'>;
type Route = RouteProp<RootStackParamList, 'WeeklyRecap'>;

export function WeeklyRecapScreen() {
  const navigation = useNavigation<Nav>();
  const { weekStart } = useRoute<Route>().params;
  const { state, markRecapShown } = useApp();
  const recap = state.weeklyRecaps.find((item) => item.weekStart === weekStart) ?? buildWeeklyRecap(state, weekStart);
  const progressDays = useMemo(() => gymProgressDays(state, weekStart), [state, weekStart]);
  const [page, setPage] = useState(0);
  const celebration = page > 0 ? progressDays[page - 1] : null;

  useEffect(() => {
    markRecapShown(weekStart, recap);
  }, [weekStart]);

  function advance() {
    if (page < progressDays.length) {
      setPage(page + 1);
      return;
    }
    navigation.goBack();
  }

  if (celebration) {
    return (
      <LinearGradient colors={[colors.bg, '#120E08', colors.bg]} style={styles.screen}>
        <ConfettiBurst play />
        <Text style={styles.kicker}>PROGRESS</Text>
        <Text style={styles.title}>{celebration.dayName}</Text>
        <View style={{ marginTop: 28 }}>
          {celebration.lifts.map((lift) => (
            <Text key={`${lift.name}-${lift.delta}`} style={styles.lift}>
              {formatSignedPounds(lift.delta)} on {lift.name}!
            </Text>
          ))}
        </View>
        <View style={{ marginTop: 'auto' }}>
          <Button
            label={page < progressDays.length ? 'Next' : 'Continue'}
            color={colors.gold}
            onPress={advance}
          />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.bg, '#120E08', colors.bg]} style={styles.screen}>
      <Text style={styles.kicker}>WEEKLY RECAP</Text>
      <Text style={styles.title}>Last week's work</Text>
      <Text style={styles.range}>{formatRange(weekStart, addDays(weekStart, 6))}</Text>
      <Card style={{ marginTop: 24, marginBottom: 12 }} accent={colors.diet}>
        <Text style={styles.rowLabel}>Diet</Text>
        <Text style={[styles.rowValue, { color: colors.diet }]}>{formatPercent(recap.dietPercent)}</Text>
        <Text style={styles.weightLine}>
          {recap.weightChange == null
            ? 'No weigh-in this week'
            : `Weight ${formatSignedPounds(recap.weightChange)}`}
        </Text>
      </Card>
      <Card style={{ marginBottom: 12 }} accent={colors.gym}>
        <Text style={styles.rowLabel}>Gym</Text>
        <Text style={[styles.rowValue, { color: colors.gym }]}>{formatPercent(recap.gymPercent)}</Text>
      </Card>
      <Card style={{ marginBottom: 24 }} accent={colors.tasks}>
        <Text style={styles.rowLabel}>Daily Goals</Text>
        <Text style={[styles.rowValue, { color: colors.tasks }]}>{formatPercent(recap.dailyPercent)}</Text>
      </Card>
      <Text style={styles.scoreLabel}>Weekly Score</Text>
      <Text style={styles.score}>{formatPercent(recap.overall)}</Text>
      <Text style={styles.quote}>I'm building myself every day.</Text>
      <View style={{ marginTop: 32 }}>
        <Button
          label={progressDays.length > 0 ? 'See what went up' : 'Continue'}
          color={colors.gold}
          onPress={advance}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 32,
  },
  kicker: {
    color: colors.gold,
    fontWeight: '800',
    letterSpacing: 2,
    fontSize: 13,
  },
  title: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '800',
    marginTop: 8,
  },
  range: {
    color: colors.muted,
    marginTop: 6,
    fontSize: 16,
  },
  rowLabel: {
    color: colors.muted,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  rowValue: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: 6,
  },
  weightLine: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  lift: {
    color: colors.gold,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 36,
    marginBottom: 10,
  },
  scoreLabel: {
    textAlign: 'center',
    color: colors.muted,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  score: {
    textAlign: 'center',
    color: colors.gold,
    fontSize: 56,
    fontWeight: '800',
    marginTop: 4,
  },
  quote: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: 10,
    fontStyle: 'italic',
  },
});
