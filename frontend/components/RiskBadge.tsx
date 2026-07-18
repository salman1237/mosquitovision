import { clsx } from 'clsx';

const RISK_STYLES: Record<string, string> = {
  Critical: 'bg-red-900/60 text-red-300 border border-red-700',
  High: 'bg-orange-900/60 text-orange-300 border border-orange-700',
  'Moderate-High': 'bg-amber-900/60 text-amber-300 border border-amber-700',
};

export default function RiskBadge({ risk }: { risk: string }) {
  const style = RISK_STYLES[risk] ?? 'bg-slate-700 text-slate-300 border border-slate-600';

  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold tracking-wide uppercase', style)}>
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 bg-current" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
      </span>
      {risk}
    </span>
  );
}
