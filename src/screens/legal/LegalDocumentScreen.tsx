import { RouteProp, useRoute } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';

import { LEGAL_EFFECTIVE_DATE, PRIVACY_SECTIONS, TERMS_SECTIONS } from '../../legal/copy';
import { HomeStackParamList } from '../../navigation/types';
import { Card } from '../../ui/Card';
import { Screen } from '../../ui/Screen';
import { colors } from '../../ui/theme';

export function LegalDocumentScreen() {
  const { params } = useRoute<RouteProp<HomeStackParamList, 'Legal'>>();
  const privacy = params.kind === 'privacy';
  const sections = privacy ? PRIVACY_SECTIONS : TERMS_SECTIONS;

  return (
    <Screen>
      <Text style={styles.date}>Effective {LEGAL_EFFECTIVE_DATE}</Text>
      {sections.map((section) => (
        <Card key={section.title} style={{ marginBottom: 12 }}>
          <Text style={styles.heading}>{section.title}</Text>
          <Text style={styles.body}>{section.body}</Text>
        </Card>
      ))}
      <View style={{ height: 12 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  date: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 14,
  },
  heading: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  body: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
});
