'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Bug, ShieldAlert, CheckCircle2, Scan } from 'lucide-react';
import type { HistoryEntry } from '@/types';

// ─── palette (validated: all-pass on dark surface #0f172a) ───────────────────
// Categorical — fixed species → slot mapping; color follows entity, never rank
const SPECIES_SLOTS: Record<string, { bar: string; dot: string; label: string }> = {
  aedes:     { bar: '#3987e5', dot: '#ff4d4d', label: 'Aedes' },
  anopheles: { bar: '#199e70', dot: '#ff1a1a', label: 'Anopheles' },
  culex:     { bar: '#d95926', dot: '#ff9933', label: 'Culex' },
};

// Status palette (risk levels carry state meaning, not series identity)
const RISK_STATUS: Record<string, string> = {
  Critical:         '#d03b3b',
  High:             '#ec835a',
  'Moderate-High':  '#fab219',
};
const RISK_ORDER = ['Critical', 'High', 'Moderate-High'];

// Sequential blue (single series — line chart; no legend needed)
const SEQ_BLUE = '#3987e5';

// Chrome tokens (dark surface)
const GRID    = '#1e293b';   // slate-800 hairline
const AXIS    = '#334155';   // slate-700 baseline
const TEXT_M  = '#64748b';   // slate-500 muted axis
const TEXT_P  = '#e2e8f0';   // slate-200 primary value

// ─── data derivation ─────────────────────────────────────────────────────────
interface Derived {
  totalScans: number;
  totalDetected: number;
  cleanScans: number;
  mostCommon: { label: string; dot: string } | null;
  species: { key: string; label: string; bar: string; dot: string; total: number }[];
  risks: { risk: string; color: string; count: number }[];
  timeline: { idx: number; n: number; ts: number }[];
}

function derive(entries: HistoryEntry[]): Derived {
  const speciesMap: Record<string, number> = {};
  const riskMap: Record<string, number> = {};
  let totalDetected = 0, cleanScans = 0;

  for (const e of entries) {
    totalDetected += e.total_detected;
    if (e.total_detected === 0) cleanScans++;
    for (const a of e.alerts) {
      const key = a.species.toLowerCase().split(' ')[0];
      speciesMap[key] = (speciesMap[key] ?? 0) + a.count;
      riskMap[a.risk] = (riskMap[a.risk] ?? 0) + 1;
    }
  }

  const species = Object.entries(speciesMap)
    .map(([key, total]) => ({
      key, total,
      label: SPECIES_SLOTS[key]?.label ?? key,
      bar:   SPECIES_SLOTS[key]?.bar   ?? '#3987e5',
      dot:   SPECIES_SLOTS[key]?.dot   ?? '#64748b',
    }))
    .sort((a, b) => b.total - a.total);

  const risks = RISK_ORDER
    .filter(r => riskMap[r])
    .map(r => ({ risk: r, color: RISK_STATUS[r] ?? '#64748b', count: riskMap[r] }));

  const ordered = [...entries].reverse();
  const timeline = ordered.map((e, i) => ({ idx: i, n: e.total_detected, ts: e.timestamp }));

  const mostCommon = species[0]
    ? { label: species[0].label, dot: species[0].dot }
    : null;

  return { totalScans: entries.length, totalDetected, cleanScans, mostCommon, species, risks, timeline };
}

// ─── StatTile ─────────────────────────────────────────────────────────────────
function StatTile({
  icon, label, value, sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-slate-500">{icon}</span>
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      </div>
      <div className="text-3xl font-semibold leading-none text-slate-100">{value}</div>
      {sub && <p className="text-xs text-slate-600 mt-2">{sub}</p>}
    </div>
  );
}

