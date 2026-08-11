<script setup>
/* ------------------------------------------------------------------ *
 * Salary raise + tax calculator
 * State is namespaced under `sal_*` in localStorage, matching the
 * persistence pattern used by the other mini-apps in this project.
 * ------------------------------------------------------------------ */

const STORE_KEY = 'sal_calc_v1'

/* --- inputs ------------------------------------------------------- */
const currency = ref('USD')            // 'USD' | 'KHR'
const period = ref('month')            // 'month' | 'year' — how salary is entered
const salary = ref(1200)               // in `currency`, per `period`
const raisePct = ref(7)

const taxMode = ref('brackets')        // 'none' | 'flat' | 'brackets'
const flatRate = ref(10)
const brackets = ref([])               // [{ upTo: number|null, rate: number }] monthly, in `currency`
const presetName = ref('Cambodia — Tax on Salary')

const khrPerUsd = ref(4100)
const dependents = ref(0)
const dependentRelief = ref(0)         // per dependent, per month, in `currency`
const preTaxDeduction = ref(0)         // per month (pension / NSSF style)
const postTaxDeduction = ref(0)        // per month (loan, insurance …)

const projectionYears = ref(5)

/* --- Cambodia Tax on Salary (monthly, KHR) ------------------------ *
 * Sub-Decree No. 196, in force since 2023. Thresholds are editable
 * below so they can be updated if the law changes.
 * ------------------------------------------------------------------ */
const KH_BRACKETS_KHR = [
  { upTo: 1_500_000, rate: 0 },
  { upTo: 2_000_000, rate: 5 },
  { upTo: 8_500_000, rate: 10 },
  { upTo: 12_500_000, rate: 15 },
  { upTo: null, rate: 20 },
]
const KH_RELIEF_KHR = 150_000          // per minor child / dependent spouse, per month

const roundThreshold = value => (currency.value === 'USD' ? Math.round(value) : Math.round(value / 1000) * 1000)

function loadCambodiaPreset () {
  const divisor = currency.value === 'USD' ? (khrPerUsd.value || 4100) : 1
  brackets.value = KH_BRACKETS_KHR.map(b => ({
    upTo: b.upTo === null ? null : roundThreshold(b.upTo / divisor),
    rate: b.rate,
  }))
  dependentRelief.value = currency.value === 'USD'
    ? Math.round((KH_RELIEF_KHR / divisor) * 100) / 100
    : KH_RELIEF_KHR
  presetName.value = 'Cambodia — Tax on Salary'
}

function loadFlatPreset () {
  brackets.value = [{ upTo: null, rate: 10 }]
  dependentRelief.value = 0
  presetName.value = 'Custom'
}

/* --- bracket helpers ---------------------------------------------- */
const orderedBrackets = computed(() => {
  const finite = brackets.value.filter(b => b.upTo !== null && Number.isFinite(b.upTo))
    .sort((a, b) => a.upTo - b.upTo)
  const open = brackets.value.filter(b => b.upTo === null || !Number.isFinite(b.upTo))
  return [...finite, ...(open.length ? [open[open.length - 1]] : [{ upTo: null, rate: 0 }])]
})

function addBracket () {
  const finite = brackets.value.filter(b => b.upTo !== null)
  const last = finite[finite.length - 1]
  const next = last ? Math.round(last.upTo * 2) : 1000
  const openIndex = brackets.value.findIndex(b => b.upTo === null)
  const row = { upTo: next, rate: last ? Math.min(last.rate + 5, 100) : 5 }
  if (openIndex === -1) brackets.value.push(row)
  else brackets.value.splice(openIndex, 0, row)
  presetName.value = 'Custom'
}

function removeBracket (index) {
  if (brackets.value.length <= 1) return
  brackets.value.splice(index, 1)
  if (!brackets.value.some(b => b.upTo === null)) {
    brackets.value[brackets.value.length - 1].upTo = null
  }
  presetName.value = 'Custom'
}

/* --- core maths --------------------------------------------------- */
function progressiveTax (taxable) {
  let tax = 0
  let floor = 0
  for (const band of orderedBrackets.value) {
    const ceiling = band.upTo === null ? Infinity : band.upTo
    if (taxable > floor) tax += (Math.min(taxable, ceiling) - floor) * ((band.rate || 0) / 100)
    floor = ceiling
    if (taxable <= ceiling) break
  }
  return tax
}

function marginalRate (taxable) {
  if (taxMode.value === 'none') return 0
  if (taxMode.value === 'flat') return flatRate.value || 0
  let floor = 0
  for (const band of orderedBrackets.value) {
    const ceiling = band.upTo === null ? Infinity : band.upTo
    if (taxable > floor && taxable <= ceiling) return band.rate || 0
    floor = ceiling
  }
  return orderedBrackets.value[orderedBrackets.value.length - 1]?.rate || 0
}

