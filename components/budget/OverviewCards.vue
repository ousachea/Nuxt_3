<script setup lang="ts">
import { gsap } from 'gsap'

const props = defineProps<{ dailyBudget: number; spent: number; currency: string }>()

const remaining = computed(() => Math.max(props.dailyBudget - props.spent, 0))
const pct       = computed(() => props.dailyBudget > 0 ? (props.spent / props.dailyBudget) * 100 : 0)

const cards = computed(() => [
  { label: 'Daily Budget', val: props.dailyBudget, color: '#818cf8', glow: 'rgba(129,140,248,', icon: '🎯' },
  { label: 'Spent Today',  val: props.spent,        color: pct.value > 100 ? '#f87171' : pct.value > 60 ? '#fbbf24' : '#f0f0fe', glow: 'rgba(248,250,252,', icon: '💸' },
  { label: 'Remaining',    val: remaining.value,    color: remaining.value === 0 ? '#f87171' : '#34d399', glow: 'rgba(52,211,153,', icon: '✅' },
  { label: 'Saved Today',  val: remaining.value,    color: '#c084fc', glow: 'rgba(192,132,252,', icon: '🏦' },
])

const animated = reactive([0, 0, 0, 0])
const cardsEl  = ref<HTMLElement[]>([])

onMounted(() => {
  gsap.from(cardsEl.value, { y: 16, opacity: 0, duration: .5, stagger: .07, ease: 'power2.out', delay: .2 })
  cards.value.forEach((c, i) => gsap.to(animated, { [i]: c.val, duration: 1.2, ease: 'power2.out', delay: i * .05 }))
})
watch(cards, nc => nc.forEach((c, i) => gsap.to(animated, { [i]: c.val, duration: .6, ease: 'power2.out' })), { deep: true })
</script>

<template>
  <div class="grid">
    <div v-for="(card, i) in cards" :key="card.label" ref="cardsEl" class="card"
         :style="{ boxShadow: `0 4px 28px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.06), 0 0 40px ${card.glow}0.04)` }">
      <div class="card-top">
        <span class="card-lbl">{{ card.label }}</span>
        <span class="card-icon">{{ card.icon }}</span>
      </div>
      <div class="card-val" :style="{ color: card.color }">
        {{ currency }}{{ animated[i].toFixed(2) }}
      </div>
      <div class="bar-bg"><div class="bar-fill" :style="{ width: Math.min(pct,100)+'%', background: card.color }"/></div>
    </div>
  </div>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-top-color: var(--card-border-top);
  border-radius: var(--card-radius);
  padding: 18px;
}
.card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.card-lbl  { font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: .07em; }
.card-icon { font-size: 16px; }
.card-val  { font-size: 22px; font-weight: 900; font-variant-numeric: tabular-nums; margin-bottom: 12px; letter-spacing: -.5px; }
.bar-bg    { height: 3px; background: rgba(255,255,255,0.07); border-radius: 2px; overflow: hidden; }
.bar-fill  { height: 100%; border-radius: 2px; transition: width .6s ease; }
</style>
