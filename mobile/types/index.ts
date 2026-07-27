export interface Alert {
  species: string;
  diseases: string;
  risk: string;
  intervention: string;
  color: string;
  count: number;
}

export interface AnalysisResult {
  success: boolean;
  alerts: Alert[];
  total_detected: number;
  image_base64: string;
  gradcam_base64?: string | null;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  filename: string;
  alerts: Alert[];
  total_detected: number;
  thumbnail: string;
}
