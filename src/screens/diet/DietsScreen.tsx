import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, Text } from 'react-native';

import { formatRange, formatWeight } from '../../lib/dates';
import { dietUsageSummary as usageOf } from '../../lib/dietLogic';
import { DietStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppProvider';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Screen } from '../../ui/Screen';
import { colors } from '../../ui/theme';

type Nav = NativeStackNavigationProp<DietStackParamList, 'Diets'>;

export function DietsScreen() {
  const navigation = useNavigation<Nav>();
  const { state, today, switchDiet } = useApp();

  return (
    <Screen>
      <Button
        label="Create new diet"
        color={colors.diet}
        onPress={() => navigation.navigate('CreateDiet')}
        style={{ marginBottom: 16 }}
      />
      {state.diets.map((diet) => {
        const summary = usageOf(state, diet, today);
        const active = diet.id === state.activeDietId;
        const pending = state.pendingDietId === diet.id;
        return (
          <Card
            key={diet.id}
            accent={active ? colors.diet : undefined}
            style={{ marginBottom: 10 }}
            onPress={() => switchDiet(diet.id)}
          >
            <Text style={styles.name}>{diet.name}</Text>
            <Text style={styles.meta}>{formatRange(summary.start, summary.end)}</Text>
            <Text style={styles.meta}>
              {summary.startWeight != null && summary.endWeight != null
                ? `${formatWeight(summary.startWeight)} → ${formatWeight(summary.endWeight)}`
                : 'Weight change unavailable'}
            </Text>
            <Text style={styles.meta}>Last used {summary.lastUsed}</Text>
            {active ? <Text style={styles.flag}>Active now</Text> : null}
            {pending ? <Text style={styles.flag}>Starts tomorrow</Text> : null}
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { color: colors.text, fontSize: 22, fontWeight: '800' },
  meta: { color: colors.muted, marginTop: 4, fontWeight: '600' },
  flag: { color: colors.diet, marginTop: 8, fontWeight: '800' },
});
