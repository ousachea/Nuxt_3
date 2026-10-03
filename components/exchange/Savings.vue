<script setup lang="ts">
/**
 * Keep savings in USD, or convert to riel for a higher deposit rate and
 * convert back later? Simple interest over the term; the riel route pays the
 * spread twice (buy rate in, sell rate out). The key output is the sell rate
 * at the end below which riel still comes out ahead.
 */
const ex = useExchangeStore()

const s = computed(() => ex.savings)
const usdEnd = computed(() => (s.value.usd || 0) * (1 + (s.value.usdInterest || 0) / 100 * (s.value.months || 0) / 12))
const khrStart = computed(() => (s.value.usd || 0) * (ex.inputs.buyRate || 0))
const khrEnd = computed(() => khrStart.value * (1 + (s.value.khrInterest || 0) / 100 * (s.value.months || 0) / 12))

/** Riel route converted back at today's sell rate. */
const khrBackUsd = computed(() => (ex.inputs.sellRate ? khrEnd.value / ex.inputs.sellRate : 0))
const diff = computed(() => khrBackUsd.value - usdEnd.value)
/** Sell rate at the end that makes both routes equal. */
const breakEvenSell = computed(() => (usdEnd.value ? khrEnd.value / usdEnd.value : 0))
const headroom = computed(() => breakEvenSell.value - (ex.inputs.sellRate || 0))

const winner = computed(() => (Math.abs(diff.value) < 0.005 ? 'even' : diff.value > 0 ? 'khr' : 'usd'))
const bar = (v: number) => `${Math.max(4, Math.min(100, v / Math.max(usdEnd.value, khrBackUsd.value, 1) * 100))}%`
</script>

<template>
  <section class="card savings">
    <h2>Savings: USD or riel?</h2>

    <div class="inputs">
      <label class="field">
        <span>Savings</span>
        <div class="input-wrap"><input v-model.number="ex.savings.usd" type="number" min="0" inputmode="decimal"><em>USD</em></div>
      </label>
      <label class="field">
        <span>For</span>
        <div class="input-wrap"><input v-model.number="ex.savings.months" type="number" min="1" max="120" inputmode="numeric"><em>months</em></div>
      </label>
      <label class="field">
        <span>USD deposit rate</span>
        <div class="input-wrap"><input v-model.number="ex.savings.usdInterest" type="number" step="0.05" min="0" inputmode="decimal"><em>% / yr</em></div>
      </label>
      <label class="field">
        <span>Riel deposit rate</span>
        <div class="input-wrap"><input v-model.number="ex.savings.khrInterest" type="number" step="0.05" min="0" inputmode="decimal"><em>% / yr</em></div>
      </label>
    </div>
    <p class="hint">Enter your bank's real rates. The defaults are only examples.</p>

    <div class="compare">
      <div class="route" :class="{ win: winner === 'usd' }">
        <div class="route-head"><span>Keep in USD</span><strong>{{ formatUSD(usdEnd) }}</strong></div>
        <div class="track"><div class="fill usd" :style="{ width: bar(usdEnd) }" /></div>
      </div>
      <div class="route" :class="{ win: winner === 'khr' }">
        <div class="route-head"><span>Riel, then back to USD</span><strong>{{ formatUSD(khrBackUsd) }}</strong></div>
        <div class="track"><div class="fill khr" :style="{ width: bar(khrBackUsd) }" /></div>
        <small>{{ formatKHR(khrStart) }} → {{ formatKHR(khrEnd) }}, changed back at today's sell rate {{ formatRate(ex.inputs.sellRate) }}</small>
      </div>
    </div>

    <Transition name="fade" mode="out-in">
      <p :key="winner" class="verdict" :class="winner === 'usd' ? 'down' : winner === 'khr' ? 'up' : ''">
        <template v-if="winner === 'khr'">Riel earns you <strong>{{ formatUSD(diff) }}</strong> more, if the rate stays where it is.</template>
        <template v-else-if="winner === 'usd'">Keeping USD earns you <strong>{{ formatUSD(-diff) }}</strong> more: the riel interest doesn't cover the spread.</template>
        <template v-else>Both come out about the same.</template>
      </p>
    </Transition>

    <p class="breakeven">
      Riel stays ahead as long as the sell rate in {{ ex.savings.months }} months is below
      <strong>{{ formatRate(breakEvenSell) }} ៛</strong>
      <template v-if="headroom > 0"> (it can rise {{ formatRate(headroom) }} ៛ from today before USD wins).</template>
      <template v-else> (it would have to fall {{ formatRate(-headroom) }} ៛ from today first).</template>
    </p>
    <p class="foot">Simple interest, before any withholding tax on interest. Uses your buy rate to convert in and your sell rate to convert back.</p>
  </section>
</template>

<style scoped>
.inputs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 1rem; }
.hint { margin-top: -0.6rem; font-size: 0.75rem; color: var(--gray); }

.compare { display: grid; gap: 0.9rem; margin-top: 1.1rem; }
.route-head { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; font-size: 0.875rem; }
.route-head span { color: var(--gray); }
.route-head strong { font-family: var(--font-serif); font-weight: 400; font-size: 1.35rem; font-variant-numeric: tabular-nums; }
.route.win .route-head span { color: var(--black); font-weight: 500; }
.route small { display: block; margin-top: 0.3rem; font-size: 0.75rem; color: var(--gray); }
.track { height: 10px; margin-top: 0.35rem; border-radius: 999px; background: var(--light); overflow: hidden; }
.fill { height: 100%; border-radius: inherit; transition: width 0.7s cubic-bezier(.34, 1.2, .5, 1); }
.fill.usd { background: var(--gray); }
.fill.khr { background: var(--ex-pos); }
.route.win .fill.usd { background: var(--black); }

.verdict { margin-top: 1rem; padding: 0.75rem 0.95rem; border-radius: 10px; background: var(--light); font-size: 0.9rem; }
.verdict.up { background: var(--ex-pos-bg); color: var(--ex-pos); }
.verdict.down { background: var(--ex-neg-bg); color: var(--ex-neg); }
.verdict strong, .breakeven strong { font-weight: 500; }
.breakeven { margin-top: 0.75rem; font-size: 0.875rem; line-height: 1.55; }
.foot { margin-top: 0.5rem; font-size: 0.6875rem; color: var(--gray); }
</style>
