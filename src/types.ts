export type Diet = {
  id: string;
  name: string;
  calorieTarget: number;
  proteinGoal: number | null;
  createdAt: string;
};

export type DietUsage = {
  dietId: string;
  startDate: string;
  endDate: string | null;
};

export type MealEntry = {
  id: string;
  date: string;
  dietId: string;
  calories: number;
  protein: number;
  savedMealId?: string;
  name?: string;
  createdAt: string;
};

export type SavedMeal = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  note: string;
};

export type WeightEntry = {
  date: string;
  weight: number;
};

export type GymVisit = {
  id: string;
  date: string;
  checkedInAt: string;
  completed: boolean;
  dayId: string;
  dayName: string;
};

export type Workout = {
  id: string;
  name: string;
  weight: number;
  sets: number;
  reps: number;
  restMinutes: number;
  restSeconds: number;
};

export type WorkoutHistoryPoint = {
  id: string;
  dayId: string;
  workoutId: string;
  workoutName: string;
  date: string;
  checkedInAt: string;
  weight: number;
  increased: boolean;
  delta?: number;
};

export type SplitDay = {
  id: string;
  name: string;
  workouts: Workout[];
};

export type RestDaySetting = {
  restDays: number;
  weekStart: string;
};

export type SessionPhase =
  | 'working'
  | 'resting'
  | 'askComplete'
  | 'askMoveUp'
  | 'askMoveDown'
  | 'askWeight'
  | 'askWeightDown';

export type WorkoutProgress = {
  workoutId: string;
  setIndex: number;
  phase: SessionPhase | 'complete';
  restEndsAt: number | null;
};

export type ActiveSession = {
  dayId: string;
  currentWorkoutId: string;
  progress: WorkoutProgress[];
};

export type DailySchedule =
  | { type: 'everyDay' }
  | { type: 'weekdays' }
  | { type: 'weekends' }
  | { type: 'dailyExcept'; weekdays: number[] }
  | { type: 'weekday'; weekday: number }
  | { type: 'oneTime'; date: string }
  | { type: 'dayOfMonth'; day: number };

export type SchedulePeriod = {
  from: string;
  to: string | null;
  schedule: DailySchedule;
};

export type HabitScope = 'daily' | 'weekly' | 'monthly';

export type Habit = {
  id: string;
  name: string;
  scope: HabitScope;
  schedule: DailySchedule | null;
  recurring: boolean;
  createdOn: string;
  deletedOn: string | null;
  scheduleHistory: SchedulePeriod[];
};

export type HabitCompletion = {
  habitId: string;
  periodKey: string;
  completed: boolean;
  updatedAt: string;
};

export type WeeklyRecap = {
  weekStart: string;
  dietPercent: number;
  gymPercent: number;
  dailyPercent: number;
  overall: number;
  shownAt: string;
  weightChange?: number | null;
};

export type AppState = {
  diets: Diet[];
  activeDietId: string | null;
  pendingDietId: string | null;
  pendingDietStartsOn: string | null;
  dietUsages: DietUsage[];
  meals: MealEntry[];
  savedMeals: SavedMeal[];
  weights: WeightEntry[];
  weightPromptDismissedOn: string | null;
  splitDays: SplitDay[];
  gymVisits: GymVisit[];
  workoutHistory: WorkoutHistoryPoint[];
  restDaySettings: RestDaySetting[];
  activeSession: ActiveSession | null;
  habits: Habit[];
  completions: HabitCompletion[];
  weeklyRecaps: WeeklyRecap[];
  lastRecapPromptWeekStart: string | null;
};

export const initialAppState: AppState = {
  diets: [],
  activeDietId: null,
  pendingDietId: null,
  pendingDietStartsOn: null,
  dietUsages: [],
  meals: [],
  savedMeals: [],
  weights: [],
  weightPromptDismissedOn: null,
  splitDays: [],
  gymVisits: [],
  workoutHistory: [],
  restDaySettings: [],
  activeSession: null,
  habits: [],
  completions: [],
  weeklyRecaps: [],
  lastRecapPromptWeekStart: null,
};
