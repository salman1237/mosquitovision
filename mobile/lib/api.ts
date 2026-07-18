import axios from 'axios';
import type { AnalysisResult } from '@/types';

const API_BASE = 'https://mosquitovision-backend-production.up.railway.app';

export async function analyzeImage(uri: string, filename: string): Promise<AnalysisResult> {
  const formData = new FormData();
  // React Native FormData uses {uri, name, type} instead of File
  formData.append('file', { uri, name: filename, type: 'image/jpeg' } as any);

  const response = await axios.post<AnalysisResult>(
    `${API_BASE}/api/analyze`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );

  return response.data;
}
