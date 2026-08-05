export function Spinner({ className = 'size-5' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin-slow ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-90"
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-ink-800 bg-ink-850 overflow-hidden">
      <div className="shimmer aspect-[4/3] w-full" />
      <div className="p-4 space-y-3">
        <div className="shimmer h-5 w-3/4 rounded" />
        <div className="flex gap-2">
          <div className="shimmer h-5 w-20 rounded-full" />
          <div className="shimmer h-5 w-16 rounded-full" />
        </div>
        <div className="shimmer h-4 w-1/3 rounded" />
      </div>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-ink-850 border border-ink-700 text-ink-400">
        {icon}
      </div>
      <h3 className="text-xl font-display text-ink-100 mb-2">{title}</h3>
      <p className="text-ink-400 max-w-sm mb-6">{description}</p>
      {action}
    </div>
  )
}
