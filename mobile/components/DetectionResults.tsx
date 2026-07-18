import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import type { AnalysisResult } from '@/types';
import AlertCard from './AlertCard';
import { colors, spacing, radius, font } from '@/constants/theme';

interface Props {
  result: AnalysisResult;
}

export default function DetectionResults({ result }: Props) {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: result.image_base64 }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Total detected</Text>
        <Text style={styles.summaryCount}>{result.total_detected}</Text>
      </View>

      {result.alerts.length === 0 ? (
        <View style={styles.noDetection}>
          <Text style={styles.noDetectionText}>No mosquitoes detected in this image.</Text>
        </View>
      ) : (
        result.alerts.map((alert, i) => (
          <AlertCard key={i} alert={alert} />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
    aspectRatio: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: 2,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: font.base,
  },
  summaryCount: {
    color: colors.green,
    fontSize: font.lg,
    fontWeight: '700',
  },
  noDetection: {
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noDetectionText: {
    color: colors.textMuted,
    fontSize: font.base,
    textAlign: 'center',
  },
});