/** Full monthly breakdown for a given monthly gross. */
function breakdown (monthlyGross) {
  const gross = Math.max(0, monthlyGross || 0)
  const preTax = Math.max(0, preTaxDeduction.value || 0)
  const relief = Math.max(0, (dependents.value || 0) * (dependentRelief.value || 0))
  const taxable = Math.max(0, gross - preTax - relief)

  let tax = 0
  if (taxMode.value === 'flat') tax = taxable * ((flatRate.value || 0) / 100)
  else if (taxMode.value === 'brackets') tax = progressiveTax(taxable)

  const postTax = Math.max(0, postTaxDeduction.value || 0)
  const net = gross - preTax - tax - postTax

  return {
    gross,
    preTax,
    relief,
    taxable,
    tax,
    postTax,
    net,
    effRate: gross > 0 ? (tax / gross) * 100 : 0,
    marginal: marginalRate(taxable),
  }
}

const monthlyNow = computed(() => (period.value === 'year' ? (salary.value || 0) / 12 : (salary.value || 0)))
const monthlyNext = computed(() => monthlyNow.value * (1 + (raisePct.value || 0) / 100))

const before = computed(() => breakdown(monthlyNow.value))
const after = computed(() => breakdown(monthlyNext.value))

const grossGain = computed(() => after.value.gross - before.value.gross)
const netGain = computed(() => after.value.net - before.value.net)
const taxGain = computed(() => after.value.tax - before.value.tax)
const keepRate = computed(() => (grossGain.value > 0 ? (netGain.value / grossGain.value) * 100 : null))

/** Two-way: type a target salary and the raise % is solved backwards. */
const targetSalary = computed({
  get: () => (period.value === 'year' ? monthlyNext.value * 12 : monthlyNext.value),
  set: (value) => {
    const base = salary.value || 0
    if (base <= 0) return
    raisePct.value = Math.round(((Number(value) || 0) / base - 1) * 1000) / 10
  },
})

const projection = computed(() => {
  const rows = []
  for (let year = 1; year <= (projectionYears.value || 1); year++) {
    const gross = monthlyNow.value * Math.pow(1 + (raisePct.value || 0) / 100, year)
    const row = breakdown(gross)
    rows.push({ year, ...row, netLift: row.net - before.value.net })
  }
  return rows
})

const projectionPeak = computed(() => Math.max(1, ...projection.value.map(r => r.gross)))

/* Stacked composition bars (net / tax / deductions) for before + after. */
function shares (b) {
  const total = Math.max(b.gross, 1)
  return {
    net: (Math.max(0, b.net) / total) * 100,
    tax: (b.tax / total) * 100,
    ded: ((b.preTax + b.postTax) / total) * 100,
  }
}

/* --- formatting --------------------------------------------------- */
const symbol = computed(() => (currency.value === 'USD' ? '$' : '៛'))

function money (value, opts = {}) {
  const negative = value < 0
  const abs = Math.abs(value || 0)
  const dp = opts.dp ?? (currency.value === 'USD' ? 2 : 0)
  const body = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  }).format(abs)
  const text = currency.value === 'USD' ? `$${body}` : `${body}៛`
  return `${negative ? '−' : ''}${text}`
}

function signedMoney (value) {
  return `${value >= 0 ? '+' : '−'}${money(Math.abs(value))}`
}

const pct = value => `${(Math.round((value || 0) * 10) / 10).toFixed(1)}%`
const compact = value => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0)

const RAISE_CHIPS = [0, 3, 5, 7, 10, 15, 20, 30]

/* --- persistence -------------------------------------------------- */
const KEYS = {
  currency, period, salary, raisePct, taxMode, flatRate, brackets, presetName,
  khrPerUsd, dependents, dependentRelief, preTaxDeduction, postTaxDeduction, projectionYears,
}

let hydrated = false

onMounted(() => {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      for (const [key, target] of Object.entries(KEYS)) {
        if (saved[key] !== undefined && saved[key] !== null) target.value = saved[key]
      }
    }
  } catch {
    /* corrupted or unavailable storage — fall through to defaults */
  }
  if (!Array.isArray(brackets.value) || !brackets.value.length) loadCambodiaPreset()
  hydrated = true
})

watch(
  () => Object.fromEntries(Object.entries(KEYS).map(([k, r]) => [k, r.value])),
  (state) => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state))
    } catch {
      /* storage full or blocked — calculator still works in-memory */
    }
  },
  { deep: true },
)

/* Switching currency rescales the money-denominated inputs so the
   numbers stay meaningful instead of becoming nonsense. */
function switchCurrency (next) {
  if (next === currency.value) return
  const rate = khrPerUsd.value || 4100
  const factor = next === 'KHR' ? rate : 1 / rate
  const scale = ref => { ref.value = Math.round((ref.value || 0) * factor * 100) / 100 }
  scale(salary)
  scale(preTaxDeduction)
  scale(postTaxDeduction)
  currency.value = next
  if (presetName.value.startsWith('Cambodia')) loadCambodiaPreset()
  else {
    scale(dependentRelief)
    brackets.value = brackets.value.map(b => ({
      ...b,
      upTo: b.upTo === null ? null : Math.round(b.upTo * factor),
    }))
  }
}

useHead({ title: 'Salary & Raise Calculator' })
</script>

