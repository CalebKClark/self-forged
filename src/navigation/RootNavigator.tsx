import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { acceptDisclaimer, getDisclaimerAccepted } from '../legal/acceptance';

import { recapDue } from '../lib/recapLogic';
import { CheckInScreen } from '../screens/gym/CheckInScreen';
import { DayChartsScreen } from '../screens/gym/DayChartsScreen';
import { DayScreen } from '../screens/gym/DayScreen';
import { GymHomeScreen } from '../screens/gym/GymHomeScreen';
import { GymImportScreen } from '../screens/gym/GymImportScreen';
import { PastMonthScreen } from '../screens/gym/PastMonthScreen';
import { PastMonthsScreen } from '../screens/gym/PastMonthsScreen';
import { SessionScreen } from '../screens/gym/SessionScreen';
import { SplitScreen } from '../screens/gym/SplitScreen';
import { StatsScreen } from '../screens/gym/StatsScreen';
import { CreateDietScreen } from '../screens/diet/CreateDietScreen';
import { DietHomeScreen } from '../screens/diet/DietHomeScreen';
import { DietsScreen } from '../screens/diet/DietsScreen';
import { EditSavedMealScreen } from '../screens/diet/EditSavedMealScreen';
import { EnterMealScreen } from '../screens/diet/EnterMealScreen';
import { SavedMealsScreen } from '../screens/diet/SavedMealsScreen';
import { WeightScreen } from '../screens/diet/WeightScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { DisclaimerScreen } from '../screens/legal/DisclaimerScreen';
import { LegalDocumentScreen } from '../screens/legal/LegalDocumentScreen';
import { SettingsScreen } from '../screens/legal/SettingsScreen';
import { RecapHistoryScreen } from '../screens/recap/RecapHistoryScreen';
import { WeeklyRecapScreen } from '../screens/recap/WeeklyRecapScreen';
import { CreateHabitScreen } from '../screens/tasks/CreateHabitScreen';
import { DailyHistoryScreen } from '../screens/tasks/DailyHistoryScreen';
import { HabitDetailScreen } from '../screens/tasks/HabitDetailScreen';
import { TasksHomeScreen } from '../screens/tasks/TasksHomeScreen';
import { useApp } from '../store/AppProvider';
import { colors, navTheme } from '../ui/theme';
import {
  DietStackParamList,
  GymStackParamList,
  HomeStackParamList,
  RootStackParamList,
  TabsParamList,
  TasksStackParamList,
} from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabsParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const DietStack = createNativeStackNavigator<DietStackParamList>();
const GymStack = createNativeStackNavigator<GymStackParamList>();
const TasksStack = createNativeStackNavigator<TasksStackParamList>();

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
    primary: colors.gold,
  },
};

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={navTheme}>
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <HomeStack.Screen
        name="RecapHistory"
        component={RecapHistoryScreen}
        options={{ title: 'Weekly Recaps' }}
      />
      <HomeStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <HomeStack.Screen
        name="Legal"
        component={LegalDocumentScreen}
        options={({ route }) => ({
          title: route.params.kind === 'privacy' ? 'Privacy Policy' : 'Terms',
        })}
      />
    </HomeStack.Navigator>
  );
}

function DietNavigator() {
  return (
    <DietStack.Navigator screenOptions={navTheme}>
      <DietStack.Screen name="DietHome" component={DietHomeScreen} options={{ headerShown: false }} />
      <DietStack.Screen name="CreateDiet" component={CreateDietScreen} options={{ title: 'New Diet' }} />
      <DietStack.Screen name="EnterMeal" component={EnterMealScreen} options={{ title: 'Enter Meal' }} />
      <DietStack.Screen name="SavedMeals" component={SavedMealsScreen} options={{ title: 'Saved Meals' }} />
      <DietStack.Screen
        name="EditSavedMeal"
        component={EditSavedMealScreen}
        options={{ title: 'Saved Meal' }}
      />
      <DietStack.Screen name="Diets" component={DietsScreen} options={{ title: 'Your Diets' }} />
      <DietStack.Screen name="Weight" component={WeightScreen} options={{ title: 'Weight Progress' }} />
    </DietStack.Navigator>
  );
}

