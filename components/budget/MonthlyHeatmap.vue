<script setup lang="ts">
const props = defineProps<{ days: { day: number; total: number; isToday: boolean; isFuture: boolean }[]; dailyBudget: number; currency: string }>()
const now       = new Date()
const monthName = now.toLocaleDateString('en', { month: 'long', year: 'numeric' })
const firstDOW  = new Date(now.getFullYear(), now.getMonth(), 1).getDay()
const padded    = computed(() => [...Array(firstDOW).fill(null), ...props.days])
const cellColor = (d: { total: number; isFuture: boolean }) => {
  if (d.isFuture || d.total === 0) return 'rgba(255,255,255,0.03)'
  const p = (d.total / props.dailyBudget) * 100
  if (p >= 100) return 'rgba(248,113,113,.75)'
  if (p >= 85)  return 'rgba(251,146,60,.65)'
  if (p >= 60)  return 'rgba(251,191,36,.55)'
  return `rgba(52,211,153,${.2 + (p/100)*.55})`
}
const tip = (d: { day: number; total: number; isFuture: boolean }) =>
  d.isFuture ? `Day ${d.day}` : d.total === 0 ? `Day ${d.day}: no spend` : `Day ${d.day}: ${props.currency}${d.total.toFixed(2)}`
const weekdays = ['S','M','T','W','T','F','S']
</script>
<template>
  <div class="card">
    <div class="head">
      <span class="title">{{ monthName }}</span>
      <div class="legend">
        <span class="dot" style="background:rgba(52,211,153,.6)"/>Under
        <span class="dot" style="background:rgba(251,191,36,.55)"/>Near
        <span class="dot" style="background:rgba(248,113,113,.75)"/>Over
      </div>
    </div>
    <div class="weekdays"><span v-for="w in weekdays" :key="w">{{ w }}</span></div>
    <div class="grid">
      <div v-for="(d, i) in padded" :key="i">
        <div v-if="d" class="cell" :class="{ today: d.isToday }" :style="{ background: cellColor(d) }" :title="tip(d)">
          <span class="dn">{{ d.day }}</span>
        </div>
        <div v-else class="cell" style="background:transparent"/>
      </div>
    </div>
  </div>
</template>
<style scoped>
.card { background: var(--card-bg); border-radius: var(--card-radius); border: 1px solid var(--card-border); border-top-color: var(--card-border-top); box-shadow: var(--card-shadow); padding: 20px; }
.head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.title { font-size: 15px; font-weight: 800; color: var(--text); letter-spacing: -.2px; }
.legend { display: flex; align-items: center; gap: 6px; font-size: 10px; color: var(--text3); font-weight: 600; }
.dot    { width: 8px; height: 8px; border-radius: 2px; display: inline-block; margin-right: 2px; }
.weekdays { display: grid; grid-template-columns: repeat(7,1fr); gap: 4px; margin-bottom: 4px; }
.weekdays span { text-align: center; font-size: 9px; font-weight: 800; color: var(--text3); text-transform: uppercase; }
.grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 4px; }
.cell { aspect-ratio: 1; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: transform .15s; cursor: default; }
.cell:hover { transform: scale(1.2); }
.today { outline: 2px solid var(--indigo); outline-offset: 1px; box-shadow: 0 0 10px rgba(129,140,248,.3); }
.dn { font-size: 9px; font-weight: 700; color: rgba(240,240,254,.4); }
</style>