<template>
  <div class="pay-shell">
    <!-- Backdrop stack: shape grid → colour glows → grain film -->
    <div class="pay-canvas" aria-hidden="true">
      <ShapeGrid
        shape="square"
        direction="diagonal"
        :speed="0.35"
        :square-size="46"
        border-color="rgba(236, 231, 220, 0.06)"
        hover-fill-color="rgba(216, 182, 106, 0.22)"
        :hover-trail-amount="6"
        vignette-color="rgba(9, 12, 11, 0.86)"
        pointer-target="window"
      />
    </div>
    <div class="pay-glow" aria-hidden="true" />
    <div class="pay-grain" aria-hidden="true" />

    <header class="pay-top">
      <div class="pay-mark">
        <span class="pay-mark-glyph">%</span>
        <span>SALARY / AFTER TAX</span>
      </div>
      <div class="pay-top-meta">
        <span class="pay-dot" />
        <span>{{ presetName.toUpperCase() }}</span>
        <span class="pay-top-sep" />
        <span>{{ currency }} · PER {{ period.toUpperCase() }}</span>
      </div>
    </header>

    <main class="pay-main">
      <!-- HERO -->
      <section class="hero">
        <div class="hero-copy">
          <p class="kicker"><span>01</span> Raise &amp; take-home modelling</p>
          <h1>What the raise<br><em>is actually worth.</em></h1>
          <p class="hero-sub">
            A raise is quoted in gross. You live on net. Set your salary, pick an
            increase, and watch how much of it survives tax.
          </p>
        </div>

        <div class="dial-wrap">
          <div
            class="dial"
            :style="{ '--sweep': `${Math.max(0, Math.min(100, keepRate ?? 0))}%` }"
          >
            <div class="dial-face">
              <span class="dial-value">{{ keepRate === null ? '—' : Math.round(keepRate) + '%' }}</span>
              <span class="dial-label">of the raise<br>you keep</span>
            </div>
          </div>
          <div class="dial-legend">
            <div><span>Gross lift</span><b>{{ signedMoney(grossGain) }}</b></div>
            <div><span>Tax on it</span><b class="is-tax">{{ signedMoney(-taxGain) }}</b></div>
            <div><span>Net lift</span><b class="is-net">{{ signedMoney(netGain) }}</b></div>
          </div>
        </div>
      </section>

      <!-- CONTROLS + PAYSLIP -->
      <section class="work">
        <div class="controls">
          <!-- salary -->
          <article class="panel" style="--delay: 0ms">
            <div class="panel-head">
              <h2>01 — Current salary</h2>
              <div class="seg">
                <button :class="{ on: currency === 'USD' }" @click="switchCurrency('USD')">USD</button>
                <button :class="{ on: currency === 'KHR' }" @click="switchCurrency('KHR')">KHR</button>
              </div>
            </div>

            <div class="field-row">
              <label class="field">
                <span>Gross salary</span>
                <div class="amount">
                  <i>{{ symbol }}</i>
                  <input v-model.number="salary" type="number" min="0" step="any" inputmode="decimal">
                </div>
              </label>
              <div class="seg tall">
                <button :class="{ on: period === 'month' }" @click="period = 'month'">/ month</button>
                <button :class="{ on: period === 'year' }" @click="period = 'year'">/ year</button>
              </div>
            </div>

            <p class="hint">
              That is {{ money(monthlyNow) }} a month · {{ money(monthlyNow * 12) }} a year, before tax.
            </p>
          </article>

          <!-- raise -->
          <article class="panel" style="--delay: 70ms">
            <div class="panel-head">
              <h2>02 — Increase</h2>
              <span class="panel-note">{{ pct(raisePct) }}</span>
            </div>

            <div class="chips">
              <button
                v-for="chip in RAISE_CHIPS"
                :key="chip"
                :class="{ on: Number(raisePct) === chip }"
                @click="raisePct = chip"
              >{{ chip }}%</button>
            </div>

            <input
              v-model.number="raisePct"
              class="slider"
              type="range"
              min="0"
              max="50"
              step="0.5"
              aria-label="Raise percentage"
            >

            <div class="field-row split">
              <label class="field">
                <span>Exact percentage</span>
                <div class="amount">
                  <input v-model.number="raisePct" type="number" min="-100" step="0.1" inputmode="decimal">
                  <i class="trail">%</i>
                </div>
              </label>
              <label class="field">
                <span>…or target salary / {{ period }}</span>
                <div class="amount">
                  <i>{{ symbol }}</i>
                  <input v-model.number="targetSalary" type="number" min="0" step="any" inputmode="decimal">
                </div>
              </label>
            </div>
          </article>

          <!-- tax -->
          <article class="panel" style="--delay: 140ms">
            <div class="panel-head">
              <h2>03 — Tax</h2>
              <div class="seg">
                <button :class="{ on: taxMode === 'brackets' }" @click="taxMode = 'brackets'">Brackets</button>
                <button :class="{ on: taxMode === 'flat' }" @click="taxMode = 'flat'">Flat</button>
                <button :class="{ on: taxMode === 'none' }" @click="taxMode = 'none'">None</button>
              </div>
            </div>

            <template v-if="taxMode === 'flat'">
              <label class="field">
                <span>Flat tax rate</span>
                <div class="amount">
                  <input v-model.number="flatRate" type="number" min="0" max="100" step="0.5">
                  <i class="trail">%</i>
                </div>
              </label>
            </template>

            <template v-else-if="taxMode === 'brackets'">
              <div class="preset-row">
                <button class="ghost" @click="loadCambodiaPreset">Load Cambodia ToS</button>
                <button class="ghost" @click="loadFlatPreset">Reset to single band</button>
              </div>

              <div v-if="currency === 'USD'" class="rate-line">
                <span>Brackets converted at</span>
                <input v-model.number="khrPerUsd" type="number" min="1" step="10">
                <span>៛ per $</span>
              </div>

              <table class="bands">
                <thead>
                  <tr>
                    <th>Monthly taxable up to</th>
                    <th class="num">Rate</th>
                    <th aria-label="Remove" />
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(band, index) in brackets" :key="index">
                    <td>
                      <div v-if="band.upTo === null" class="band-open">and above</div>
                      <div v-else class="amount slim">
                        <i>{{ symbol }}</i>
                        <input v-model.number="band.upTo" type="number" min="0" step="any" @change="presetName = 'Custom'">
                      </div>
                    </td>
                    <td class="num">
                      <div class="amount slim right">
                        <input v-model.number="band.rate" type="number" min="0" max="100" step="0.5" @change="presetName = 'Custom'">
                        <i class="trail">%</i>
                      </div>
                    </td>
                    <td class="shrink">
                      <button class="icon" title="Remove band" @click="removeBracket(index)">×</button>
                    </td>
                  </tr>
                </tbody>
              </table>

              <button class="ghost wide" @click="addBracket">+ Add band</button>
            </template>

            <p v-else class="hint">No tax applied — this is the pure gross view.</p>
          </article>

          <!-- deductions -->
          <article class="panel" style="--delay: 210ms">
            <div class="panel-head">
              <h2>04 — Relief &amp; deductions</h2>
              <span class="panel-note">per month</span>
            </div>

            <div class="field-row split">
              <label class="field">
                <span>Dependents</span>
                <div class="amount">
                  <input v-model.number="dependents" type="number" min="0" step="1">
                </div>
              </label>
              <label class="field">
                <span>Relief per dependent</span>
                <div class="amount">
                  <i>{{ symbol }}</i>
                  <input v-model.number="dependentRelief" type="number" min="0" step="any">
                </div>
              </label>
            </div>

            <div class="field-row split">
              <label class="field">
                <span>Pre-tax deduction</span>
                <div class="amount">
                  <i>{{ symbol }}</i>
                  <input v-model.number="preTaxDeduction" type="number" min="0" step="any">
                </div>
              </label>
              <label class="field">
                <span>Post-tax deduction</span>
                <div class="amount">
                  <i>{{ symbol }}</i>
                  <input v-model.number="postTaxDeduction" type="number" min="0" step="any">
                </div>
              </label>
            </div>

            <p class="hint">
              Pre-tax items (pension, social security) shrink the taxable base.
              Post-tax items (loans, insurance) only shrink take-home.
            </p>
          </article>
        </div>

        <!-- PAYSLIP -->
        <aside class="slip-col">
          <div class="slip-wrap">
            <div class="slip">
              <div class="slip-head">
                <div>
                  <p class="slip-title">Pay statement</p>
                  <p class="slip-sub">Monthly · {{ currency }}</p>
                </div>
                <div class="slip-stamp">{{ pct(raisePct) }}</div>
              </div>

              <div class="perf" />

              <div class="slip-cols">
                <span />
                <span>Now</span>
                <span>After</span>
              </div>

              <div class="slip-row">
                <span>Gross</span>
                <b>{{ money(before.gross) }}</b>
                <b>{{ money(after.gross) }}</b>
              </div>
              <div v-if="before.preTax > 0" class="slip-row muted">
                <span>Pre-tax deduction</span>
                <b>{{ money(-before.preTax) }}</b>
                <b>{{ money(-after.preTax) }}</b>
              </div>
              <div v-if="before.relief > 0" class="slip-row muted">
                <span>Dependent relief</span>
                <b>{{ money(-before.relief) }}</b>
                <b>{{ money(-after.relief) }}</b>
              </div>
              <div class="slip-row muted">
                <span>Taxable</span>
                <b>{{ money(before.taxable) }}</b>
                <b>{{ money(after.taxable) }}</b>
              </div>
              <div class="slip-row is-tax">
                <span>Tax</span>
                <b>{{ money(-before.tax) }}</b>
                <b>{{ money(-after.tax) }}</b>
              </div>
              <div v-if="before.postTax > 0" class="slip-row muted">
                <span>Post-tax deduction</span>
                <b>{{ money(-before.postTax) }}</b>
                <b>{{ money(-after.postTax) }}</b>
              </div>

              <div class="perf" />

              <div class="slip-row total">
                <span>Net pay</span>
                <b>{{ money(before.net) }}</b>
                <b>{{ money(after.net) }}</b>
              </div>

              <div class="slip-delta" :class="{ down: netGain < 0 }">
                <span>{{ netGain >= 0 ? '▲' : '▼' }}</span>
                {{ signedMoney(netGain) }} / month
                <em>{{ signedMoney(netGain * 12) }} a year</em>
              </div>

              <div class="bars">
                <div v-for="row in [{ k: 'Now', b: before }, { k: 'After', b: after }]" :key="row.k" class="bar-row">
                  <span>{{ row.k }}</span>
                  <div class="bar">
                    <i class="seg-net" :style="{ width: shares(row.b).net + '%' }" />
                    <i class="seg-tax" :style="{ width: shares(row.b).tax + '%' }" />
                    <i class="seg-ded" :style="{ width: shares(row.b).ded + '%' }" />
                  </div>
                </div>
                <div class="bar-key">
                  <span><i class="seg-net" />Net</span>
                  <span><i class="seg-tax" />Tax</span>
                  <span><i class="seg-ded" />Deductions</span>
                </div>
              </div>

              <div class="slip-foot">
                <div><span>Effective rate</span><b>{{ pct(before.effRate) }} → {{ pct(after.effRate) }}</b></div>
                <div><span>Marginal band</span><b>{{ pct(after.marginal) }}</b></div>
                <div><span>Annual net</span><b>{{ money(after.net * 12) }}</b></div>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <!-- PROJECTION -->
      <section class="projection">
        <div class="section-head">
          <h2>05 — If this repeats every year</h2>
          <div class="years">
            <span>Horizon</span>
            <input v-model.number="projectionYears" type="range" min="1" max="10" step="1" class="slider slim">
            <b>{{ projectionYears }} yr</b>
          </div>
        </div>

        <div class="proj-scroll">
          <table class="proj">
            <thead>
              <tr>
                <th>Year</th>
                <th class="num">Gross / mo</th>
                <th class="num">Tax / mo</th>
                <th class="num">Net / mo</th>
                <th class="num">Net / yr</th>
                <th class="num">vs today</th>
                <th class="growth">Growth</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Today</td>
                <td class="num">{{ money(before.gross) }}</td>
                <td class="num tax">{{ money(before.tax) }}</td>
                <td class="num net">{{ money(before.net) }}</td>
                <td class="num">{{ money(before.net * 12) }}</td>
                <td class="num dim">—</td>
                <td class="growth">
                  <span class="track"><i :style="{ width: (before.gross / projectionPeak) * 100 + '%' }" /></span>
                </td>
              </tr>
              <tr v-for="row in projection" :key="row.year">
                <td>+{{ row.year }}</td>
                <td class="num">{{ money(row.gross) }}</td>
                <td class="num tax">{{ money(row.tax) }}</td>
                <td class="num net">{{ money(row.net) }}</td>
                <td class="num">{{ money(row.net * 12) }}</td>
                <td class="num" :class="row.netLift >= 0 ? 'up' : 'down'">{{ signedMoney(row.netLift) }}</td>
                <td class="growth">
                  <span class="track"><i :style="{ width: (row.gross / projectionPeak) * 100 + '%' }" /></span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="footnote">
          Compounding {{ pct(raisePct) }} a year on the current gross, taxed with the
          rules above. Bracket thresholds are held constant — real ones drift with policy,
          so treat long horizons as a sketch, not a forecast.
          <template v-if="presetName.startsWith('Cambodia')">
            Cambodia figures follow the monthly Tax on Salary bands introduced by
            Sub-Decree 196 (first 1,500,000៛ tax-free, rising to 20%); check them
            against the current Prakas before relying on them.
          </template>
        </p>
      </section>
    </main>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=IBM+Plex+Mono:wght@300;400;500;600&display=swap');

