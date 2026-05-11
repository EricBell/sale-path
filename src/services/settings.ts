import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppSettings {
  clusterRadiusMiles: number;
}

const DEFAULTS: AppSettings = {
  clusterRadiusMiles: 0.5,
};

export const DEFAULT_SETTINGS = DEFAULTS;

const KEY = '@sale-path/settings';
const HOME_KEY = '@sale-path/homeAddress';

export async function loadSettings(): Promise<AppSettings> {
  try {
    const json = await AsyncStorage.getItem(KEY);
    if (!json) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(json) };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(settings));
}

export async function loadHomeAddress(): Promise<string> {
  try {
    return (await AsyncStorage.getItem(HOME_KEY)) ?? '';
  } catch {
    return '';
  }
}

export async function saveHomeAddress(address: string): Promise<void> {
  try {
    await AsyncStorage.setItem(HOME_KEY, address);
  } catch {
    // non-critical, ignore
  }
}
