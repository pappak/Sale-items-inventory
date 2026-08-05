import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  Item,
  ShareLink,
  PublicCatalog,
  GeneratedDescription,
} from '../types'

const API = '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, init)
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      message = body.detail || body.message || message
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

function jsonBody(data: unknown): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }
}

/* ---------- Items ---------- */

export function useItems(category?: string) {
  return useQuery({
    queryKey: ['items', category ?? 'all'],
    queryFn: () =>
      request<Item[]>(
        `/items${category ? `?category=${encodeURIComponent(category)}` : ''}`,
      ),
  })
}

export function useItem(id: string | undefined) {
  return useQuery({
    queryKey: ['item', id],
    queryFn: () => request<Item>(`/items/${id}`),
    enabled: !!id,
  })
}

export interface ItemInput {
  title: string
  description?: string | null
  category?: string | null
  condition?: string | null
  dimensions?: string | null
  provenance?: string | null
  estimated_value?: number | null
  asking_price?: number | null
}

export function useCreateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ItemInput) => request<Item>(`/items`, jsonBody(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items'] })
    },
  })
}

export function useUpdateItem(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ItemInput) =>
      request<Item>(`/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: (updated) => {
      qc.setQueryData(['item', id], updated)
      qc.invalidateQueries({ queryKey: ['items'] })
    },
  })
}

export function useDeleteItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      request<void>(`/items/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items'] })
    },
  })
}

/* ---------- Photos ---------- */

export function useUploadPhotos(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (files: File[]) => {
      const form = new FormData()
      files.forEach((f) => form.append('files', f))
      const res = await fetch(`${API}/items/${id}/photos`, {
        method: 'POST',
        body: form,
      })
      if (!res.ok) {
        let msg = `Upload failed (${res.status})`
        try { const b = await res.json(); msg = b.detail || b.message || msg } catch {}
        throw new Error(msg)
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['item', id] })
      qc.invalidateQueries({ queryKey: ['items'] })
    },
  })
}

export function useDeletePhoto(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (photoId: string) =>
      request<void>(`/items/${id}/photos/${photoId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['item', id] })
      qc.invalidateQueries({ queryKey: ['items'] })
    },
  })
}

/* ---------- AI Description ---------- */

export function useGenerateDescription(id: string) {
  return useMutation({
    mutationFn: () =>
      request<GeneratedDescription>(`/items/${id}/generate-description`, {
        method: 'POST',
      }),
  })
}

/* ---------- AI Category Suggestion ---------- */

export interface CategorySuggestion {
  category?: string | null
  questions?: string[] | null
  description?: string | null
  title?: string | null
  estimated_value?: number | null
}

export async function suggestCategory(
  title: string,
): Promise<CategorySuggestion> {
  const res = await fetch(`${API}/items/suggest-category`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
  if (!res.ok) return {}
  return res.json()
}

/* ---------- Share Links ---------- */

export function useShareLinks() {
  return useQuery({
    queryKey: ['share-links'],
    queryFn: () => request<ShareLink[]>(`/share-links`),
  })
}

export interface ShareLinkInput {
  scope: 'all' | 'category' | 'item'
  category?: string | null
  item_id?: string | null
  label?: string | null
}

export function useCreateShareLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ShareLinkInput) =>
      request<ShareLink>(`/share-links`, jsonBody(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['share-links'] })
    },
  })
}

export function useDeleteShareLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      request<void>(`/share-links/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['share-links'] })
    },
  })
}

/* ---------- Public ---------- */

export function usePublicCatalog(token: string | undefined) {
  return useQuery({
    queryKey: ['public', token],
    queryFn: () => request<PublicCatalog>(`/public/${token}`),
    enabled: !!token,
  })
}

/* ---------- Export ---------- */

export function exportPdf(
  scope: 'all' | 'category' | 'item',
  id?: string,
  token?: string,
) {
  const params = new URLSearchParams({ scope })
  if (id) params.set('id', id)
  if (token) params.set('token', token)
  window.open(`${API}/export/pdf?${params.toString()}`, '_blank')
}
