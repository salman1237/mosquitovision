'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, FolderOpen, Loader2, Shuffle } from 'lucide-react';
import { clsx } from 'clsx';
import {
  fetchSampleAsFile,
  fetchSampleCollections,
  fetchSamplePage,
  sampleUrl,
  type SampleCollection,
  type SampleImage,
} from '@/lib/api';

const PAGE_SIZE = 24;

interface SampleGalleryProps {
  /** Called with the chosen image wrapped as a File; the parent runs analysis. */
  onPick: (file: File) => void | Promise<void>;
  disabled?: boolean;
}

/**
 * Browses the server-hosted sample library (/api/samples) so a demo can be
 * run from any machine without needing local copies of the test images.
 */
export default function SampleGallery({ onPick, disabled }: SampleGalleryProps) {
  const [collections, setCollections] = useState<SampleCollection[] | null>(null);
  const [collectionId, setCollectionId] = useState<string>('');
  const [folderId, setFolderId] = useState<string>('');
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<SampleImage[]>([]);
  // Key of the page most recently loaded; "loading" is derived by comparing it
  // to the requested key, so no state is set synchronously inside the effect.
  const [loadedKey, setLoadedKey] = useState<string>('');
  const [picking, setPicking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pageKey = `${collectionId}|${folderId}|${offset}|${seed ?? ''}`;
  const loadingPage = !!collectionId && !!folderId && loadedKey !== pageKey;

  // Load the catalogue once; hide the whole panel if the server has no library.
  useEffect(() => {
    fetchSampleCollections()
      .then((cols) => {
        setCollections(cols);
        if (cols.length > 0) {
          setCollectionId(cols[0].id);
          setFolderId(cols[0].folders[0]?.id ?? '');
        }
      })
      .catch(() => setCollections([]));
  }, []);

  // Fetch the page whenever the selection changes; ignore stale responses.
  useEffect(() => {
    if (!collectionId || !folderId) return;
    let cancelled = false;
    fetchSamplePage(collectionId, folderId, offset, PAGE_SIZE, seed)
      .then((page) => {
        if (cancelled) return;
        setItems(page.items);
        setTotal(page.total);
        setError(null);
        setLoadedKey(pageKey);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Could not load sample images.');
        setLoadedKey(pageKey);
      });
    return () => { cancelled = true; };
  }, [collectionId, folderId, offset, seed, pageKey]);

  const selectFolder = (cid: string, fid: string) => {
    setCollectionId(cid);
    setFolderId(fid);
    setOffset(0);
  };

  const shuffle = () => {
    setSeed(Math.floor(Math.random() * 1_000_000));
    setOffset(0);
  };

  const pick = async (img: SampleImage) => {
    if (disabled || picking) return;
    setPicking(img.url);
    setError(null);
    try {
      const file = await fetchSampleAsFile(img);
      await onPick(file);
    } catch {
      setError('Could not fetch that image from the server.');
    } finally {
      setPicking(null);
    }
  };

  if (collections === null) return null;         // still loading catalogue
  if (collections.length === 0) return null;     // no library on this server

  const current = collections.find((c) => c.id === collectionId);
  const pageStart = total === 0 ? 0 : offset + 1;
  const pageEnd = Math.min(offset + PAGE_SIZE, total);

  return (
    <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="flex items-center gap-2 text-slate-100 font-semibold text-sm">
            <FolderOpen className="h-4 w-4 text-green-400" />
            Sample images on server
          </h3>
          <p className="text-slate-500 text-xs mt-0.5">
            Click any image to analyse it — no upload from this device needed.
          </p>
        </div>
        <button
          onClick={shuffle}
          disabled={disabled || loadingPage}
          className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-700 disabled:opacity-50"
          title="Show a random selection"
        >
          <Shuffle className="h-3.5 w-3.5" /> Shuffle
        </button>
      </div>

      {/* Folder tabs, grouped by collection */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {collections.map((c) =>
          c.folders.map((f) => {
            const active = c.id === collectionId && f.id === folderId;
            return (
              <button
                key={`${c.id}/${f.id}`}
                onClick={() => selectFolder(c.id, f.id)}
                disabled={disabled}
                className={clsx(
                  'rounded-md px-2.5 py-1 text-xs border transition-colors',
                  active
                    ? 'border-green-600 bg-green-950/40 text-green-300'
                    : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:text-slate-200',
                )}
                title={c.name}
              >
                {c.id === 'real' ? 'Real · ' : 'Synthetic · '}{f.name}
                <span className="ml-1 text-slate-600">{f.count}</span>
              </button>
            );
          }),
        )}
      </div>

      {/* Thumbnail grid */}
      <div className="relative min-h-[120px]">
        {loadingPage && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/60 rounded-lg">
            <Loader2 className="h-6 w-6 animate-spin text-green-400" />
          </div>
        )}
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {items.map((img) => {
            const busy = picking === img.url;
            return (
              <button
                key={img.url}
                onClick={() => pick(img)}
                disabled={disabled || !!picking}
                className={clsx(
                  'group relative aspect-square overflow-hidden rounded-md border bg-slate-800',
                  'border-slate-700 hover:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500',
                  'disabled:cursor-not-allowed',
                )}
                title={img.name}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sampleUrl(img.thumb)}
                  alt={img.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
                {busy && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70">
                    <Loader2 className="h-5 w-5 animate-spin text-green-400" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pager */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>
          {current?.name}: {pageStart}–{pageEnd} of {total}
        </span>
        <div className="flex gap-1.5">
          <button
            onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
            disabled={disabled || loadingPage || offset === 0}
            className="rounded-md border border-slate-700 bg-slate-800 p-1.5 hover:bg-slate-700 disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setOffset((o) => o + PAGE_SIZE)}
            disabled={disabled || loadingPage || offset + PAGE_SIZE >= total}
            className="rounded-md border border-slate-700 bg-slate-800 p-1.5 hover:bg-slate-700 disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </section>
  );
}
