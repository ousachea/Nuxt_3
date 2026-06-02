import { defineStore } from 'pinia'
import type { BudgetSettings, MealPreset } from '~/types/budget'

const DEFAULT_PRESETS: MealPreset[] = [
  { id: 'breakfast', name: 'Breakfast', icon: '🌅', amount: 2.50, categoryId: 'food'   },
  { id: 'lunch',     name: 'Lunch',     icon: '☀️',  amount: 2.50, categoryId: 'food'   },
  { id: 'dinner',    name: 'Dinner',    icon: '🌆',  amount: 3.00, categoryId: 'food'   },
  { id: 'coffee',    name: 'Coffee',    icon: '☕',  amount: 1.50, categoryId: 'coffee' },
  { id: 'drinks',    name: 'Drinks',    icon: '🧃',  amount: 1.00, categoryId: 'drinks' },
  { id: 'snack',     name: 'Snack',     icon: '🍿',  amount: 1.00, categoryId: 'food'   },
]

export const useBudgetStore = defineStore('budget', () => {
  const settings = ref<BudgetSettings>({
    dailyBudget: 20,
    monthlyBudget: 600,
    userName: 'Friend',
    currency: '$',
  })

  const mealPresets = ref<MealPreset[]>(DEFAULT_PRESETS.map(p => ({ ...p })))

  if (process.client) {
    try {
      const s = localStorage.getItem('bp_settings')
      if (s) Object.assign(settings.value, JSON.parse(s))
      const p = localStorage.getItem('bp_meal_presets')
      if (p) mealPresets.value = JSON.parse(p)
    } catch {}
    watch(settings,     v => localStorage.setItem('bp_settings',     JSON.stringify(v)), { deep: true })
    watch(mealPresets,  v => localStorage.setItem('bp_meal_presets', JSON.stringify(v)), { deep: true })
  }

  const updateSettings    = (patch: Partial<BudgetSettings>) => Object.assign(settings.value, patch)
  const updatePresetAmount = (id: string, amount: number) => {
    const p = mealPresets.value.find(p => p.id === id)
    if (p) p.amount = Math.max(0, amount)
  }

  return { settings, mealPresets, updateSettings, updatePresetAmount }
})
