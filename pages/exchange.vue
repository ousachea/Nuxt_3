<script setup lang="ts">
/**
 * USD ⇄ KHR exchange page.
 *
 * The money changer's buy / sell rates are entered by hand (they differ from
 * shop to shop); the live market mid-rate is a reference point. State lives in
 * `stores/exchange.ts`; the shops, converter, history, trades, alerts and
 * savings cards are in `components/exchange/`.
 */
import { computed, watch, type Ref } from 'vue'
import { TransitionPresets, useTransition, usePreferredReducedMotion, useIntervalFn } from '@vueuse/core'
import type { Plan } from '~/stores/exchange'

const sfx = useSfx()
const { themePref, isDark, setTheme } = usePageTheme()
const ex = useExchangeStore()

/** Two-way bindings onto the store, so the template reads like local state. */
const field = <K extends keyof typeof ex.inputs>(k: K) => computed({
  get: () => ex.inputs[k],
  set: (v: (typeof ex.inputs)[K]) => { ex.inputs[k] = v },
})
const buyRate = field('buyRate')
const sellRate = field('sellRate')
const plan = field('plan')
const planUsd = field('planUsd')
const planKhr = field('planKhr')
const spread = computed(() => ex.spread)
const market = computed(() => ex.market)
const marketState = computed(() => ex.marketState)

// Results count up/down to their new value instead of jumping.
const reducedMotion = usePreferredReducedMotion()
const tween = (source: Ref<number>) => useTransition(source, {
  duration: 450,
  transition: TransitionPresets.easeOutCubic,
  disabled: computed(() => reducedMotion.value === 'reduce'),
})

// ---------- Market rate ----------
async function loadMarket(force = false) {
  try {
    const fresh = await ex.loadMarket(force)
    if (force && fresh) sfx.play('success')
  } catch {
    if (force) sfx.play('error')
  }
}
onMounted(() => loadMarket())
// Keep the reference (and market alerts) current while the page stays open.
useIntervalFn(() => loadMarket(true), 30 * 60 * 1000)

const marketRateShown = tween(computed(() => market.value?.rate ?? 0))

const marketUpdated = computed(() => {
  if (!market.value) return ''
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    .format(new Date(market.value.updated))
})

/** How a rate compares with the market, e.g. "12 ៛ below market (−0.3%)". */
function vsMarket(rate: number) {
  const m = market.value?.rate
  if (!m || !rate) return null
  const diff = rate - m
  const pct = diff / m * 100
  if (Math.abs(diff) < 0.5) return { text: 'same as market', tone: 'even' }
  return {
    text: `${formatRate(Math.abs(diff))} ៛ ${diff > 0 ? 'above' : 'below'} market (${diff > 0 ? '+' : '−'}${Math.abs(pct).toFixed(2)}%)`,
    tone: diff > 0 ? 'up' : 'down',
  }
}

/** Set buy / sell either side of the market rate, keeping today's spread. */
function fillFromMarket() {
  const m = market.value?.rate
  if (!m) return
  const s = Math.max(0, spread.value)
  buyRate.value = Math.round(m - s / 2)
  sellRate.value = Math.round(m + s / 2)
  sfx.play('select')
}

const activeShop = computed(() => ex.shops.find(s => s.id === ex.inputs.activeShopId) ?? null)

// ---------- When do I gain? ----------
// Exchanging and later exchanging back only pays if the rate moves past the
// spread. Two directions:
//  • 'toUsd'  — riel → USD now at the SELL rate; back to riel later at the
//               BUY rate. Gain once the future buy rate > today's sell rate.
//  • 'toKhr'  — USD → riel now at the BUY rate; back to USD later at the
//               SELL rate. Gain once the future sell rate < today's buy rate.


/** The rate that matters later, and where it has to cross to break even. */
const breakEven = computed(() => (plan.value === 'toUsd' ? sellRate.value : buyRate.value) || 0)
const todayLater = computed(() => (plan.value === 'toUsd' ? buyRate.value : sellRate.value) || 0)
/** Distance the later rate still has to move (always ≥ 0 when there's a spread). */
const needMove = computed(() => Math.abs(breakEven.value - todayLater.value))

const futureRate = ref(0)
const resetFuture = () => { futureRate.value = Math.round(todayLater.value) }
watch([plan, buyRate, sellRate], resetFuture, { immediate: true })

