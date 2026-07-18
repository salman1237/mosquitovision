import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HistoryEntry, AnalysisResult } from '@/types';

const STORAGE_KEY = 'mosquitovision_history';
const MAX_ENTRIES = 50;

export async function getHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addHistoryEntry(
  result: AnalysisResult,
  filename: string
): Promise<HistoryEntry[]> {
  const history = await getHistory();
  const entry: HistoryEntry = {
    id: Date.now().toString(),
    timestamp: Date.now(),
    filename,
    alerts: result.alerts,
    total_detected: result.total_detected,
    thumbnail: result.image_base64,
  };
  const updated = [entry, ...history].slice(0, MAX_ENTRIES);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function removeHistoryEntry(id: string): Promise<HistoryEntry[]> {
  const history = await getHistory();
  const updated = history.filter((e) => e.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