.pay-shell {
  --ink: #090c0b;
  --ink-2: #131815;
  --line: rgba(236, 231, 220, 0.13);
  --line-2: rgba(236, 231, 220, 0.26);
  --bone: #ece7dc;
  --dim: #878d86;
  --paper: #f3eee2;
  --paper-ink: #191c15;
  --jade: #6fd6a4;
  --verm: #e8613b;
  --sand: #d8b66a;

  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
  color: var(--bone);

  /* Base plate. The ShapeGrid canvas, the colour glows and the grain film
     stack over it as fixed layers, all below the content (z-index 1). */
  background-color: var(--ink);
  background-image: linear-gradient(178deg, #141a17 0%, #0b0f0d 44%, #070a09 100%);
  background-attachment: fixed;
  background-repeat: no-repeat;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-weight: 300;
  font-size: 14px;
}

.pay-canvas {
  position: fixed;
  inset: 0;
  z-index: 0;
}

/* Warm sand light from the top-right, cool jade bounce from the bottom-left.
   Sits above the grid so the glows tint it instead of being buried by it. */
.pay-glow {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image:
    radial-gradient(78% 52% at 86% -8%, rgba(216, 182, 106, 0.15), transparent 62%),
    radial-gradient(62% 48% at 0% 104%, rgba(111, 214, 164, 0.1), transparent 66%);
}

.pay-grain {
  position: fixed;
  inset: 0;
  z-index: 0;
  opacity: 0.045;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* ---------- top bar ---------- */
.pay-top {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 68px;
  padding: 0 clamp(20px, 5vw, 68px);
  border-bottom: 1px solid var(--line);
}

.pay-mark, .pay-top-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 10px;
  letter-spacing: 0.14em;
  color: var(--dim);
}

.pay-mark { color: var(--bone); }

.pay-mark-glyph {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--line-2);
  border-radius: 50%;
  font-family: 'Instrument Serif', serif;
  font-size: 15px;
  color: var(--sand);
}

