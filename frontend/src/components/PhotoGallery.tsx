import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Photo } from '../types'

export function PhotoGallery({
  photos,
  title,
}: {
  photos: Photo[]
  title: string
}) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [zoomed, setZoomed] = useState(false)

  const sorted = [...photos].sort((a, b) => a.sort_order - b.sort_order)

  const next = useCallback(
    () => setActiveIdx((i) => (i + 1) % sorted.length),
    [sorted.length],
  )
  const prev = useCallback(
    () => setActiveIdx((i) => (i - 1 + sorted.length) % sorted.length),
    [sorted.length],
  )

  useEffect(() => {
    if (!zoomed) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomed(false)
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [zoomed, next, prev])

  if (sorted.length === 0) return null

  return (
    <>
      <div className="space-y-3">
        {/* Main image */}
        <button
          onClick={() => setZoomed(true)}
          className="group relative block w-full aspect-[4/3] overflow-hidden rounded-xl bg-ink-900 border border-ink-800"
          aria-label={`Zoom ${title} photo ${activeIdx + 1}`}
        >
          <img
            src={sorted[activeIdx].url}
            alt={`${title} — photo ${activeIdx + 1}`}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          {sorted.length > 1 && (
            <div className="absolute bottom-3 right-3 rounded-lg bg-black/60 backdrop-blur-sm px-2.5 py-1 text-xs text-ink-100 font-mono">
              {activeIdx + 1} / {sorted.length}
            </div>
          )}
        </button>

        {/* Thumbnails */}
        {sorted.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {sorted.map((photo, idx) => (
              <button
                key={photo.id}
                onClick={() => setActiveIdx(idx)}
                className={`relative size-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                  idx === activeIdx
                    ? 'border-teal-500 ring-2 ring-teal-500/20'
                    : 'border-ink-700 opacity-60 hover:opacity-100'
                }`}
                aria-label={`View photo ${idx + 1}`}
              >
                <img
                  src={photo.url}
                  alt=""
                  className="size-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zoom modal */}
      {zoomed && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in"
          onClick={() => setZoomed(false)}
        >
          <button
            className="absolute top-5 right-5 flex size-10 items-center justify-center rounded-full bg-ink-800/80 text-ink-100 hover:bg-ink-700 transition-colors"
            onClick={() => setZoomed(false)}
            aria-label="Close zoom"
          >
            <X className="size-5" />
          </button>

          {sorted.length > 1 && (
            <>
              <button
                className="absolute left-4 sm:left-8 flex size-12 items-center justify-center rounded-full bg-ink-800/80 text-ink-100 hover:bg-ink-700 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  prev()
                }}
                aria-label="Previous photo"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                className="absolute right-4 sm:right-8 flex size-12 items-center justify-center rounded-full bg-ink-800/80 text-ink-100 hover:bg-ink-700 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  next()
                }}
                aria-label="Next photo"
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          )}

          <img
            src={sorted[activeIdx].url}
            alt={`${title} — photo ${activeIdx + 1}`}
            className="max-h-[88vh] max-w-[92vw] object-contain rounded-lg animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
