<script setup lang="ts">
import { gsap } from 'gsap'

const props = defineProps<{ spent: number; budget: number; currency: string }>()

const ringEl   = ref<SVGCircleElement | null>(null)
const animated = reactive({ spent: 0, pct: 0 })

const R = 86
const C = 2 * Math.PI * R

const pct       = computed(() => props.budget > 0 ? Math.min((props.spent / props.budget) * 100, 100) : 0)
const remaining = computed(() => Math.max(props.budget - props.spent, 0))
const exceeded  = computed(() => props.spent > props.budget)

const ringColor = computed(() => {
  if (exceeded.value || pct.value >= 100) return '#f87171'
  if (pct.value >= 85) return '#fb923c'
  if (pct.value >= 60) return '#fbbf24'
  return '#34d399'
})
const glowRgba = computed(() => {
  if (exceeded.value || pct.value >= 100) return 'rgba(248,113,113,'
  if (pct.value >= 85) return 'rgba(251,146,60,'
  if (pct.value >= 60) return 'rgba(251,191,36,'
  return 'rgba(52,211,153,'
})
const statusLabel = computed(() => {
  if (exceeded.value) return 'Over Budget'
  if (pct.value >= 85) return 'Almost Full'
  if (pct.value >= 60) return 'Watch Out'
  return 'On Track'
})

const animateTo = (s: number, p: number) => {
  gsap.to(animated, { spent: s, pct: p, duration: 1, ease: 'power2.out' })
  if (ringEl.value)
    gsap.to(ringEl.value, { strokeDashoffset: C * (1 - p / 100), duration: 1, ease: 'power2.out' })
}

onMounted(() => {
  if (ringEl.value) gsap.set(ringEl.value, { strokeDashoffset: C })
  nextTick(() => animateTo(props.spent, pct.value))
})
watch(() => [props.spent, pct.value], ([s, p]) => animateTo(s as number, p as number))
</script>

<template>
  <div class="ring-wrap">
    <!-- Radial glow layer -->
    <div class="ring-glow" :style="{ background: `radial-gradient(circle, ${glowRgba}0.12) 0%, transparent 65%)` }"/>

    <div class="ring-container">
      <svg :width="210" :height="210" class="-rotate-90" style="overflow:visible">
        <defs>
          <filter id="ring-glow-filter" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <!-- Track -->
        <circle cx="105" cy="105" :r="R" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="11"/>
        <!-- Progress -->
        <circle ref="ringEl" cx="105" cy="105" :r="R"
          fill="none" :stroke="ringColor" stroke-width="11" stroke-linecap="round"
          :stroke-dasharray="C" :stroke-dashoffset="C"
          filter="url(#ring-glow-filter)"
          style="transition:stroke 0.5s ease;"/>
      </svg>

      <div class="ring-center">
        <div class="ring-label">SPENT TODAY</div>
        <div class="ring-amount" :style="{ color: ringColor }">
          {{ currency }}{{ animated.spent.toFixed(2) }}
        </div>
        <div class="ring-sub">of {{ currency }}{{ budget.toFixed(2) }}</div>
        <div class="ring-badge" :style="{ background: glowRgba + '0.15)', color: ringColor }">
          {{ statusLabel }}
        </div>
      </div>
    </div>

    <!-- Stats row -->
    <div class="ring-stats">
      <div class="stat">
        <span class="stat-lbl">Remaining</span>
        <span class="stat-val" :style="{ color: exceeded ? '#f87171' : '#34d399' }">
          {{ exceeded ? '-' : '' }}{{ currency }}{{ exceeded ? (spent-budget).toFixed(2) : remaining.toFixed(2) }}
        </span>
      </div>
      <div class="divider"/>
      <div class="stat">
        <span class="stat-lbl">Budget</span>
        <span class="stat-val" style="color:var(--text)">{{ currency }}{{ budget.toFixed(2) }}</span>
      </div>
      <div class="divider"/>
      <div class="stat">
        <span class="stat-lbl">Used</span>
        <span class="stat-val" :style="{ color: ringColor }">{{ animated.pct.toFixed(0) }}%</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ring-wrap {
  position: relative;
  padding: 32px 24px 26px;
  display: flex; flex-direction: column; align-items: center;
}
.ring-glow {
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  transition: background 0.5s ease;
}
.ring-container { position: relative; width: 210px; height: 210px; }
.ring-center {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center;
}
.ring-label  { font-size: 10px; font-weight: 700; letter-spacing: .1em; color: var(--text3); text-transform: uppercase; margin-bottom: 5px; }
.ring-amount { font-size: 32px; font-weight: 900; letter-spacing: -1.5px; line-height: 1; font-variant-numeric: tabular-nums; }
.ring-sub    { font-size: 12px; color: var(--text3); margin-top: 4px; font-weight: 500; }
.ring-badge  {
  margin-top: 10px; padding: 4px 12px; border-radius: 20px;
  font-size: 10px; font-weight: 800; letter-spacing: .07em; text-transform: uppercase;
}
.ring-stats {
  display: flex; align-items: center; gap: 24px;
  margin-top: 24px; padding-top: 20px;
  border-top: 1px solid rgba(255,255,255,0.07); width: 100%;
  justify-content: center;
}
.stat  { text-align: center; }
.stat-lbl { display: block; font-size: 10px; color: var(--text3); text-transform: uppercase; letter-spacing: .08em; margin-bottom: 5px; font-weight: 600; }
.stat-val { font-size: 17px; font-weight: 800; font-variant-numeric: tabular-nums; }
.divider  { width: 1px; height: 36px; background: rgba(255,255,255,0.07); }
</style>
