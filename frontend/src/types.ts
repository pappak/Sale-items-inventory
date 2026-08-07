declare const __APP_VERSION__: string
declare const __BUILD_NUMBER__: string
declare const __BUILD_DATE__: string

export interface Photo {
  id: string
  url: string
  filename: string
  sort_order: number
}

export interface Item {
  id: string
  title: string
  description: string | null
  category: string | null
  condition: string | null
  dimensions: string | null
  provenance: string | null
  estimated_value: number | null
  asking_price: number | null
  is_sold: boolean
  share_token: string
  photos: Photo[]
  created_at: string
}

export interface ShareLink {
  id: string
  token: string
  scope: 'all' | 'category' | 'item'
  category: string | null
  item_id: string | null
  label: string | null
  created_at: string
}

export interface PublicCatalog {
  items: Item[]
  label: string | null
  scope: string
}

export interface GeneratedDescription {
  title: string
  description: string
  condition: string
  category: string
}

export const CATEGORIES = [
  'Photography Gear',
  'Bikes',
  'Arts & Crafts / Hobbies',
  'Technology',
  'General',
] as const

export const CONDITIONS = ['New', 'Like New', 'Excellent', 'Good', 'Fair', 'Poor'] as const

export type Category = (typeof CATEGORIES)[number]
export type Condition = (typeof CONDITIONS)[number]