.pay-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--jade);
  box-shadow: 0 0 0 4px rgba(111, 214, 164, 0.14);
  animation: blip 2.6s ease infinite;
}

.pay-top-sep { width: 22px; height: 1px; background: var(--line-2); }

/* ---------- layout ---------- */
.pay-main {
  position: relative;
  z-index: 1;
  width: min(1420px, 100%);
  margin: 0 auto;
  padding: 0 clamp(20px, 5vw, 68px) 96px;
}

/* ---------- hero ---------- */
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 48px;
  align-items: end;
  padding: clamp(56px, 8vw, 108px) 0 56px;
  border-bottom: 1px solid var(--line);
}

.kicker {
  margin-bottom: 26px;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--dim);
}

.kicker span { margin-right: 18px; color: var(--sand); }

.hero h1 {
  font-family: 'Instrument Serif', serif;
  font-weight: 400;
  font-size: clamp(44px, 7.2vw, 108px);
  line-height: 0.92;
  letter-spacing: -0.02em;
}

.hero h1 em { font-style: italic; color: var(--sand); }

.hero-sub {
  max-width: 44ch;
  margin-top: 26px;
  font-size: 13px;
  line-height: 1.75;
  color: var(--dim);
}

.dial-wrap { animation: rise 0.8s 0.15s both; }

