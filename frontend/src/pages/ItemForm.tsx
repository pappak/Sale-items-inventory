import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  useItem,
  useCreateItem,
  useUpdateItem,
  useUploadPhotos,
  useDeletePhoto,
  useReorderPhotos,
  useGenerateDescription,
  suggestCategory,
} from '../lib/api'
import { useToast } from '../components/Toast'
import { Spinner } from '../components/ui'
import { CATEGORIES, CONDITIONS, type Item } from '../types'
import {
  ArrowLeft,
  Save,
  Sparkles,
  Upload,
  Trash2,
  Star,
  ImageIcon,
  X,
  HelpCircle,
} from 'lucide-react'

interface FormData {
  title: string
  category: string
  condition: string
  description: string
  dimensions: string
  provenance: string
  estimated_value: string
  asking_price: string
}

const emptyForm: FormData = {
  title: '',
  category: '',
  condition: '',
  description: '',
  dimensions: '',
  provenance: '',
  estimated_value: '',
  asking_price: '',
}

function itemToForm(item: Item): FormData {
  return {
    title: item.title ?? '',
    category: item.category ?? '',
    condition: item.condition ?? '',
    description: item.description ?? '',
    dimensions: item.dimensions ?? '',
    provenance: item.provenance ?? '',
    estimated_value:
      item.estimated_value != null ? String(item.estimated_value) : '',
    asking_price: item.asking_price != null ? String(item.asking_price) : '',
  }
}

