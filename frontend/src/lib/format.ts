export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateLong(value: string | null | undefined): string {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/** Category badge color classes */
export function categoryBadgeClass(category: string | null | undefined): string {
  switch (category) {
    case 'Photography Gear':
      return 'bg-sky-500/15 text-sky-300 border-sky-500/30'
    case 'Bikes':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    case 'N-Scale Trains':
      return 'bg-violet-500/15 text-violet-300 border-violet-500/30'
    case 'Airbrush & Compressor':
      return 'bg-orange-500/15 text-orange-300 border-orange-500/30'
    case 'General':
    default:
      return 'bg-ink-600/40 text-ink-300 border-ink-500/40'
  }
}

/** Condition badge color classes */
export function conditionBadgeClass(
  condition: string | null | undefined,
): string {
  switch (condition) {
    case 'New':
    case 'Like New':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    case 'Good':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    case 'Fair':
    case 'Poor':
      return 'bg-rose-500/15 text-rose-300 border-rose-500/30'
    default:
      return 'bg-ink-600/40 text-ink-300 border-ink-500/40'
  }
}

/** Get primary photo (sort_order 0) or first available */
export function primaryPhoto(
  photos: { url: string; sort_order: number }[] | undefined,
): string | null {
  if (!photos || photos.length === 0) return null
  const sorted = [...photos].sort((a, b) => a.sort_order - b.sort_order)
  return sorted[0].url
}
