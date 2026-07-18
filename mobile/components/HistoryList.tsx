import React from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import type { HistoryEntry } from '@/types';
import { colors, spacing, radius, font } from '@/constants/theme';

interface Props {
  entries: HistoryEntry[];
  onRestore: (entry: HistoryEntry) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export default function HistoryList({ entries, onRestore, onRemove, onClear }: Props) {
  const confirmClear = () => {
    Alert.alert('Clear History', 'Remove all scan history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: onClear },
    ]);
  };

  if (entries.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No scan history yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={entries}
      keyExtractor={(e) => e.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.headerTitle}>History</Text>
          <TouchableOpacity onPress={confirmClear}>
            <Text style={styles.clearBtn}>Clear all</Text>
          </TouchableOpacity>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => onRestore(item)} activeOpacity={0.75}>
          <Image source={{ uri: item.thumbnail }} style={styles.thumb} resizeMode="cover" />
          <View style={styles.info}>
            <Text style={styles.filename} numberOfLines={1}>{item.filename}</Text>
            <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleString()}</Text>
            <Text style={styles.detected}>
              {item.total_detected} detected ·{' '}
              {item.alerts.map((a) => a.species).join(', ') || 'none'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => onRemove(item.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.deleteText}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: font.md,
    fontWeight: '600',
  },
  clearBtn: {
    color: colors.textMuted,
    fontSize: font.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.border,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  filename: {
    color: colors.textPrimary,
    fontSize: font.base,
    fontWeight: '500',
  },
  timestamp: {
    color: colors.textMuted,
    fontSize: font.sm,
  },
  detected: {
    color: colors.textSecondary,
    fontSize: font.sm,
  },
  deleteBtn: {
    padding: spacing.xs,
  },
  deleteText: {
    color: colors.textMuted,
    fontSize: font.base,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: font.base,
  },
});
