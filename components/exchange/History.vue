<script setup lang="ts">
/**
 * Rate history: market mid-rate (backfilled for a year) plus the shop rates
 * you entered on each day. Tells you where today sits in the chosen period's
 * range, and whether that range is even wide enough to beat your spread.
 */
const props = defineProps<{ dark: boolean }>()
const ex = useExchangeStore()
const sfx = useSfx()

const PERIODS = [
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
  { days: 365, label: '1 year' },
]
const period = ref(90)

onMounted(() => {
  ex.pruneHistory()
  ex.backfillHistory()
})

const points = computed(() => {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - period.value)
  const from = todayKey(cutoff)
  return Object.entries(ex.history)
    .filter(([d]) => d >= from)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, p]) => ({ t: new Date(`${date}T12:00:00`).getTime(), ...p }))
})

const marketPts = computed(() => points.value.filter(p => p.market !== undefined) as { t: number, market: number }[])

const stats = computed(() => {
  const vals = marketPts.value.map(p => p.market)
  if (vals.length < 3) return null
  const high = Math.max(...vals)
  const low = Math.min(...vals)
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length
  const now = ex.market?.rate ?? vals[vals.length - 1]
  const below = vals.filter(v => v < now).length
  return { high, low, avg, now, range: high - low, pct: Math.round(below / vals.length * 100) }
})

/** Plain-language reading of today versus the period. */
const verdict = computed(() => {
  const s = stats.value
  if (!s) return null
  const p = s.pct
  const where = p >= 80 ? 'near the top' : p >= 60 ? 'above the middle' : p > 40 ? 'in the middle' : p > 20 ? 'below the middle' : 'near the bottom'
  const advice = p >= 70
    ? { tone: 'up', text: 'A relatively good time to sell USD for riel: dollars buy more riel than usual.' }
    : p <= 30
      ? { tone: 'up', text: 'A relatively good time to buy USD with riel: dollars are cheaper than usual.' }
      : { tone: 'even', text: 'Nothing special about today: timing won\'t make much difference right now.' }
  const spread = Math.max(0, ex.spread)
  const beats = s.range > spread * 1.5
  return { where, advice, beats, spread }
})

const series = computed(() => {
  const out: { name: string, data: [number, number | null][] }[] = [
    { name: 'Market', data: marketPts.value.map(p => [p.t, p.market]) },
  ]
  const shop = points.value.filter(p => p.buy !== undefined)
  if (shop.length) {
    out.push({ name: 'Your buy rate', data: shop.map(p => [p.t, p.buy!]) })
    out.push({ name: 'Your sell rate', data: shop.map(p => [p.t, p.sell ?? null]) })
  }
  return out
})

const options = computed(() => {
  const text = props.dark ? '#8f8e8a' : '#888'
  const grid = props.dark ? '#2d2c2b' : '#ece9e4'
  return {
    chart: {
      type: 'line',
      background: 'transparent',
      foreColor: text,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true, speed: 500 },
      fontFamily: 'DM Sans, system-ui, sans-serif',
    },
    theme: { mode: props.dark ? 'dark' : 'light' },
    colors: [props.dark ? '#ecebe7' : '#0d0d0d', props.dark ? '#5bbd7c' : '#2f7d4a', props.dark ? '#e86d5f' : '#b23a2e'],
    stroke: { width: [2, 2, 2], curve: 'smooth', dashArray: [0, 4, 4] },
    markers: { size: [0, 3, 3], strokeWidth: 0, hover: { size: 5 } },
    grid: { borderColor: grid, strokeDashArray: 3, padding: { left: 8, right: 8 } },
    xaxis: { type: 'datetime', labels: { datetimeUTC: false }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { formatter: (v: number) => formatRate(v) }, tickAmount: 4 },
    tooltip: { theme: props.dark ? 'dark' : 'light', x: { format: 'd MMM yyyy' }, y: { formatter: (v: number) => (v ? `${formatRate(v)} ៛` : '—') } },
    legend: { position: 'top', horizontalAlign: 'left', fontSize: '12px', markers: { size: 5 } },
    dataLabels: { enabled: false },
  }
})