.dial {
  position: relative;
  width: 178px;
  height: 178px;
  margin-bottom: 26px;
  border-radius: 50%;
  background:
    conic-gradient(var(--jade) 0 var(--sweep), rgba(232, 97, 59, 0.5) var(--sweep) 100%);
  transition: background 0.5s ease;
}

.dial::before {
  content: '';
  position: absolute;
  inset: -9px;
  border: 1px dashed var(--line-2);
  border-radius: 50%;
}

.dial-face {
  position: absolute;
  inset: 13px;
  display: grid;
  place-content: center;
  gap: 6px;
  text-align: center;
  border-radius: 50%;
  background: linear-gradient(158deg, #161c19 0%, #0a0e0c 72%);
  box-shadow: inset 0 1px 0 rgba(236, 231, 220, 0.06);
}

.dial-value {
  font-family: 'Instrument Serif', serif;
  font-size: 46px;
  line-height: 1;
  letter-spacing: -0.02em;
}

.dial-label {
  font-size: 9px;
  line-height: 1.5;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--dim);
}

.dial-legend { border-top: 1px solid var(--line); }

.dial-legend div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  padding: 11px 0;
  border-bottom: 1px solid var(--line);
}

.dial-legend span {
  font-size: 9px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--dim);
}

.dial-legend b { font-weight: 500; font-variant-numeric: tabular-nums; }
.dial-legend .is-net { color: var(--jade); }
.dial-legend .is-tax { color: var(--verm); }

/* ---------- work grid ---------- */
.work {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 400px;
  gap: 44px;
  padding: 56px 0;
  border-bottom: 1px solid var(--line);
}

.controls { display: flex; flex-direction: column; gap: 2px; }

.panel {
  padding: 26px 0 30px;
  border-top: 1px solid var(--line);
  animation: rise 0.7s both;
  animation-delay: var(--delay, 0ms);
}

.panel:first-child { border-top: 0; padding-top: 0; }

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.panel-head h2 {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--bone);
}

.panel-note {
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--sand);
}

/* segmented toggles */
.seg { display: flex; border: 1px solid var(--line-2); }

.seg button {
  padding: 6px 13px;
  font: inherit;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--dim);
  background: transparent;
  border: 0;
  border-left: 1px solid var(--line-2);
  cursor: pointer;
  transition: color 0.18s, background 0.18s;
}

.seg button:first-child { border-left: 0; }
.seg button:hover { color: var(--bone); }
.seg button.on { color: var(--ink); background: var(--bone); }
.seg.tall button { padding: 12px 15px; }

/* fields */
.field-row { display: flex; align-items: flex-end; gap: 16px; }
.field-row.split { display: grid; grid-template-columns: 1fr 1fr; align-items: end; }
.field-row + .field-row { margin-top: 20px; }
.field { flex: 1; min-width: 0; display: block; }

.field > span {
  display: block;
  margin-bottom: 9px;
  font-size: 9px;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: var(--dim);
}

.amount {
  display: flex;
  align-items: baseline;
  gap: 7px;
  padding-bottom: 7px;
  border-bottom: 1px solid var(--line-2);
  transition: border-color 0.2s;
}

.amount:focus-within { border-color: var(--sand); }
.amount i { font-style: normal; font-size: 15px; color: var(--dim); }
.amount i.trail { margin-left: auto; }

