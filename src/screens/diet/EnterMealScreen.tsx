import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';

import { dietForDate } from '../../lib/dietLogic';
import { parseDecimal } from '../../lib/dates';
import { DietStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppProvider';
import { Button } from '../../ui/Button';
import { FieldInput } from '../../ui/FieldInput';
import { Screen } from '../../ui/Screen';
import { colors } from '../../ui/theme';

type Nav = NativeStackNavigationProp<DietStackParamList, 'EnterMeal'>;
type Route = RouteProp<DietStackParamList, 'EnterMeal'>;

export function EnterMealScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const mealId = route.params?.mealId;
  const { state, today, addMeal, updateMeal } = useApp();
  const diet = dietForDate(state, today);
  const existing = state.meals.find((meal) => meal.id === mealId);
  const [calories, setCalories] = useState(existing ? String(existing.calories) : '');
  const [protein, setProtein] = useState(existing ? String(existing.protein) : '');
  const calorieNum = useMemo(() => (calories.trim() === '' ? 0 : parseDecimal(calories)), [calories]);
  const proteinNum = useMemo(() => (protein.trim() === '' ? 0 : parseDecimal(protein)), [protein]);
  const wantsProtein = diet?.proteinGoal != null;
  const invalid =
    (calories.trim() !== '' && calorieNum === null) ||
    (wantsProtein && protein.trim() !== '' && proteinNum === null);

  function save() {
    if (invalid || calorieNum === null || proteinNum === null) {
      return;
    }
    if (existing) {
      updateMeal(existing.id, { calories: calorieNum, protein: wantsProtein ? proteinNum : existing.protein });
    } else {
      addMeal({ calories: calorieNum, protein: wantsProtein ? proteinNum : 0 });
    }
    navigation.goBack();
  }

  return (
    <Screen>
      <FieldInput
        label="Calories"
        placeholder="Optional"
        keyboardType="decimal-pad"
        value={calories}
        onChangeText={setCalories}
        error={calories.trim() !== '' && calorieNum === null ? 'Enter a valid number' : undefined}
      />
      {wantsProtein ? (
        <FieldInput
          label="Protein (g)"
          placeholder="Optional"
          keyboardType="decimal-pad"
          value={protein}
          onChangeText={setProtein}
          error={protein.trim() !== '' && proteinNum === null ? 'Enter a valid number' : undefined}
        />
      ) : null}
      <Button
        label={existing ? 'Save changes' : 'Add to today'}
        color={colors.diet}
        onPress={save}
        disabled={invalid}
      />
    </Screen>
  );
}
