<script setup lang="ts">
import { gsap } from 'gsap'
import { useBudgetStore } from '~/stores/budget'
import { useExpenseStore } from '~/stores/expenses'
import { useGamificationStore } from '~/stores/gamification'

definePageMeta({ layout: 'budget' })

onMounted(() => {
  document.body.style.cssText = `
    font-family:'Outfit',sans-serif;
    background:
      radial-gradient(ellipse 80% 60% at 12% -8%, rgba(99,102,241,.14) 0%, transparent 52%),
      radial-gradient(ellipse 55% 45% at 88% 108%, rgba(139,92,246,.10) 0%, transparent 52%),
      radial-gradient(ellipse 40% 30% at 50% 50%, rgba(52,211,153,.03) 0%, transparent 60%),
      #06060d !important;
    color:#f0f0fe;
  `
})
onUnmounted(() => {
  document.body.style.cssText = ''
})

const budgetStore     = useBudgetStore()
const expenseStore    = useExpenseStore()
const gamification    = useGamificationStore()

const activeTab   = ref('dashboard')
const showModal   = ref(false)
const toastEl     = ref<HTMLElement | null>(null)

const { settings }       = storeToRefs(budgetStore)
const { todayExpenses, todayTotal, expenses } = storeToRefs(expenseStore)

const savedToday     = computed(() => Math.max(settings.value.dailyBudget - todayTotal.value, 0))
const categoryTotals = computed(() => expenseStore.getCategoryTotals(todayExpenses.value))
const days7          = computed(() => expenseStore.getLast7Days())
const monthlyDays    = computed(() => expenseStore.getMonthlyDays())

// All-time category totals for analytics
const allTimeTotals  = computed(() => expenseStore.getCategoryTotals(expenses.value))

const handleAdd = (data: { amount: number; categoryId: string; notes: string; createdAt: string }) => {
  expenseStore.addExpense(data)
  showModal.value = false
  // Gamification checks
  gamification.addXP(10)
  gamification.checkMilestones(expenses.value.length, todayTotal.value, settings.value.dailyBudget)
  gamification.updateStreak(todayTotal.value <= settings.value.dailyBudget)
}

const handleDelete = (id: string) => {
  expenseStore.deleteExpense(id)
}

const handleSettingsUpdate = (patch: any) => {
  budgetStore.updateSettings(patch)
}

const handleReset = () => {
  expenseStore.expenses.splice(0)
  gamification.resetAll()
}

