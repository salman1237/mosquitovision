'use client';

import { useEffect, useState } from 'react';
import { Bug } from 'lucide-react';
import { clsx } from 'clsx';

type ApiStatus = 'checking' | 'live' | 'down';

export default function Header() {
  const [status, setStatus] = useState<ApiStatus>('checking');

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/`,
          { signal: AbortSignal.timeout(4000) }
        );
        setStatus(res.ok ? 'live' : 'down');
      } catch {
        setStatus('down');
      }
    };

    check();
    const id = setInterval(check, 15000);
    return () => clearInterval(id);
  }, []);

  const dot = {
    checking: { ping: 'bg-yellow-400', solid: 'bg-yellow-500', label: 'Connecting…' },
    live:     { ping: 'bg-green-400',  solid: 'bg-green-500',  label: 'API Live' },
    down:     { ping: 'bg-red-400',    solid: 'bg-red-500',    label: 'API Offline' },
  }[status];

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-600">
          <Bug className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white leading-tight">MosquitoVision</h1>
          <p className="text-[11px] text-slate-500 leading-tight">AI-Powered Mosquito Detection & Disease Risk Analysis</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className={clsx('absolute inline-flex h-full w-full animate-ping rounded-full opacity-75', dot.ping)} />
            <span className={clsx('relative inline-flex h-2 w-2 rounded-full', dot.solid)} />
          </span>
          <span className={clsx('text-xs', status === 'down' ? 'text-red-400' : 'text-slate-500')}>
            {dot.label}
          </span>
        </div>
      </div>
    </header>
  );
}
