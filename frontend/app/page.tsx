'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';
import Header from '@/components/Header';
import ImageUploader from '@/components/ImageUploader';
import DetectionResults from '@/components/DetectionResults';
import HistoryPanel from '@/components/HistoryPanel';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import { analyzeImage } from '@/lib/api';
import { useHistory } from '@/hooks/useHistory';
import type { AnalysisResult, HistoryEntry } from '@/types';

function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (detail) return String(detail);
    if (err.code === 'ERR_NETWORK') return 'Cannot reach the analysis server. Make sure the FastAPI backend is running.';
    return err.message;
  }
  return err instanceof Error ? err.message : 'An unexpected error occurred.';
}

export default function HomePage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { history, addEntry, removeEntry, clearHistory } = useHistory();

  const handleAnalyze = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await analyzeImage(file);
      setResult(data);
      addEntry(data, file.name);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setResult(null);
    setError(null);
  };

  const handleRestore = (entry: HistoryEntry) => {
    setResult({
      success: true,
      alerts: entry.alerts,
      total_detected: entry.total_detected,
      image_base64: entry.thumbnail,
    });
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col min-h-dvh bg-slate-950">
      <Header />

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">
        {/* Main two-column: uploader + results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left column: uploader */}
          <section>
            <div className="mb-4">
              <h2 className="text-slate-100 font-semibold text-base">Upload Image</h2>
              <p className="text-slate-500 text-sm mt-0.5">
                Select a mosquito image to identify the species and assess disease risk.
              </p>
            </div>
            <ImageUploader onAnalyze={handleAnalyze} onClear={handleClear} isLoading={isLoading} />

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mt-4 flex gap-3 rounded-lg border border-red-800 bg-red-950/40 p-4"
                >
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-red-300">Analysis failed</p>
                    <p className="text-xs text-red-400/80 mt-0.5 break-words">{error}</p>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="shrink-0 text-red-500 hover:text-red-300 transition-colors"
                    aria-label="Dismiss error"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Right column: results */}
          <section>
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-4">
                    <h2 className="text-slate-100 font-semibold text-base">Analysis Results</h2>
                    <p className="text-slate-500 text-sm mt-0.5">
                      Detection output with annotated bounding boxes and risk assessment.
                    </p>
                  </div>
                  <DetectionResults result={result} />
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center min-h-[280px] rounded-xl border border-dashed border-slate-800 bg-slate-900/30"
                >
                  {isLoading ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative h-12 w-12">
                        <div className="absolute inset-0 rounded-full border-2 border-green-900" />
                        <div className="absolute inset-0 rounded-full border-2 border-t-green-500 animate-spin" />
                      </div>
                      <p className="text-slate-400 text-sm">Running YOLO inference…</p>
                      <p className="text-slate-600 text-xs">This may take a few seconds</p>
                    </div>
                  ) : (
                    <p className="text-slate-600 text-sm px-6 text-center">
                      Results will appear here after analysis
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>

        {/* Analytics dashboard */}
        <AnalyticsDashboard entries={history} />

        {/* History section */}
        <HistoryPanel
          entries={history}
          onRestore={handleRestore}
          onRemove={removeEntry}
          onClear={clearHistory}
        />
      </main>

      <footer className="border-t border-slate-800 py-4 text-center">
        <p className="text-xs text-slate-700">
          MosquitoVision · YOLO-powered mosquito species detection · For research use
        </p>
      </footer>
    </div>
  );
}
