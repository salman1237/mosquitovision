'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, ChevronDown, ChevronUp, Trash2, X, Clock, Bug } from 'lucide-react';
import Image from 'next/image';
import { clsx } from 'clsx';
import type { HistoryEntry } from '@/types';

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function absoluteTime(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

interface HistoryPanelProps {
  entries: HistoryEntry[];
  onRestore: (entry: HistoryEntry) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export default function HistoryPanel({ entries, onRestore, onRemove, onClear }: HistoryPanelProps) {
  const [open, setOpen] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);

  const highestRisk = (entry: HistoryEntry) =>
    entry.alerts.find((a) => a.risk === 'Critical')
    ?? entry.alerts.find((a) => a.risk === 'High')
    ?? entry.alerts[0];

  return (
    <section className="mt-10 border-t border-slate-800 pt-8">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-slate-400" />
          <h2 className="text-slate-100 font-semibold text-base">Scan History</h2>
          {entries.length > 0 && (
            <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-300">
              {entries.length}
            </span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {entries.length > 0 && (
            confirmClear ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Clear all history?</span>
                <button
                  onClick={() => { onClear(); setConfirmClear(false); }}
                  className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
                >Yes, clear</button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >Cancel</button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear all
              </button>
            )
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors ml-2"
          >
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-slate-800 bg-slate-900/20">
                <Clock className="h-8 w-8 text-slate-700 mb-3" />
                <p className="text-slate-600 text-sm">No scans yet</p>
                <p className="text-slate-700 text-xs mt-1">Analyze an image to see history here</p>
              </div>
            ) : (
              <div className="overflow-x-auto pb-2">
                <div className="flex gap-4 min-w-max">
                  {entries.map((entry, i) => {
                    const risk = highestRisk(entry);
                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className={clsx(
                          'group relative w-52 shrink-0 rounded-xl border border-slate-700 bg-slate-800/60',
                          'cursor-pointer hover:border-slate-500 hover:bg-slate-800 transition-all duration-150'
                        )}
                        onClick={() => onRestore(entry)}
                      >
                        {/* Remove button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); onRemove(entry.id); }}
                          className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/70 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                          aria-label="Remove entry"
                        >
                          <X className="h-3 w-3" />
                        </button>

                        {/* Thumbnail */}
                        <div className="relative h-32 w-full overflow-hidden rounded-t-xl bg-slate-900">
                          <Image
                            src={entry.thumbnail}
                            alt={`Scan ${absoluteTime(entry.timestamp)}`}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                          {/* Risk ribbon */}
                          {risk && (
                            <div
                              className="absolute bottom-0 left-0 right-0 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
                              style={{ backgroundColor: `${risk.color}cc` }}
                            >
                              {risk.risk}
                            </div>
                          )}
                        </div>

                        {/* Card body */}
                        <div className="p-3">
                          {/* Time */}
                          <div className="flex items-center gap-1 text-slate-500 mb-2">
                            <Clock className="h-3 w-3" />
                            <span className="text-[11px]" title={absoluteTime(entry.timestamp)}>
                              {relativeTime(entry.timestamp)}
                            </span>
                          </div>

                          {/* Detection count */}
                          <div className="flex items-center gap-1.5 mb-2.5">
                            <Bug className="h-3.5 w-3.5 text-green-400 shrink-0" />
                            <span className="text-xs text-slate-300">
                              <span className="font-semibold text-white">{entry.total_detected}</span>
                              {' '}mosquito{entry.total_detected !== 1 ? 'es' : ''}
                            </span>
                          </div>

                          {/* Species pills */}
                          <div className="flex flex-wrap gap-1">
                            {entry.alerts.map((a) => (
                              <span
                                key={a.species}
                                className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                                style={{ backgroundColor: `${a.color}99` }}
                              >
                                {a.species.split(' ')[0]}
                              </span>
                            ))}
                            {entry.total_detected === 0 && (
                              <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] text-slate-400">
                                None detected
                              </span>
                            )}
                          </div>

                          {/* Filename */}
                          <p className="mt-2 text-[10px] text-slate-600 truncate" title={entry.filename}>
                            {entry.filename}
                          </p>
                        </div>

                        {/* Hover hint */}
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center rounded-b-xl py-1.5 bg-green-600/0 group-hover:bg-green-600/10 transition-colors">
                          <span className="text-[10px] text-green-500 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                            Click to restore
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