// ─── Species bar chart (horizontal) ─────────────────────────────────────────
// Validated palette; direct value labels provide secondary encoding.
function SpeciesChart({ data }: { data: Derived['species'] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (data.length === 0) {
    return (
      <p className="text-slate-600 text-sm text-center py-8">No detections yet</p>
    );
  }

  const BAR_H = 18;
  const GAP   = 18;
  const LW    = 82;   // label column width
  const VW    = 28;   // value column width
  const W     = 400;
  const trackW = W - LW - VW - 8;
  const max    = Math.max(...data.map(d => d.total), 1);
  const svgH   = data.length * (BAR_H + GAP) - GAP;

  return (
    <div className="relative overflow-visible">
      <svg viewBox={`0 0 ${W} ${svgH}`} className="w-full" style={{ height: svgH }}
        role="img" aria-label="Species detection count bar chart">
        {data.map((d, i) => {
          const y    = i * (BAR_H + GAP);
          const barW = (d.total / max) * trackW;
          const isH  = hovered === d.key;

          return (
            <g key={d.key}
              onMouseEnter={() => setHovered(d.key)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Label with domain-color dot (color-alone encoding avoided — text names it) */}
              <circle cx={LW - 18} cy={y + BAR_H / 2} r={4} fill={d.dot} />
              <text x={LW - 10} y={y + BAR_H / 2} textAnchor="end"
                dominantBaseline="middle" fontSize={11} fill={isH ? TEXT_P : TEXT_M}>
                {d.label}
              </text>

              {/* Track */}
              <rect x={LW} y={y} width={trackW} height={BAR_H} rx={4} fill={GRID} />

              {/* Bar — ≤24px, 4px rounded data-end, square at baseline */}
              {barW > 0 && (
                <rect x={LW} y={y} width={barW} height={BAR_H} rx={4}
                  fill={d.bar} fillOpacity={isH ? 1 : 0.85} />
              )}

              {/* Direct value label (mandatory secondary encoding for CVD) */}
              <text x={LW + barW + 5} y={y + BAR_H / 2}
                dominantBaseline="middle" fontSize={11} fontWeight={600} fill={TEXT_P}>
                {d.total}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend — required for ≥2 series */}
      {data.length >= 2 && (
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3">
          {data.map(d => (
            <div key={d.key} className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-1.5 rounded-full" style={{ backgroundColor: d.bar }} />
              <span className="text-[11px] text-slate-500">{d.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Detections-per-scan line chart ─────────────────────────────────────────
// Single series → no legend box (title names it). Sequential blue.
function TimelineChart({ data }: { data: Derived['timeline'] }) {
  const [hov, setHov] = useState<number | null>(null);

  if (data.length < 2) {
    return (
      <p className="text-slate-600 text-sm text-center py-8">
        {data.length === 0 ? 'No scans yet' : 'Analyze one more image to see the trend'}
      </p>
    );
  }

  const W  = 400;
  const H  = 90;
  const P  = { t: 10, r: 12, b: 24, l: 28 };
  const iW = W - P.l - P.r;
  const iH = H - P.t - P.b;

  const maxN = Math.max(...data.map(d => d.n), 1);
  const xOf  = (i: number) => P.l + (i / (data.length - 1)) * iW;
  const yOf  = (n: number) => P.t + iH - (n / maxN) * iH;

  const pts = data.map((d, i) => ({ x: xOf(i), y: yOf(d.n), d }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L ${pts[pts.length - 1].x.toFixed(1)} ${(P.t + iH).toFixed(1)} L ${P.l} ${(P.t + iH).toFixed(1)} Z`;

  const yTicks = [0, maxN > 1 ? Math.ceil(maxN / 2) : 0, maxN].filter((v, i, a) => a.indexOf(v) === i);

  // X labels: up to 6 evenly-spaced scan numbers
  const xLabelIdxs: number[] = data.length <= 6
    ? data.map((_, i) => i)
    : [0, Math.round(data.length / 3), Math.round((2 * data.length) / 3), data.length - 1];

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible"
        style={{ height: H + 4 }}
        role="img" aria-label="Mosquito detections per scan over time">

        {/* Y hairline gridlines + ticks */}
        {yTicks.map(t => {
          const y = yOf(t);
          return (
            <g key={t}>
              <line x1={P.l} y1={y} x2={P.l + iW} y2={y}
                stroke={GRID} strokeWidth={1} />
              <text x={P.l - 4} y={y} textAnchor="end" dominantBaseline="middle"
                fontSize={9} fill={TEXT_M}
                style={{ fontVariantNumeric: 'tabular-nums' }}>
                {t}
              </text>
            </g>
          );
        })}

        {/* Baseline */}
        <line x1={P.l} y1={P.t + iH} x2={P.l + iW} y2={P.t + iH}
          stroke={AXIS} strokeWidth={1} />

        {/* Area — hue at 10% opacity */}
        <path d={area} fill={SEQ_BLUE} fillOpacity={0.10} />

        {/* Line — 2px, round join */}
        <path d={line} fill="none" stroke={SEQ_BLUE} strokeWidth={2}
          strokeLinejoin="round" strokeLinecap="round" />

        {/* Hover crosshair */}
        {hov !== null && (
          <line x1={pts[hov].x} y1={P.t} x2={pts[hov].x} y2={P.t + iH}
            stroke={AXIS} strokeWidth={1} strokeDasharray="2 2" />
        )}

        {/* Dots — ≥8px hit target, 2px surface ring */}
        {pts.map((p, i) => (
          <g key={i}
            onMouseEnter={() => setHov(i)}
            onMouseLeave={() => setHov(null)}>
            <circle cx={p.x} cy={p.y} r={12} fill="transparent" />
            <circle cx={p.x} cy={p.y} r={5} fill="#0f172a" />
            <circle cx={p.x} cy={p.y} r={3.5}
              fill={hov === i ? '#60a5fa' : SEQ_BLUE} />
          </g>
        ))}

        {/* In-SVG tooltip */}
        {hov !== null && (() => {
          const p = pts[hov];
          const tx = Math.max(P.l, Math.min(p.x - 34, W - P.r - 68));
          const ty = p.y > P.t + 36 ? p.y - 38 : p.y + 10;
          return (
            <g>
              <rect x={tx} y={ty} width={68} height={28} rx={4}
                fill="#1e293b" stroke="#334155" strokeWidth={1} />
              <text x={tx + 6} y={ty + 11} fontSize={9} fill={TEXT_M}>
                Scan #{p.d.idx + 1}
              </text>
              <text x={tx + 6} y={ty + 22} fontSize={10} fontWeight={600} fill={TEXT_P}
                style={{ fontVariantNumeric: 'tabular-nums' }}>
                {p.d.n} detected
              </text>
            </g>
          );
        })()}

        {/* X-axis labels */}
        {xLabelIdxs.map(i => (
          <text key={i} x={pts[i].x} y={P.t + iH + 14}
            textAnchor="middle" fontSize={9} fill={TEXT_M}
            style={{ fontVariantNumeric: 'tabular-nums' }}>
            #{i + 1}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ─── Risk breakdown (ordinal meter bars) ────────────────────────────────────
function RiskBreakdown({ risks, totalScans }: { risks: Derived['risks']; totalScans: number }) {
  if (risks.length === 0) {
    return <p className="text-slate-600 text-sm text-center py-8">No risk data yet</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {risks.map(r => {
        const pct = totalScans > 0 ? (r.count / totalScans) * 100 : 0;
        return (
          <div key={r.risk}>
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-xs text-slate-400">{r.risk}</span>
              <span className="text-xs font-semibold text-slate-300"
                style={{ fontVariantNumeric: 'tabular-nums' }}>
                {r.count} scan{r.count !== 1 ? 's' : ''}
              </span>
            </div>
            {/* Meter: fill on same-surface track */}
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: r.color, opacity: 0.85 }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function AnalyticsDashboard({ entries }: { entries: HistoryEntry[] }) {
  const data = useMemo(() => derive(entries), [entries]);
  const isEmpty = entries.length === 0;

  return (
    <section className="mt-10 border-t border-slate-800 pt-8">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-4 w-4 text-slate-400" />
        <h2 className="text-slate-100 font-semibold text-base">Analytics</h2>
        {!isEmpty && (
          <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-300">
            {entries.length} scan{entries.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-slate-800 bg-slate-900/20">
          <BarChart3 className="h-10 w-10 text-slate-700 mb-3" />
          <p className="text-slate-600 text-sm">Analytics appear after your first scan</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-6"
        >
          {/* KPI row — 4 stat tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile
              icon={<Scan className="h-4 w-4" />}
              label="Total scans"
              value={data.totalScans}
            />
            <StatTile
              icon={<Bug className="h-4 w-4" />}
              label="Mosquitoes detected"
              value={data.totalDetected}
              sub={`avg ${data.totalScans > 0 ? (data.totalDetected / data.totalScans).toFixed(1) : '0'} per scan`}
            />
            <StatTile
              icon={<ShieldAlert className="h-4 w-4" />}
              label="Most common"
              value={
                data.mostCommon ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: data.mostCommon.dot }} />
                    <span className="text-2xl">{data.mostCommon.label}</span>
                  </span>
                ) : '—'
              }
            />
            <StatTile
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="Clean scans"
              value={data.cleanScans}
              sub={`${data.totalScans > 0 ? Math.round((data.cleanScans / data.totalScans) * 100) : 0}% of all scans`}
            />
          </div>

          {/* Charts: species (2/3) + risk breakdown (1/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-xl border border-slate-700 bg-slate-800/60 p-5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-5">
                Species detections
              </p>
              <SpeciesChart data={data.species} />
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-5">
                Risk breakdown
              </p>
              <RiskBreakdown risks={data.risks} totalScans={data.totalScans} />
            </div>
          </div>

          {/* Detection timeline — full width */}
          <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-4">
              Detections per scan
            </p>
            <TimelineChart data={data.timeline} />
          </div>
        </motion.div>
      )}
    </section>
  );
}
