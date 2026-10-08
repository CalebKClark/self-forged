import * as Haptics from 'expo-haptics';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWallClockCountdown } from '../../hooks/useWallClockCountdown';
import { formatCountdown, formatWeight, parseDecimal } from '../../lib/dates';
import { lastWeekLabel, lastWorkoutChange } from '../../lib/workoutChange';
import {
  hydrateSession,
  nextIncompleteWorkoutId,
  sessionCompletedCount,
} from '../../lib/sessionLogic';
import { GymStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppProvider';
import { ActiveSession, Workout, WorkoutProgress } from '../../types';
import { FieldInput } from '../../ui/FieldInput';
import { PromptModal } from '../../ui/PromptModal';
import { colors } from '../../ui/theme';

type SessionRoute = RouteProp<GymStackParamList, 'Session'>;
type SessionNavigation = NativeStackNavigationProp<GymStackParamList, 'Session'>;

export function SessionScreen() {
  const navigation = useNavigation<SessionNavigation>();
  const { dayId } = useRoute<SessionRoute>().params;
  const {
    state,
    saveSession,
    completeCheckIn,
    logWorkoutHit,
    addWeightToWorkout,
  } = useApp();
  const day = state.splitDays.find((item) => item.id === dayId);
  const workouts = useMemo(() => day?.workouts ?? [], [day]);
  const workoutIds = useMemo(() => workouts.map((item) => item.id), [workouts]);

  const [currentWorkoutId, setCurrentWorkoutId] = useState('');
  const [progress, setProgress] = useState<WorkoutProgress[]>([]);
  const [customOpen, setCustomOpen] = useState(false);
  const [customWeight, setCustomWeight] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const restHandled = useRef(false);
  const didRestore = useRef(false);
  const currentWorkoutIdRef = useRef('');
  const snapshotRef = useRef<ActiveSession | null>(null);

  const workout = workouts.find((item) => item.id === currentWorkoutId);
  const current = progress.find((item) => item.workoutId === currentWorkoutId);
  const phase = current?.phase ?? 'working';
  const setIndex = current?.setIndex ?? 0;
  const restEndsAt = current?.restEndsAt ?? null;
  const completedCount = progress.filter((item) => item.phase === 'complete').length;
  const switchable = workouts.filter((item) => {
    const entry = progress.find((row) => row.workoutId === item.id);
    return item.id !== currentWorkoutId && entry?.phase !== 'complete';
  });
  const sessionDone = hydrated && workouts.length > 0 && completedCount === workouts.length;
  currentWorkoutIdRef.current = currentWorkoutId;

  function patchCurrent(patch: Partial<WorkoutProgress>) {
    const workoutId = currentWorkoutIdRef.current;
    setProgress((list) => list.map((item) => (item.workoutId === workoutId ? { ...item, ...patch } : item)));
  }

  function beginNextSet() {
    if (restHandled.current) {
      return;
    }
    restHandled.current = true;
    setProgress((list) =>
      list.map((item) =>
        item.workoutId === currentWorkoutIdRef.current
          ? { ...item, setIndex: item.setIndex + 1, phase: 'working', restEndsAt: null }
          : item
      )
    );
  }

  const remainingSeconds = useWallClockCountdown(restEndsAt, phase === 'resting', beginNextSet);

  useEffect(() => {
    navigation.setOptions({
      title: day?.name ?? 'Workout',
      headerLeft: sessionDone
        ? undefined
        : () => (
            <Pressable onPress={() => navigation.popToTop()} hitSlop={12} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>Pause</Text>
            </Pressable>
          ),
    });
  }, [day, navigation, sessionDone]);

  useEffect(() => {
    if (didRestore.current || !day) {
      return;
    }
    didRestore.current = true;
    if (workouts.length === 0) {
      saveSession(null);
      setHydrated(true);
      return;
    }
    const snap = hydrateSession(state.activeSession, workouts);
    if (snap && snap.dayId === dayId) {
      let nextProgress = snap.progress;
      const item = nextProgress.find((row) => row.workoutId === snap.currentWorkoutId);
      if (item?.phase === 'resting' && item.restEndsAt && item.restEndsAt <= Date.now()) {
        nextProgress = nextProgress.map((row) =>
          row.workoutId === snap.currentWorkoutId
            ? { ...row, setIndex: row.setIndex + 1, phase: 'working', restEndsAt: null }
            : row
        );
        restHandled.current = true;
      } else {
        restHandled.current = item?.phase !== 'resting';
      }
      currentWorkoutIdRef.current = snap.currentWorkoutId;
      setCurrentWorkoutId(snap.currentWorkoutId);
      setProgress(nextProgress);
    } else {
      setCurrentWorkoutId(workouts[0].id);
      setProgress(
        workouts.map((item) => ({
          workoutId: item.id,
          setIndex: 0,
          phase: 'working' as const,
          restEndsAt: null,
        }))
      );
    }
    setHydrated(true);
  }, [day, dayId, workouts, saveSession, state.activeSession]);

  useEffect(() => {
    if (!hydrated || !currentWorkoutId) {
      return;
    }
    const snap: ActiveSession = { dayId, currentWorkoutId, progress };
    snapshotRef.current = snap;
    if (sessionDone) {
      saveSession(null);
      return;
    }
    saveSession(snap);
  }, [dayId, currentWorkoutId, progress, hydrated, sessionDone, saveSession]);

  useEffect(() => {
    if (!hydrated || sessionDone) {
      return;
    }
    const interval = setInterval(() => {
      if (snapshotRef.current) {
        saveSession(snapshotRef.current);
      }
    }, 4000);
    const appState = AppState.addEventListener('change', (status) => {
      if ((status === 'background' || status === 'inactive') && snapshotRef.current) {
        saveSession(snapshotRef.current);
      }
    });
    return () => {
      clearInterval(interval);
      appState.remove();
    };
  }, [hydrated, sessionDone, saveSession]);

  function restSecondsFor(item: Workout) {
    return item.restMinutes * 60 + item.restSeconds;
  }

  function finishSet() {
    if (!workout || phase === 'complete') {
      return;
    }
    const lastSet = setIndex + 1 >= workout.sets;
    if (lastSet) {
      patchCurrent({ phase: 'askComplete', restEndsAt: null });
      return;
    }
    const rest = restSecondsFor(workout);
    if (rest <= 0) {
      beginNextSet();
      return;
    }
    restHandled.current = false;
    patchCurrent({ restEndsAt: Date.now() + rest * 1000, phase: 'resting' });
  }

  function switchToWorkout(id: string) {
    const item = progress.find((row) => row.workoutId === id);
    if (!item || item.phase === 'complete') {
      return;
    }
    setCustomOpen(false);
    setPickerOpen(false);
    setCurrentWorkoutId(id);
    if (item.phase === 'resting' && item.restEndsAt && item.restEndsAt <= Date.now()) {
      restHandled.current = false;
      currentWorkoutIdRef.current = id;
      beginNextSet();
      return;
    }
    restHandled.current = item.phase !== 'resting';
  }

  function finishCurrentWorkout(increased: boolean, delta = 0) {
    if (workout) {
      logWorkoutHit({
        dayId,
        workoutId: workout.id,
        workoutName: workout.name,
        weight: workout.weight,
        increased,
        delta,
      });
    }
    const nextProgress = progress.map((item) =>
      item.workoutId === currentWorkoutId ? { ...item, phase: 'complete' as const, restEndsAt: null } : item
    );
    const nextSession: ActiveSession = { dayId, currentWorkoutId, progress: nextProgress };
    const nextId = nextIncompleteWorkoutId(nextSession, workoutIds, currentWorkoutId);
    setProgress(nextProgress);
    if (!nextId) {
      completeCheckIn(dayId);
      return;
    }
    setCurrentWorkoutId(nextId);
    restHandled.current = true;
  }

  function applyWeightChange(amount: number) {
    if (!workout) {
      return;
    }
    addWeightToWorkout(dayId, workout.id, amount);
    setCustomOpen(false);
    setCustomWeight('');
    finishCurrentWorkout(amount > 0, amount);
  }

  useEffect(() => {
    if (sessionDone) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [sessionDone]);

  if (!day) {
    return (
      <View style={styles.screen}>
        <Text style={styles.missing}>This day is gone.</Text>
      </View>
    );
  }

  if (workouts.length === 0 || (!sessionDone && !workout && hydrated)) {
    return (
      <View style={styles.screen}>
        <Text style={styles.missing}>This day has no workouts.</Text>
      </View>
    );
  }

  if (sessionDone) {
    return (
      <SafeAreaView style={styles.screen} edges={['bottom']}>
        <View style={styles.middle}>
          <Text style={styles.kicker}>DONE</Text>
          <Text style={styles.headline}>Workout complete</Text>
          <Text style={styles.sub}>Nice work. Your check-in is saved.</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.primaryCta, pressed && styles.pressed]}
          onPress={() => navigation.popToTop()}
        >
          <Text style={styles.primaryCtaText}>Done</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const switcher = (
    <>
      {switchable.length > 0 ? (
        <Pressable
          style={({ pressed }) => [styles.secondaryCta, pressed && styles.pressed]}
          onPress={() => setPickerOpen(true)}
        >
          <Text style={styles.secondaryCtaText}>Do a different workout</Text>
        </Pressable>
      ) : null}
      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.pickerOverlay}>
          <Pressable style={styles.pickerBackdrop} onPress={() => setPickerOpen(false)} />
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Pick a workout</Text>
            <Text style={styles.pickerSub}>Finished ones stay done. Come back to this one later.</Text>
            <ScrollView style={styles.pickerList}>
              {workouts.map((item) => {
                const entry = progress.find((row) => row.workoutId === item.id);
                const done = entry?.phase === 'complete';
                const active = item.id === currentWorkoutId;
                return (
                  <Pressable
                    key={item.id}
                    disabled={done}
                    style={({ pressed }) => [
                      styles.pickerRow,
                      active && styles.pickerRowActive,
                      done && styles.pickerRowDone,
                      pressed && !done && styles.pressed,
                    ]}
                    onPress={() => switchToWorkout(item.id)}
                  >
                    <Text style={styles.pickerName}>{item.name}</Text>
                    <Text style={styles.pickerMeta}>
                      {done
                        ? 'Done'
                        : active
                          ? `Here now · set ${(entry?.setIndex ?? 0) + 1} of ${item.sets}`
                          : (entry?.setIndex ?? 0) > 0
                            ? `Set ${(entry?.setIndex ?? 0) + 1} of ${item.sets}`
                            : 'Not started'}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable
              style={({ pressed }) => [styles.secondaryCta, pressed && styles.pressed]}
              onPress={() => setPickerOpen(false)}
            >
              <Text style={styles.secondaryCtaText}>Keep going here</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );

  if (phase === 'askComplete' && workout) {
    return (
      <Question
        kicker={workout.name}
        title="Did you complete all reps on all sets?"
        onYes={() => patchCurrent({ phase: 'askMoveUp' })}
        onNo={() => patchCurrent({ phase: 'askMoveDown' })}
        extra={switcher}
      />
    );
  }

  if (phase === 'askMoveUp' && workout) {
    return (
      <Question
        kicker={workout.name}
        title="Do you feel ready to move up next week?"
        onYes={() => patchCurrent({ phase: 'askWeight' })}
        onNo={() => finishCurrentWorkout(false)}
        extra={switcher}
      />
    );
  }

  if ((phase === 'askWeight' || phase === 'askWeightDown') && workout) {
    const goingDown = phase === 'askWeightDown';
    const customAmount = parseDecimal(customWeight);
    return (
      <SafeAreaView style={styles.screen} edges={['bottom']}>
        <View style={styles.top}>
          <Text style={styles.kicker}>{workout.name}</Text>
          <Text style={styles.headline}>
            {goingDown
              ? 'How much weight do you wanna drop for next time?'
              : 'How much weight do you wanna add for next time?'}
          </Text>
          <Text style={styles.sub}>Current: {formatWeight(workout.weight)}</Text>
        </View>
        <View style={styles.bottomStack}>
          <Pressable
            style={({ pressed }) => [styles.primaryCta, pressed && styles.pressed]}
            onPress={() => applyWeightChange(goingDown ? -5 : 5)}
          >
            <Text style={styles.primaryCtaText}>{goingDown ? '-5 pounds' : '+5 pounds'}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.primaryCta, pressed && styles.pressed]}
            onPress={() => applyWeightChange(goingDown ? -10 : 10)}
          >
            <Text style={styles.primaryCtaText}>{goingDown ? '-10 pounds' : '+10 pounds'}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.secondaryCta, pressed && styles.pressed]}
            onPress={() => setCustomOpen(true)}
          >
            <Text style={styles.secondaryCtaText}>Custom</Text>
          </Pressable>
          {switcher}
        </View>
        <PromptModal
          visible={customOpen}
          title={goingDown ? 'How much weight do you wanna drop?' : 'How much weight do you wanna add?'}
          confirmLabel={goingDown ? 'Drop' : 'Add'}
          confirmDisabled={customAmount === null || customAmount <= 0}
          confirmColor={colors.gym}
          onCancel={() => {
            setCustomOpen(false);
            setCustomWeight('');
          }}
          onConfirm={() => {
            if (customAmount !== null && customAmount > 0) {
              applyWeightChange(goingDown ? -customAmount : customAmount);
            }
          }}
        >
          <FieldInput
            value={customWeight}
            onChangeText={setCustomWeight}
            placeholder="e.g. 2.5"
            keyboardType="decimal-pad"
            autoFocus
          />
        </PromptModal>
      </SafeAreaView>
    );
  }

  if (phase === 'askMoveDown' && workout) {
    return (
      <Question
        kicker={workout.name}
        title="Want to go down in weight next week?"
        onYes={() => patchCurrent({ phase: 'askWeightDown' })}
        onNo={() => finishCurrentWorkout(false, 0)}
        extra={switcher}
      />
    );
  }

  if (!workout || phase === 'complete') {
    return null;
  }

  if (phase === 'resting') {
    return (
      <SafeAreaView style={styles.screen} edges={['bottom']}>
        <View style={styles.top}>
          <Text style={styles.kicker}>REST</Text>
          <Text style={styles.workoutName}>{workout.name}</Text>
          <Text style={styles.sub}>
            After set {setIndex + 1} of {workout.sets}
          </Text>
        </View>
        <View style={styles.middle}>
          <Text style={styles.timer}>{formatCountdown(remainingSeconds)}</Text>
        </View>
        <View style={styles.bottomStack}>
          <Pressable
            style={({ pressed }) => [styles.secondaryCta, pressed && styles.pressed]}
            onPress={beginNextSet}
          >
            <Text style={styles.secondaryCtaText}>Skip the rest of the timer</Text>
          </Pressable>
          {switcher}
        </View>
      </SafeAreaView>
    );
  }

  const lastWeek = lastWeekLabel(lastWorkoutChange(state.workoutHistory, workout.id, workout.name));

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <View style={styles.top}>
        <Text style={styles.kicker}>
          {completedCount} OF {workouts.length} DONE
        </Text>
        <Text style={styles.workoutName}>{workout.name}</Text>
        <View style={styles.chips}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{formatWeight(workout.weight)}</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              {workout.sets} x {workout.reps}
            </Text>
          </View>
        </View>
        {lastWeek ? <Text style={styles.lastWeek}>{lastWeek}</Text> : null}
      </View>
      <View style={styles.middle}>
        <Text style={styles.setHuge}>{setIndex + 1}</Text>
        <Text style={styles.setOf}>set of {workout.sets}</Text>
        <Text style={styles.begin}>Begin set now</Text>
      </View>
      <View style={styles.bottomStack}>
        <Pressable
          style={({ pressed }) => [styles.primaryCta, pressed && styles.pressed]}
          onPress={finishSet}
        >
          <Text style={styles.primaryCtaText}>Set finished</Text>
        </Pressable>
        {switcher}
      </View>
    </SafeAreaView>
  );
}

