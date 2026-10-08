import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { parseDecimal, parsePositiveInt } from '../../lib/dates';
import { DietStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppProvider';
import { Button } from '../../ui/Button';
import { FieldInput } from '../../ui/FieldInput';
import { Screen } from '../../ui/Screen';
import { colors } from '../../ui/theme';

type Nav = NativeStackNavigationProp<DietStackParamList, 'CreateDiet'>;

export function CreateDietScreen() {
  const navigation = useNavigation<Nav>();
  const { createDiet } = useApp();
  const [step, setStep] = useState(0);
  const [weight, setWeight] = useState('');
  const [calories, setCalories] = useState('');
  const [wantProtein, setWantProtein] = useState<boolean | null>(null);
  const [protein, setProtein] = useState('');
  const [name, setName] = useState('');

  const weightNum = parseDecimal(weight);
  const calorieNum = parsePositiveInt(calories);
  const proteinNum = parsePositiveInt(protein);

  function next() {
    if (step === 0 && (weightNum == null || weightNum <= 0)) {
      return;
    }
    if (step === 1 && calorieNum == null) {
      return;
    }
    if (step === 2 && wantProtein === null) {
      return;
    }
    if (step === 3 && wantProtein && proteinNum == null) {
      return;
    }
    if (step === 2 && wantProtein === false) {
      setStep(4);
      return;
    }
    if (step < 4) {
      setStep(step + 1);
      return;
    }
    if (!name.trim() || weightNum == null || calorieNum == null) {
      return;
    }
    createDiet({
      name: name.trim(),
      currentWeight: weightNum,
      calorieTarget: calorieNum,
      proteinGoal: wantProtein ? proteinNum : null,
    });
    navigation.goBack();
  }

  return (
    <Screen>
      {step === 0 ? (
        <>
          <Text style={styles.title}>Current weight</Text>
          <FieldInput
            placeholder="e.g. 190"
            keyboardType="decimal-pad"
            value={weight}
            onChangeText={setWeight}
            autoFocus
          />
        </>
      ) : null}
      {step === 1 ? (
        <>
          <Text style={styles.title}>Daily calorie target</Text>
          <FieldInput
            placeholder="e.g. 2200"
            keyboardType="number-pad"
            value={calories}
            onChangeText={setCalories}
            autoFocus
          />
        </>
      ) : null}
      {step === 2 ? (
        <>
          <Text style={styles.title}>Do you want a daily protein goal?</Text>
          <View style={styles.row}>
            <Pressable
              onPress={() => setWantProtein(true)}
              style={[styles.choice, wantProtein === true && styles.choiceOn]}
            >
              <Text style={styles.choiceText}>Yes</Text>
            </Pressable>
            <Pressable
              onPress={() => setWantProtein(false)}
              style={[styles.choice, wantProtein === false && styles.choiceOn]}
            >
              <Text style={styles.choiceText}>No</Text>
            </Pressable>
          </View>
        </>
      ) : null}
      {step === 3 ? (
        <>
          <Text style={styles.title}>Protein goal (grams)</Text>
          <FieldInput
            placeholder="e.g. 200"
            keyboardType="number-pad"
            value={protein}
            onChangeText={setProtein}
            autoFocus
          />
        </>
      ) : null}
      {step === 4 ? (
        <>
          <Text style={styles.title}>Name this diet</Text>
          <FieldInput placeholder="e.g. Cut" value={name} onChangeText={setName} autoFocus />
        </>
      ) : null}
      <Button
        label={step === 4 ? 'Create diet' : 'Continue'}
        color={colors.diet}
        onPress={next}
        disabled={
          (step === 0 && (weightNum == null || weightNum <= 0)) ||
          (step === 1 && calorieNum == null) ||
          (step === 2 && wantProtein === null) ||
          (step === 3 && proteinNum == null) ||
          (step === 4 && !name.trim())
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  choice: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  choiceOn: {
    borderColor: colors.diet,
  },
  choiceText: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 18,
  },
});
