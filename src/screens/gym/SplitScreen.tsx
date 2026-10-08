import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDayWorkoutMeta } from '../../lib/dayDuration';
import { getActiveRestDays, getPendingRestDays } from '../../lib/gymRest';
import { GymStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppProvider';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { EmptyState } from '../../ui/Copy';
import { FieldInput } from '../../ui/FieldInput';
import { PromptModal } from '../../ui/PromptModal';
import { Screen } from '../../ui/Screen';
import { colors } from '../../ui/theme';

type Nav = NativeStackNavigationProp<GymStackParamList, 'Split'>;

export function SplitScreen() {
  const navigation = useNavigation<Nav>();
  const { state, addSplitDay, setRestDays } = useApp();
  const [nameOpen, setNameOpen] = useState(false);
  const [name, setName] = useState('');
  const [restOpen, setRestOpen] = useState(false);
  const [restValue, setRestValue] = useState(0);
  const neverSet = state.restDaySettings.length === 0;
  const active = getActiveRestDays(state.restDaySettings);
  const pending = getPendingRestDays(state.restDaySettings);

  const restLabel = neverSet
    ? 'Not set yet · 0 this week'
    : pending
      ? `${active} this week · ${pending.restDays} starting next Monday`
      : `${active} rest ${active === 1 ? 'day' : 'days'} this week`;

  return (
    <Screen>
      <Pressable
        onPress={() => {
          setRestValue(neverSet ? 0 : pending?.restDays ?? active);
          setRestOpen(true);
        }}
        style={styles.restBtn}
      >
        <Text style={styles.restTitle}>Set rest days</Text>
        <Text style={styles.restMeta}>{restLabel}</Text>
      </Pressable>

      {state.splitDays.length === 0 ? (
        <EmptyState title="No days yet" body="Add a training day to start building your split." />
      ) : (
        state.splitDays.map((day) => (
          <Card key={day.id} style={{ marginBottom: 10 }} onPress={() => navigation.navigate('Day', { dayId: day.id })}>
            <Text style={styles.name}>{day.name}</Text>
            <Text style={styles.meta}>{formatDayWorkoutMeta(day.workouts)}</Text>
          </Card>
        ))
      )}

      <Button
        label="Add Day"
        color={colors.gym}
        onPress={() => {
          setName('');
          setNameOpen(true);
        }}
        style={{ marginTop: 8 }}
      />

      <NameModal
        visible={nameOpen}
        value={name}
        onChange={setName}
        onCancel={() => setNameOpen(false)}
        onConfirm={() => {
          if (name.trim()) {
            addSplitDay(name);
            setNameOpen(false);
          }
        }}
      />

      <PromptModal
        visible={restOpen}
        title="Rest days per week"
        message={
          neverSet
            ? 'WARNING: once you click okay, any change to rest days per week won\'t take effect until the next calendar week (beginning on Monday).'
            : 'This change will take effect at the beginning of the next calendar week (Monday).'
        }
        confirmLabel="Okay"
        confirmColor={colors.gym}
        onCancel={() => setRestOpen(false)}
        onConfirm={() => {
          setRestDays(restValue);
          setRestOpen(false);
        }}
      >
        <View style={styles.restChoices}>
          {Array.from({ length: 7 }, (_, index) => (
            <Pressable
              key={index}
              onPress={() => setRestValue(index)}
              style={[styles.restChoice, restValue === index && styles.restChoiceOn]}
            >
              <Text style={styles.restChoiceText}>{index}</Text>
            </Pressable>
          ))}
        </View>
      </PromptModal>
    </Screen>
  );
}

function NameModal({
  visible,
  value,
  onChange,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <PromptModal
      visible={visible}
      title="Name this day"
      confirmLabel="Add"
      confirmColor={colors.gym}
      confirmDisabled={!value.trim()}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <FieldInput placeholder="e.g. Push, Legs, Day 1" value={value} onChangeText={onChange} autoFocus />
    </PromptModal>
  );
}

const styles = StyleSheet.create({
  restBtn: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  restTitle: { color: colors.text, fontWeight: '800', fontSize: 16 },
  restMeta: { color: colors.muted, marginTop: 4 },
  name: { color: colors.text, fontSize: 20, fontWeight: '800' },
  meta: { color: colors.muted, marginTop: 4, fontWeight: '600' },
  restChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  restChoice: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  restChoiceOn: { borderColor: colors.gym },
  restChoiceText: { color: colors.text, fontWeight: '800', fontSize: 16 },
});
