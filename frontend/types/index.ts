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
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  filename: string;
  alerts: Alert[];
  total_detected: number;
  thumbnail: string; // compressed JPEG base64 of annotated result
}
