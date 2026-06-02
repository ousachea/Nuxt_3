import { defineStore } from 'pinia'
import type { Expense } from '~/types/budget'

export const useExpenseStore = defineStore('expenses', () => {
  const expenses = ref<Expense[]>([])

  if (process.client) {
    try {
      const saved = localStorage.getItem('bp_expenses')
      if (saved) expenses.value = JSON.parse(saved)
    } catch {}
    watch(expenses, v => localStorage.setItem('bp_expenses', JSON.stringify(v)), { deep: true })
  }

  const isToday = (d: string) => new Date(d).toDateString() === new Date().toDateString()

  const todayExpenses = computed(() => expenses.value.filter(e => isToday(e.createdAt)))
  const todayTotal = computed(() => todayExpenses.value.reduce((s, e) => s + e.amount, 0))

  const addExpense = (e: Omit<Expense, 'id'>) => {
    expenses.value.unshift({ ...e, id: crypto.randomUUID() })
  }

  const deleteExpense = (id: string) => {
    expenses.value = expenses.value.filter(e => e.id !== id)
  }

  const getCategoryTotals = (exps?: Expense[]) => {
    const list = exps ?? todayExpenses.value
    return list.reduce((acc, e) => {
      acc[e.categoryId] = (acc[e.categoryId] || 0) + e.amount
      return acc
    }, {} as Record<string, number>)
  }

  const getLast7Days = () =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      const total = expenses.value
        .filter(e => new Date(e.createdAt).toDateString() === d.toDateString())
        .reduce((s, e) => s + e.amount, 0)
      return { label: d.toLocaleDateString('en', { weekday: 'short' }), total, isToday: i === 6 }
    })

  const getMonthlyDays = () => {
    const now = new Date()
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), i + 1)
      const total = expenses.value
        .filter(e => new Date(e.createdAt).toDateString() === d.toDateString())
        .reduce((s, e) => s + e.amount, 0)
      return { day: i + 1, total, isToday: d.toDateString() === new Date().toDateString(), isFuture: d > new Date() }
    })
  }

  return { expenses, todayExpenses, todayTotal, addExpense, deleteExpense, getCategoryTotals, getLast7Days, getMonthlyDays }
})
