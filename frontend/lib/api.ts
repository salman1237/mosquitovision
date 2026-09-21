import axios from 'axios';
import type { AnalysisResult } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function analyzeImage(file: File): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post<AnalysisResult>(
    `${API_BASE}/api/analyze`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );

  return response.data;
}

// ---- Sample image library (server-hosted demo images) --------------------

export interface SampleFolder { id: string; name: string; count: number }
export interface SampleCollection { id: string; name: string; folders: SampleFolder[] }
export interface SampleImage { name: string; url: string; thumb: string }
export interface SamplePage { total: number; offset: number; limit: number; items: SampleImage[] }

/** Absolute URL for a server-relative sample path such as "/samples/…". */
export function sampleUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export async function fetchSampleCollections(): Promise<SampleCollection[]> {
  const res = await axios.get<{ collections: SampleCollection[] }>(`${API_BASE}/api/samples`);
  return res.data.collections;
}

export async function fetchSamplePage(
  collection: string,
  folder: string,
  offset: number,
  limit: number,
  seed?: number,
): Promise<SamplePage> {
  const res = await axios.get<SamplePage>(`${API_BASE}/api/samples/${collection}/${folder}`, {
    params: { offset, limit, ...(seed !== undefined ? { seed } : {}) },
  });
  return res.data;
}

/** Download a sample image and wrap it as a File so it flows through the same
 *  analyze path as a user upload. */
export async function fetchSampleAsFile(img: SampleImage): Promise<File> {
  const res = await axios.get<Blob>(sampleUrl(img.url), { responseType: 'blob' });
  const type = res.data.type || 'image/jpeg';
  return new File([res.data], img.name, { type });
}
