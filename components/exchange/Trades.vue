<script setup lang="ts">
/**
 * Logged exchanges and what each would make or lose if reversed at today's
 * rates, with its break-even. Bought USD → valued at today's buy rate (riel);
 * sold USD → valued at today's sell rate (dollars).
 */
import type { Trade } from '~/stores/exchange'

const ex = useExchangeStore()
const sfx = useSfx()

const adding = ref(false)
const draft = reactive({
  kind: 'buyUsd' as Trade['kind'],
  usd: 100,
  rate: 0,
  date: todayKey(),
  shop: '',
})

function startAdd() {
  draft.kind = 'buyUsd'
  draft.usd = 100
  draft.rate = ex.inputs.sellRate
  draft.date = todayKey()
  draft.shop = ex.shops.find(s => s.id === ex.inputs.activeShopId)?.name ?? ''
  adding.value = true
}
// Default the rate to what that kind of trade would have used today.
watch(() => draft.kind, (k) => { draft.rate = k === 'buyUsd' ? ex.inputs.sellRate : ex.inputs.buyRate })

function save() {
  if (!draft.usd || !draft.rate) return
  ex.addTrade({ kind: draft.kind, usd: draft.usd, rate: draft.rate, date: draft.date, shop: draft.shop.trim() || undefined })
  adding.value = false
  sfx.play('success')
}
function remove(id: string) {
  ex.removeTrade(id)
  sfx.play('collapse')
}

