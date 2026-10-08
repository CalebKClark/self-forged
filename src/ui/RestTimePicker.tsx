import { Picker } from '@react-native-picker/picker';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from './theme';

const MINUTES = Array.from({ length: 31 }, (_, index) => index);
const SECONDS = Array.from({ length: 60 }, (_, index) => index);

type RestTimePickerProps = {
  minutes: number;
  seconds: number;
  onChange: (minutes: number, seconds: number) => void;
};

export function RestTimePicker({ minutes, seconds, onChange }: RestTimePickerProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Rest between sets</Text>
      <View style={styles.pickerRow}>
        <Picker
          selectedValue={minutes}
          onValueChange={(value) => onChange(Number(value), seconds)}
          style={styles.picker}
          itemStyle={styles.item}
        >
          {MINUTES.map((value) => (
            <Picker.Item key={value} label={String(value)} value={value} color={colors.text} />
          ))}
        </Picker>
        <Text style={styles.colon}>:</Text>
        <Picker
          selectedValue={seconds}
          onValueChange={(value) => onChange(minutes, Number(value))}
          style={styles.picker}
          itemStyle={styles.item}
        >
          {SECONDS.map((value) => (
            <Picker.Item
              key={value}
              label={value.toString().padStart(2, '0')}
              value={value}
              color={colors.text}
            />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
    borderRadius: 14,
  },
  picker: {
    width: 120,
    height: 216,
  },
  item: {
    color: colors.text,
    fontSize: 22,
  },
  colon: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
});
