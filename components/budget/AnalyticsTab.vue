<script setup lang="ts">
const props = defineProps<{
  days7: { label: string; total: number; isToday: boolean }[]
  monthlyDays: { day: number; total: number; isToday: boolean; isFuture: boolean }[]
  categoryTotals: Record<string, number>
  dailyBudget: number; currency: string
}>()

const weekTotal  = computed(() => props.days7.reduce((s, d) => s + d.total, 0))
const weekAvg    = computed(() => weekTotal.value / 7)
const monthTotal = computed(() => props.monthlyDays.reduce((s, d) => s + d.total, 0))
</script>

<template>
  <div class="tab-root">
    <header class="tab-header">
      <h2 class="tab-title">Analytics</h2>
      <p class="tab-sub">Your spending patterns</p>
    </header>

    <!-- Summary stats row -->
    <div class="stat-row">
      <div class="stat-card">
        <div class="sc-label">This Week</div>
        <div class="sc-val" style="color:var(--indigo)">{{ currency }}{{ weekTotal.toFixed(0) }}</div>
      </div>
      <div class="stat-card">
        <div class="sc-label">Daily Avg</div>
        <div class="sc-val" :style="{ color: weekAvg > dailyBudget ? '#f87171' : '#34d399' }">
          {{ currency }}{{ weekAvg.toFixed(0) }}
        </div>
      </div>
      <div class="stat-card">
        <div class="sc-label">This Month</div>
        <div class="sc-val" style="color:var(--purple)">{{ currency }}{{ monthTotal.toFixed(0) }}</div>
      </div>
      <div class="stat-card">
        <div class="sc-label">Daily Budget</div>
        <div class="sc-val" style="color:#34d399">{{ currency }}{{ dailyBudget }}</div>
      </div>
    </div>

    <BudgetMonthlyProjection :currency="currency"/>

    <!-- Charts grid -->
    <div class="charts-grid">
      <div class="chart-wide">
        <BudgetWeeklyChart :days="days7" :daily-budget="dailyBudget" :currency="currency"/>
      </div>
      <div class="chart-side">
        <BudgetCategoryChart :totals="categoryTotals" :currency="currency"/>
      </div>
    </div>

    <BudgetMonthlyHeatmap :days="monthlyDays" :daily-budget="dailyBudget" :currency="currency"/>

    <div class="bottom-pad"/>
  </div>
</template>

<style scoped>
.tab-root   { display: flex; flex-direction: column; gap: 14px; }
.tab-header { padding: 24px 0 4px; }
.tab-title  { font-size: 26px; font-weight: 800; color: var(--text); letter-spacing: -.5px; }
.tab-sub    { font-size: 13px; color: var(--text3); margin-top: 3px; }

.stat-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.stat-card { background: var(--card-bg); border: 1px solid var(--card-border); border-top-color: var(--card-border-top); box-shadow: var(--card-shadow); border-radius: 14px; padding: 14px 16px; }
.sc-label  { font-size: 10px; color: var(--text3); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 6px; font-weight: 700; }
.sc-val    { font-size: 22px; font-weight: 800; font-variant-numeric: tabular-nums; }

/* Mobile: single column charts */
.charts-grid { display: flex; flex-direction: column; gap: 14px; }
.chart-wide, .chart-side { width: 100%; }

.bottom-pad { height: 88px; }

/* Desktop */
@media (min-width: 1024px) {
  .stat-row { grid-template-columns: repeat(4, 1fr); }
  .charts-grid {
    display: grid;
    grid-template-columns: 3fr 2fr;
    gap: 20px;
    align-items: start;
  }
  .bottom-pad { height: 40px; }
}
</style>