/** Result of the round trip at `rate`, in the currency you started with. */
function roundTrip(rate: number) {
  if (plan.value === 'toUsd') {
    // riel → dollars at the sell rate, then back to riel at `rate`
    const khr = planKhr.value || 0
    const usd = sellRate.value ? khr / sellRate.value : 0
    return { amount: usd * rate - khr, unit: 'khr' as const }
  }
  // dollars → riel at the buy rate, then back to dollars at `rate`
  const usd = planUsd.value || 0
  return { amount: rate ? usd * buyRate.value / rate - usd : 0, unit: 'usd' as const }
}

/** "$100" or "400,000 ៛": what you start with on the current tab. */
const holding = computed(() => (plan.value === 'toUsd' ? formatKHR(planKhr.value || 0) : formatUSD(planUsd.value || 0)))

const whatIf = computed(() => roundTrip(futureRate.value))
const nowResult = computed(() => roundTrip(todayLater.value))
const fmtMoney = (r: { amount: number, unit: 'khr' | 'usd' }) =>
  r.unit === 'khr' ? formatKHR(Math.abs(r.amount)) : formatUSD(Math.abs(r.amount))

// Slider / scale span around break-even, wide enough to show both zones.
const span = computed(() => Math.max(100, Math.ceil(Math.max(needMove.value, Math.abs(spread.value)) * 3 / 50) * 50))
const scaleMin = computed(() => Math.round(breakEven.value - span.value))
const scaleMax = computed(() => Math.round(breakEven.value + span.value))
const pos = (rate: number) => Math.min(100, Math.max(0, (rate - scaleMin.value) / (scaleMax.value - scaleMin.value) * 100))

/** A few example rates either side of break-even for the quick table. */
const examples = computed(() => {
  const step = Math.max(10, Math.round(span.value / 4 / 10) * 10)
  const dir = plan.value === 'toUsd' ? 1 : -1 // direction that gains
  return [-2, -1, 0, 1, 2].map((k) => {
    const rate = breakEven.value + dir * k * step
    return { rate, result: roundTrip(rate) }
  })
})

watch(() => Math.sign(Math.round(whatIf.value.amount * 100)), (now, before) => {
  if (before === undefined || now === before || now === 0) return
  sfx.play(now > 0 ? 'success' : 'error')
})

function setPlan(next: Plan) {
  if (plan.value === next) return
  plan.value = next
  sfx.play('select')
}
</script>

