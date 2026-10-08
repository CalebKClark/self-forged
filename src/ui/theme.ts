export const colors = {
  bg: '#08090D',
  bgElevated: '#0E1016',
  surface: '#141821',
  surface2: '#1C2230',
  surface3: '#252C3D',
  border: '#2C3448',
  text: '#F4F6FB',
  muted: '#8B93A7',
  muted2: '#5E667A',
  gold: '#E8B84A',
  goldSoft: '#F0D084',
  diet: '#3EE0B0',
  dietDim: '#1A4A3C',
  gym: '#FF5A3C',
  gymDim: '#4A221C',
  tasks: '#7B8CFF',
  tasksDim: '#242A55',
  weekly: '#C084FC',
  monthly: '#38BDF8',
  success: '#3DD68C',
  danger: '#FF5C7A',
  warning: '#FFB020',
  overlay: 'rgba(0,0,0,0.72)',
};

export const accentFor = {
  home: colors.gold,
  diet: colors.diet,
  gym: colors.gym,
  tasks: colors.tasks,
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
};

export const radii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const navTheme = {
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '700' as const, fontSize: 18 },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.bg },
};
