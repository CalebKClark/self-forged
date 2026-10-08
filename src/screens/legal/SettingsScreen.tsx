import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { LEGAL_APP_NAME, LEGAL_CONTACT_EMAIL } from '../../legal/copy';
import { HomeStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppProvider';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { PromptModal } from '../../ui/PromptModal';
import { Screen } from '../../ui/Screen';
import { colors } from '../../ui/theme';

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { exportAllData, resetAllData } = useApp();
  const [status, setStatus] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function exportData() {
    await Clipboard.setStringAsync(exportAllData());
    setStatus('Copied all local data to the clipboard. Paste it somewhere safe if you want a backup.');
  }

  function deleteData() {
    resetAllData();
    setConfirmDelete(false);
    setStatus('All local diet, gym, and habit data on this device was deleted.');
  }

  return (
    <Screen>
      <Text style={styles.lead}>
        {LEGAL_APP_NAME} keeps your logs on this device. There is no account and no cloud backup.
      </Text>

      <Card style={{ marginBottom: 12 }} onPress={() => navigation.navigate('Legal', { kind: 'privacy' })}>
        <Text style={styles.link}>Privacy Policy</Text>
        <Text style={styles.meta}>What stays on device, and what Expo updates may send</Text>
      </Card>
      <Card style={{ marginBottom: 18 }} onPress={() => navigation.navigate('Legal', { kind: 'terms' })}>
        <Text style={styles.link}>Terms and health disclaimer</Text>
        <Text style={styles.meta}>Not medical advice. Your logs, your responsibility.</Text>
      </Card>

      <Text style={styles.section}>Your data</Text>
      <Button label="Export all data" variant="secondary" onPress={() => void exportData()} style={{ marginBottom: 10 }} />
      <Button label="Delete all data" variant="danger" onPress={() => setConfirmDelete(true)} />
      {status ? <Text style={styles.status}>{status}</Text> : null}

      <Text style={styles.section}>App</Text>
      <Card>
        <Text style={styles.meta}>Version 1.0.0</Text>
        <Text style={styles.meta}>Contact {LEGAL_CONTACT_EMAIL}</Text>
      </Card>

      <PromptModal
        visible={confirmDelete}
        title="Delete all data?"
        message="This removes diet, gym, habits, and streaks stored on this device. It cannot be undone unless you already exported a copy."
        confirmLabel="Delete everything"
        confirmColor={colors.danger}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={deleteData}
      />
      <View style={{ height: 8 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  link: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
    fontWeight: '600',
  },
  section: {
    marginTop: 8,
    marginBottom: 10,
    color: colors.muted,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  status: {
    color: colors.goldSoft,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
    marginBottom: 8,
    fontWeight: '600',
  },
});