// Achievement toast animation
const { newlyUnlocked } = storeToRefs(gamification)
watch(newlyUnlocked, (a) => {
  if (!a) return
  nextTick(() => {
    if (toastEl.value) {
      gsap.fromTo(toastEl.value, { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' })
      setTimeout(() => {
        if (toastEl.value) gsap.to(toastEl.value, { x: 60, opacity: 0, duration: 0.3 })
      }, 3500)
    }
  })
})
</script>

<template>
  <div class="app-wrap">
    <!-- Sidebar — desktop only -->
    <BudgetSidebarNav
      class="sidebar-slot"
      :active="activeTab"
      :streak="gamification.streak"
      :level="gamification.level"
      :xp="gamification.xp"
      @change="activeTab = $event"
    />

    <!-- Main scroll area -->
    <div class="main-slot">
    <!-- Content -->
    <div class="content-area">

      <Transition name="tab">
        <BudgetDashboardTab
          v-if="activeTab === 'dashboard'"
          :spent="todayTotal"
          :daily-budget="settings.dailyBudget"
          :currency="settings.currency"
          :user-name="settings.userName"
          :today-expenses="todayExpenses"
          :category-totals="categoryTotals"
          :saved-today="savedToday"
          @delete="handleDelete"
        />
      </Transition>

      <Transition name="tab">
        <BudgetExpensesTab
          v-if="activeTab === 'expenses'"
          :expenses="expenses"
          :currency="settings.currency"
          @delete="handleDelete"
        />
      </Transition>

      <Transition name="tab">
        <BudgetAnalyticsTab
          v-if="activeTab === 'analytics'"
          :days7="days7"
          :monthly-days="monthlyDays"
          :category-totals="allTimeTotals"
          :daily-budget="settings.dailyBudget"
          :currency="settings.currency"
        />
      </Transition>

      <Transition name="tab">
        <BudgetAchievementsTab
          v-if="activeTab === 'achievements'"
          :achievements="gamification.achievements"
          :streak="gamification.streak"
          :level="gamification.level"
          :xp="gamification.xp"
          :level-progress="gamification.levelProgress"
          :xp-to-next-level="gamification.xpToNextLevel"
        />
      </Transition>

      <Transition name="tab">
        <BudgetSettingsTab
          v-if="activeTab === 'settings'"
          :settings="settings"
          @update="handleSettingsUpdate"
          @reset="handleReset"
        />
      </Transition>
    </div>

    <!-- FAB -->
    <button
      v-if="activeTab !== 'settings'"
      class="fab"
      @click="showModal = true"
    >
      <span class="fab-icon">+</span>
    </button>

    <!-- Add Expense Modal -->
    <Teleport to="body">
      <BudgetAddExpenseModal
        v-if="showModal"
        :currency="settings.currency"
        @close="showModal = false"
        @add="handleAdd"
      />
    </Teleport>

    <!-- Achievement Toast -->
    <Teleport to="body">
      <div v-if="newlyUnlocked" ref="toastEl" class="achievement-toast">
        <span style="font-size:26px">{{ newlyUnlocked.icon }}</span>
        <div class="toast-info">
          <span class="toast-pre">Achievement Unlocked!</span>
          <span class="toast-title">{{ newlyUnlocked.title }}</span>
          <span class="toast-xp">+{{ newlyUnlocked.xpReward }} XP</span>
        </div>
      </div>
    </Teleport>

    <!-- Bottom Nav — mobile only -->
    <BudgetBottomNav class="mobile-nav" :active="activeTab" @change="activeTab = $event" />
    </div><!-- /main-slot -->
  </div>
</template>

<style>
/* Force Outfit across the entire budget page scope */
body, body * { font-family: 'Outfit', sans-serif !important; }

:root {
  --bg:       #06060d;
  --surface:  #0e0e22;
  --surface2: #131332;
  --border:   #1e1e3c;
  --border2:  #28285a;
  --text:     #f0f0fe;
  --text2:    #9090c0;
  --text3:    #4e4e78;
  --green:    #34d399;
  --yellow:   #fbbf24;
  --orange:   #fb923c;
  --red:      #f87171;
  --indigo:   #818cf8;
  --purple:   #c084fc;
  --grad:     linear-gradient(135deg,#6366f1,#8b5cf6);
  --card-bg:         linear-gradient(145deg,#161640 0%,#0d0d26 100%);
  --card-border:     rgba(255,255,255,0.08);
  --card-border-top: rgba(255,255,255,0.16);
  --card-shadow:     0 4px 28px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06);
  --card-radius:     18px;
}
</style>

<style scoped>
/* ── Shell ── */
.app-wrap {
  min-height: 100dvh;
  background: transparent;
  display: flex;
  position: relative;
}
.sidebar-slot { display: none; }   /* hidden on mobile */
.main-slot    { flex: 1; min-width: 0; overflow-y: auto; }
.content-area { max-width: 480px; margin: 0 auto; padding: 0 16px; position: relative; }

/* ── FAB ── */
.fab {
  position: fixed;
  right: max(20px, calc(50% - 220px));
  bottom: 76px;
  width: 56px; height: 56px; border-radius: 50%; border: none;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  box-shadow: 0 4px 24px rgba(99,102,241,.45);
  cursor: pointer; z-index: 40;
  display: flex; align-items: center; justify-content: center;
  transition: transform .15s, box-shadow .15s;
}
.fab:hover  { transform: scale(1.08); box-shadow: 0 6px 32px rgba(99,102,241,.6); }
.fab:active { transform: scale(.93); }
.fab-icon   { color: #fff; font-size: 30px; line-height: 1; font-weight: 300; margin-top: -2px; }

/* ── Toast ── */
.achievement-toast {
  position: fixed; top: 20px; right: 16px;
  display: flex; align-items: center; gap: 12px;
  background: #0e0e1e; border: 1px solid rgba(129,140,248,.35);
  border-radius: 14px; padding: 14px 18px;
  z-index: 200; min-width: 220px;
  box-shadow: 0 8px 40px rgba(0,0,0,.5);
}
.toast-info  { display: flex; flex-direction: column; }
.toast-pre   { font-size: 11px; color: #8e8eb0; margin-bottom: 2px; }
.toast-title { font-size: 14px; font-weight: 700; color: #f0f0fe; }
.toast-xp    { font-size: 12px; font-weight: 600; color: #818cf8; margin-top: 2px; }

/* ── Tab transitions ── */
.tab-enter-active, .tab-leave-active { transition: opacity .18s ease, transform .18s ease; }
.tab-enter-from { opacity: 0; transform: translateY(10px); }
.tab-leave-to   { opacity: 0; transform: translateY(-8px); position: absolute; width: 100%; }

/* ── Desktop ── */
@media (min-width: 1024px) {
  .sidebar-slot { display: flex; }   /* show sidebar */
  .mobile-nav   { display: none; }   /* hide bottom nav */
  .content-area { max-width: 1100px; padding: 0 40px; }
  .fab {
    right: 40px;
    bottom: 40px;
  }
}
</style>
