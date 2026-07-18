import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { analyzeImage } from '@/lib/api';
import { addHistoryEntry } from '@/lib/history';
import { resizeForUpload } from '@/lib/resize';
import DetectionResults from '@/components/DetectionResults';
import { colors, spacing, radius, font } from '@/constants/theme';
import type { AnalysisResult } from '@/types';

export default function HomeScreen() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageName, setImageName] = useState('image.jpg');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickFromGallery = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Gallery access is required to select images.');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!picked.canceled && picked.assets[0]) {
      const asset = picked.assets[0];
      setImageUri(asset.uri);
      setImageName(asset.fileName ?? 'photo.jpg');
      setResult(null);
      setError(null);
    }
  }, []);

  const pickFromCamera = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to take photos.');
      return;
    }
    const captured = await ImagePicker.launchCameraAsync({
      quality: 0.85,
    });
    if (!captured.canceled && captured.assets[0]) {
      const asset = captured.assets[0];
      setImageUri(asset.uri);
      setImageName(`capture_${Date.now()}.jpg`);
      setResult(null);
      setError(null);
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!imageUri) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const resizedUri = await resizeForUpload(imageUri);
      const data = await analyzeImage(resizedUri, imageName);
      setResult(data);
      await addHistoryEntry(data, imageName);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ??
        err?.message ??
        'Analysis failed. Please try again.';
      setError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }, [imageUri, imageName]);

  const handleClear = () => {
    setImageUri(null);
    setResult(null);
    setError(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* History button */}
      <TouchableOpacity style={styles.historyBtn} onPress={() => router.push('/history')}>
        <Text style={styles.historyBtnText}>View History</Text>
      </TouchableOpacity>

      {/* Picker buttons */}
      <View style={styles.pickerRow}>
        <TouchableOpacity style={styles.pickerBtn} onPress={pickFromCamera} activeOpacity={0.8}>
          <Text style={styles.pickerIcon}>📷</Text>
          <Text style={styles.pickerLabel}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pickerBtn} onPress={pickFromGallery} activeOpacity={0.8}>
          <Text style={styles.pickerIcon}>🖼️</Text>
          <Text style={styles.pickerLabel}>Gallery</Text>
        </TouchableOpacity>
      </View>

      {/* Image preview */}
      {imageUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
          <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
            <Text style={styles.clearBtnText}>✕ Clear</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Select or capture a mosquito image</Text>
        </View>
      )}

      {/* Analyze button */}
      {imageUri && !result && (
        <TouchableOpacity
          style={[styles.analyzeBtn, loading && styles.analyzeBtnDisabled]}
          onPress={handleAnalyze}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#020617" />
          ) : (
            <Text style={styles.analyzeBtnText}>Analyze</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Loading state */}
      {loading && (
        <View style={styles.loadingInfo}>
          <Text style={styles.loadingText}>Running YOLO inference…</Text>
          <Text style={styles.loadingSubtext}>This may take a few seconds</Text>
        </View>
      )}

      {/* Error */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Analysis failed</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Text style={styles.errorDismiss}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results */}
      {result && (
        <View style={styles.resultsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Analysis Results</Text>
            <TouchableOpacity onPress={handleClear}>
              <Text style={styles.newScanBtn}>New scan</Text>
            </TouchableOpacity>
          </View>
          <DetectionResults result={result} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  historyBtn: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
  },
  historyBtnText: {
    color: colors.textSecondary,
    fontSize: font.sm,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  pickerBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  pickerIcon: {
    fontSize: 28,
  },
  pickerLabel: {
    color: colors.textSecondary,
    fontSize: font.base,
    fontWeight: '500',
  },
  previewContainer: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  preview: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.surface,
  },
  clearBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(2,6,23,0.75)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  clearBtnText: {
    color: colors.textSecondary,
    fontSize: font.sm,
  },
  placeholder: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderDashed,
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  placeholderText: {
    color: colors.textMuted,
    fontSize: font.base,
  },
  analyzeBtn: {
    backgroundColor: colors.green,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  analyzeBtnDisabled: {
    opacity: 0.7,
  },
  analyzeBtnText: {
    color: '#020617',
    fontSize: font.md,
    fontWeight: '700',
  },
  loadingInfo: {
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: font.base,
  },
  loadingSubtext: {
    color: colors.textMuted,
    fontSize: font.sm,
  },
  errorBox: {
    backgroundColor: colors.redBg,
    borderWidth: 1,
    borderColor: colors.redBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  errorTitle: {
    color: colors.red,
    fontSize: font.base,
    fontWeight: '600',
  },
  errorMsg: {
    color: '#fca5a5',
    fontSize: font.sm,
  },
  errorDismiss: {
    color: colors.textMuted,
    fontSize: font.sm,
    marginTop: spacing.xs,
  },
  resultsSection: {
    marginTop: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: font.md,
    fontWeight: '600',
  },
  newScanBtn: {
    color: colors.textMuted,
    fontSize: font.sm,
  },
});
