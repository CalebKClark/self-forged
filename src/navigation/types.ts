import { NavigatorScreenParams } from '@react-navigation/native';

export type HomeStackParamList = {
  Home: undefined;
  RecapHistory: undefined;
  Settings: undefined;
  Legal: { kind: 'privacy' | 'terms' };
};

export type DietStackParamList = {
  DietHome: undefined;
  CreateDiet: undefined;
  EnterMeal: { mealId?: string } | undefined;
  SavedMeals: undefined;
  EditSavedMeal: { mealId?: string } | undefined;
  Diets: undefined;
  Weight: undefined;
};

export type GymStackParamList = {
  GymHome: undefined;
  CheckIn: undefined;
  Session: { dayId: string };
  Split: undefined;
  Day: { dayId: string };
  Stats: undefined;
  PastMonths: undefined;
  PastMonth: { year: number; monthIndex: number };
  DayCharts: { dayId: string };
  GymImport: undefined;
};

export type TasksStackParamList = {
  TasksHome: undefined;
  CreateHabit: { habitId?: string; scope?: 'daily' | 'weekly' | 'monthly' };
  HabitDetail: { habitId: string };
  DailyHistory: { date: string };
};

export type TabsParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  DietTab: NavigatorScreenParams<DietStackParamList>;
  GymTab: NavigatorScreenParams<GymStackParamList>;
  TasksTab: NavigatorScreenParams<TasksStackParamList>;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabsParamList>;
  WeeklyRecap: { weekStart: string };
};
