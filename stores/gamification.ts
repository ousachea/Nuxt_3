import { defineStore } from 'pinia'
import type { Achievement } from '~/types/budget'

const ALL: Achievement[] = [
  { id: 'first_expense',  title: 'First Step',       description: 'Log your first expense',       icon: '🏆', xpReward: 50   },
  { id: 'streak_3',       title: '3-Day Streak',      description: 'Stay under budget 3 days',     icon: '🔥', xpReward: 100  },
  { id: 'streak_7',       title: 'Week Warrior',      description: '7-day budget streak',          icon: '⚡', xpReward: 250  },
  { id: 'streak_14',      title: 'Fortnight',         description: '14-day budget streak',         icon: '💪', xpReward: 500  },
  { id: 'streak_30',      title: 'Monthly Master',    description: '30-day budget streak',         icon: '👑', xpReward: 1000 },
  { id: 'save_10',        title: 'First Savings',     description: 'Save $10 in one day',          icon: '💰', xpReward: 75   },
  { id: 'expenses_10',    title: 'Consistent',        description: 'Log 10 total expenses',        icon: '📊', xpReward: 100  },
  { id: 'expenses_30',    title: 'Dedicated',         description: 'Log 30 total expenses',        icon: '📈', xpReward: 300  },
  { id: 'budget_perfect', title: 'Perfect Day',       description: 'Spend under 50% of budget',   icon: '✨', xpReward: 150  },
]

export const useGamificationStore = defineStore('gamification', () => {
  const xp = ref(0)
  const streak = ref(0)
  const lastActiveDate = ref('')
  const unlockedIds = ref<string[]>([])
  const newlyUnlocked = ref<Achievement | null>(null)

  if (process.client) {
    try {
      const saved = localStorage.getItem('bp_gamification')
      if (saved) {
        const d = JSON.parse(saved)
        xp.value = d.xp ?? 0
        streak.value = d.streak ?? 0
        lastActiveDate.value = d.lastActiveDate ?? ''
        unlockedIds.value = d.unlockedIds ?? []
      }
    } catch {}
    watch([xp, streak, lastActiveDate, unlockedIds], () => {
      localStorage.setItem('bp_gamification', JSON.stringify({
        xp: xp.value, streak: streak.value,
        lastActiveDate: lastActiveDate.value, unlockedIds: unlockedIds.value
      }))
    }, { deep: true })
  }

  const level = computed(() => Math.floor(xp.value / 500) + 1)
  const levelProgress = computed(() => (xp.value % 500) / 5)
  const xpToNextLevel = computed(() => 500 - (xp.value % 500))
  const achievements = computed(() => ALL.map(a => ({ ...a, unlocked: unlockedIds.value.includes(a.id) })))

  const addXP = (amount: number) => { xp.value += amount }

  const unlock = (id: string) => {
    if (unlockedIds.value.includes(id)) return
    const a = ALL.find(a => a.id === id)
    if (!a) return
    unlockedIds.value.push(id)
    addXP(a.xpReward)
    newlyUnlocked.value = { ...a, unlocked: true }
    setTimeout(() => { newlyUnlocked.value = null }, 4000)
  }

  const updateStreak = (underBudget: boolean) => {
    const today = new Date().toDateString()
    if (lastActiveDate.value === today) return
    if (underBudget) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      streak.value = lastActiveDate.value === yesterday.toDateString() ? streak.value + 1 : 1
      addXP(25)
      if (streak.value >= 3)  unlock('streak_3')
      if (streak.value >= 7)  unlock('streak_7')
      if (streak.value >= 14) unlock('streak_14')
      if (streak.value >= 30) unlock('streak_30')
    } else {
      streak.value = 0
    }
    lastActiveDate.value = today
  }

  const checkMilestones = (expenseCount: number, todayTotal: number, dailyBudget: number) => {
    if (expenseCount >= 1)  unlock('first_expense')
    if (expenseCount >= 10) unlock('expenses_10')
    if (expenseCount >= 30) unlock('expenses_30')
    if (todayTotal > 0 && todayTotal <= dailyBudget * 0.5) unlock('budget_perfect')
    if (dailyBudget - todayTotal >= 10) unlock('save_10')
  }

  const resetAll = () => {
    xp.value = 0; streak.value = 0
    lastActiveDate.value = ''; unlockedIds.value = []
    newlyUnlocked.value = null
  }

  return { xp, streak, level, levelProgress, xpToNextLevel, achievements, newlyUnlocked, addXP, unlock, updateStreak, checkMilestones, unlockedIds, resetAll }
})
