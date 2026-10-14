import { Ionicons } from '@expo/vector-icons';
import { CommonActions, CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  currentWeight,
  dietProgress,
  DIET_HIT_COPY,
  isDietDaySuccessful,
  PROTEIN_UNDER_RATIO,
} from '../../lib/dietLogic';
import { formatWeight, parseDecimal } from '../../lib/dates';
import { completedGymDates, computeGymStreak, hasCompletedGymOn } from '../../lib/gymLogic';
import { dailyProgress, monthlyProgress, weeklyProgress } from '../../lib/habitLogic';
import { HomeStackParamList, RootStackParamList, TabsParamList } from '../../navigation/types';
import { useApp } from '../../store/AppProvider';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { CircularProgress } from '../../ui/CircularProgress';
import { Kicker } from '../../ui/Copy';
import { FieldInput } from '../../ui/FieldInput';
import { PromptModal } from '../../ui/PromptModal';
import { Screen } from '../../ui/Screen';
import { StreakVisual } from '../../ui/StreakVisual';
import { colors } from '../../ui/theme';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function periodLine(label: string, done: number, total: number) {
  if (total === 0) {
    return { text: `${label}: No goals`, complete: false };
  }
  if (done >= total) {
    return { text: `${label}: Complete`, complete: true };
  }
  return { text: `${label}: ${done}/${total} complete`, complete: false };
}

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { state, today, logWeight } = useApp();
  const dietReady = Boolean(state.activeDietId);
  const gymUnlocked = state.restDaySettings.length > 0;
  const gymStreak = gymUnlocked
    ? computeGymStreak(completedGymDates(state), state.restDaySettings, today)
    : { current: 0, best: 0 };
  const diet = dietProgress(state, today);
  const dietHit = dietReady && isDietDaySuccessful(state, today);
  const daily = dailyProgress(state, today);
  const weekly = weeklyProgress(state, today);
  const monthly = monthlyProgress(state, today);
  const weight = currentWeight(state);
  const gymDone = hasCompletedGymOn(state, today);
  const loggedToday = state.weights.some((entry) => entry.date === today);
  const [weightOpen, setWeightOpen] = useState(false);
  const [weightText, setWeightText] = useState('');
  const parsedWeight = parseDecimal(weightText);
  const dailyLine = periodLine('Daily', daily.done, daily.total);
  const weeklyLine = periodLine('Weekly', weekly.done, weekly.total);
  const monthlyLine = periodLine('Monthly', monthly.done, monthly.total);
  function openTab(name: keyof TabsParamList) {
    navigation.dispatch(CommonActions.navigate({ name }));
  }

  return (
    <Screen safeTop>
      <Kicker text="Self Forged" />
      <Text style={styles.title}>Build yourself{'\n'}every day.</Text>
      <Text style={styles.sub}>Stay locked in. Separate streaks. One standard.</Text>

      <Card style={{ marginBottom: 10 }} onPress={() => openTab('GymTab')}>
        <StreakVisual
          count={gymStreak.current}
          best={gymStreak.best}
          label="Gym streak"
          accent={colors.gym}
          locked={!gymUnlocked}
          lockedText="Set rest days in View Split"
          compact
        />
        <Text style={[styles.status, { color: gymDone ? colors.success : colors.warning }]}>
          {gymDone ? 'Complete' : 'Incomplete'}
        </Text>
      </Card>

      <Card style={{ marginBottom: 10 }} onPress={() => openTab('DietTab')}>
        <Text style={[styles.cardKicker, { color: colors.diet }]}>Diet</Text>
        {diet ? (
          <>
            <View style={styles.rings}>
              <CircularProgress
                size={112}
                progress={diet.caloriePct}
                color={colors.diet}
                value={`${Math.round(diet.calories)} / ${diet.calorieTarget}`}
                label="Cal"
                complete={dietHit}
              />
              {diet.proteinGoal != null ? (
                <CircularProgress
                  size={112}
                  progress={diet.proteinPct ?? 0}
                  color={colors.gold}
                  value={`${Math.round(diet.protein)} / ${diet.proteinGoal}g`}
                  label="Protein"
                  complete={diet.protein >= diet.proteinGoal * (1 - PROTEIN_UNDER_RATIO)}
                />
              ) : null}
            </View>
            <Text style={[styles.status, { color: dietHit ? colors.success : colors.warning }]}>
              {dietHit ? 'Complete' : 'Incomplete'}
            </Text>
            <Text style={styles.hint}>{DIET_HIT_COPY}</Text>
          </>
        ) : (
          <Text style={styles.lockedMini}>Create a diet to start tracking today.</Text>
        )}
      </Card>

      <Card style={{ marginBottom: 10 }} onPress={() => openTab('TasksTab')}>
        <Text style={[styles.cardKicker, { color: colors.tasks }]}>Daily Tasks</Text>
        <TaskLine line={dailyLine} />
        <TaskLine line={weeklyLine} />
        <TaskLine line={monthlyLine} />
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.cardKicker}>Current weight</Text>
        <Text style={styles.cardValue}>{weight == null ? 'Not logged yet' : formatWeight(weight)}</Text>
        <Text style={[styles.weightMeta, { color: loggedToday ? colors.success : colors.warning }]}>
          {loggedToday ? 'Logged today' : 'Not logged today'}
        </Text>
        {!loggedToday ? (
          <Button
            label="Log weight"
            color={colors.diet}
            onPress={() => setWeightOpen(true)}
            style={{ marginTop: 12 }}
          />
        ) : null}
      </Card>

      <Card style={{ marginBottom: 12 }} onPress={() => navigation.navigate('RecapHistory')}>
        <View style={styles.linkRow}>
          <Text style={styles.link}>Past weekly recaps</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </View>
      </Card>
      <Card onPress={() => navigation.navigate('Settings')}>
        <View style={styles.linkRow}>
          <Text style={styles.link}>Settings, privacy, and data</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </View>
      </Card>

      <PromptModal
        visible={weightOpen}
        title="Log your weight"
        confirmLabel="Save"
        confirmDisabled={parsedWeight === null || parsedWeight <= 0}
        confirmColor={colors.diet}
        onCancel={() => {
          setWeightOpen(false);
          setWeightText('');
        }}
        onConfirm={() => {
          if (parsedWeight && parsedWeight > 0) {
            logWeight(parsedWeight);
            setWeightOpen(false);
            setWeightText('');
          }
        }}
      >
        <FieldInput
          placeholder="e.g. 182"
          keyboardType="decimal-pad"
          value={weightText}
          onChangeText={setWeightText}
        />
      </PromptModal>
    </Screen>
  );
}

function TaskLine({ line }: { line: { text: string; complete: boolean } }) {
  return (
    <View style={styles.taskRow}>
      <Text style={[styles.taskText, line.complete && { color: colors.success }]}>{line.text}</Text>
      {line.complete ? <Ionicons name="checkmark-circle" size={20} color={colors.success} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
    marginBottom: 8,
  },
  sub: {
    color: colors.muted,
    fontSize: 15,
    marginBottom: 20,
  },
  rings: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 8,
  },
  status: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  hint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
  lockedMini: {
    color: colors.muted,
    textAlign: 'center',
    fontWeight: '700',
    paddingVertical: 18,
  },
  cardKicker: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  cardValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  weightMeta: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  taskText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  link: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
