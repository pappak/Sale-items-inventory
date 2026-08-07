import { useParams, Link, useNavigate } from 'react-router-dom'
import { useItem } from '../lib/api'
import { useAuth } from '../lib/auth'
import { PhotoGallery } from '../components/PhotoGallery'
import { CategoryBadge, ConditionBadge } from '../components/Badges'
import { Spinner } from '../components/ui'
import { formatCurrency, formatDateLong } from '../lib/format'
import { ArrowLeft, Ruler, MapPin, DollarSign, Tag, Package, Pencil } from 'lucide-react'

export function ItemDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: item, isLoading, isError } = useItem(id)
  const { authed } = useAuth()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="size-8 text-teal-400" />
      </div>
    )
  }

  if (isError || !item) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-ink-850 border border-ink-700 text-ink-500">
          <Package className="size-8" />
        </div>
        <h1 className="text-2xl font-display text-ink-100 mb-2">Item Not Found</h1>
        <p className="text-ink-400 max-w-sm">
          This item may have been removed or is no longer available.
        </p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-sm text-ink-400 hover:text-ink-100 transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left: Photos */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          {item.photos.length > 0 ? (
            <div className="relative">
              <PhotoGallery photos={item.photos} title={item.title} />
              {item.is_sold && (
                <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none flex items-center justify-center">
                  <div className="absolute inset-0 bg-black/40 rounded-xl" />
                  <div
                    className="relative w-[120%] text-center py-4 font-black text-white text-4xl select-none"
                    style={{
                      transform: 'rotate(-35deg)',
                      background: 'linear-gradient(135deg, #dc2626ee, #991b1bee)',
                      boxShadow: '0 6px 32px rgba(0,0,0,0.7)',
                      letterSpacing: '0.35em',
                    }}
                  >
                    SOLD
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="relative flex aspect-[4/3] items-center justify-center rounded-xl bg-ink-900 border border-ink-800 text-ink-600 overflow-hidden">
              <Package className="size-12" />
              {item.is_sold && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="w-[120%] text-center py-4 font-black text-white text-4xl select-none"
                    style={{
                      transform: 'rotate(-35deg)',
                      background: 'linear-gradient(135deg, #dc2626ee, #991b1bee)',
                      boxShadow: '0 6px 32px rgba(0,0,0,0.7)',
                      letterSpacing: '0.35em',
                    }}
                  >
                    SOLD
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div>
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-3xl sm:text-4xl font-display text-ink-50 leading-tight">
              {item.title}
            </h1>
            {authed && (
              <Link
                to={`/items/${item.id}/edit`}
                className="shrink-0 flex items-center gap-1.5 rounded-lg bg-ink-800 px-3 py-2 text-sm font-medium text-ink-300 hover:bg-ink-700 hover:text-ink-50 transition-colors"
              >
                <Pencil className="size-4" />
                Edit
              </Link>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-6">
            {item.category && <CategoryBadge category={item.category} />}
            <ConditionBadge condition={item.condition} />
            {item.is_sold && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-1 text-sm font-bold text-rose-400 ring-1 ring-rose-500/40 uppercase tracking-wide">
                Sold
              </span>
            )}
          </div>

          {/* Description */}
          {item.description && (
            <div className="mb-8">
              <h2 className="text-xs uppercase tracking-wider text-ink-500 font-medium mb-2">
                Description
              </h2>
              <p className="text-ink-200 leading-relaxed whitespace-pre-wrap">
                {item.description}
              </p>
            </div>
          )}

          {/* Specs grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {item.dimensions && (
              <SpecCard
                icon={<Ruler className="size-4" />}
                label="Dimensions"
                value={item.dimensions}
              />
            )}
            {item.provenance && (
              <SpecCard
                icon={<MapPin className="size-4" />}
                label="Provenance"
                value={item.provenance}
              />
            )}
            {item.estimated_value != null && (
              <SpecCard
                icon={<DollarSign className="size-4" />}
                label="Estimated Value"
                value={formatCurrency(item.estimated_value)}
              />
            )}
            {item.asking_price != null && (
              <SpecCard
                icon={<Tag className="size-4" />}
                label={item.is_sold ? 'Sold Price' : 'Asking Price'}
                value={formatCurrency(item.asking_price)}
                highlight={!item.is_sold}
                strikethrough={item.is_sold}
              />
            )}
          </div>

          {/* Meta */}
          <div className="mt-8 pt-6 border-t border-ink-800">
            <p className="text-xs text-ink-500">
              Listed {formatDateLong(item.created_at)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SpecCard({
  icon,
  label,
  value,
  highlight = false,
  strikethrough = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  highlight?: boolean
  strikethrough?: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? 'border-teal-500/30 bg-teal-500/5'
          : strikethrough
          ? 'border-rose-500/20 bg-rose-500/5'
          : 'border-ink-700 bg-ink-900/50'
      }`}
    >
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ink-500 font-medium mb-1.5">
        {icon}
        {label}
      </div>
      <p
        className={`text-sm font-medium ${
          highlight ? 'text-teal-300 font-mono text-lg' : strikethrough ? 'text-ink-400 line-through' : 'text-ink-100'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
