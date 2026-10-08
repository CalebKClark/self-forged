import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  currentWeight,
  dayTotals,
  dietForDate,
  DIET_HIT_COPY,
  isDietDaySuccessful,
  mealsOnDate,
  PROTEIN_UNDER_RATIO,
  shouldPromptWeight,
} from '../../lib/dietLogic';
import { formatWeight, parseDecimal } from '../../lib/dates';
import { DietStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppProvider';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { CircularProgress } from '../../ui/CircularProgress';
import { EmptyState, Kicker } from '../../ui/Copy';
import { FieldInput } from '../../ui/FieldInput';
import { PromptModal } from '../../ui/PromptModal';
import { Screen } from '../../ui/Screen';
import { colors } from '../../ui/theme';

type Nav = NativeStackNavigationProp<DietStackParamList, 'DietHome'>;

export function DietHomeScreen() {
  const navigation = useNavigation<Nav>();
  const { state, today, deleteMeal, logWeight, dismissWeightPrompt } = useApp();
  const diet = dietForDate(state, today);
  const weight = currentWeight(state);
  const totals = dayTotals(state.meals, today);
  const meals = mealsOnDate(state.meals, today);
  const [weightOpen, setWeightOpen] = useState(shouldPromptWeight(state, today));
  const [weightText, setWeightText] = useState('');
  const parsedWeight = parseDecimal(weightText);

  if (!diet) {
    return (
      <Screen safeTop>
        <Kicker text="Diet" color={colors.diet} />
        <Text style={styles.title}>Fuel the work.</Text>
        <EmptyState
          title="No diet yet"
          body="Create your first diet with a calorie target and optional protein goal."
        />
        <Button label="Create a diet" color={colors.diet} onPress={() => navigation.navigate('CreateDiet')} />
      </Screen>
    );
  }

  const caloriePct = diet.calorieTarget > 0 ? (totals.calories / diet.calorieTarget) * 100 : 0;
  const proteinPct =
    diet.proteinGoal && diet.proteinGoal > 0 ? (totals.protein / diet.proteinGoal) * 100 : 0;

  return (
    <Screen safeTop>
      <Kicker text="Active diet" color={colors.diet} />
      <Text style={styles.title}>{diet.name}</Text>
      <Text style={styles.weight}>{weight == null ? 'Weight not logged' : formatWeight(weight)}</Text>

      <View style={styles.rings}>
        <CircularProgress
          progress={caloriePct}
          color={colors.diet}
          value={`${Math.round(totals.calories)} / ${diet.calorieTarget}`}
          label="Cal"
          complete={isDietDaySuccessful(state, today)}
        />
        {diet.proteinGoal != null ? (
          <CircularProgress
            progress={proteinPct}
            color={colors.gold}
            value={`${Math.round(totals.protein)} / ${diet.proteinGoal}g`}
            label="Protein"
            complete={totals.protein >= diet.proteinGoal * (1 - PROTEIN_UNDER_RATIO)}
          />
        ) : null}
      </View>
      <Text style={styles.hint}>{DIET_HIT_COPY}</Text>

      <Button
        label="Enter Meal / Snack"
        color={colors.diet}
        onPress={() => navigation.navigate('EnterMeal')}
        style={{ marginBottom: 10 }}
      />
      <Button
        label="Saved meals"
        variant="secondary"
        onPress={() => navigation.navigate('SavedMeals')}
        style={{ marginBottom: 16 }}
      />

      <Text style={styles.section}>Today's meals</Text>
      {meals.length === 0 ? (
        <Text style={styles.muted}>No meals logged yet today.</Text>
      ) : (
        meals.map((meal) => (
          <Card key={meal.id} style={{ marginBottom: 8 }}>
            <View style={styles.mealRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.mealName}>{meal.name ?? 'Meal / snack'}</Text>
                <Text style={styles.muted}>
                  {Math.round(meal.calories)} cal
                  {diet.proteinGoal != null ? ` · ${Math.round(meal.protein)}g protein` : ''}
                </Text>
              </View>
              <Pressable onPress={() => navigation.navigate('EnterMeal', { mealId: meal.id })}>
                <Text style={styles.link}>Edit</Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  Alert.alert('Delete this entry?', undefined, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteMeal(meal.id) },
                  ])
                }
              >
                <Text style={[styles.link, { color: colors.danger }]}>Delete</Text>
              </Pressable>
            </View>
          </Card>
        ))
      )}

      <Button
        label="Weight history / progress"
        variant="secondary"
        onPress={() => navigation.navigate('Weight')}
        style={{ marginTop: 16, marginBottom: 10 }}
      />
      <Button
        label="See past or other created diets"
        variant="secondary"
        onPress={() => navigation.navigate('Diets')}
      />

      <PromptModal
        visible={weightOpen}
        title="Log your weight?"
        message="It's been about a week since your last weigh-in. You can skip this."
        confirmLabel="Log weight"
        cancelLabel="Not now"
        confirmDisabled={parsedWeight === null || parsedWeight <= 0}
        confirmColor={colors.diet}
        onCancel={() => {
          dismissWeightPrompt();
          setWeightOpen(false);
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

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 4,
  },
  weight: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 18,
  },
  rings: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 10,
  },
  hint: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 18,
    fontWeight: '600',
  },
  section: {
    color: colors.muted,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontSize: 12,
    marginBottom: 8,
  },
  muted: {
    color: colors.muted,
    fontSize: 14,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mealName: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
  link: {
    color: colors.diet,
    fontWeight: '800',
  },
});
