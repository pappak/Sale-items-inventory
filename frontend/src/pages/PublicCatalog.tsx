import { useParams } from 'react-router-dom'
import { usePublicCatalog, exportPdf } from '../lib/api'
import { PhotoGallery } from '../components/PhotoGallery'
import { CategoryBadge, ConditionBadge } from '../components/Badges'
import { Spinner } from '../components/ui'
import { formatCurrency, formatDateLong } from '../lib/format'
import { Boxes, FileDown, Ruler, MapPin, DollarSign, Tag } from 'lucide-react'

export function PublicCatalog() {
  const { token } = useParams<{ token: string }>()
  const { data, isLoading, isError } = usePublicCatalog(token)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950">
        <Spinner className="size-8 text-teal-400" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-6 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-ink-850 border border-ink-700 text-ink-500">
          <Boxes className="size-8" />
        </div>
        <h1 className="text-2xl font-display text-ink-100 mb-2">
          Catalog Not Found
        </h1>
        <p className="text-ink-400 max-w-sm">
          This share link may have expired or been removed. Please contact the
          seller for an updated link.
        </p>
      </div>
    )
  }

  const { items, label, scope } = data
  const today = formatDateLong(new Date().toISOString())

  const handleExport = () => {
    // Determine export params from the share scope
    if (scope === 'all') {
      exportPdf('all')
    } else if (scope === 'category' && items[0]?.category) {
      exportPdf('category', undefined, token)
    } else if (scope === 'item' && items[0]?.id) {
      exportPdf('item', items[0].id)
    } else {
      exportPdf('all')
    }
  }

  return (
    <div className="min-h-screen bg-ink-950 grain">
      {/* Header */}
      <header className="border-b border-ink-800 bg-ink-950/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                <Boxes className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-base text-ink-50 truncate">
                  {label || 'Inventory Catalog'}
                </p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-ink-500 font-medium">
                  {today}
                </p>
              </div>
            </div>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-3.5 py-2 text-sm font-semibold text-ink-950 hover:bg-teal-400 transition-colors shrink-0"
            >
              <FileDown className="size-4" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Title block */}
        <div className="mb-10 sm:mb-14 animate-fade-in">
          <p className="text-xs uppercase tracking-[0.25em] text-teal-400 font-semibold mb-3">
            Inventory Catalog
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl text-ink-50 mb-3 leading-[1.05]">
            {label || 'Available Items'}
          </h1>
          <div className="flex items-center gap-4 text-sm text-ink-400">
            <span>
              {items.length} item{items.length === 1 ? '' : 's'}
            </span>
            <span className="size-1 rounded-full bg-ink-600" />
            <span>Updated {today}</span>
          </div>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className="rounded-2xl border border-ink-800 bg-ink-850 p-12 text-center">
            <p className="text-ink-400">
              No items are currently available in this catalog.
            </p>
          </div>
        ) : (
          <div className="space-y-12 sm:space-y-16">
            {items.map((item, idx) => (
              <article
                key={item.id}
                className="animate-fade-in-up grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 pb-12 sm:pb-16 border-b border-ink-800 last:border-0 last:pb-0"
                style={{ animationDelay: `${Math.min(idx * 80, 400)}ms` }}
              >
                {/* Photo gallery */}
                <div className="md:sticky md:top-24 md:self-start">
                  {item.photos.length > 0 ? (
                    <PhotoGallery photos={item.photos} title={item.title} />
                  ) : (
                    <div className="aspect-[4/3] rounded-xl bg-ink-900 border border-ink-800 flex items-center justify-center text-ink-600">
                      <Boxes className="size-12" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-5">
                  <div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <CategoryBadge category={item.category} />
                      <ConditionBadge condition={item.condition} />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-display text-ink-50 leading-tight">
                      {item.title}
                    </h2>
                  </div>

                  {item.description && (
                    <p className="text-ink-300 leading-relaxed whitespace-pre-wrap">
                      {item.description}
                    </p>
                  )}

                  {/* Specs grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {item.dimensions && (
                      <SpecRow
                        icon={<Ruler className="size-4" />}
                        label="Dimensions"
                        value={item.dimensions}
                      />
                    )}
                    {item.provenance && (
                      <SpecRow
                        icon={<MapPin className="size-4" />}
                        label="Provenance"
                        value={item.provenance}
                      />
                    )}
                    {item.estimated_value != null && (
                      <SpecRow
                        icon={<DollarSign className="size-4" />}
                        label="Estimated Value"
                        value={formatCurrency(item.estimated_value)}
                      />
                    )}
                    {item.asking_price != null && (
                      <SpecRow
                        icon={<Tag className="size-4" />}
                        label="Asking Price"
                        value={formatCurrency(item.asking_price)}
                        highlight
                      />
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-ink-800 text-center">
          <p className="text-xs text-ink-500">
            Catalog generated {today} · {items.length} item
            {items.length === 1 ? '' : 's'}
          </p>
        </footer>
      </main>
    </div>
  )
}

function SpecRow({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        highlight
          ? 'border-teal-500/30 bg-teal-500/5'
          : 'border-ink-700 bg-ink-900/50'
      }`}
    >
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ink-500 font-medium mb-1">
        {icon}
        {label}
      </div>
      <p
        className={`text-sm font-medium ${
          highlight ? 'text-teal-300 font-mono text-base' : 'text-ink-100'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