.amount input {
  flex: 1;
  min-width: 0;
  padding: 0;
  font: inherit;
  font-size: 24px;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
  color: var(--bone);
  background: transparent;
  border: 0;
  outline: none;
}

.amount.slim input { font-size: 14px; }
.amount.slim { padding-bottom: 4px; }
.amount.right input { text-align: right; }

.amount input::-webkit-outer-spin-button,
.amount input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.amount input[type='number'] { -moz-appearance: textfield; }

.hint {
  margin-top: 16px;
  font-size: 11px;
  line-height: 1.7;
  color: var(--dim);
}

/* chips */
.chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 22px; }

.chips button {
  padding: 8px 14px;
  font: inherit;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--dim);
  background: transparent;
  border: 1px solid var(--line-2);
  cursor: pointer;
  transition: all 0.18s;
}

.chips button:hover { color: var(--bone); border-color: var(--bone); }

.chips button.on {
  color: var(--ink);
  background: var(--sand);
  border-color: var(--sand);
}

/* slider */
.slider {
  width: 100%;
  height: 22px;
  margin: 4px 0 24px;
  background: transparent;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
}

.slider::-webkit-slider-runnable-track {
  height: 1px;
  background: var(--line-2);
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 15px;
  height: 15px;
  margin-top: -7px;
  border-radius: 50%;
  background: var(--sand);
  box-shadow: 0 0 0 5px rgba(216, 182, 106, 0.16);
  transition: box-shadow 0.2s;
}

.slider:hover::-webkit-slider-thumb { box-shadow: 0 0 0 8px rgba(216, 182, 106, 0.22); }
.slider::-moz-range-track { height: 1px; background: var(--line-2); }
.slider::-moz-range-thumb { width: 15px; height: 15px; border: 0; border-radius: 50%; background: var(--sand); }
.slider.slim { width: 150px; margin: 0; }

/* brackets */
.preset-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 18px; }

.ghost {
  padding: 7px 13px;
  font: inherit;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--dim);
  background: transparent;
  border: 1px dashed var(--line-2);
  cursor: pointer;
  transition: all 0.18s;
}

.ghost:hover { color: var(--sand); border-color: var(--sand); }
.ghost.wide { width: 100%; margin-top: 12px; }

.rate-line {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--dim);
}

.rate-line input {
  width: 66px;
  padding: 3px 0;
  font: inherit;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--sand);
  text-align: center;
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--line-2);
  outline: none;
}

.bands { width: 100%; border-collapse: collapse; }

.bands th {
  padding-bottom: 9px;
  font-size: 9px;
  font-weight: 400;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-align: left;
  color: var(--dim);
  border-bottom: 1px solid var(--line);
}

.bands th.num, .bands td.num { text-align: right; }
.bands td { padding: 9px 0; border-bottom: 1px solid var(--line); }
.bands td.shrink { width: 30px; text-align: right; }
.bands .band-open { font-size: 13px; color: var(--sand); }

.icon {
  width: 22px;
  height: 22px;
  font: inherit;
  font-size: 15px;
  line-height: 1;
  color: var(--dim);
  background: transparent;
  border: 0;
  cursor: pointer;
  transition: color 0.18s;
}

.icon:hover { color: var(--verm); }

/* ---------- payslip ---------- */
.slip-col { position: relative; }

.slip-wrap {
  position: sticky;
  top: 24px;
  filter: drop-shadow(0 22px 34px rgba(0, 0, 0, 0.5));
  animation: rise 0.8s 0.25s both;
}

