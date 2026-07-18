import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Alert } from '@/types';
import { colors, spacing, radius, font } from '@/constants/theme';

interface Props {
  alert: Alert;
}

const riskColor: Record<string, string> = {
  Critical: '#ef4444',
  High: '#f97316',
  'Moderate-High': '#eab308',
  Moderate: '#84cc16',
};

export default function AlertCard({ alert }: Props) {
  const rc = riskColor[alert.risk] ?? '#94a3b8';

  return (
    <View style={[styles.card, { borderLeftColor: alert.color }]}>
      <View style={styles.header}>
        <Text style={styles.species}>{alert.species}</Text>
        <View style={[styles.riskBadge, { backgroundColor: rc + '22', borderColor: rc + '55' }]}>
          <Text style={[styles.riskText, { color: rc }]}>{alert.risk}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Diseases</Text>
        <Text style={styles.value}>{alert.diseases}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Intervention</Text>
        <Text style={styles.value}>{alert.intervention}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Detected</Text>
        <Text style={[styles.value, { color: alert.color }]}>{alert.count}×</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  species: {
    color: colors.textPrimary,
    fontSize: font.base,
    fontWeight: '600',
    flex: 1,
  },
  riskBadge: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  riskText: {
    fontSize: font.sm,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 3,
  },
  label: {
    color: colors.textMuted,
    fontSize: font.sm,
    width: 84,
    flexShrink: 0,
  },
  value: {
    color: colors.textSecondary,
    fontSize: font.sm,
    flex: 1,
  },
});
