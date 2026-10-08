import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { colors, radii } from './theme';

type FieldInputProps = TextInputProps & {
  label?: string;
  error?: string;
};

export function FieldInput({ label, error, style, ...props }: FieldInputProps) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.muted}
        selectionColor={colors.gold}
        style={[styles.input, style]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    color: colors.muted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface2,
  },
  error: {
    marginTop: 6,
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
});
