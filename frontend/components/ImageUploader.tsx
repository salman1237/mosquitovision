'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, ImageIcon, X, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import Image from 'next/image';

const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.8;

function resizeFile(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = document.createElement('img');
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { naturalWidth: w, naturalHeight: h } = img;
      if (w <= MAX_DIMENSION && h <= MAX_DIMENSION) {
        resolve(file);
        return;
      }
      const scale = MAX_DIMENSION / Math.max(w, h);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => resolve(new File([blob!], file.name, { type: 'image/jpeg' })),
        'image/jpeg',
        JPEG_QUALITY,
      );
    };
    img.src = url;
  });
}

interface ImageUploaderProps {
  onAnalyze: (file: File) => Promise<void>;
  onClear: () => void;
  isLoading: boolean;
}

export default function ImageUploader({ onAnalyze, onClear, isLoading }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    multiple: false,
    disabled: isLoading,
  });

  const clear = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);
    onClear();
  };

  const handleAnalyze = async () => {
    if (!file) return;
    const resized = await resizeFile(file);
    await onAnalyze(resized);
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        {...getRootProps()}
        className={clsx(
          'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200 select-none',
          'min-h-[280px] p-6',
          !isLoading && 'cursor-pointer',
          isDragActive
            ? 'border-green-500 bg-green-950/20'
            : 'border-slate-600 bg-slate-800/40 hover:border-slate-400 hover:bg-slate-800/60',
          isLoading && 'pointer-events-none'
        )}
      >
        <input {...getInputProps()} />

        <AnimatePresence mode="wait">
          {preview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full flex items-center justify-center"
            >
              <div className="relative max-h-[400px] overflow-hidden rounded-lg">
                <Image
                  src={preview}
                  alt="Selected image"
                  width={600}
                  height={400}
                  className="rounded-lg object-contain max-h-[360px] w-auto"
                  unoptimized
                />
                {/* Analyzing overlay */}
                <AnimatePresence>
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-slate-900/75 backdrop-blur-[2px]"
                    >
                      <Loader2 className="h-9 w-9 animate-spin text-green-400 mb-2" />
                      <p className="text-sm font-medium text-slate-200">Analyzing…</p>
                      <p className="text-xs text-slate-500 mt-0.5">Running YOLO inference</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 text-center"
            >
              <motion.div
                animate={isDragActive ? { scale: 1.12 } : { scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-700"
              >
                <Upload className="h-6 w-6 text-slate-300" />
              </motion.div>
              <div>
                <p className="text-slate-200 font-medium">
                  {isDragActive ? 'Drop image here' : 'Drag & drop an image'}
                </p>
                <p className="text-slate-500 text-sm mt-1">or click to browse — PNG, JPG, JPEG, WEBP</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-2">
                <ImageIcon className="h-3.5 w-3.5" />
                <span>Supports single mosquito or multi-specimen images</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex gap-3"
          >
            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className={clsx(
                'flex flex-1 items-center justify-center gap-2 rounded-lg px-5 py-3',
                'bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-semibold transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4" />
                  Analyze Image
                </>
              )}
            </button>

            <button
              onClick={clear}
              disabled={isLoading}
              className="flex items-center justify-center rounded-lg px-4 py-3 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Clear image"
              aria-label="Clear image"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
