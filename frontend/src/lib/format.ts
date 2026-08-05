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
      return 'badge-sky'
    case 'Bikes':
      return 'badge-emerald'
    case 'Arts & Crafts / Hobbies':
      return 'badge-violet'
    case 'General':
    default:
      return 'badge-neutral'
  }
}

/** Condition badge color classes */
export function conditionBadgeClass(
  condition: string | null | undefined,
): string {
  switch (condition) {
    case 'New':
    case 'Like New':
      return 'badge-emerald'
    case 'Good':
      return 'badge-amber'
    case 'Fair':
    case 'Poor':
      return 'badge-rose'
    default:
      return 'badge-neutral'
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
