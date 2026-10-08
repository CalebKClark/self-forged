import AsyncStorage from '@react-native-async-storage/async-storage';

const DISCLAIMER_KEY = 'ultimate.disclaimerAccepted.v1';

export async function getDisclaimerAccepted(): Promise<boolean> {
  const value = await AsyncStorage.getItem(DISCLAIMER_KEY);
  return value === '1';
}

export async function acceptDisclaimer(): Promise<void> {
  await AsyncStorage.setItem(DISCLAIMER_KEY, '1');
}
