'use client';

import { useState, useEffect, useCallback } from 'react';
import type { HistoryEntry, AnalysisResult } from '@/types';
import { compressImage } from '@/lib/image';

const STORAGE_KEY = 'mosquitovision_history';
const MAX_ENTRIES = 15;

function load(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function save(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // quota exceeded — drop the oldest until it fits
    let trimmed = entries.slice(0, Math.max(entries.length - 1, 1));
    while (trimmed.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        return;
      } catch {
        trimmed = trimmed.slice(0, trimmed.length - 1);
      }
    }
  }
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(load());
  }, []);

  const addEntry = useCallback(async (result: AnalysisResult, filename: string) => {
    const thumbnail = await compressImage(result.image_base64);
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      filename,
      alerts: result.alerts,
      total_detected: result.total_detected,
      thumbnail,
    };
    setHistory((prev) => {
      const updated = [entry, ...prev].slice(0, MAX_ENTRIES);
      save(updated);
      return updated;
    });
  }, []);

  const removeEntry = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      save(updated);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  return { history, addEntry, removeEntry, clearHistory };
}
