import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors, radii } from './theme';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  color?: string;
  disabled?: boolean;
  style?: ViewStyle;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  color,
  disabled,
  style,
}: ButtonProps) {
  const background =
    variant === 'primary' ? color ?? colors.gold : variant === 'danger' ? colors.danger : 'transparent';
  const border =
    variant === 'secondary' ? colors.border : variant === 'ghost' ? 'transparent' : background;
  const textColor = variant === 'ghost' ? color ?? colors.gold : colors.text;
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: background, borderColor: border },
        variant === 'secondary' && styles.secondary,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  secondary: {
    backgroundColor: colors.surface,
  },
  label: {
    fontSize: 17,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.8,
  },
});
