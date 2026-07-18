import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { HistoryEntry } from '@/types';
import { colors, spacing, radius, font } from '@/constants/theme';

interface Props {
  entries: HistoryEntry[];
}

export default function AnalyticsSummary({ entries }: Props) {
  if (entries.length === 0) return null;

  const totalScans = entries.length;
  const totalDetected = entries.reduce((s, e) => s + e.total_detected, 0);

  const speciesCounts: Record<string, number> = {};
  for (const entry of entries) {
    for (const alert of entry.alerts) {
      speciesCounts[alert.species] = (speciesCounts[alert.species] ?? 0) + alert.count;
    }
  }
  const topSpecies = Object.entries(speciesCounts).sort((a, b) => b[1] - a[1]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analytics</Text>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{totalScans}</Text>
          <Text style={styles.statLabel}>Scans</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{totalDetected}</Text>
          <Text style={styles.statLabel}>Detections</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{topSpecies.length}</Text>
          <Text style={styles.statLabel}>Species</Text>
        </View>
      </View>

      {topSpecies.length > 0 && (
        <View style={styles.breakdown}>
          {topSpecies.map(([species, count]) => (
            <View key={species} style={styles.breakdownRow}>
              <Text style={styles.breakdownSpecies} numberOfLines={1}>{species}</Text>
              <Text style={styles.breakdownCount}>{count}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: font.base,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: colors.green,
    fontSize: font.xl,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: font.sm,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  breakdown: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownSpecies: {
    color: colors.textSecondary,
    fontSize: font.sm,
    flex: 1,
  },
  breakdownCount: {
    color: colors.textPrimary,
    fontSize: font.sm,
    fontWeight: '600',
  },
});
