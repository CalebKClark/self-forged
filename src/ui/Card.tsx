import { ReactNode } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { colors, radii } from './theme';

type CardProps = {
  children: ReactNode;
  style?: ViewStyle;
  accent?: string;
  onPress?: () => void;
};

export function Card({ children, style, accent, onPress }: CardProps) {
  const body = (
    <View style={[styles.card, accent ? { borderColor: accent } : null, style]}>{children}</View>
  );
  if (!onPress) {
    return body;
  }
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  pressed: {
    opacity: 0.85,
  },
});