function GymNavigator() {
  return (
    <GymStack.Navigator screenOptions={navTheme}>
      <GymStack.Screen name="GymHome" component={GymHomeScreen} options={{ headerShown: false }} />
      <GymStack.Screen name="CheckIn" component={CheckInScreen} options={{ title: 'Check In' }} />
      <GymStack.Screen name="Session" component={SessionScreen} options={{ title: 'Workout' }} />
      <GymStack.Screen name="Split" component={SplitScreen} options={{ title: 'View Split' }} />
      <GymStack.Screen name="Day" component={DayScreen} options={{ title: 'Day' }} />
      <GymStack.Screen name="Stats" component={StatsScreen} options={{ title: 'Stats' }} />
      <GymStack.Screen name="PastMonths" component={PastMonthsScreen} options={{ title: 'Past months' }} />
      <GymStack.Screen name="PastMonth" component={PastMonthScreen} options={{ title: 'Month' }} />
      <GymStack.Screen name="DayCharts" component={DayChartsScreen} options={{ title: 'Charts' }} />
      <GymStack.Screen
        name="GymImport"
        component={GymImportScreen}
        options={{ title: 'Import gym data' }}
      />
    </GymStack.Navigator>
  );
}

function TasksNavigator() {
  return (
    <TasksStack.Navigator screenOptions={navTheme}>
      <TasksStack.Screen name="TasksHome" component={TasksHomeScreen} options={{ headerShown: false }} />
      <TasksStack.Screen
        name="CreateHabit"
        component={CreateHabitScreen}
        options={{ title: 'Create Habit' }}
      />
      <TasksStack.Screen name="HabitDetail" component={HabitDetailScreen} options={{ title: 'Habit' }} />
      <TasksStack.Screen
        name="DailyHistory"
        component={DailyHistoryScreen}
        options={{ title: 'Daily Goals' }}
      />
    </TasksStack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="HomeTab"
        component={HomeNavigator}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="flash" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="DietTab"
        component={DietNavigator}
        options={{
          title: 'Diet',
          tabBarIcon: ({ color, size }) => <Ionicons name="nutrition" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="GymTab"
        component={GymNavigator}
        options={{
          title: 'Gym',
          tabBarIcon: ({ color, size }) => <Ionicons name="barbell" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="TasksTab"
        component={TasksNavigator}
        options={{
          title: 'Daily Tasks',
          tabBarIcon: ({ color, size }) => <Ionicons name="checkmark-done" size={size} color={color} />,
        }}
      />
    </Tabs.Navigator>
  );
}

function TabsWithRecap() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { state, today } = useApp();
  const due = recapDue(state, today);
  const shown = useRef<string | null>(null);

  useEffect(() => {
    if (due && shown.current !== due) {
      shown.current = due;
      navigation.navigate('WeeklyRecap', { weekStart: due });
    }
  }, [due, navigation]);

  return <TabNavigator />;
}

export function RootNavigator() {
  const { ready } = useApp();
  const [disclaimerReady, setDisclaimerReady] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getDisclaimerAccepted().then((value) => {
      if (!cancelled) {
        setAccepted(value);
        setDisclaimerReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready || !disclaimerReady) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (!accepted) {
    return (
      <DisclaimerScreen
        onAccept={() => {
          void acceptDisclaimer().then(() => setAccepted(true));
        }}
      />
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Tabs" component={TabsWithRecap} />
        <RootStack.Screen
          name="WeeklyRecap"
          component={WeeklyRecapScreen}
          options={{ presentation: 'fullScreenModal', headerShown: false }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
