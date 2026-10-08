import { StyleSheet, Text, View } from 'react-native';

import { colors } from './theme';

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
}

export function SectionLabel({ text, color }: { text: string; color?: string }) {
  return <Text style={[styles.section, color ? { color } : null]}>{text}</Text>;
}

export function Kicker({ text, color }: { text: string; color?: string }) {
  return <Text style={[styles.kicker, color ? { color } : null]}>{text}</Text>;
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  body: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 21,
  },
  section: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  kicker: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
});
