import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedMap } from '../types';

const KEY = '@sale-path/savedMaps';

export async function loadSavedMaps(): Promise<SavedMap[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  return JSON.parse(raw) as SavedMap[];
}

export async function saveMap(map: SavedMap): Promise<void> {
  const maps = await loadSavedMaps();
  const idx = maps.findIndex((m) => m.id === map.id);
  if (idx >= 0) {
    maps[idx] = { ...map, createdAt: maps[idx].createdAt };
  } else {
    maps.unshift(map);
  }
  await AsyncStorage.setItem(KEY, JSON.stringify(maps));
}

export async function deleteMap(id: string): Promise<void> {
  const maps = await loadSavedMaps();
  await AsyncStorage.setItem(KEY, JSON.stringify(maps.filter((m) => m.id !== id)));
}

export async function renameMap(id: string, name: string): Promise<void> {
  const maps = await loadSavedMaps();
  const map = maps.find((m) => m.id === id);
  if (!map) return;
  map.name = name;
  map.updatedAt = Date.now();
  await AsyncStorage.setItem(KEY, JSON.stringify(maps));
}

export function generateMapName(stopCount: number): string {
  const now = new Date();
  const month = now.toLocaleString('default', { month: 'short' });
  const day = now.getDate();
  return `${month} ${day} • ${stopCount} stop${stopCount !== 1 ? 's' : ''}`;
}
