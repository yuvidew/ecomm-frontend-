import type { LucideIcon } from 'lucide-react'

// placeholder shapes for the UI-first home page phase — not the real
// Product/Category types from src/features/*/types, and not fetched via
// TanStack Query. Will be replaced once useProducts()/useCategories() have
// real rows to show.

export type DummyProduct = {
  id: number
  name: string
  price: number
  originalPrice?: number
  rating: number
  reviews: number
  badge?: 'Sale' | 'New'
}

export type Feature = {
  icon: LucideIcon
  label: string
  description: string
}

export type TrustStat = {
  label: string
  value: string
}