const rows = computed(() => ex.trades.map(t => ({ t, r: ex.tradeResult(t) })))
const totals = computed(() => ({
  khr: rows.value.filter(x => x.r.unit === 'khr').reduce((a, x) => a + x.r.amount, 0),
  usd: rows.value.filter(x => x.r.unit === 'usd').reduce((a, x) => a + x.r.amount, 0),
  hasKhr: rows.value.some(x => x.r.unit === 'khr'),
  hasUsd: rows.value.some(x => x.r.unit === 'usd'),
}))
const tone = (n: number, unit: 'khr' | 'usd') => (n > (unit === 'usd' ? 0.005 : 0.5) ? 'up' : n < -(unit === 'usd' ? 0.005 : 0.5) ? 'down' : 'even')
const fmtDate = (d: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${d}T12:00:00`))
</script>

<template>
  <section class="card trades">
    <div class="card-head">
      <h2>My trades</h2>
      <button v-if="!adding" type="button" class="btn small" @click="startAdd">+ Log a trade</button>
    </div>

    <Transition name="fade">
      <form v-if="adding" class="add" @submit.prevent="save">
        <div class="seg kind" role="tablist">
          <button type="button" :class="{ on: draft.kind === 'buyUsd' }" @click="draft.kind = 'buyUsd'">I bought USD</button>
          <button type="button" :class="{ on: draft.kind === 'sellUsd' }" @click="draft.kind = 'sellUsd'">I sold USD</button>
        </div>
        <div class="add-grid">
          <label><span>Dollars</span><input v-model.number="draft.usd" class="plain" type="number" min="0" inputmode="decimal" required></label>
          <label><span>At rate (៛ per $1)</span><input v-model.number="draft.rate" class="plain" type="number" inputmode="decimal" required></label>
          <label><span>Date</span><input v-model="draft.date" class="plain" type="date" required></label>
          <label><span>Shop <small>optional</small></span><input v-model="draft.shop" class="plain" placeholder="Where"></label>
        </div>
        <p class="add-hint">
          <template v-if="draft.kind === 'buyUsd'">You paid {{ formatKHR(draft.usd * draft.rate) }} for {{ formatUSD(draft.usd) }}.</template>
          <template v-else>You got {{ formatKHR(draft.usd * draft.rate) }} for {{ formatUSD(draft.usd) }}.</template>
        </p>
        <div class="add-actions">
          <button type="button" class="btn small" @click="adding = false">Cancel</button>
          <button type="submit" class="btn small primary">Save trade</button>
        </div>
      </form>
    </Transition>

    <p v-if="!ex.trades.length && !adding" class="empty">
      Log each time you change money. You'll see what each trade would make or lose at today's rates, and the rate you need to break even.
    </p>

    <template v-else-if="ex.trades.length">
      <div class="totals">
        <div v-if="totals.hasKhr" :class="tone(totals.khr, 'khr')">
          <span>Dollars you bought</span>
          <strong>{{ formatSigned(totals.khr, 'khr') }}</strong>
          <small>if sold back today at {{ formatRate(ex.inputs.buyRate) }}</small>
        </div>
        <div v-if="totals.hasUsd" :class="tone(totals.usd, 'usd')">
          <span>Dollars you sold</span>
          <strong>{{ formatSigned(totals.usd, 'usd') }}</strong>
          <small>if bought back today at {{ formatRate(ex.inputs.sellRate) }}</small>
        </div>
      </div>

      <TransitionGroup tag="ul" name="list" class="list">
        <li v-for="{ t, r } in rows" :key="t.id">
          <div class="t-main">
            <span class="kind-dot" :class="t.kind" />
            <div>
              <strong>{{ t.kind === 'buyUsd' ? 'Bought' : 'Sold' }} {{ formatUSD(t.usd) }}</strong> at {{ formatRate(t.rate) }} ៛
              <small>{{ fmtDate(t.date) }}<template v-if="t.shop"> · {{ t.shop }}</template></small>
            </div>
          </div>
          <div class="t-result" :class="tone(r.amount, r.unit)">
            <strong>{{ formatSigned(r.amount, r.unit) }}</strong>
            <small>
              break-even: {{ t.kind === 'buyUsd' ? 'buy rate above' : 'sell rate below' }} {{ formatRate(r.breakEven) }}
            </small>
          </div>
          <button type="button" class="icon" aria-label="Delete trade" @click="remove(t.id)">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" /></svg>
          </button>
        </li>
      </TransitionGroup>
    </template>
  </section>
</template>

<style scoped>
.card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.card-head h2 { margin: 0; }

.plain {
  width: 100%;
  min-width: 0;
  padding: 0.5rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--white);
  font: 400 0.9rem var(--font-sans);
  color: var(--black);
  outline: none;
}
.plain:focus { border-color: var(--black); }

.add { display: grid; gap: 0.75rem; margin-bottom: 1rem; padding: 0.9rem; border: 1px dashed var(--border); border-radius: 10px; }
.kind { justify-self: start; }
.add-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.6rem; }
.add-grid label span { display: block; font-size: 0.6875rem; color: var(--gray); margin-bottom: 0.2rem; }
.add-grid small { opacity: 0.7; }
.add-hint { font-size: 0.8125rem; color: var(--gray); }
.add-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }

.totals { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: 0.75rem; margin-bottom: 1rem; }
.totals div { display: grid; gap: 0.1rem; padding: 0.85rem 1rem; border-radius: 10px; background: var(--light); }
.totals span { font-size: 0.6875rem; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.8; }
.totals strong { font-family: var(--font-serif); font-weight: 400; font-size: 1.75rem; line-height: 1.15; font-variant-numeric: tabular-nums; }
.totals small { font-size: 0.75rem; opacity: 0.8; }
.totals .up { background: var(--ex-pos-bg); color: var(--ex-pos); }
.totals .down { background: var(--ex-neg-bg); color: var(--ex-neg); }

.list { list-style: none; display: grid; position: relative; }
.list li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0.25rem;
  border-bottom: 1px solid var(--border);
  font-size: 0.9rem;
}
.t-main { display: flex; align-items: flex-start; gap: 0.6rem; }
.t-main strong { font-weight: 500; }
.t-main small, .t-result small { display: block; font-size: 0.75rem; color: var(--gray); }
.kind-dot { flex-shrink: 0; width: 8px; height: 8px; margin-top: 0.45rem; border-radius: 50%; }
.kind-dot.buyUsd { background: var(--ex-pos); }
.kind-dot.sellUsd { background: #c9862b; }
.t-result { text-align: right; }
.t-result strong { font-weight: 500; font-variant-numeric: tabular-nums; }
.t-result.up strong { color: var(--ex-pos); }
.t-result.down strong { color: var(--ex-neg); }
.icon {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--gray);
  cursor: pointer;
}
.icon:hover { background: var(--light); color: var(--black); }
.empty { font-size: 0.875rem; color: var(--gray); line-height: 1.55; }

.list-enter-active, .list-leave-active { transition: opacity 0.25s, transform 0.3s cubic-bezier(.2, .8, .2, 1); }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateX(-8px); }
.list-leave-active { position: absolute; width: 100%; }
.list-move { transition: transform 0.3s cubic-bezier(.2, .8, .2, 1); }

@media (max-width: 700px) {
  .add-grid { grid-template-columns: 1fr 1fr; }
  .list li { grid-template-columns: minmax(0, 1fr) auto; }
  .t-result { grid-column: 1; grid-row: 2; text-align: left; padding-left: 1.1rem; }
  .icon { grid-row: 1; grid-column: 2; }
}
</style>
