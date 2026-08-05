import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useItems, useDeleteItem } from '../lib/api'
import { useToast } from '../components/Toast'
import { CategoryBadge, ConditionBadge } from '../components/Badges'
import { SkeletonCard, EmptyState, Spinner } from '../components/ui'
import { formatCurrency, primaryPhoto } from '../lib/format'
import { Package, Pencil, Trash2, Plus } from 'lucide-react'

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<string>('All')
  // Always fetch all items; filter + derive tabs client-side
  const { data: allItems, isLoading, isError } = useItems()
  const deleteItem = useDeleteItem()
  const toast = useToast()

  // Derive categories dynamically from actual items (sorted, with counts)
  const { tabs, items } = useMemo(() => {
    const all = allItems ?? []
    const cats = Array.from(
      new Set(all.map((i) => i.category).filter(Boolean) as string[])
    ).sort()
    const tabs = ['All', ...cats]
    const items = activeTab === 'All'
      ? all
      : all.filter((i) => i.category === activeTab)
    return { tabs, items }
  }, [allItems, activeTab])

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    deleteItem.mutate(id, {
      onSuccess: () => toast(`"${title}" deleted`, 'success'),
      onError: (e) => toast(`Failed to delete: ${e.message}`, 'error'),
    })
  }

  return (
    <div className="animate-fade-in">
      {/* Page heading */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl text-ink-50 mb-1.5">
            Your Inventory
          </h1>
          <p className="text-ink-400">
            {allItems?.length ?? 0} item{(allItems?.length ?? 0) === 1 ? '' : 's'} in
            your catalog
          </p>
        </div>
      </div>

      {/* Category tabs */}
      <div className="mb-8 flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-teal-500 text-ink-950'
                : 'bg-ink-850 text-ink-300 border border-ink-700 hover:border-ink-600 hover:text-ink-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={<Package className="size-7" />}
          title="Couldn't load items"
          description="There was a problem fetching your inventory. Make sure the backend is running."
        />
      ) : items && items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item, idx) => {
            const photo = primaryPhoto(item.photos)
            return (
              <div
                key={item.id}
                className="group animate-fade-in-up rounded-2xl border border-ink-800 bg-ink-850 overflow-hidden hover:border-ink-600 transition-all hover:shadow-xl hover:shadow-black/30"
                style={{ animationDelay: `${Math.min(idx * 40, 300)}ms` }}
              >
                {/* Photo */}
                <Link
                  to={`/items/${item.id}/edit`}
                  className="relative block aspect-[4/3] overflow-hidden bg-ink-900"
                >
                  {photo ? (
                    <img
                      src={photo}
                      alt={item.title}
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-ink-600">
                      <Package className="size-10" />
                    </div>
                  )}
                  {item.photos.length > 1 && (
                    <div className="absolute top-2.5 right-2.5 rounded-md bg-black/60 backdrop-blur-sm px-2 py-0.5 text-xs text-ink-100 font-mono">
                      {item.photos.length} photos
                    </div>
                  )}
                </Link>

                {/* Body */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Link
                      to={`/items/${item.id}/edit`}
                      className="font-display text-lg text-ink-50 hover:text-teal-300 transition-colors line-clamp-1"
                    >
                      {item.title}
                    </Link>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <CategoryBadge category={item.category} />
                    <ConditionBadge condition={item.condition} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-ink-500 font-medium mb-0.5">
                        Asking
                      </p>
                      <p className="font-mono text-lg text-teal-300">
                        {formatCurrency(item.asking_price)}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <Link
                        to={`/items/${item.id}/edit`}
                        className="flex size-9 items-center justify-center rounded-lg bg-ink-800 text-ink-300 hover:bg-ink-700 hover:text-ink-50 transition-colors"
                        aria-label={`Edit ${item.title}`}
                      >
                        <Pencil className="size-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(item.id, item.title)}
                        disabled={deleteItem.isPending}
                        className="flex size-9 items-center justify-center rounded-lg bg-ink-800 text-ink-300 hover:bg-rose-500/15 hover:text-rose-400 transition-colors disabled:opacity-50"
                        aria-label={`Delete ${item.title}`}
                      >
                        {deleteItem.isPending && deleteItem.variables === item.id ? (
                          <Spinner className="size-4" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Package className="size-7" />}
          title="No items yet"
          description={
            activeTab === 'All'
              ? 'Start building your catalog by adding your first item.'
              : `No items in the "${activeTab}" category yet.`
          }
          action={
            <Link
              to="/items/new"
              className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-semibold text-ink-950 hover:bg-teal-400 transition-colors"
            >
              <Plus className="size-4" />
              Add Your First Item
            </Link>
          }
        />
      )}
    </div>
  )
}