function Question({
  kicker,
  title,
  onYes,
  onNo,
  extra,
}: {
  kicker: string;
  title: string;
  onYes: () => void;
  onNo: () => void;
  extra?: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <View style={styles.top}>
        <Text style={styles.kicker}>{kicker}</Text>
      </View>
      <View style={styles.middle}>
        <Text style={styles.headline}>{title}</Text>
      </View>
      <View style={styles.bottomStack}>
        <Pressable style={({ pressed }) => [styles.primaryCta, pressed && styles.pressed]} onPress={onYes}>
          <Text style={styles.primaryCtaText}>Yes</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.secondaryCta, pressed && styles.pressed]} onPress={onNo}>
          <Text style={styles.secondaryCtaText}>No</Text>
        </Pressable>
        {extra}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  top: { paddingTop: 8 },
  middle: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bottomStack: { gap: 12 },
  missing: { fontSize: 16, color: colors.muted },
  headerButton: { paddingHorizontal: 4 },
  headerButtonText: { color: colors.gym, fontSize: 16, fontWeight: '700' },
  kicker: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: colors.gym,
    textAlign: 'center',
    marginBottom: 10,
  },
  workoutName: {
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.text,
    marginBottom: 16,
  },
  lastWeek: {
    marginTop: 14,
    textAlign: 'center',
    color: colors.goldSoft,
    fontSize: 16,
    fontWeight: '700',
  },
  chips: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipText: { color: colors.text, fontSize: 16, fontWeight: '700' },
  setHuge: { fontSize: 120, lineHeight: 128, fontWeight: '800', color: colors.text },
  setOf: { fontSize: 20, color: colors.muted, marginTop: -8 },
  begin: { marginTop: 28, fontSize: 22, fontWeight: '700', color: colors.gym },
  headline: {
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.text,
    lineHeight: 36,
    paddingHorizontal: 8,
  },
  sub: { fontSize: 16, textAlign: 'center', color: colors.muted, marginTop: 12 },
  timer: {
    fontSize: 88,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  primaryCta: {
    backgroundColor: colors.gym,
    borderRadius: 18,
    paddingVertical: 22,
    alignItems: 'center',
  },
  primaryCtaText: { color: colors.text, fontSize: 22, fontWeight: '800' },
  secondaryCta: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  secondaryCtaText: { color: colors.text, fontSize: 18, fontWeight: '700' },
  pickerOverlay: { flex: 1, justifyContent: 'flex-end' },
  pickerBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  pickerCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 28,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 1,
  },
  pickerTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  pickerSub: { marginTop: 6, marginBottom: 14, fontSize: 15, color: colors.muted, lineHeight: 20 },
  pickerList: { marginBottom: 14 },
  pickerRow: {
    backgroundColor: colors.surface2,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerRowActive: { borderColor: colors.gym },
  pickerRowDone: { opacity: 0.45 },
  pickerName: { fontSize: 18, fontWeight: '800', color: colors.text },
  pickerMeta: { marginTop: 4, fontSize: 14, color: colors.muted },
  pressed: { opacity: 0.75 },
});
