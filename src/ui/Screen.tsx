import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from './theme';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  safeTop?: boolean;
  style?: ViewStyle;
};

export function Screen({ children, scroll = true, padded = true, safeTop = false, style }: ScreenProps) {
  const edges = safeTop ? (['top', 'left', 'right'] as const) : (['left', 'right'] as const);
  if (scroll) {
    return (
      <SafeAreaView style={styles.safe} edges={[...edges]}>
        <ScrollView
          contentContainerStyle={[padded && styles.padded, style]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={[styles.safe, padded && styles.padded, style]} edges={[...edges]}>
      <View style={styles.fill}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  padded: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  fill: {
    flex: 1,
  },
});