.slip {
  padding: 26px 26px 34px;
  color: var(--paper-ink);
  background: var(--paper);
  -webkit-mask:
    linear-gradient(#000 0 0) top / 100% calc(100% - 9px) no-repeat,
    radial-gradient(circle at 50% 100%, transparent 5.5px, #000 6px) bottom / 15px 9px repeat-x;
  mask:
    linear-gradient(#000 0 0) top / 100% calc(100% - 9px) no-repeat,
    radial-gradient(circle at 50% 100%, transparent 5.5px, #000 6px) bottom / 15px 9px repeat-x;
}

.slip-head { display: flex; align-items: flex-start; justify-content: space-between; }

.slip-title {
  font-family: 'Instrument Serif', serif;
  font-size: 25px;
  line-height: 1.1;
}

.slip-sub {
  margin-top: 3px;
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(25, 28, 21, 0.5);
}

.slip-stamp {
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--paper-ink);
  border: 1.5px solid var(--paper-ink);
  border-radius: 3px;
  transform: rotate(3deg);
}

.perf {
  height: 1px;
  margin: 18px 0;
  background: repeating-linear-gradient(90deg, rgba(25, 28, 21, 0.42) 0 4px, transparent 4px 8px);
}

.slip-cols, .slip-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 14px;
  align-items: baseline;
}

.slip-cols {
  margin-bottom: 10px;
  font-size: 8px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(25, 28, 21, 0.45);
}

.slip-cols span:not(:first-child), .slip-row b { min-width: 86px; text-align: right; }

.slip-row {
  padding: 6px 0;
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.slip-row b { font-size: 13px; font-weight: 500; font-variant-numeric: tabular-nums; letter-spacing: 0; }
.slip-row.muted { color: rgba(25, 28, 21, 0.52); }
.slip-row.is-tax { color: #a5391b; }
.slip-row.total { padding: 2px 0 0; }
.slip-row.total span { font-weight: 500; }

.slip-row.total b {
  font-family: 'Instrument Serif', serif;
  font-size: 27px;
  font-weight: 400;
  letter-spacing: -0.01em;
}

.slip-delta {
  display: flex;
  align-items: baseline;
  gap: 7px;
  margin-top: 10px;
  padding: 8px 10px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: #14603c;
  background: rgba(111, 214, 164, 0.2);
}

.slip-delta.down { color: #a5391b; background: rgba(232, 97, 59, 0.16); }
.slip-delta em { margin-left: auto; font-size: 10px; font-style: normal; opacity: 0.72; }

/* composition bars */
.bars { margin-top: 22px; }

.bar-row {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  margin-bottom: 7px;
  font-size: 8px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(25, 28, 21, 0.55);
}

.bar { display: flex; height: 9px; overflow: hidden; background: rgba(25, 28, 21, 0.1); }
.bar i { height: 100%; transition: width 0.45s cubic-bezier(0.2, 0.8, 0.2, 1); }
.seg-net { background: #2f8f63; }
.seg-tax { background: #cb4a25; }
.seg-ded { background: rgba(25, 28, 21, 0.4); }

.bar-key {
  display: flex;
  gap: 14px;
  margin-top: 10px;
  font-size: 8px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(25, 28, 21, 0.55);
}

.bar-key span { display: flex; align-items: center; gap: 5px; }
.bar-key i { width: 8px; height: 8px; }

.slip-foot { margin-top: 22px; border-top: 1px solid rgba(25, 28, 21, 0.22); }

.slip-foot div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px dotted rgba(25, 28, 21, 0.2);
  font-size: 9px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(25, 28, 21, 0.55);
}

.slip-foot div:last-child { border-bottom: 0; }
.slip-foot b { font-size: 12px; font-weight: 500; letter-spacing: 0; color: var(--paper-ink); font-variant-numeric: tabular-nums; }

/* ---------- projection ---------- */
.projection { padding: 56px 0 0; }

.section-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 26px;
}

.section-head h2 {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.years {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 9px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--dim);
}

.years b { color: var(--sand); font-weight: 500; }

.proj-scroll { overflow-x: auto; }
.proj { width: 100%; min-width: 720px; border-collapse: collapse; }

.proj th {
  padding: 0 14px 10px 0;
  font-size: 9px;
  font-weight: 400;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  text-align: left;
  color: var(--dim);
  border-bottom: 1px solid var(--line-2);
}

.proj th.num, .proj td.num { text-align: right; font-variant-numeric: tabular-nums; }
.proj th.growth, .proj td.growth { width: 22%; padding-right: 0; }
.proj td { padding: 13px 14px 13px 0; font-size: 13px; border-bottom: 1px solid var(--line); }
.proj tbody tr { transition: background 0.18s; }
.proj tbody tr:hover { background: rgba(236, 231, 220, 0.04); }
.proj td.tax { color: var(--verm); }
.proj td.net { color: var(--jade); }
.proj td.dim { color: var(--dim); }
.proj td.up { color: var(--jade); }
.proj td.down { color: var(--verm); }

.track { display: block; height: 5px; background: rgba(236, 231, 220, 0.09); }
.track i { display: block; height: 100%; background: linear-gradient(90deg, var(--sand), var(--jade)); transition: width 0.5s cubic-bezier(0.2, 0.8, 0.2, 1); }

.footnote {
  max-width: 78ch;
  margin-top: 26px;
  font-size: 11px;
  line-height: 1.8;
  color: var(--dim);
}

/* ---------- motion ---------- */
@keyframes blip { 50% { opacity: 0.35; } }
@keyframes rise { from { opacity: 0; transform: translateY(20px); } }

/* ---------- responsive ---------- */
@media (max-width: 1080px) {
  .hero { grid-template-columns: 1fr; gap: 44px; }
  .dial-wrap { display: grid; grid-template-columns: 178px minmax(0, 1fr); gap: 34px; align-items: center; }
  .dial { margin-bottom: 0; }
  .work { grid-template-columns: 1fr; gap: 48px; }
  .slip-wrap { position: static; max-width: 420px; }
}

@media (max-width: 620px) {
  .pay-top { height: 58px; }
  .pay-top-meta span:not(.pay-dot) { display: none; }
  .hero { padding-top: 48px; }
  .hero h1 { font-size: clamp(38px, 12vw, 60px); }
  .dial-wrap { grid-template-columns: 1fr; gap: 26px; }
  .field-row, .field-row.split { grid-template-columns: 1fr; flex-direction: column; align-items: stretch; gap: 20px; }
  .amount input { font-size: 20px; }
  .slip { padding: 22px 18px 30px; }
  .slip-cols span:not(:first-child), .slip-row b { min-width: 68px; }
  .slip-row.total b { font-size: 22px; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
</style>
