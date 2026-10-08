import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLayoutEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';

import { formatRest, parseDecimal, parsePositiveInt } from '../../lib/dates';
import { GymStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppProvider';
import { Workout } from '../../types';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { EmptyState } from '../../ui/Copy';
import { FieldInput } from '../../ui/FieldInput';
import { PromptModal } from '../../ui/PromptModal';
import { RestTimePicker } from '../../ui/RestTimePicker';
import { Screen } from '../../ui/Screen';
import { colors } from '../../ui/theme';

type Nav = NativeStackNavigationProp<GymStackParamList, 'Day'>;
type Route = RouteProp<GymStackParamList, 'Day'>;

export function DayScreen() {
  const navigation = useNavigation<Nav>();
  const { dayId } = useRoute<Route>().params;
  const { state, addWorkout, updateWorkout, deleteWorkout, renameSplitDay, deleteSplitDay } = useApp();
  const day = state.splitDays.find((item) => item.id === dayId);
  const [wizard, setWizard] = useState(0);
  const [edit, setEdit] = useState<Workout | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [restM, setRestM] = useState(1);
  const [restS, setRestS] = useState(30);

  useLayoutEffect(() => {
    navigation.setOptions({ title: day?.name ?? 'Day' });
  }, [day, navigation]);

  if (!day) {
    return (
      <Screen>
        <EmptyState title="This day was deleted." />
      </Screen>
    );
  }

  function resetWizard() {
    setWizard(0);
    setEdit(null);
    setName('');
    setWeight('');
    setSets('');
    setReps('');
    setRestM(1);
    setRestS(30);
  }

  function startEdit(workout: Workout) {
    setEdit(workout);
    setName(workout.name);
    setWeight(String(workout.weight));
    setSets(String(workout.sets));
    setReps(String(workout.reps));
    setRestM(workout.restMinutes);
    setRestS(workout.restSeconds);
    setWizard(5);
  }

  const weightNum = parseDecimal(weight);
  const setsNum = parsePositiveInt(sets);
  const repsNum = parsePositiveInt(reps);

  return (
    <Screen>
      {day.workouts.length === 0 ? (
        <EmptyState title="No workouts on this day yet." />
      ) : (
        day.workouts.map((workout) => (
          <Card key={workout.id} style={{ marginBottom: 10 }} onPress={() => startEdit(workout)}>
            <Text style={styles.name}>{workout.name}</Text>
            <Text style={styles.meta}>
              {workout.weight} lbs · {workout.sets} sets x {workout.reps} reps · rest {formatRest(workout.restMinutes, workout.restSeconds)}
            </Text>
          </Card>
        ))
      )}
      <Button label="Add workout" color={colors.gym} onPress={() => setWizard(1)} style={{ marginTop: 8 }} />
      <Button label="Rename day" variant="secondary" onPress={() => { setName(day.name); setRenameOpen(true); }} style={{ marginTop: 10 }} />
      <Button
        label="Delete day"
        variant="ghost"
        color={colors.danger}
        onPress={() =>
          Alert.alert('Delete this day?', undefined, [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => {
                deleteSplitDay(day.id);
                navigation.goBack();
              },
            },
          ])
        }
      />

      <PromptModal
        visible={wizard === 1}
        title="Name this workout"
        confirmLabel="Next"
        confirmColor={colors.gym}
        confirmDisabled={!name.trim()}
        onCancel={resetWizard}
        onConfirm={() => setWizard(2)}
      >
        <FieldInput placeholder="e.g. Bench Press" value={name} onChangeText={setName} autoFocus />
      </PromptModal>
      <PromptModal
        visible={wizard === 2}
        title="What is your working set weight?"
        confirmLabel="Next"
        confirmColor={colors.gym}
        confirmDisabled={weightNum === null}
        onCancel={resetWizard}
        onConfirm={() => setWizard(3)}
      >
        <FieldInput placeholder="e.g. 135" keyboardType="decimal-pad" value={weight} onChangeText={setWeight} autoFocus />
      </PromptModal>
      <PromptModal
        visible={wizard === 3}
        title="Sets and reps"
        confirmLabel="Next"
        confirmColor={colors.gym}
        confirmDisabled={setsNum === null || repsNum === null}
        onCancel={resetWizard}
        onConfirm={() => setWizard(4)}
      >
        <FieldInput label="Sets" placeholder="e.g. 3" keyboardType="number-pad" value={sets} onChangeText={setSets} />
        <FieldInput label="Reps" placeholder="e.g. 8" keyboardType="number-pad" value={reps} onChangeText={setReps} />
      </PromptModal>
      <PromptModal
        visible={wizard === 4}
        title="Rest between sets"
        confirmLabel="Add"
        confirmColor={colors.gym}
        onCancel={resetWizard}
        onConfirm={() => {
          if (!name.trim() || weightNum === null || setsNum === null || repsNum === null) {
            return;
          }
          addWorkout(day.id, {
            name: name.trim(),
            weight: weightNum,
            sets: setsNum,
            reps: repsNum,
            restMinutes: restM,
            restSeconds: restS,
          });
          resetWizard();
        }}
      >
        <RestTimePicker minutes={restM} seconds={restS} onChange={(m, s) => { setRestM(m); setRestS(s); }} />
      </PromptModal>
      <PromptModal
        visible={wizard === 5 && edit !== null}
        title="Edit workout"
        confirmLabel="Save changes"
        confirmColor={colors.gym}
        confirmDisabled={!name.trim() || weightNum === null || setsNum === null || repsNum === null}
        onCancel={resetWizard}
        onConfirm={() => {
          if (!edit || !name.trim() || weightNum === null || setsNum === null || repsNum === null) {
            return;
          }
          updateWorkout(day.id, {
            ...edit,
            name: name.trim(),
            weight: weightNum,
            sets: setsNum,
            reps: repsNum,
            restMinutes: restM,
            restSeconds: restS,
          });
          resetWizard();
        }}
      >
        <FieldInput label="Name" value={name} onChangeText={setName} />
        <FieldInput label="Weight" keyboardType="decimal-pad" value={weight} onChangeText={setWeight} />
        <FieldInput label="Sets" keyboardType="number-pad" value={sets} onChangeText={setSets} />
        <FieldInput label="Reps" keyboardType="number-pad" value={reps} onChangeText={setReps} />
        <RestTimePicker minutes={restM} seconds={restS} onChange={(m, s) => { setRestM(m); setRestS(s); }} />
        <Pressable
          onPress={() => {
            if (!edit) {
              return;
            }
            Alert.alert('Delete workout?', undefined, [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  deleteWorkout(day.id, edit.id);
                  resetWizard();
                },
              },
            ]);
          }}
        >
          <Text style={styles.delete}>Delete workout</Text>
        </Pressable>
      </PromptModal>
      <PromptModal
        visible={renameOpen}
        title="Rename day"
        confirmLabel="Save"
        confirmColor={colors.gym}
        confirmDisabled={!name.trim()}
        onCancel={() => setRenameOpen(false)}
        onConfirm={() => {
          renameSplitDay(day.id, name);
          setRenameOpen(false);
        }}
      >
        <FieldInput value={name} onChangeText={setName} />
      </PromptModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { color: colors.text, fontSize: 18, fontWeight: '800' },
  meta: { color: colors.muted, marginTop: 4 },
  delete: { color: colors.danger, fontWeight: '800', textAlign: 'center', marginTop: 8 },
});
