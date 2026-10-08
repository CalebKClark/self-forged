import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { DietStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppProvider';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { EmptyState } from '../../ui/Copy';
import { Screen } from '../../ui/Screen';
import { colors } from '../../ui/theme';

type Nav = NativeStackNavigationProp<DietStackParamList, 'SavedMeals'>;

export function SavedMealsScreen() {
  const navigation = useNavigation<Nav>();
  const { state, addMeal, deleteSavedMeal } = useApp();

  return (
    <Screen>
      <Button
        label="Create saved meal"
        color={colors.diet}
        onPress={() => navigation.navigate('EditSavedMeal')}
        style={{ marginBottom: 16 }}
      />
      {state.savedMeals.length === 0 ? (
        <EmptyState title="No saved meals yet" body="Save meals you eat often so you can add them in one tap." />
      ) : (
        state.savedMeals.map((meal) => (
          <Card key={meal.id} style={{ marginBottom: 10 }}>
            <Text style={styles.name}>{meal.name}</Text>
            <Text style={styles.meta}>
              {Math.round(meal.calories)} cal · {Math.round(meal.protein)}g protein
            </Text>
            {meal.note ? <Text style={styles.note}>{meal.note}</Text> : null}
            <View style={styles.row}>
              <Pressable
                onPress={() => {
                  addMeal({
                    calories: meal.calories,
                    protein: meal.protein,
                    savedMealId: meal.id,
                    name: meal.name,
                  });
                  navigation.navigate('DietHome');
                }}
              >
                <Text style={styles.link}>Add to today</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate('EditSavedMeal', { mealId: meal.id })}>
                <Text style={styles.link}>Edit</Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  Alert.alert('Delete saved meal?', undefined, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteSavedMeal(meal.id) },
                  ])
                }
              >
                <Text style={[styles.link, { color: colors.danger }]}>Delete</Text>
              </Pressable>
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { color: colors.text, fontSize: 18, fontWeight: '800' },
  meta: { color: colors.muted, marginTop: 4, fontWeight: '600' },
  note: { color: colors.muted, marginTop: 6, fontSize: 14 },
  row: { flexDirection: 'row', gap: 16, marginTop: 12 },
  link: { color: colors.diet, fontWeight: '800' },
});
