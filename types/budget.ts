export interface Category {
  id: string
  name: string
  icon: string
  color: string
  bgColor: string
}

export interface Expense {
  id: string
  amount: number
  categoryId: string
  notes: string
  createdAt: string
}

export interface BudgetSettings {
  dailyBudget: number
  monthlyBudget: number
  userName: string
  currency: string
}

export interface MealPreset {
  id: string
  name: string
  icon: string
  amount: number
  categoryId: string
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  xpReward: number
  unlocked?: boolean
}
