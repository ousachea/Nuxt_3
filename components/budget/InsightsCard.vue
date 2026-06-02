<script setup lang="ts">
import type { Expense } from '~/types/budget'
import { useCategories } from '~/composables/useCategories'

const props = defineProps<{ expenses: Expense[]; dailyBudget: number; spent: number; currency: string }>()
const { getCategoryById } = useCategories()

const insights = computed(() => {
  const out: { icon: string; text: string; accent: string }[] = []
  if (!props.expenses.length) return out

  const pct = props.dailyBudget > 0 ? (props.spent / props.dailyBudget) * 100 : 0
  const totals: Record<string, number> = {}
  for (const e of props.expenses) totals[e.categoryId] = (totals[e.categoryId] || 0) + e.amount
  const [topId, topAmt] = Object.entries(totals).sort((a, b) => b[1] - a[1])[0] ?? []
  if (topId && topAmt) {
    const cat = getCategoryById(topId)
    out.push({ icon: cat.icon, text: `${((topAmt / props.spent) * 100).toFixed(0)}% of spending on ${cat.name}`, accent: cat.color })
  }
  if (pct < 50)      out.push({ icon: '🎉', text: `Great! Only ${pct.toFixed(0)}% of budget used`, accent: '#34d399' })
  else if (pct < 85) out.push({ icon: '⚡', text: `${pct.toFixed(0)}% used — stay mindful`, accent: '#fbbf24' })
  else if (pct >= 100) out.push({ icon: '🚨', text: `Over budget by ${props.currency}${(props.spent - props.dailyBudget).toFixed(2)}`, accent: '#f87171' })
  const saved = props.dailyBudget - props.spent
  if (saved > 0) out.push({ icon: '💡', text: `At this pace, save ~${props.currency}${(saved * 30).toFixed(0)} this month`, accent: '#818cf8' })
  return out.slice(0, 3)
})
</script>

<template>
  <div class="card">
    <div class="title">Smart Insights</div>
    <div v-if="!insights.length" class="empty">
      <span>🔍</span><p>Add expenses to see insights</p>
    </div>
    <ul v-else class="list">
      <li v-for="(ins, i) in insights" :key="i" class="item" :style="{ borderLeftColor: ins.accent, boxShadow: `0 0 20px ${ins.accent}08` }">
        <span class="item-icon">{{ ins.icon }}</span>
        <span class="item-text">{{ ins.text }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.card {
  background: var(--card-bg); border-radius: var(--card-radius);
  border: 1px solid var(--card-border); border-top-color: var(--card-border-top);
  box-shadow: var(--card-shadow); padding: 20px;
}
.title { font-size: 15px; font-weight: 800; color: var(--text); margin-bottom: 14px; letter-spacing: -.2px; }
.empty { padding: 20px 0; text-align: center; font-size: 14px; color: var(--text3); }
.empty span { font-size: 28px; display: block; margin-bottom: 8px; }
.list  { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.item  { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 12px; background: rgba(255,255,255,.03); border-left: 3px solid; }
.item-icon { font-size: 18px; flex-shrink: 0; }
.item-text { font-size: 13px; color: var(--text2); line-height: 1.4; font-weight: 500; }
</style>
