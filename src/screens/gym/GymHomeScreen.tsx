import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, Text } from 'react-native';

import { completedGymDates, computeGymStreak, hasCompletedGymOn } from '../../lib/gymLogic';
import { sessionCompletedCount } from '../../lib/sessionLogic';
import { GymStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppProvider';
import { Button } from '../../ui/Button';
import { CalendarMonth } from '../../ui/CalendarMonth';
import { Card } from '../../ui/Card';
import { Kicker } from '../../ui/Copy';
import { Screen } from '../../ui/Screen';
import { StreakVisual } from '../../ui/StreakVisual';
import { colors } from '../../ui/theme';

type Nav = NativeStackNavigationProp<GymStackParamList, 'GymHome'>;

export function GymHomeScreen() {
  const navigation = useNavigation<Nav>();
  const { state, today, discardSession } = useApp();
  const unlocked = state.restDaySettings.length > 0;
  const streak = unlocked
    ? computeGymStreak(completedGymDates(state), state.restDaySettings, today)
    : { current: 0, best: 0 };
  const completedToday = hasCompletedGymOn(state, today);
  const session = state.activeSession;
  const pausedDay = session ? state.splitDays.find((day) => day.id === session.dayId) : undefined;
  const showPaused = Boolean(session && pausedDay && pausedDay.workouts.length > 0);
  const now = new Date();
  const completedDates = completedGymDates(state);

  return (
    <Screen safeTop>
      <Kicker text="Ultimate Workout Controller" color={colors.gym} />
      <Text style={styles.title}>Train with intent.</Text>
      <Card style={{ marginBottom: 16 }}>
        <StreakVisual
          count={streak.current}
          best={streak.best}
          label="Gym streak"
          accent={colors.gym}
          locked={!unlocked}
          lockedText={'To unlock streaks set up your rest days in "View Split"'}
        />
      </Card>

      {completedToday ? (
        <Card accent={colors.success} style={{ marginBottom: 12 }}>
          <Text style={styles.done}>Workout Completed Today</Text>
        </Card>
      ) : null}

      {showPaused ? (
        <Card accent={colors.gym} style={{ marginBottom: 12 }}>
          <Text style={styles.paused}>PAUSED</Text>
          <Text style={styles.pausedTitle}>{pausedDay?.name}</Text>
          <Text style={styles.pausedBody}>
            {sessionCompletedCount(session)} of {pausedDay?.workouts.length} workouts done. Look around if you
            want, then come back.
          </Text>
          <Button
            label="Resume Workout"
            color={colors.gym}
            onPress={() => navigation.navigate('Session', { dayId: session!.dayId })}
            style={{ marginTop: 12 }}
          />
          <Button label="Discard workout" variant="ghost" color={colors.danger} onPress={discardSession} />
        </Card>
      ) : (
        <Button
          label="Check In"
          color={colors.gym}
          disabled={completedToday}
          onPress={() => navigation.navigate('CheckIn')}
          style={{ marginBottom: 10 }}
        />
      )}

      <Button
        label="View Split"
        variant="secondary"
        onPress={() => navigation.navigate('Split')}
        style={{ marginBottom: 10 }}
      />
      <Button
        label="Stats"
        variant="secondary"
        onPress={() => navigation.navigate('Stats')}
        style={{ marginBottom: 10 }}
      />
      <Button
        label="Import old gym data"
        variant="secondary"
        onPress={() => navigation.navigate('GymImport')}
        style={{ marginBottom: 16 }}
      />
      <Card>
        <CalendarMonth
          year={now.getFullYear()}
          monthIndex={now.getMonth()}
          completedDates={completedDates}
          accent={colors.gym}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 16,
  },
  done: {
    color: colors.success,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  paused: {
    color: colors.gym,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  pausedTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 6,
  },
  pausedBody: {
    color: colors.muted,
    marginTop: 8,
    lineHeight: 20,
  },
});
