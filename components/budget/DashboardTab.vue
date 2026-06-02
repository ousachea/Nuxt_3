<script setup lang="ts">
import { gsap } from 'gsap'
import type { Expense } from '~/types/budget'

const props = defineProps<{
  spent: number; dailyBudget: number; currency: string; userName: string
  todayExpenses: Expense[]; categoryTotals: Record<string, number>; savedToday: number
}>()
const emit = defineEmits<{ (e: 'delete', id: string): void }>()

const hour     = new Date().getHours()
const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
const dateStr  = new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })

const root = ref<HTMLElement | null>(null)
onMounted(() => {
  if (root.value)
    gsap.from([...root.value.querySelectorAll('.ai')], { y: 18, opacity: 0, duration: .5, stagger: .06, ease: 'power2.out' })
})
</script>

<template>
  <div ref="root" class="tab-root">
    <header class="header ai">
      <p class="date-str">{{ dateStr }}</p>
      <h1 class="greeting">{{ greeting }}, <span class="name-grad">{{ userName }}</span> 👋</h1>
    </header>

    <div class="layout">
      <div class="col-left">
        <div class="ring-card ai">
          <BudgetProgressRing :spent="spent" :budget="dailyBudget" :currency="currency"/>
        </div>
        <div class="ai"><BudgetSavingsJar :saved="savedToday" :daily-budget="dailyBudget" :currency="currency"/></div>
        <div class="ai"><BudgetSpendingTimeline :expenses="todayExpenses" :currency="currency" @delete="emit('delete', $event)"/></div>
        <div class="ai"><BudgetMonthlyProjection :currency="currency"/></div>
      </div>
      <div class="col-right">
        <div class="ai"><BudgetOverviewCards :daily-budget="dailyBudget" :spent="spent" :currency="currency"/></div>
        <div class="ai"><BudgetMealPlanner :currency="currency"/></div>
        <div class="ai"><BudgetInsightsCard :expenses="todayExpenses" :daily-budget="dailyBudget" :spent="spent" :currency="currency"/></div>
        <div class="ai"><BudgetCategoryChart :totals="categoryTotals" :currency="currency"/></div>
      </div>
    </div>

    <div class="spacer"/>
  </div>
</template>

<style scoped>
.tab-root { display: flex; flex-direction: column; }
.header  { padding: 26px 0 12px; }
.date-str { font-size: 12px; color: var(--text3); margin-bottom: 5px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; }
.greeting { font-size: 28px; font-weight: 900; color: var(--text); letter-spacing: -.8px; }
.name-grad { background: linear-gradient(135deg, var(--indigo), var(--purple)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

.ring-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-top-color: var(--card-border-top);
  border-radius: 22px;
  box-shadow: var(--card-shadow), 0 0 60px rgba(99,102,241,.06);
  overflow: hidden;
}

.layout    { display: contents; }
.col-left  { display: contents; }
.col-right { display: contents; }
.col-left > *, .col-right > * { margin-bottom: 12px; }
.spacer { height: 88px; }

@media (min-width: 1024px) {
  .layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    align-items: start;
    margin-top: 0;
  }
  .col-left, .col-right { display: flex; flex-direction: column; gap: 16px; }
  .col-left > *, .col-right > * { margin-bottom: 0; }
  .spacer { height: 40px; }
}
</style>
