import { StyleSheet, Text } from 'react-native';

import { HEALTH_DISCLAIMER } from '../../legal/copy';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Kicker } from '../../ui/Copy';
import { Screen } from '../../ui/Screen';
import { colors } from '../../ui/theme';

type DisclaimerScreenProps = {
  onAccept: () => void;
};

export function DisclaimerScreen({ onAccept }: DisclaimerScreenProps) {
  return (
    <Screen safeTop>
      <Kicker text="Before you start" />
      <Text style={styles.title}>This is a tracker,{'\n'}not medical care.</Text>
      <Card style={{ marginBottom: 18 }}>
        <Text style={styles.body}>{HEALTH_DISCLAIMER}</Text>
      </Card>
      <Text style={styles.note}>
        You can read the full Privacy Policy and Terms anytime from Settings on the Home tab.
      </Text>
      <Button label="I understand" onPress={onAccept} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
    marginBottom: 16,
  },
  body: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  note: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
});
