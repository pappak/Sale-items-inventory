import { categoryBadgeClass, conditionBadgeClass } from '../lib/format'

export function CategoryBadge({
  category,
  className = '',
}: {
  category: string | null | undefined
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${categoryBadgeClass(category)} ${className}`}
    >
      {category ?? 'Uncategorized'}
    </span>
  )
}

export function ConditionBadge({
  condition,
  className = '',
}: {
  condition: string | null | undefined
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${conditionBadgeClass(condition)} ${className}`}
    >
      {condition ?? 'Unknown'}
    </span>
  )
}
