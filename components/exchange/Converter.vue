<script setup lang="ts">
/**
 * Two-way quick converter. USD → riel uses the buy rate (the changer buys
 * your dollars); riel → USD uses the sell rate. Swap flips the direction and
 * carries the result across as the new amount.
 */
import { TransitionPresets, useTransition, usePreferredReducedMotion } from '@vueuse/core'

const ex = useExchangeStore()
const sfx = useSfx()

const toKhr = computed(() => ex.inputs.convDir === 'usdToKhr')
const result = computed(() => {
  const amt = ex.inputs.convAmount || 0
  if (toKhr.value) return amt * (ex.inputs.buyRate || 0)
  return ex.inputs.sellRate ? amt / ex.inputs.sellRate : 0
})

const reduced = usePreferredReducedMotion()
const shown = useTransition(result, {
  duration: 450,
  transition: TransitionPresets.easeOutCubic,
  disabled: computed(() => reduced.value === 'reduce'),
})

const spinning = ref(false)
function swap() {
  const carried = result.value
  ex.inputs.convDir = toKhr.value ? 'khrToUsd' : 'usdToKhr'
  ex.inputs.convAmount = toKhr.value ? Math.round(carried * 100) / 100 : Math.round(carried)
  spinning.value = false
  requestAnimationFrame(() => { spinning.value = true })
  sfx.play('select')
}
</script>

<template>
  <section class="card conv">
    <h2>Quick convert</h2>

    <label class="field">
      <span>You give</span>
      <div class="input-wrap">
        <input v-model.number="ex.inputs.convAmount" type="number" min="0" :inputmode="toKhr ? 'decimal' : 'numeric'">
        <em>{{ toKhr ? 'USD' : '៛' }}</em>
      </div>
    </label>

    <div class="swap-row">
      <span class="rate-used">at {{ toKhr ? 'buy' : 'sell' }} rate {{ formatRate(toKhr ? ex.inputs.buyRate : ex.inputs.sellRate) }} ៛</span>
      <button type="button" class="swap" :class="{ spin: spinning }" aria-label="Swap direction" @click="swap" @animationend="spinning = false">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M5 2.5v10M5 12.5L2.5 10M5 12.5L7.5 10M11 13.5v-10M11 3.5L8.5 6M11 3.5L13.5 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </button>
    </div>

    <div class="result" :class="{ positive: toKhr }">
      <span>You receive</span>
      <strong>{{ toKhr ? formatKHR(shown) : formatUSD(shown) }}</strong>
    </div>
  </section>
</template>

<style scoped>
.swap-row { display: flex; align-items: center; justify-content: space-between; margin: -0.35rem 0 0.75rem; }
.rate-used { font-size: 0.75rem; color: var(--gray); }
.swap {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--theme-card);
  color: var(--black);
  cursor: pointer;
  transition: border-color 0.18s, transform 0.2s;
}
.swap:hover { border-color: var(--gray); }
.swap.spin { animation: swap-spin 0.45s cubic-bezier(.34, 1.56, .64, 1); }
@keyframes swap-spin { from { transform: rotate(-180deg) scale(0.85); } }
</style>
