'use client';

import { motion } from 'framer-motion';
import { Bug, Syringe, AlertTriangle } from 'lucide-react';
import RiskBadge from './RiskBadge';
import type { Alert } from '@/types';

export default function AlertCard({ alert, index }: { alert: Alert; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08 }}
      className="rounded-xl border border-slate-700 bg-slate-800/70 p-5 backdrop-blur-sm"
      style={{ borderLeftColor: alert.color, borderLeftWidth: 4 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4 shrink-0" style={{ color: alert.color }} />
          <h3 className="font-semibold text-slate-100 text-sm leading-tight">{alert.species}</h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
            style={{ backgroundColor: alert.color }}
          >
            ×{alert.count}
          </span>
          <RiskBadge risk={alert.risk} />
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        <div className="flex gap-2">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-0.5">Diseases</p>
            <p className="text-sm text-slate-200">{alert.diseases}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Syringe className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-0.5">Intervention</p>
            <p className="text-sm text-slate-300">{alert.intervention}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
