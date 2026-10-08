import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { currentWeight } from '../../lib/dietLogic';
import { formatWeight, parseDecimal } from '../../lib/dates';
import { useApp } from '../../store/AppProvider';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { FieldInput } from '../../ui/FieldInput';
import { PromptModal } from '../../ui/PromptModal';
import { Screen } from '../../ui/Screen';
import { WeightChart } from '../../ui/WeightChart';
import { colors } from '../../ui/theme';

export function WeightScreen() {
  const { state, today, logWeight } = useApp();
  const weight = currentWeight(state);
  const todayEntry = state.weights.find((item) => item.date === today);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(todayEntry ? String(todayEntry.weight) : '');
  const parsed = parseDecimal(value);
  const points = [...state.weights]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => ({ id: item.date, date: item.date, weight: item.weight }));

  return (
    <Screen>
      <Card style={{ marginBottom: 16 }}>
        <Text style={styles.label}>Current weight</Text>
        <Text style={styles.value}>{weight == null ? 'Not logged yet' : formatWeight(weight)}</Text>
      </Card>
      <Button
        label={todayEntry ? "Replace today's weight" : 'Log weight'}
        color={colors.diet}
        onPress={() => setOpen(true)}
        style={{ marginBottom: 16 }}
      />
      <WeightChart title="Weight over time" points={points} accent={colors.diet} />
      <PromptModal
        visible={open}
        title={todayEntry ? "Replace today's weight?" : 'Log weight'}
        message={todayEntry ? 'You can only keep one weight per day. This will replace today’s entry.' : undefined}
        confirmLabel="Save"
        confirmColor={colors.diet}
        confirmDisabled={parsed === null || parsed <= 0}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          if (parsed && parsed > 0) {
            logWeight(parsed);
            setOpen(false);
          }
        }}
      >
        <FieldInput
          placeholder="e.g. 182.4"
          keyboardType="decimal-pad"
          value={value}
          onChangeText={setValue}
        />
      </PromptModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.muted,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  value: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 6,
  },
});
