import { useState } from 'react'
import {
  useShareLinks,
  useCreateShareLink,
  useDeleteShareLink,
  useItems,
} from '../lib/api'
import { useToast } from '../components/Toast'
import { Spinner, EmptyState } from '../components/ui'
import { formatDate } from '../lib/format'
import { CATEGORIES } from '../types'
import {
  Share2,
  Copy,
  Trash2,
  Plus,
  Link2,
  Globe,
  FolderTree,
  Package,
} from 'lucide-react'

type Scope = 'all' | 'category' | 'item'

const scopeMeta: Record<
  Scope,
  { label: string; icon: typeof Globe; desc: string }
> = {
  all: { label: 'All Items', icon: Globe, desc: 'Share your entire catalog' },
  category: {
    label: 'By Category',
    icon: FolderTree,
    desc: 'Share items in one category',
  },
  item: { label: 'Single Item', icon: Package, desc: 'Share one specific item' },
}

export function ShareManager() {
  const { data: shareLinks, isLoading } = useShareLinks()
  const { data: items } = useItems()
  const createLink = useCreateShareLink()
  const deleteLink = useDeleteShareLink()
  const toast = useToast()

  const [scope, setScope] = useState<Scope>('all')
  const [category, setCategory] = useState('')
  const [itemId, setItemId] = useState('')
  const [itemSearch, setItemSearch] = useState('')
  const [label, setLabel] = useState('')

  const handleCreate = () => {
    if (scope === 'category' && !category) {
      toast('Please select a category', 'error')
      return
    }
    if (scope === 'item' && !itemId) {
      toast('Please select an item', 'error')
      return
    }
    createLink.mutate(
      {
        scope,
        category: scope === 'category' ? category : null,
        item_id: scope === 'item' ? itemId : null,
        label: label.trim() || null,
      },
      {
        onSuccess: () => {
          toast('Share link created', 'success')
          setLabel('')
          setCategory('')
          setItemId('')
          setItemSearch('')
        },
        onError: (e) => toast(`Failed: ${e.message}`, 'error'),
      },
    )
  }

  const handleCopy = (token: string) => {
    const url = `${window.location.origin}/#/share/${token}`
    navigator.clipboard
      .writeText(url)
      .then(() => toast('Link copied to clipboard', 'success'))
      .catch(() => toast('Copy failed — select and copy manually', 'error'))
  }

  const handleDelete = (id: string) => {
    if (!confirm('Delete this share link? The URL will stop working.')) return
    deleteLink.mutate(id, {
      onSuccess: () => toast('Share link deleted', 'success'),
      onError: (e) => toast(`Failed: ${e.message}`, 'error'),
    })
  }

  const filteredItems = (items ?? []).filter((item) =>
    item.title.toLowerCase().includes(itemSearch.toLowerCase()),
  )

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl text-ink-50 mb-1.5">Share Links</h1>
        <p className="text-ink-400">
          Create shareable catalog links for auction houses and buyers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Create form */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-ink-800 bg-ink-850 p-6 sticky top-24">
            <h2 className="text-lg font-display text-ink-50 mb-4 flex items-center gap-2">
              <Plus className="size-5 text-teal-400" />
              Create Share Link
            </h2>

            {/* Scope selector */}
            <div className="space-y-2 mb-5">
              {(Object.keys(scopeMeta) as Scope[]).map((s) => {
                const meta = scopeMeta[s]
                const Icon = meta.icon
                return (
                  <button
                    key={s}
                    onClick={() => setScope(s)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                      scope === s
                        ? 'border-teal-500 bg-teal-500/5'
                        : 'border-ink-700 hover:border-ink-600'
                    }`}
                  >
                    <div
                      className={`flex size-9 items-center justify-center rounded-lg ${
                        scope === s
                          ? 'bg-teal-500/15 text-teal-400'
                          : 'bg-ink-800 text-ink-400'
                      }`}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink-100">
                        {meta.label}
                      </p>
                      <p className="text-xs text-ink-500">{meta.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Conditional fields */}
            {scope === 'category' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-ink-200 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3.5 py-2.5 text-ink-50 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-colors"
                >
                  <option value="">Select category...</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {scope === 'item' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-ink-200 mb-1.5">
                  Select Item
                </label>
                <input
                  type="text"
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  placeholder="Search items..."
                  className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3.5 py-2.5 text-ink-50 placeholder:text-ink-500 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-colors mb-2"
                />
                <div className="max-h-48 overflow-y-auto rounded-lg border border-ink-700 bg-ink-900 divide-y divide-ink-800">
                  {filteredItems.length === 0 ? (
                    <p className="px-3.5 py-3 text-sm text-ink-500">
                      No items found
                    </p>
                  ) : (
                    filteredItems.slice(0, 20).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setItemId(item.id)
                          setItemSearch(item.title)
                        }}
                        className={`flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm transition-colors ${
                          itemId === item.id
                            ? 'bg-teal-500/10 text-teal-300'
                            : 'text-ink-200 hover:bg-ink-800'
                        }`}
                      >
                        <Package className="size-4 shrink-0 text-ink-500" />
                        <span className="truncate">{item.title}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Label */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-ink-200 mb-1.5">
                Label <span className="text-ink-500 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. For Christie's Auction"
                className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3.5 py-2.5 text-ink-50 placeholder:text-ink-500 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-colors"
              />
            </div>

            <button
              onClick={handleCreate}
              disabled={createLink.isPending}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-semibold text-ink-950 hover:bg-teal-400 transition-colors disabled:opacity-50"
            >
              {createLink.isPending ? (
                <Spinner className="size-4" />
              ) : (
                <Link2 className="size-4" />
              )}
              Create Link
            </button>
          </div>
        </div>

        {/* Existing links */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner className="size-8 text-teal-400" />
            </div>
          ) : shareLinks && shareLinks.length > 0 ? (
            <div className="space-y-3">
              {shareLinks.map((link) => {
                const url = `${window.location.origin}/#/share/${link.token}`
                return (
                  <div
                    key={link.id}
                    className="rounded-xl border border-ink-800 bg-ink-850 p-4 hover:border-ink-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <p className="font-medium text-ink-50 truncate">
                          {link.label || 'Untitled Link'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 rounded-md bg-ink-800 px-2 py-0.5 text-xs text-ink-300">
                            {scopeMeta[link.scope]?.label ?? link.scope}
                          </span>
                          {link.category && (
                            <span className="text-xs text-ink-500">
                              {link.category}
                            </span>
                          )}
                          <span className="text-xs text-ink-500">
                            {formatDate(link.created_at)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(link.id)}
                        disabled={deleteLink.isPending}
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-400 hover:bg-rose-500/15 hover:text-rose-400 transition-colors"
                        aria-label="Delete share link"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex-1 min-w-0 rounded-lg border border-ink-700 bg-ink-900 px-3 py-2">
                        <p className="text-xs text-ink-400 font-mono truncate">
                          {url}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCopy(link.token)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-ink-800 px-3 py-2 text-sm font-medium text-ink-200 hover:bg-ink-700 transition-colors shrink-0"
                      >
                        <Copy className="size-3.5" />
                        Copy
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon={<Share2 className="size-7" />}
              title="No share links yet"
              description="Create a link to share your inventory catalog with auction houses or buyers."
            />
          )}
        </div>
      </div>
    </div>
  )
}
