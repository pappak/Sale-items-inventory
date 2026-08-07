import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useItems, useDeleteItem, useToggleSold } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useToast } from '../components/Toast'
import { CategoryBadge, ConditionBadge } from '../components/Badges'
import { SkeletonCard, EmptyState, Spinner } from '../components/ui'
import { formatCurrency, primaryPhoto } from '../lib/format'
import { Package, Pencil, Trash2, Plus, Tag, DollarSign, CheckCircle2, Clock, LayoutGrid, CheckSquare, Square } from 'lucide-react'
import type { Item } from '../types'

interface ItemCardProps {
  item: Item
  photo: string | null
  idx: number
  authed: boolean
  deleteItem: ReturnType<typeof useDeleteItem>
  onDelete: (id: string, title: string) => void
  toast: ReturnType<typeof useToast>
  selected: boolean
  onSelect: (id: string) => void
}

function ItemCard({ item, photo, idx, authed, deleteItem, onDelete, toast, selected, onSelect }: ItemCardProps) {
  const toggleSold = useToggleSold(item.id)

  const handleToggleSold = () => {
    toggleSold.mutate(undefined, {
      onSuccess: () =>
        toast(item.is_sold ? `"${item.title}" marked as available` : `"${item.title}" marked as sold`, 'success'),
      onError: (e) => toast(`Failed: ${(e as Error).message}`, 'error'),
    })
  }

  return (
    <div
      className={`group animate-fade-in-up rounded-2xl border overflow-hidden transition-all hover:shadow-xl hover:shadow-black/30 ${
        selected
          ? 'border-teal-400 bg-ink-850 shadow-lg shadow-teal-500/10'
          : 'border-ink-800 bg-ink-850 hover:border-ink-600'
      }`}
      style={{ animationDelay: `${Math.min(idx * 40, 300)}ms` }}
    >
      {/* Photo with SOLD ribbon */}
      <Link
        to={`/items/${item.id}`}
        className="relative block aspect-[4/3] overflow-hidden bg-ink-900"
      >
        {photo ? (
          <img
            src={photo}
            alt={item.title}
            className={`size-full object-cover transition-transform duration-500 group-hover:scale-105 ${item.is_sold ? 'brightness-50' : ''}`}
            loading="lazy"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-ink-600">
            <Package className="size-10" />
          </div>
        )}

        {/* SOLD diagonal banner */}
        {item.is_sold && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <div
              className="absolute w-[140%] text-center py-3 font-black tracking-[0.25em] text-white text-2xl select-none"
              style={{
                transform: 'rotate(-35deg)',
                background: 'linear-gradient(135deg, #dc2626ee, #991b1bee)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
                letterSpacing: '0.3em',
              }}
            >
              SOLD
            </div>
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Link
            to={`/items/${item.id}`}
            className="font-display text-lg text-ink-50 hover:text-teal-300 transition-colors line-clamp-1"
          >
            {item.title}
          </Link>
        </div>

        {/* Thumbnail strip */}
        {item.photos.length > 1 && (
          <div className="flex gap-1.5 mb-3">
            {item.photos
              .slice()
              .sort((a, b) => a.sort_order - b.sort_order)
              .slice(1, 5)
              .map((p) => (
                <div
                  key={p.id}
                  className="size-12 shrink-0 overflow-hidden rounded-md ring-1 ring-ink-700 bg-ink-800"
                >
                  <img
                    src={p.url}
                    alt=""
                    className="size-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            {item.photos.length > 5 && (
              <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-ink-800 text-xs font-mono text-ink-400 ring-1 ring-ink-700">
                +{item.photos.length - 5}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 mb-3">
          <CategoryBadge category={item.category} />
          <ConditionBadge condition={item.condition} />
          {item.is_sold && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-xs font-semibold text-rose-400 ring-1 ring-rose-500/40">
              SOLD
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-ink-500 font-medium mb-0.5">
              {item.is_sold ? 'Sold for' : 'Asking'}
            </p>
            <p className={`font-mono text-lg ${item.is_sold ? 'text-ink-400 line-through' : 'text-teal-300'}`}>
              {formatCurrency(item.asking_price)}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Select toggle */}
            {!item.is_sold && (
              <button
                onClick={() => onSelect(item.id)}
                title={selected ? 'Deselect' : 'Select for price total'}
                className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                  selected
                    ? 'bg-teal-500/20 text-teal-300 ring-1 ring-teal-500/40'
                    : 'bg-ink-800 text-ink-400 hover:bg-ink-700 hover:text-ink-100'
                }`}
              >
                {selected ? <CheckSquare className="size-3.5" /> : <Square className="size-3.5" />}
                {selected ? 'Selected' : 'Select'}
              </button>
            )}
            {authed && (
              <div className="flex gap-1.5">
                <button
                  onClick={handleToggleSold}
                  disabled={toggleSold.isPending}
                  title={item.is_sold ? 'Mark as available' : 'Mark as sold'}
                  className={`flex size-9 items-center justify-center rounded-lg transition-colors disabled:opacity-50 ${
                    item.is_sold
                      ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                      : 'bg-ink-800 text-ink-300 hover:bg-rose-500/15 hover:text-rose-400'
                  }`}
                  aria-label={item.is_sold ? 'Mark as available' : 'Mark as sold'}
                >
                  {toggleSold.isPending ? <Spinner className="size-4" /> : <Tag className="size-4" />}
                </button>
                <Link
                  to={`/items/${item.id}/edit`}
                  className="flex size-9 items-center justify-center rounded-lg bg-ink-800 text-ink-300 hover:bg-ink-700 hover:text-ink-50 transition-colors"
                  aria-label={`Edit ${item.title}`}
                >
                  <Pencil className="size-4" />
                </Link>
                <button
                  onClick={() => onDelete(item.id, item.title)}
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
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


export function Dashboard() {
  const [activeTab, setActiveTab] = useState<string>('All')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const { authed } = useAuth()
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

  // Admin stats — computed from all items
  const stats = useMemo(() => {
    const all = allItems ?? []
    const available = all.filter(i => !i.is_sold)
    const sold = all.filter(i => i.is_sold)
    const totalAsking = available.reduce((sum, i) => sum + (i.asking_price ?? 0), 0)
    const totalEstimated = all.reduce((sum, i) => sum + (i.estimated_value ?? 0), 0)
    const totalSoldValue = sold.reduce((sum, i) => sum + (i.asking_price ?? 0), 0)
    const categories = new Set(all.map(i => i.category).filter(Boolean)).size
    return { total: all.length, available: available.length, sold: sold.length, totalAsking, totalEstimated, totalSoldValue, categories }
  }, [allItems])

  // Asking price — uses selected items if any are selected, otherwise all visible
  const filteredAsking = useMemo(() => {
    if (selectedIds.size > 0) {
      return (allItems ?? []).filter(i => selectedIds.has(i.id) && !i.is_sold)
        .reduce((sum, i) => sum + (i.asking_price ?? 0), 0)
    }
    return items.filter(i => !i.is_sold).reduce((sum, i) => sum + (i.asking_price ?? 0), 0)
  }, [items, allItems, selectedIds])

  const handleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="animate-fade-in">
      {/* Stats panel */}
      {!isLoading && (allItems?.length ?? 0) > 0 && (
        <div className="mb-8 grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="rounded-xl border border-ink-700 bg-ink-800 p-4">
            <div className="flex items-center gap-2 text-ink-400 text-xs font-medium uppercase tracking-wider mb-2">
              <LayoutGrid className="size-3.5" />
              Total Items
            </div>
            <p className="text-2xl font-bold text-blue-400">{stats.total}</p>
            <p className="text-xs text-ink-500 mt-0.5">{stats.categories} categor{stats.categories === 1 ? 'y' : 'ies'}</p>
          </div>

          <div className="rounded-xl border border-ink-700 bg-ink-800 p-4">
            <div className="flex items-center gap-2 text-ink-400 text-xs font-medium uppercase tracking-wider mb-2">
              <Clock className="size-3.5" />
              Available
            </div>
            <p className="text-2xl font-bold text-teal-300">{stats.available}</p>
            <p className="text-xs text-ink-500 mt-0.5">{formatCurrency(stats.totalAsking)} asking</p>
          </div>

          <div className="rounded-xl border border-ink-700 bg-ink-800 p-4">
            <div className="flex items-center gap-2 text-ink-400 text-xs font-medium uppercase tracking-wider mb-2">
              <CheckCircle2 className="size-3.5" />
              Sold
            </div>
            <p className="text-2xl font-bold text-rose-400">{stats.sold}</p>
            <p className="text-xs text-ink-500 mt-0.5">{formatCurrency(stats.totalSoldValue)} total</p>
          </div>

          <div className="rounded-xl border border-ink-700 bg-ink-800 p-4">
            <div className="flex items-center gap-2 text-ink-400 text-xs font-medium uppercase tracking-wider mb-2">
              <DollarSign className="size-3.5" />
              Est. Value
            </div>
            <p className="text-2xl font-bold text-violet-400">{formatCurrency(stats.totalEstimated)}</p>
            <p className="text-xs text-ink-500 mt-0.5">across all items</p>
          </div>

          <div className={`rounded-xl border p-4 transition-all duration-300 ${
            selectedIds.size > 0
              ? 'border-teal-500/60 bg-teal-500/10 shadow-lg shadow-teal-500/10'
              : 'border-ink-700 bg-ink-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wider transition-colors ${selectedIds.size > 0 ? 'text-teal-400' : 'text-ink-400'}`}>
                <Tag className="size-3.5" />
                Asking Price
              </div>
              {selectedIds.size > 0 && (
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-[10px] font-medium text-teal-500/60 hover:text-rose-400 transition-colors"
                >
                  ✕ Clear
                </button>
              )}
            </div>
            <p className={`text-2xl font-bold transition-colors duration-300 ${selectedIds.size > 0 ? 'text-teal-300' : 'text-sky-300'}`}>
              {formatCurrency(filteredAsking)}
            </p>
            <p className={`text-xs mt-0.5 transition-colors ${selectedIds.size > 0 ? 'text-teal-500' : 'text-ink-500'}`}>
              {selectedIds.size > 0 ? `${selectedIds.size} item${selectedIds.size === 1 ? '' : 's'} selected` : activeTab === 'All' ? 'asking price total' : `${activeTab} total`}
            </p>
          </div>
        </div>
      )}

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
              <ItemCard
                key={item.id}
                item={item}
                photo={photo}
                idx={idx}
                authed={authed}
                deleteItem={deleteItem}
                onDelete={handleDelete}
                toast={toast}
                selected={selectedIds.has(item.id)}
                onSelect={handleSelect}
              />
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
            authed ? (
              <Link
                to="/items/new"
                className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-semibold text-ink-950 hover:bg-teal-400 transition-colors"
              >
                <Plus className="size-4" />
                Add Your First Item
              </Link>
            ) : undefined
          }
        />
      )}
    </div>
  )
}