<template>
  <div class="page ex" :class="{ dark: isDark }" @input="sfx.typing($event)">
    <header class="ex-head">
      <div>
        <p class="section-label">Currency</p>
        <h1 class="title">USD ⇄ KHR</h1>
        <p class="lede">
          Convert between US dollars and Cambodian riel at your money changer's rates, and see how they compare with the market.
        </p>
      </div>
      <ThemeSwitch :pref="themePref" @select="setTheme" />
    </header>

    <!-- MARKET RATE -->
    <section class="card market" :class="`m-${marketState}`">
      <div class="market-main">
        <p class="market-label">
          <span class="market-dot" />
          {{ marketState === 'loading' ? 'Fetching market rate…' : marketState === 'cached' ? 'Market rate (offline, last saved)' : marketState === 'error' ? 'Market rate unavailable' : 'Market rate' }}
        </p>
        <p class="market-rate">
          <template v-if="market">
            {{ formatRate(marketRateShown) }} <em>៛ per $1</em>
          </template>
          <span v-else-if="marketState === 'loading'" class="skeleton" />
          <template v-else>—</template>
        </p>
        <p v-if="market" class="market-meta">
          Mid-market rate from {{ market.source }} · updated {{ marketUpdated }}
        </p>
        <p v-else-if="marketState === 'error'" class="market-meta">
          Couldn't reach the rate service. Check your connection and try again.
        </p>
      </div>
      <div class="market-actions">
        <button type="button" class="btn" :disabled="marketState === 'loading'" @click="loadMarket(true)">
          <svg class="refresh" :class="{ spin: marketState === 'loading' }" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M12 7a5 5 0 1 1-1.46-3.54M12 1.8v2.7H9.3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" /></svg>
          Refresh
        </button>
        <button type="button" class="btn primary" :disabled="!market" @click="fillFromMarket">
          Fill my rates from market
        </button>
      </div>
    </section>

    <div class="grid">
      <!-- RATES -->
      <section class="card">
        <div class="rates-head">
          <h2>Money changer rates</h2>
          <Transition name="fade" mode="out-in">
            <span v-if="activeShop" :key="activeShop.id" class="from-shop">from {{ activeShop.name }}</span>
          </Transition>
        </div>

        <label class="field">
          <span>Buy rate <small>they buy your USD</small></span>
          <div class="input-wrap">
            <input v-model.number="buyRate" type="number" inputmode="decimal">
            <em>៛</em>
          </div>
          <Transition name="fade" mode="out-in">
            <p v-if="vsMarket(buyRate)" :key="vsMarket(buyRate)!.text" class="vs" :class="vsMarket(buyRate)!.tone">{{ vsMarket(buyRate)!.text }}</p>
          </Transition>
        </label>

        <label class="field">
          <span>Sell rate <small>they sell you USD</small></span>
          <div class="input-wrap">
            <input v-model.number="sellRate" type="number" inputmode="decimal">
            <em>៛</em>
          </div>
          <Transition name="fade" mode="out-in">
            <p v-if="vsMarket(sellRate)" :key="vsMarket(sellRate)!.text" class="vs" :class="vsMarket(sellRate)!.tone">{{ vsMarket(sellRate)!.text }}</p>
          </Transition>
        </label>

        <div class="chip-row">
          <span class="chip">Spread <strong>{{ formatRate(spread) }} ៛</strong> per $1</span>
        </div>
      </section>

      <ExchangeConverter />
      <ExchangeShops />
    </div>

    <!-- WHEN DO I GAIN -->
    <section class="card gain" :class="`plan-${plan}`">
      <div class="gain-head">
        <h2>When do I gain?</h2>
        <div class="seg" role="tablist" aria-label="What are you doing?">
          <button type="button" role="tab" :aria-selected="plan === 'toKhr'" :class="{ on: plan === 'toKhr' }" @click="setPlan('toKhr')">
            <span class="cur">$</span> If I have USD
          </button>
          <button type="button" role="tab" :aria-selected="plan === 'toUsd'" :class="{ on: plan === 'toUsd' }" @click="setPlan('toUsd')">
            <span class="cur">៛</span> If I have KHR
          </button>
        </div>
      </div>

      <div class="gain-body">
        <div class="gain-explain">
          <Transition name="fade" mode="out-in">
            <div :key="plan">
              <p class="gain-step"><b>1</b>
                <span v-if="plan === 'toUsd'">Today you change <strong>{{ formatKHR(planKhr) }}</strong> into dollars at the sell rate <strong>{{ formatRate(sellRate) }} ៛</strong> and get <strong>{{ formatUSD(sellRate ? planKhr / sellRate : 0) }}</strong>.</span>
                <span v-else>Today you change <strong>{{ formatUSD(planUsd) }}</strong> into riel at the buy rate <strong>{{ formatRate(buyRate) }} ៛</strong> and get <strong>{{ formatKHR(planUsd * buyRate) }}</strong>.</span>
              </p>
              <p class="gain-step"><b>2</b>
                <span v-if="plan === 'toUsd'">Later you change the dollars back to riel at the <strong>buy rate</strong>, which is {{ formatRate(buyRate) }} ៛ today.</span>
                <span v-else>Later you change the riel back to dollars at the <strong>sell rate</strong>, which is {{ formatRate(sellRate) }} ៛ today.</span>
              </p>
              <p class="gain-rule">
                <span v-if="plan === 'toUsd'">You end up with more riel only when the <strong>buy rate goes above {{ formatRate(breakEven) }} ៛</strong>.</span>
                <span v-else>You end up with more dollars only when the <strong>sell rate drops below {{ formatRate(breakEven) }} ៛</strong>.</span>
                <template v-if="needMove > 0">
                  It needs to move <strong>{{ formatRate(needMove) }} ៛</strong> {{ plan === 'toUsd' ? 'up' : 'down' }} from today first.
                </template>
              </p>
              <p v-if="nowResult.amount < 0" class="gain-now">
                Changing back straight away would cost you <strong>{{ fmtMoney(nowResult) }}</strong>: that's the money changer's spread.
              </p>
            </div>
          </Transition>

          <label class="field amount">
            <span>How much you have</span>
            <div v-if="plan === 'toUsd'" class="input-wrap">
              <input v-model.number="planKhr" type="number" min="0" step="1000" inputmode="numeric">
              <em>៛</em>
            </div>
            <div v-else class="input-wrap">
              <input v-model.number="planUsd" type="number" min="0" inputmode="decimal">
              <em>USD</em>
            </div>
          </label>
        </div>

        <div class="gain-visual">
          <!-- scale: loss zone / gain zone split at break-even -->
          <div class="scale" :style="{ '--be': `${pos(breakEven)}%` }">
            <div class="zone loss" />
            <div class="zone win" />
            <div class="tick be" :style="{ left: `${pos(breakEven)}%` }"><span>Break-even<br>{{ formatRate(breakEven) }}</span></div>
            <div class="tick today" :style="{ left: `${pos(todayLater)}%` }"><span>Today<br>{{ formatRate(todayLater) }}</span></div>
            <div v-if="market && market.rate > scaleMin && market.rate < scaleMax" class="tick mkt" :style="{ left: `${pos(market.rate)}%` }" />
            <div class="thumb" :class="whatIf.amount >= 0 ? 'up' : 'down'" :style="{ left: `${pos(futureRate)}%` }" />
          </div>
          <div class="scale-ends">
            <span>{{ formatRate(scaleMin) }} ៛</span>
            <span v-if="market && market.rate > scaleMin && market.rate < scaleMax" class="mkt-legend"><i /> Market {{ formatRate(market.rate) }} ៛</span>
            <span>{{ formatRate(scaleMax) }} ៛</span>
          </div>

          <label class="whatif">
            <span>What if the {{ plan === 'toUsd' ? 'buy' : 'sell' }} rate becomes…</span>
            <input v-model.number="futureRate" class="range" type="range" :min="scaleMin" :max="scaleMax" step="1">
          </label>

          <div class="verdict" :class="whatIf.amount > 0.004 ? 'up' : whatIf.amount < -0.004 ? 'down' : 'even'">
            <span class="verdict-rate">At {{ formatRate(futureRate) }} ៛</span>
            <Transition name="fade" mode="out-in">
              <strong :key="whatIf.amount > 0.004 ? 'g' : whatIf.amount < -0.004 ? 'l' : 'e'">
                {{ whatIf.amount > 0.004 ? 'You gain' : whatIf.amount < -0.004 ? 'You lose' : 'You break even' }}
              </strong>
            </Transition>
            <span class="verdict-amt">{{ fmtMoney(whatIf) }}</span>
          </div>

          <table class="examples">
            <thead><tr><th>If the {{ plan === 'toUsd' ? 'buy' : 'sell' }} rate is</th><th>Result on {{ holding }}</th></tr></thead>
            <tbody>
              <tr v-for="ex in examples" :key="ex.rate" :class="ex.result.amount > 0.004 ? 'up' : ex.result.amount < -0.004 ? 'down' : 'even'" @click="futureRate = ex.rate">
                <td>{{ formatRate(ex.rate) }} ៛</td>
                <td>{{ ex.result.amount > 0.004 ? '+' : ex.result.amount < -0.004 ? '−' : '' }}{{ fmtMoney(ex.result) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <ExchangeHistory :dark="isDark" />
    <ExchangeTrades />
    <div class="pair">
      <ExchangeAlerts />
      <ExchangeSavings />
    </div>

    <section class="card explanation">
      <h2>How exchange rates work</h2>
      <ul>
        <li><strong>Buy rate</strong>: the exchange buys your USD.</li>
        <li><strong>Sell rate</strong>: the exchange sells USD to you.</li>
        <li>If you buy USD today and the buy rate later goes up, you make a profit. If it goes down, you lose money.</li>
        <li>The difference between buy and sell is the <strong>spread</strong>, which is the money changer's margin.</li>
        <li>The <strong>market rate</strong> is the mid-point banks trade at. Money changers buy a little below it and sell a little above it.</li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.ex {
  --ex-pos: #2f7d4a;
  --ex-pos-bg: #e6f3ea;
  --ex-neg: #b23a2e;
  --ex-neg-bg: #f9e5e2;
  max-width: none;
  padding: 4rem clamp(1rem, 3vw, 3rem);
}
.ex.dark {
  --ex-pos: #5bbd7c;
  --ex-pos-bg: #183021;
  --ex-neg: #e86d5f;
  --ex-neg-bg: #36201d;
}

.ex-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
}
.title {
  font-family: var(--font-serif);
  font-weight: 300;
  font-size: clamp(2.5rem, 6vw, 3.75rem);
  line-height: 1.05;
}
.lede { margin-top: 0.75rem; max-width: 36rem; color: var(--gray); }

/* MARKET */
.market {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-top: 2.5rem;
}
.market-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; color: var(--gray); }
.market-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--gray); }
.m-live .market-dot { background: var(--ex-pos); animation: live-pulse 1.8s ease-in-out infinite; }
.m-cached .market-dot { background: #c9862b; }
.m-error .market-dot { background: var(--ex-neg); }
.m-loading .market-dot { animation: blink 1s ease-in-out infinite; }
.market-rate {
  margin-top: 0.35rem;
  font-family: var(--font-serif);
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}
.market-rate em { font-family: var(--font-sans); font-style: normal; font-size: 0.9375rem; color: var(--gray); }
.market-meta { margin-top: 0.35rem; font-size: 0.75rem; color: var(--gray); }
.market-actions { display: flex; gap: 0.6rem; flex-wrap: wrap; }

.skeleton {
  display: inline-block;
  width: 8.5rem;
  height: 0.8em;
  border-radius: 8px;
  background: linear-gradient(90deg, var(--light) 25%, var(--border) 50%, var(--light) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.2s linear infinite;
}
.refresh.spin { animation: spin 0.9s linear infinite; }

/* GRID */
.grid {
  display: grid;
  /* 1 → 2×2 → 4 across, so the four cards never leave one stranded */
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-top: 1.5rem;
}
.two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 1rem; }

.vs { margin-top: 0.4rem; font-size: 0.75rem; color: var(--gray); }
.vs.up { color: var(--ex-pos); }
.vs.down { color: #c9862b; }

.chip-row { margin-top: 0.25rem; }
.chip {
  display: inline-flex;
  gap: 0.35rem;
  padding: 0.45rem 0.8rem;
  border-radius: 999px;
  background: var(--light);
  font-size: 0.8125rem;
  color: var(--gray);
}
.chip strong { font-weight: 500; color: var(--black); }

/* WHEN DO I GAIN */
.gain { margin-top: 1.5rem; }
.gain-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
.gain-head h2 { margin: 0; }

.gain-body { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr); gap: 2.5rem; }
.gain-step { display: flex; gap: 0.75rem; margin-bottom: 0.9rem; font-size: 0.9375rem; line-height: 1.55; }
.gain-step b {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 50%;
  background: var(--light);
  font-size: 0.75rem;
  font-weight: 500;
}
.gain-step strong, .gain-rule strong, .gain-now strong { font-weight: 500; }
.gain-rule {
  margin: 1.1rem 0 0.75rem;
  padding: 0.9rem 1rem;
  border-left: 3px solid var(--ex-pos);
  border-radius: 0 10px 10px 0;
  background: var(--ex-pos-bg);
  font-size: 0.9375rem;
  line-height: 1.55;
}
.gain-rule strong { color: var(--ex-pos); }
.gain-now { font-size: 0.8125rem; color: var(--gray); line-height: 1.5; }
.amount { margin-top: 1.25rem; max-width: 14rem; }

/* scale */
.scale { position: relative; height: 14px; margin: 3.25rem 0 0.4rem; border-radius: 999px; overflow: visible; }
.zone { position: absolute; top: 0; bottom: 0; transition: left 0.5s cubic-bezier(.2, .8, .2, 1), right 0.5s cubic-bezier(.2, .8, .2, 1); }
.plan-toUsd .zone.loss { left: 0; right: calc(100% - var(--be)); border-radius: 999px 0 0 999px; background: var(--ex-neg-bg); }
.plan-toUsd .zone.win { left: var(--be); right: 0; border-radius: 0 999px 999px 0; background: var(--ex-pos-bg); }
.plan-toKhr .zone.win { left: 0; right: calc(100% - var(--be)); border-radius: 999px 0 0 999px; background: var(--ex-pos-bg); }
.plan-toKhr .zone.loss { left: var(--be); right: 0; border-radius: 0 999px 999px 0; background: var(--ex-neg-bg); }
.tick {
  position: absolute;
  top: -4px;
  bottom: -4px;
  width: 2px;
  margin-left: -1px;
  background: var(--black);
  transition: left 0.5s cubic-bezier(.2, .8, .2, 1);
}
.tick span {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.6875rem;
  line-height: 1.25;
  text-align: center;
  white-space: nowrap;
  color: var(--gray);
}
.tick.be span { color: var(--black); font-weight: 500; }
.tick.today { background: var(--gray); }
.tick.today span { bottom: auto; top: calc(100% + 6px); }
.tick.mkt { background: #c9862b; opacity: 0.8; }
.mkt-legend { display: inline-flex; align-items: center; gap: 0.35rem; color: #c9862b; }
.mkt-legend i { width: 2px; height: 10px; background: #c9862b; }
.thumb {
  position: absolute;
  top: 50%;
  width: 18px;
  height: 18px;
  margin: -9px 0 0 -9px;
  border-radius: 50%;
  border: 3px solid var(--theme-card);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  transition: left 0.25s cubic-bezier(.2, .8, .2, 1), background 0.25s;
}
.thumb.up { background: var(--ex-pos); }
.thumb.down { background: var(--ex-neg); }
.scale-ends { display: flex; justify-content: space-between; margin-top: 2.6rem; font-size: 0.6875rem; color: var(--gray); }

.whatif { display: block; margin-top: 1rem; font-size: 0.875rem; }
.range { width: 100%; margin-top: 0.5rem; accent-color: var(--black); }

.verdict {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.25rem 0.75rem;
  margin-top: 1rem;
  padding: 1rem 1.1rem;
  border-radius: 10px;
  background: var(--light);
  transition: background-color 0.35s, color 0.35s;
}
.verdict.up { background: var(--ex-pos-bg); color: var(--ex-pos); }
.verdict.down { background: var(--ex-neg-bg); color: var(--ex-neg); }
.verdict-rate { width: 100%; font-size: 0.75rem; opacity: 0.8; }
.verdict strong { font-weight: 500; font-size: 1rem; }
.verdict-amt { font-family: var(--font-serif); font-size: clamp(1.75rem, 3vw, 2.25rem); line-height: 1.15; font-variant-numeric: tabular-nums; }

.examples { width: 100%; margin-top: 1rem; border-collapse: collapse; font-size: 0.8125rem; font-variant-numeric: tabular-nums; }
.examples th { padding: 0.4rem 0.6rem; text-align: left; font-weight: 400; color: var(--gray); border-bottom: 1px solid var(--border); }
.examples th:last-child, .examples td:last-child { text-align: right; }
.examples td { padding: 0.45rem 0.6rem; border-bottom: 1px solid var(--border); }
.examples tbody tr { cursor: pointer; transition: background 0.15s; }
.examples tbody tr:hover { background: var(--light); }
.examples tr.up td:last-child { color: var(--ex-pos); }
.examples tr.down td:last-child { color: var(--ex-neg); }

@media (max-width: 900px) {
  .gain-body { grid-template-columns: 1fr; gap: 1.5rem; }
}
@media (max-width: 700px) {
}

.rates-head { display: flex; align-items: baseline; justify-content: space-between; gap: 0.5rem; }
.from-shop { font-size: 0.75rem; color: var(--ex-pos); }

.pair {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
  align-items: start;
}

.explanation { margin-top: 1.5rem; }
.explanation ul { list-style: none; display: grid; gap: 0.6rem; font-size: 0.9rem; }
.explanation li { padding-left: 1rem; position: relative; }
.explanation li::before { content: ''; position: absolute; left: 0; top: 0.65em; width: 5px; height: 5px; border-radius: 50%; background: var(--gray); }
.explanation strong { font-weight: 500; }

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes shimmer { to { background-position: -200% 0; } }
@keyframes blink { 50% { opacity: 0.3; } }
@keyframes live-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(63, 143, 90, 0.45); }
  50% { box-shadow: 0 0 0 5px rgba(63, 143, 90, 0); }
}

@media (prefers-reduced-motion: reduce) {
  .ex *, .ex *::before, .ex *::after { animation: none !important; transition-duration: 0.01ms !important; }
}

@media (min-width: 701px) {
  .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (min-width: 1280px) {
  .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (max-width: 700px) {
  .ex { padding: 3rem 1rem; }
  .market-actions { width: 100%; }
}
</style>

<style>
/* Building blocks shared by the exchange page and its cards in
   components/exchange/ (scoped styles wouldn't reach into them). */
.ex .card {
  background: var(--theme-card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1.75rem;
  min-width: 0;
  transition: background-color 0.3s, border-color 0.3s;
}
.ex .card h2 {
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--gray);
  margin-bottom: 1.25rem;
}
.ex .btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.6rem 1rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--theme-card);
  font: 400 0.875rem var(--font-sans);
  color: var(--black);
  cursor: pointer;
  transition: border-color 0.18s, background 0.18s, color 0.18s, opacity 0.18s, transform 0.25s cubic-bezier(.34, 1.56, .64, 1);
}
.ex .btn:hover:not(:disabled) { transform: translateY(-1px); border-color: var(--gray); }
.ex .btn:active:not(:disabled) { transform: scale(0.97); }
.ex .btn:disabled { opacity: 0.5; cursor: default; }
.ex .btn.primary { background: var(--black); border-color: var(--black); color: var(--white); }
.ex .field { display: block; margin-bottom: 1.25rem; }
.ex .field > span { display: block; font-size: 0.875rem; margin-bottom: 0.4rem; }
.ex .field > span small { margin-left: 0.35rem; font-size: 0.75rem; color: var(--gray); }
.ex .hint { margin: -0.75rem 0 1.25rem; font-size: 0.8125rem; color: var(--gray); }
.ex .input-wrap {
  display: flex;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--white);
  transition: border-color 0.2s, box-shadow 0.25s;
}
.ex .input-wrap:focus-within { border-color: var(--black); box-shadow: 0 0 0 4px rgba(127, 127, 127, 0.12); }
.ex .input-wrap input {
  flex: 1;
  width: 100%;
  min-width: 0;
  border: 0;
  background: transparent;
  padding: 0.7rem 0.85rem;
  font: 400 1.125rem var(--font-sans);
  color: var(--black);
  outline: none;
}
.ex .input-wrap em { font-style: normal; color: var(--gray); font-size: 0.8125rem; padding-right: 0.85rem; }
.ex .result {
  display: grid;
  gap: 0.15rem;
  margin-top: 0.5rem;
  padding: 1rem 1.1rem;
  border-radius: 10px;
  background: var(--light);
  transition: background-color 0.35s, color 0.35s;
}
.ex .result > span { font-size: 0.75rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gray); }
.ex .result strong {
  font-family: var(--font-serif);
  font-weight: 400;
  font-size: clamp(1.75rem, 3vw, 2.25rem);
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
}
.ex .result.positive { background: var(--ex-pos-bg); color: var(--ex-pos); }
.ex .result.negative { background: var(--ex-neg-bg); color: var(--ex-neg); }
.ex .result.positive > span,
.ex .result.negative > span { color: inherit; opacity: 0.8; }
.ex .seg {
  display: inline-grid;
  grid-auto-flow: column;
  gap: 4px;
  padding: 4px;
  border-radius: 10px;
  background: var(--light);
}
.ex .seg button {
  padding: 0.5rem 0.9rem;
  border: 0;
  border-radius: 7px;
  background: transparent;
  font: 400 0.8125rem var(--font-sans);
  color: var(--gray);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.ex .seg .cur {
  display: inline-grid;
  place-items: center;
  width: 1.25rem;
  height: 1.25rem;
  margin-right: 0.3rem;
  border-radius: 50%;
  background: var(--border);
  font-size: 0.75rem;
  color: var(--black);
}
.ex .seg button.on .cur { background: var(--black); color: var(--white); }
.ex .seg button.on { background: var(--theme-card); color: var(--black); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08); }
.ex .fade-enter-active,
.ex .fade-leave-active { transition: opacity 0.18s ease, transform 0.22s cubic-bezier(.2, .8, .2, 1); }
.ex .fade-enter-from { opacity: 0; transform: translateY(4px); }
.ex .fade-leave-to { opacity: 0; transform: translateY(-4px); }
.ex .btn.small { padding: 0.35rem 0.8rem; font-size: 0.8125rem; }

@media (max-width: 700px) {
  .ex .card { padding: 1.25rem; }
  .ex .gain .seg { grid-auto-flow: row; width: 100%; }
  .ex .market-actions .btn { flex: 1; justify-content: center; }
}
.ex .history,
.ex .trades { margin-top: 1.5rem; }
</style>
