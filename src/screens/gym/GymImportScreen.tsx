import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';

import { useApp } from '../../store/AppProvider';
import {
  exportStorageBackup,
  gymSnapshotFromBackup,
  scanDeviceStorage,
  type StorageScan,
} from '../../store/legacyGym';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Screen } from '../../ui/Screen';
import { colors } from '../../ui/theme';

export function GymImportScreen() {
  const { replaceGymData } = useApp();
  const [scan, setScan] = useState<StorageScan | null>(null);
  const [status, setStatus] = useState('');
  const [paste, setPaste] = useState('');

  const refresh = useCallback(() => {
    void scanDeviceStorage().then(setScan);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  async function importFound() {
    if (!scan?.foundLegacy) {
      setStatus('No old gym keys were found in this Expo Go copy.');
      return;
    }
    replaceGymData(scan);
    setStatus(
      `Imported ${scan.splitDays.length} split days, ${scan.gymVisits.length} gym days, ${scan.workoutHistory.length} history points.`
    );
  }

  async function copyBackup() {
    const backup = await exportStorageBackup();
    await Clipboard.setStringAsync(backup);
    setStatus('Copied all local save data. You can paste that here later or send it over.');
  }

  function importPaste() {
    const snapshot = gymSnapshotFromBackup(paste);
    if (!snapshot) {
      setStatus('That paste did not look like gym backup data.');
      return;
    }
    replaceGymData(snapshot);
    setStatus(
      `Imported ${snapshot.splitDays.length} split days, ${snapshot.gymVisits.length} gym days, ${snapshot.workoutHistory.length} history points.`
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>Import old gym data</Text>
      <Text style={styles.body}>
        Expo Go keeps saves in separate buckets. The published app and the home Wi‑Fi / QR version can be
        different buckets, which is why Gym looked empty.
      </Text>
      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.label}>This copy of the app currently has</Text>
        <Text style={styles.meta}>
          {scan
            ? `${scan.splitDays.length} split days · ${scan.gymVisits.length} gym days · ${scan.workoutHistory.length} history points · ${scan.restDaySettings.length} rest settings`
            : 'Scanning…'}
        </Text>
        <Text style={styles.keys}>Keys: {scan ? scan.keys.join(', ') || 'none' : '…'}</Text>
      </Card>
      <Button
        label="Import gym data found here"
        color={colors.gym}
        onPress={() => void importFound()}
        style={{ marginBottom: 10 }}
      />
      <Button
        label="Copy a backup of everything saved here"
        variant="secondary"
        onPress={() => void copyBackup()}
        style={{ marginBottom: 10 }}
      />
      <Text style={styles.label}>Or paste a backup</Text>
      <TextInput
        value={paste}
        onChangeText={setPaste}
        placeholder="Paste backup JSON"
        placeholderTextColor={colors.muted}
        multiline
        style={styles.input}
      />
      <Button label="Import pasted backup" color={colors.gym} onPress={importPaste} />
      {status ? <Text style={styles.status}>{status}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 26, fontWeight: '800', marginBottom: 8 },
  body: { color: colors.muted, fontSize: 15, lineHeight: 21, marginBottom: 16 },
  label: {
    color: colors.muted,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontSize: 12,
    marginBottom: 6,
  },
  meta: { color: colors.text, fontWeight: '700', marginBottom: 8 },
  keys: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    color: colors.text,
    backgroundColor: colors.surface2,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  status: { color: colors.success, marginTop: 14, fontWeight: '700', lineHeight: 20 },
});
