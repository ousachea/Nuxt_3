import type { Category } from '~/types/budget'

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food',          name: 'Food',          icon: '🍔', color: '#f97316', bgColor: 'rgba(249,115,22,0.15)' },
  { id: 'water',         name: 'Water',         icon: '💧', color: '#3b82f6', bgColor: 'rgba(59,130,246,0.15)' },
  { id: 'coffee',        name: 'Coffee',        icon: '☕', color: '#d97706', bgColor: 'rgba(217,119,6,0.15)' },
  { id: 'drinks',        name: 'Drinks',        icon: '🧃', color: '#10b981', bgColor: 'rgba(16,185,129,0.15)' },
  { id: 'transport',     name: 'Transport',     icon: '🚌', color: '#6366f1', bgColor: 'rgba(99,102,241,0.15)' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎮', color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.15)' },
  { id: 'shopping',      name: 'Shopping',      icon: '🛒', color: '#ec4899', bgColor: 'rgba(236,72,153,0.15)' },
  { id: 'other',         name: 'Other',         icon: '📦', color: '#94a3b8', bgColor: 'rgba(148,163,184,0.15)' },
]

export const useCategories = () => {
  const getCategoryById = (id: string): Category =>
    DEFAULT_CATEGORIES.find(c => c.id === id) ?? DEFAULT_CATEGORIES[7]!
  return { categories: DEFAULT_CATEGORIES, getCategoryById }
}