function setPeriod(days: number) {
  if (period.value === days) return
  period.value = days
  sfx.play('select')
}
</script>

<template>
  <section class="card history">
    <div class="card-head">
      <h2>Rate history</h2>
      <div class="seg" role="tablist" aria-label="Period">
        <button v-for="p in PERIODS" :key="p.days" type="button" role="tab" :aria-selected="period === p.days" :class="{ on: period === p.days }" @click="setPeriod(p.days)">
          {{ p.label }}
        </button>
      </div>
    </div>

    <div v-if="stats" class="stats">
      <div><span>Today</span><strong>{{ formatRate(stats.now) }}</strong></div>
      <div><span>High</span><strong>{{ formatRate(stats.high) }}</strong></div>
      <div><span>Low</span><strong>{{ formatRate(stats.low) }}</strong></div>
      <div><span>Average</span><strong>{{ formatRate(stats.avg) }}</strong></div>
      <div><span>Range</span><strong>{{ formatRate(stats.range) }} ៛</strong></div>
    </div>

    <Transition name="fade" mode="out-in">
      <div v-if="verdict && stats" :key="period" class="verdicts">
        <p class="where">
          Today's market rate is <strong>{{ verdict.where }}</strong> of the last {{ PERIODS.find(p => p.days === period)!.label }}
          (higher than {{ stats.pct }}% of days).
        </p>
        <p class="advice" :class="verdict.advice.tone">{{ verdict.advice.text }}</p>
        <p class="beats" :class="verdict.beats ? 'ok' : 'warn'">
          <template v-if="verdict.beats">
            The rate moved {{ formatRate(stats.range) }} ៛ in this period, more than your {{ formatRate(verdict.spread) }} ៛ spread, so waiting for a better rate can pay off.
          </template>
          <template v-else>
            The rate only moved {{ formatRate(stats.range) }} ៛ in this period, about the same as your {{ formatRate(verdict.spread) }} ៛ spread.
            Timing alone is unlikely to earn much, so a better shop or a higher-interest deposit will usually do more.
          </template>
        </p>
      </div>
    </Transition>

    <div class="chart">
      <ApexChart v-if="marketPts.length > 1" type="line" height="280" :options="options" :series="series" />
      <div v-else class="chart-empty">
        <span v-if="ex.backfilling">Loading past rates… {{ Math.round(ex.backfillProgress * 100) }}%</span>
        <span v-else>Not enough history yet. It builds up as the page fetches daily rates.</span>
      </div>
    </div>
    <p class="foot">
      <template v-if="ex.backfilling">Loading past rates… {{ Math.round(ex.backfillProgress * 100) }}% · </template>
      Market: daily mid-rate (daily for the last 30 days, weekly before that). Your rates are logged on each day you enter them.
    </p>
  </section>
</template>

<style scoped>
.card-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
.card-head h2 { margin: 0; }

.stats { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 1px; border: 1px solid var(--border); border-radius: 10px; overflow: hidden; background: var(--border); }
.stats div { display: grid; gap: 0.15rem; padding: 0.7rem 0.85rem; background: var(--theme-card); }
.stats span { font-size: 0.6875rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gray); }
.stats strong { font-family: var(--font-serif); font-weight: 400; font-size: 1.35rem; font-variant-numeric: tabular-nums; }

.verdicts { display: grid; gap: 0.5rem; margin-top: 1rem; font-size: 0.9rem; line-height: 1.55; }
.verdicts strong { font-weight: 500; }
.advice { padding: 0.7rem 0.9rem; border-radius: 10px; background: var(--light); }
.advice.up { background: var(--ex-pos-bg); color: var(--ex-pos); }
.beats { font-size: 0.8125rem; color: var(--gray); }
.beats.warn { color: #c9862b; }

.chart { margin-top: 1rem; min-height: 280px; }
.chart-empty { display: grid; place-items: center; height: 280px; border: 1px dashed var(--border); border-radius: 10px; font-size: 0.875rem; color: var(--gray); }
.foot { margin-top: 0.5rem; font-size: 0.6875rem; color: var(--gray); }

@media (max-width: 700px) {
  .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .stats div:first-child { grid-column: 1 / -1; }
}
</style>