export function ItemForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const toast = useToast()

  const { data: existingItem, isLoading } = useItem(id)
  const createItem = useCreateItem()
  const updateItem = useUpdateItem(id!)
  const uploadPhotos = useUploadPhotos(id!)
  const deletePhoto = useDeletePhoto(id!)
  const reorderPhotos = useReorderPhotos(id!)
  const generateDescription = useGenerateDescription(id!)

  const [form, setForm] = useState<FormData>(emptyForm)
  const [loaded, setLoaded] = useState(false)
  const [categoryLoading, setCategoryLoading] = useState(false)
  const [clarifyQuestions, setClarifyQuestions] = useState<string[]>([])
  const [clarifyAnswers, setClarifyAnswers] = useState<string[]>([])
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const dragSrcIdx = useRef<number | null>(null)

  useEffect(() => {
    if (isEdit && existingItem && !loaded) {
      setForm(itemToForm(existingItem))
      setLoaded(true)
    }
    if (!isEdit) setLoaded(true)
  }, [isEdit, existingItem, loaded])

  const update = (field: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleTitleBlur = async () => {
    const title = form.title.trim()
    if (title.length < 3 || form.category) return
    setCategoryLoading(true)
    try {
      const result = await suggestCategory(title)
      if (result.category) {
        setForm((prev) => ({
          ...prev,
          category: result.category ?? prev.category,
          description: result.description && !prev.description ? result.description : prev.description,
          title: result.title && result.title.trim() ? result.title : prev.title,
          estimated_value: result.estimated_value && !prev.estimated_value ? String(result.estimated_value) : prev.estimated_value,
        }))
        const parts = [`Category: ${result.category}`]
        if (result.description) parts.push('description')
        if (result.estimated_value) parts.push(`est. value $${result.estimated_value.toLocaleString()}`)
        toast(`AI filled in ${parts.join(' + ')}`, 'success')
      } else if (result.questions && result.questions.length > 0) {
        setClarifyQuestions(result.questions)
        setClarifyAnswers(new Array(result.questions.length).fill(''))
      }
    } catch {
      /* silently fail — this is just an assist */
    } finally {
      setCategoryLoading(false)
    }
  }

  const handleClarifySubmit = async () => {
    const title = form.title.trim()
    const answers = clarifyAnswers.filter((a) => a.trim())
    if (!title || answers.length === 0) return
    setCategoryLoading(true)
    try {
      const combined = `${title} — ${answers.join(', ')}`
      const result = await suggestCategory(combined)
      if (result.category) {
        setForm((prev) => ({
          ...prev,
          category: result.category ?? prev.category,
          description: result.description && !prev.description ? result.description : prev.description,
          title: result.title && result.title.trim() ? result.title : prev.title,
          estimated_value: result.estimated_value && !prev.estimated_value ? String(result.estimated_value) : prev.estimated_value,
        }))
        toast(`AI filled in category + description`, 'success')
        setClarifyQuestions([])
        setClarifyAnswers([])
      }
    } catch {
      /* ignore */
    } finally {
      setCategoryLoading(false)
    }
  }

  const handleSave = () => {
    if (!form.title.trim()) {
      toast('Title is required', 'error')
      return
    }
    const payload = {
      title: form.title.trim(),
      category: form.category || null,
      condition: form.condition || null,
      description: form.description || null,
      dimensions: form.dimensions || null,
      provenance: form.provenance || null,
      estimated_value: form.estimated_value
        ? Number(form.estimated_value)
        : null,
      asking_price: form.asking_price ? Number(form.asking_price) : null,
    }

    if (isEdit) {
      updateItem.mutate(payload, {
        onSuccess: () => {
          toast('Item updated', 'success')
          navigate('/')
        },
        onError: (e) => toast(`Save failed: ${e.message}`, 'error'),
      })
    } else {
      createItem.mutate(payload, {
        onSuccess: (item) => {
          toast('Item created', 'success')
          navigate(`/items/${item.id}/edit`)
        },
        onError: (e) => toast(`Create failed: ${e.message}`, 'error'),
      })
    }
  }

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragActive, setIsDragActive] = useState(false)

  const doUpload = (files: File[]) => {
    if (!id) { toast('Save the item first before uploading photos', 'info'); return }
    if (files.length === 0) return
    uploadPhotos.mutate(files, {
      onSuccess: () => toast(`${files.length} photo(s) uploaded`, 'success'),
      onError: (e) => toast(`Upload failed: ${e.message}`, 'error'),
    })
  }

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(true) }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragActive(false) }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragActive(false)
    doUpload(Array.from(e.dataTransfer.files))
  }
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    doUpload(Array.from(e.target.files ?? []))
    e.target.value = '' // reset so same file can be re-selected
  }

  const handleGenerate = () => {
    if (!id) return
    if (!existingItem?.photos?.length) {
      toast('Add at least one photo first', 'info')
      return
    }
    generateDescription.mutate(undefined, {
      onSuccess: (result) => {
        setForm((prev) => ({
          ...prev,
          title: result.title || prev.title,
          description: result.description || prev.description,
          condition: result.condition || prev.condition,
          category: result.category || prev.category,
        }))
        toast('Description generated from photos', 'success')
      },
      onError: (e) => toast(`AI generation failed: ${e.message}`, 'error'),
    })
  }

  const handleDeletePhoto = (photoId: string) => {
    if (!confirm('Remove this photo?')) return
    deletePhoto.mutate(photoId, {
      onSuccess: () => toast('Photo removed', 'success'),
      onError: (e) => toast(`Failed: ${e.message}`, 'error'),
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="size-8 text-teal-400" />
      </div>
    )
  }

  const sortedPhotos = existingItem
    ? [...existingItem.photos].sort((a, b) => a.sort_order - b.sort_order)
    : []

  const canGenerate = !!id && sortedPhotos.length > 0

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Back link */}
      <button
        onClick={() => navigate('/')}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-100 transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to inventory
      </button>

      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl text-ink-50 mb-1.5">
          {isEdit ? 'Edit Item' : 'New Item'}
        </h1>
        <p className="text-ink-400">
          {isEdit
            ? 'Update details, manage photos, and generate descriptions.'
            : 'Add a new piece to your inventory catalog.'}
        </p>
      </div>

      <div className="space-y-6">
        {/* AI Assist banner */}
        {isEdit && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-teal-500/20 bg-teal-500/5 p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-500/15 text-teal-400">
                <Sparkles className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink-50">
                  AI Description Generator
                </p>
                <p className="text-xs text-ink-400 mt-0.5">
                  {canGenerate
                    ? 'Analyze photos to auto-fill title, description, condition & category.'
                    : 'Upload at least one photo to enable AI generation.'}
                </p>
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={!canGenerate || generateDescription.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-teal-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {generateDescription.isPending ? (
                <>
                  <Spinner className="size-4" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Generate from Photos
                </>
              )}
            </button>
          </div>
        )}

        {/* Main form */}
        <div className="rounded-2xl border border-ink-800 bg-ink-850 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-ink-200 mb-1.5">
              Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              onBlur={handleTitleBlur}
              placeholder="e.g. Canon AE-1 35mm Camera"
              className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3.5 py-2.5 text-ink-50 placeholder:text-ink-500 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-colors"
            />
            {clarifyQuestions.length > 0 && (
              <div className="mt-2 rounded-lg border border-teal-500/20 bg-teal-500/5 p-3 animate-scale-in">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-teal-400">
                    <HelpCircle className="size-3.5" />
                    Clarify for better categorization
                  </div>
                  <button
                    onClick={() => {
                      setClarifyQuestions([])
                      setClarifyAnswers([])
                    }}
                    className="text-ink-400 hover:text-ink-100 transition-colors"
                    aria-label="Dismiss"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {clarifyQuestions.map((q, i) => (
                    <div key={i}>
                      <p className="text-xs text-ink-300 mb-1">{q}</p>
                      <input
                        type="text"
                        value={clarifyAnswers[i] ?? ''}
                        onChange={(e) => {
                          const next = [...clarifyAnswers]
                          next[i] = e.target.value
                          setClarifyAnswers(next)
                        }}
                        placeholder="Your answer..."
                        className="w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-1.5 text-sm text-ink-50 placeholder:text-ink-500 focus:border-teal-500 focus:outline-none transition-colors"
                      />
                    </div>
                  ))}
                  <button
                    onClick={handleClarifySubmit}
                    disabled={categoryLoading}
                    className="inline-flex items-center gap-1.5 rounded-md bg-teal-500 px-3 py-1.5 text-xs font-semibold text-ink-950 hover:bg-teal-400 transition-colors disabled:opacity-50"
                  >
                    {categoryLoading && <Spinner className="size-3" />}
                    Use this to categorize
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-ink-200 mb-1.5">
                Category
                {categoryLoading && <Spinner className="size-3.5 text-teal-400" />}
              </label>
              <select
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
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
            <div>
              <label className="block text-sm font-medium text-ink-200 mb-1.5">
                Condition
              </label>
              <select
                value={form.condition}
                onChange={(e) => update('condition', e.target.value)}
                className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3.5 py-2.5 text-ink-50 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-colors"
              >
                <option value="">Select condition...</option>
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-200 mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={5}
              placeholder="Detailed description of the item..."
              className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3.5 py-2.5 text-ink-50 placeholder:text-ink-500 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-colors resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-ink-200 mb-1.5">
                Dimensions
              </label>
              <input
                type="text"
                value={form.dimensions}
                onChange={(e) => update('dimensions', e.target.value)}
                placeholder="e.g. 12 × 8 × 6 in"
                className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3.5 py-2.5 text-ink-50 placeholder:text-ink-500 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-200 mb-1.5">
                Provenance
              </label>
              <input
                type="text"
                value={form.provenance}
                onChange={(e) => update('provenance', e.target.value)}
                placeholder="e.g. Purchased 2019, B&H Photo"
                className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3.5 py-2.5 text-ink-50 placeholder:text-ink-500 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-ink-200 mb-1.5">
                Estimated Value ($)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.estimated_value}
                onChange={(e) => update('estimated_value', e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3.5 py-2.5 text-ink-50 placeholder:text-ink-500 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-colors font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-200 mb-1.5">
                Asking Price ($)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.asking_price}
                onChange={(e) => update('asking_price', e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3.5 py-2.5 text-ink-50 placeholder:text-ink-500 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-colors font-mono"
              />
            </div>
          </div>
        </div>

        {/* Photo upload section */}
        <div className="rounded-2xl border border-ink-800 bg-ink-850 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display text-ink-50">Photos</h2>
            {sortedPhotos.length > 0 && (
              <span className="text-xs text-ink-400 font-mono">
                {sortedPhotos.length} photo{sortedPhotos.length === 1 ? '' : 's'}
              </span>
            )}
          </div>

          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => id && fileInputRef.current?.click()}
            className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all ${
              !id
                ? 'border-ink-700 opacity-50 cursor-not-allowed'
                : isDragActive
                  ? 'border-teal-500 bg-teal-500/10 cursor-copy'
                  : 'border-teal-500/40 hover:border-teal-500 hover:bg-ink-900/50 cursor-pointer'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileInput}
            />
            <div className="flex flex-col items-center gap-2">
              <div className="flex size-12 items-center justify-center rounded-xl bg-ink-800 text-ink-400">
                {uploadPhotos.isPending ? (
                  <Spinner className="size-5" />
                ) : (
                  <Upload className="size-5" />
                )}
              </div>
              <p className="text-sm font-medium text-ink-200">
                {isDragActive
                  ? 'Drop images here'
                  : 'Drag & drop photos, or click to browse'}
              </p>
              <p className="text-xs text-ink-500">
                {!id
                  ? 'Save the item first to enable uploads'
                  : 'JPG, PNG, WebP — multiple files OK'}
              </p>
            </div>
          </div>

          {/* Photo thumbnails */}
          {sortedPhotos.length > 0 && (
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {sortedPhotos.map((photo, idx) => (
                <div
                  key={photo.id}
                  draggable
                  onDragStart={() => { dragSrcIdx.current = idx }}
                  onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx) }}
                  onDragLeave={() => setDragOverIdx(null)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragOverIdx(null)
                    const src = dragSrcIdx.current
                    if (src === null || src === idx) return
                    const reordered = [...sortedPhotos]
                    const [moved] = reordered.splice(src, 1)
                    reordered.splice(idx, 0, moved)
                    reorderPhotos.mutate(reordered.map(p => p.id))
                    dragSrcIdx.current = null
                  }}
                  onDragEnd={() => { dragSrcIdx.current = null; setDragOverIdx(null) }}
                  className={`group relative aspect-square overflow-hidden rounded-lg border bg-ink-900 cursor-grab active:cursor-grabbing transition-all ${
                    dragOverIdx === idx
                      ? 'border-teal-400 scale-105 shadow-lg shadow-teal-500/20'
                      : 'border-ink-700'
                  }`}
                >
                  <img
                    src={photo.url}
                    alt={photo.filename}
                    className="size-full object-cover pointer-events-none"
                    loading="lazy"
                  />
                  {idx === 0 && (
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-md bg-teal-500 px-1.5 py-0.5 text-[10px] font-semibold text-ink-950">
                      <Star className="size-2.5 fill-current" />
                      Primary
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-1.5 py-1 bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-ink-400 select-none">⠿ drag to reorder</span>
                  </div>
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    disabled={deletePhoto.isPending}
                    className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-md bg-black/60 backdrop-blur-sm text-ink-100 opacity-0 group-hover:opacity-100 hover:bg-rose-500 transition-all"
                    aria-label="Delete photo"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {isEdit && sortedPhotos.length === 0 && (
            <div className="mt-4 flex items-center gap-2 text-sm text-ink-500">
              <ImageIcon className="size-4" />
              No photos uploaded yet.
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <button
            onClick={() => navigate('/')}
            className="rounded-lg border border-ink-700 px-4 py-2.5 text-sm font-medium text-ink-300 hover:bg-ink-850 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={createItem.isPending || updateItem.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-5 py-2.5 text-sm font-semibold text-ink-950 hover:bg-teal-400 transition-colors disabled:opacity-50"
          >
            {createItem.isPending || updateItem.isPending ? (
              <Spinner className="size-4" />
            ) : (
              <Save className="size-4" />
            )}
            {isEdit ? 'Save Changes' : 'Create Item'}
          </button>
        </div>
      </div>
    </div>
  )
}
