import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import type { AnalysisResult } from '@/types';
import AlertCard from './AlertCard';
import { colors, spacing, radius, font } from '@/constants/theme';

interface Props {
  result: AnalysisResult;
}

export default function DetectionResults({ result }: Props) {
  return (
    <View>
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

      {/* GradCAM heatmap */}
      {result.gradcam_base64 && (
        <View style={styles.gradcamContainer}>
          <Text style={styles.gradcamTitle}>GradCAM Explanation</Text>
          <Image
            source={{ uri: result.gradcam_base64 }}
            style={styles.gradcamImage}
            resizeMode="contain"
          />
          <Text style={styles.gradcamCaption}>
            Red/warm areas = regions the model weighted most heavily when identifying the species
          </Text>
        </View>
      )}

      {result.alerts.length === 0 ? (
        <View style={styles.noDetection}>
          <Text style={styles.noDetectionText}>No mosquitoes detected in this image.</Text>
        </View>
      ) : (
        result.alerts.map((alert, i) => (
          <AlertCard key={i} alert={alert} />
        ))
      )}
    </View>
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
  gradcamContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#581c87',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  gradcamTitle: {
    color: '#c084fc',
    fontSize: font.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  // The GradCAM heatmap is always square (640x640 from the backend).
  // aspectRatio sizes it from its own width -- a percentage height would
  // resolve to zero here, since gradcamContainer has no explicit height.
  gradcamImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.sm,
  },
  gradcamCaption: {
    color: colors.textMuted,
    fontSize: font.sm,
    textAlign: 'center',
    marginTop: spacing.sm,
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
