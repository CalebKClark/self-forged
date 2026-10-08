import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';

import { parseDecimal } from '../../lib/dates';
import { DietStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppProvider';
import { Button } from '../../ui/Button';
import { FieldInput } from '../../ui/FieldInput';
import { Screen } from '../../ui/Screen';
import { colors } from '../../ui/theme';

type Nav = NativeStackNavigationProp<DietStackParamList, 'EditSavedMeal'>;
type Route = RouteProp<DietStackParamList, 'EditSavedMeal'>;

export function EditSavedMealScreen() {
  const navigation = useNavigation<Nav>();
  const { mealId } = useRoute<Route>().params ?? {};
  const { state, upsertSavedMeal } = useApp();
  const existing = state.savedMeals.find((item) => item.id === mealId);
  const [name, setName] = useState(existing?.name ?? '');
  const [calories, setCalories] = useState(existing ? String(existing.calories) : '');
  const [protein, setProtein] = useState(existing ? String(existing.protein) : '');
  const [note, setNote] = useState(existing?.note ?? '');
  const calorieNum = parseDecimal(calories);
  const proteinNum = protein.trim() === '' ? 0 : parseDecimal(protein);
  const valid = name.trim().length > 0 && calorieNum !== null && calorieNum >= 0 && proteinNum !== null;

  return (
    <Screen>
      <FieldInput label="Name" placeholder="e.g. Chicken rice bowl" value={name} onChangeText={setName} />
      <FieldInput
        label="Calories"
        placeholder="e.g. 650"
        keyboardType="decimal-pad"
        value={calories}
        onChangeText={setCalories}
      />
      <FieldInput
        label="Protein (g)"
        placeholder="e.g. 45"
        keyboardType="decimal-pad"
        value={protein}
        onChangeText={setProtein}
      />
      <FieldInput
        label="Note"
        placeholder="Optional portion notes"
        value={note}
        onChangeText={setNote}
        multiline
      />
      <Button
        label={existing ? 'Save meal' : 'Create saved meal'}
        color={colors.diet}
        disabled={!valid}
        onPress={() => {
          if (!valid || calorieNum === null || proteinNum === null) {
            return;
          }
          upsertSavedMeal({
            id: existing?.id,
            name: name.trim(),
            calories: calorieNum,
            protein: proteinNum,
            note: note.trim(),
          });
          navigation.goBack();
        }}
      />
    </Screen>
  );
}
