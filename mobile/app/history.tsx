import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import HistoryList from '@/components/HistoryList';
import AnalyticsSummary from '@/components/AnalyticsSummary';
import { getHistory, removeHistoryEntry, clearHistory } from '@/lib/history';
import type { HistoryEntry } from '@/types';
import { colors, spacing } from '@/constants/theme';

export default function HistoryScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  const load = useCallback(async () => {
    setEntries(await getHistory());
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleRemove = async (id: string) => {
    setEntries(await removeHistoryEntry(id));
  };

  const handleClear = async () => {
    await clearHistory();
    setEntries([]);
  };

  const handleRestore = (entry: HistoryEntry) => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <AnalyticsSummary entries={entries} />
      <HistoryList
        entries={entries}
        onRestore={handleRestore}
        onRemove={handleRemove}
        onClear={handleClear}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.md,
  },
});
