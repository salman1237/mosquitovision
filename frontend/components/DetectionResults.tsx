'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Eye, Bug } from 'lucide-react';
import Image from 'next/image';
import AlertCard from './AlertCard';
import type { AnalysisResult } from '@/types';

export default function DetectionResults({ result }: { result: AnalysisResult }) {
  const highestRisk = result.alerts.find((a) => a.risk === 'Critical')
    ?? result.alerts.find((a) => a.risk === 'High')
    ?? result.alerts[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-6"
    >
      {/* Summary bar */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-slate-800 border border-slate-700 px-4 py-2.5">
          <Bug className="h-4 w-4 text-green-400" />
          <span className="text-sm text-slate-300">
            <span className="font-bold text-white">{result.total_detected}</span> mosquito{result.total_detected !== 1 ? 'es' : ''} detected
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-slate-800 border border-slate-700 px-4 py-2.5">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          <span className="text-sm text-slate-300">
            <span className="font-bold text-white">{result.alerts.length}</span> species identified
          </span>
        </div>
        {highestRisk && (
          <div
            className="flex items-center gap-2 rounded-lg border px-4 py-2.5"
            style={{ borderColor: highestRisk.color, backgroundColor: `${highestRisk.color}18` }}
          >
            <span className="text-sm font-semibold" style={{ color: highestRisk.color }}>
              Highest Risk: {highestRisk.risk}
            </span>
          </div>
        )}
      </div>

      {/* Annotated image */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="h-4 w-4 text-slate-400" />
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Detection Output</p>
        </div>
        <div className="flex justify-center">
          <Image
            src={result.image_base64}
            alt="Annotated detection result"
            width={640}
            height={480}
            className="rounded-lg object-contain max-h-[420px] w-auto"
            unoptimized
          />
        </div>
      </div>

      {/* Alert cards */}
      {result.alerts.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">Disease Risk Alerts</p>
          <div className="flex flex-col gap-3">
            {result.alerts.map((alert, i) => (
              <AlertCard key={alert.species} alert={alert} index={i} />
            ))}
          </div>
        </div>
      )}

      {result.total_detected === 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-8 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-green-500 mb-3" />
          <p className="text-slate-200 font-medium">No mosquitoes detected</p>
          <p className="text-slate-500 text-sm mt-1">The image appears clear of identified mosquito species.</p>
        </div>
      )}
    </motion.div>
  );
}
