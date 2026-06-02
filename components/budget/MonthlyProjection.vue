<script setup lang="ts">
import { useBudgetStore }  from '~/stores/budget'
import { useCategories }   from '~/composables/useCategories'

const props = defineProps<{ currency: string }>()

const budgetStore = useBudgetStore()
const { getCategoryById, categories } = useCategories()
const { settings, mealPresets } = storeToRefs(budgetStore)

const now         = new Date()
const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

// ── Extra (non-meal) daily amounts ──────────────────────────────────────────
const EXTRA_KEY = 'bp_proj_extra'
const extra = ref<Record<string, string>>({})
const activeExtra = ref<string[]>([])

if (process.client) {
  try {
    const saved = localStorage.getItem(EXTRA_KEY)
    if (saved) {
      const d = JSON.parse(saved)
      extra.value       = d.extra       || {}
      activeExtra.value = d.activeExtra || []
    }
  } catch {}
  watch([extra, activeExtra], () => {
    localStorage.setItem(EXTRA_KEY, JSON.stringify({ extra: extra.value, activeExtra: activeExtra.value }))
  }, { deep: true })
}

// Categories NOT already covered by meal presets
const mealCatIds = computed(() => new Set(mealPresets.value.map(p => p.categoryId)))
const extraCategories = computed(() =>
  categories.filter(c =>
    activeExtra.value.includes(c.id) ||
    (parseFloat(extra.value[c.id] || '0') > 0 && !mealCatIds.value.has(c.id))
  )
)
const hiddenCategories = computed(() =>
  categories.filter(c => !activeExtra.value.includes(c.id) && !mealCatIds.value.has(c.id))
)

const getExtraVal = (id: string) => {
  const n = parseFloat(extra.value[id] || '0')
  return isNaN(n) ? 0 : n
}
const removeExtra = (id: string) => {
  activeExtra.value = activeExtra.value.filter(c => c !== id)
  delete extra.value[id]
}

// ── Totals ───────────────────────────────────────────────────────────────────
const mealsDailyTotal = computed(() => mealPresets.value.reduce((s, p) => s + p.amount, 0))
const extraDailyTotal = computed(() => extraCategories.value.reduce((s, c) => s + getExtraVal(c.id), 0))
const totalPerDay     = computed(() => mealsDailyTotal.value + extraDailyTotal.value)
const totalPerMonth   = computed(() => totalPerDay.value * daysInMonth)

const pct      = computed(() => settings.value.monthlyBudget > 0 ? Math.min((totalPerMonth.value / settings.value.monthlyBudget) * 100, 100) : 0)
const barColor = computed(() => pct.value >= 100 ? '#f87171' : pct.value >= 85 ? '#fb923c' : pct.value >= 60 ? '#fbbf24' : '#34d399')
const gap      = computed(() => settings.value.monthlyBudget - totalPerMonth.value)
</script>

<template>
  <div class="card">
    <!-- Header -->
    <div class="head">
      <div>
        <div class="title">Monthly Projection</div>
        <div class="sub">{{ daysInMonth }} days · edit amounts to see your projection</div>
      </div>
    </div>

    <!-- ── Meals section ── -->
    <div class="section">
      <div class="section-label">🍽 Meals &amp; Drinks</div>
      <div class="rows">
        <div v-for="preset in mealPresets" :key="preset.id" class="row">
          <div class="row-cat">
            <span class="row-em">{{ preset.icon }}</span>
            <span class="row-name">{{ preset.name }}</span>
          </div>
          <div class="row-input-wrap" :style="{ '--c': getCategoryById(preset.categoryId).color }">
            <span class="row-cur">{{ currency }}</span>
            <input
              class="row-input"
              type="number" min="0" step="0.25"
              :value="preset.amount"
              @change="budgetStore.updatePresetAmount(preset.id, +($event.target as HTMLInputElement).value)"
              @input="budgetStore.updatePresetAmount(preset.id, +($event.target as HTMLInputElement).value)"
            />
            <span class="row-unit">/day</span>
          </div>
          <div class="row-result" :style="{ color: getCategoryById(preset.categoryId).color }">
            {{ currency }}{{ (preset.amount * daysInMonth).toFixed(2) }}
            <span class="row-mo">/mo</span>
          </div>
        </div>
      </div>
      <!-- Meals subtotal -->
      <div class="subtotal">
        <span class="subtotal-label">Meals &amp; drinks subtotal</span>
        <span class="subtotal-val">{{ currency }}{{ (mealsDailyTotal * daysInMonth).toFixed(2) }}/mo</span>
      </div>
    </div>

    <!-- ── Other spending section ── -->
    <div class="section" v-if="extraCategories.length > 0 || hiddenCategories.length > 0">
      <div class="section-label">🗂 Other Spending</div>
      <div class="rows" v-if="extraCategories.length">
        <div v-for="cat in extraCategories" :key="cat.id" class="row">
          <div class="row-cat">
            <span class="row-em">{{ cat.icon }}</span>
            <span class="row-name">{{ cat.name }}</span>
          </div>
          <div class="row-input-wrap" :style="{ '--c': cat.color }">
            <span class="row-cur">{{ currency }}</span>
            <input
              class="row-input"
              type="number" min="0" step="0.25"
              :value="extra[cat.id] || ''"
              placeholder="0.00"
              @input="extra[cat.id] = ($event.target as HTMLInputElement).value"
            />
            <span class="row-unit">/day</span>
          </div>
          <div class="row-result" :style="{ color: getExtraVal(cat.id) > 0 ? cat.color : 'var(--text3)' }">
            {{ currency }}{{ (getExtraVal(cat.id) * daysInMonth).toFixed(2) }}
            <span class="row-mo">/mo</span>
          </div>
          <button class="row-remove" @click="removeExtra(cat.id)">×</button>
        </div>
      </div>

      <!-- Add extra category chips -->
      <div class="add-row" v-if="hiddenCategories.length">
        <span class="add-label">+ Add:</span>
        <div class="add-chips">
          <button v-for="cat in hiddenCategories" :key="cat.id"
                  class="add-chip" @click="activeExtra.push(cat.id)">
            {{ cat.icon }} {{ cat.name }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── Grand total equation ── -->
    <div class="equation-card">
      <div class="eq-breakdown">
        <div class="eq-part">
          <span class="eq-label">Meals</span>
          <span class="eq-val orange">{{ currency }}{{ mealsDailyTotal.toFixed(2) }}/day</span>
        </div>
        <span v-if="extraDailyTotal > 0" class="eq-plus">+</span>
        <div v-if="extraDailyTotal > 0" class="eq-part">
          <span class="eq-label">Other</span>
          <span class="eq-val indigo">{{ currency }}{{ extraDailyTotal.toFixed(2) }}/day</span>
        </div>
        <span class="eq-plus">=</span>
        <div class="eq-part">
          <span class="eq-label">Total</span>
          <span class="eq-val white">{{ currency }}{{ totalPerDay.toFixed(2) }}/day</span>
        </div>
      </div>
      <div class="eq-main">
        <span class="eq-daily">{{ currency }}{{ totalPerDay.toFixed(2) }}</span>
        <span class="eq-x">× {{ daysInMonth }} days</span>
        <span class="eq-equals">=</span>
        <span class="eq-result" :style="{ color: barColor }">{{ currency }}{{ totalPerMonth.toFixed(2) }}</span>
      </div>
    </div>

    <!-- ── vs Monthly budget ── -->
    <div class="vs">
      <div class="vs-labels">
        <span>Projected: <strong :style="{ color: barColor }">{{ currency }}{{ totalPerMonth.toFixed(2) }}</strong></span>
        <span style="color:var(--text3)">Budget: {{ currency }}{{ settings.monthlyBudget }}</span>
      </div>
      <div class="vs-track">
        <div class="vs-fill" :style="{ width: pct + '%', background: barColor }"/>
      </div>
      <div class="vs-note" :style="{ color: barColor }">
        {{ gap >= 0
          ? `${currency}${gap.toFixed(2)} under your monthly budget`
          : `${currency}${Math.abs(gap).toFixed(2)} over your monthly budget` }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  background: var(--card-bg); border-radius: var(--card-radius);
  border: 1px solid var(--card-border); border-top-color: var(--card-border-top);
  box-shadow: var(--card-shadow); padding: 20px;
  display: flex; flex-direction: column; gap: 16px;
}

/* Header */
.head  { display: flex; align-items: flex-start; justify-content: space-between; }
.title { font-size: 15px; font-weight: 800; color: var(--text); letter-spacing: -.2px; }
.sub   { font-size: 12px; color: var(--text3); margin-top: 3px; font-weight: 500; }

/* Section */
.section       { display: flex; flex-direction: column; gap: 8px; }
.section-label { font-size: 11px; font-weight: 800; color: var(--text3); text-transform: uppercase; letter-spacing: .08em; }

/* Rows */
.rows { display: flex; flex-direction: column; gap: 6px; }

.row {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 12px; border-radius: 12px;
  background: rgba(255,255,255,.03); border: 1px solid var(--border);
  transition: border-color .15s;
}
.row:focus-within { border-color: rgba(129,140,248,.3); background: rgba(129,140,248,.04); }

.row-cat  { display: flex; align-items: center; gap: 7px; flex: 1; min-width: 0; }
.row-em   { font-size: 18px; line-height: 1; flex-shrink: 0; }
.row-name { font-size: 13px; font-weight: 700; color: var(--text); }

.row-input-wrap {
  display: flex; align-items: center; gap: 2px;
  background: rgba(255,255,255,.06); border: 1px solid var(--border2);
  border-radius: 9px; padding: 5px 8px; flex-shrink: 0;
}
.row:focus-within .row-input-wrap { border-color: var(--c, rgba(129,140,248,.5)); }
.row-cur   { font-size: 12px; color: var(--text3); font-weight: 600; }
.row-unit  { font-size: 10px; color: var(--text3); font-weight: 600; white-space: nowrap; }
.row-input {
  width: 52px; background: transparent; border: none; outline: none;
  font-size: 15px; font-weight: 900; color: var(--text); text-align: center;
  font-family: inherit; font-variant-numeric: tabular-nums;
}
.row-input::placeholder { color: var(--text3); font-weight: 500; font-size: 13px; }

.row-result {
  font-size: 13px; font-weight: 900; font-variant-numeric: tabular-nums;
  min-width: 76px; text-align: right; flex-shrink: 0;
}
.row-mo { font-size: 10px; opacity: .7; font-weight: 600; }

.row-remove {
  font-size: 14px; color: var(--text3); background: transparent; border: none;
  cursor: pointer; padding: 2px 5px; border-radius: 6px; flex-shrink: 0;
  transition: color .15s, background .15s;
}
.row-remove:hover { color: #f87171; background: rgba(248,113,113,.1); }

/* Subtotal */
.subtotal {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 12px; border-radius: 10px;
  background: rgba(249,115,22,.07); border: 1px solid rgba(249,115,22,.15);
}
.subtotal-label { font-size: 12px; font-weight: 700; color: var(--text3); }
.subtotal-val   { font-size: 14px; font-weight: 900; color: #fb923c; font-variant-numeric: tabular-nums; }

/* Add extra */
.add-row   { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.add-label { font-size: 11px; font-weight: 700; color: var(--text3); white-space: nowrap; }
.add-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.add-chip  {
  font-size: 11px; font-weight: 700; color: var(--text3);
  background: rgba(255,255,255,.04); border: 1px solid var(--border);
  padding: 4px 9px; border-radius: 20px; cursor: pointer; font-family: inherit;
  transition: all .15s;
}
.add-chip:hover { color: var(--text); border-color: var(--border2); background: rgba(255,255,255,.08); }

/* Equation card */
.equation-card {
  background: rgba(255,255,255,.03); border: 1px solid var(--border);
  border-radius: 14px; padding: 14px 16px;
  display: flex; flex-direction: column; gap: 10px;
}
.eq-breakdown { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.eq-part  { display: flex; flex-direction: column; }
.eq-label { font-size: 9px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 2px; }
.eq-val   { font-size: 14px; font-weight: 900; font-variant-numeric: tabular-nums; }
.eq-val.orange { color: #fb923c; }
.eq-val.indigo { color: var(--indigo); }
.eq-val.white  { color: var(--text); }
.eq-plus { font-size: 16px; font-weight: 700; color: var(--text3); margin-top: 12px; }

.eq-main {
  display: flex; align-items: baseline; gap: 8px;
  border-top: 1px solid var(--border); padding-top: 10px; flex-wrap: wrap;
}
.eq-daily  { font-size: 22px; font-weight: 900; color: var(--text); font-variant-numeric: tabular-nums; }
.eq-x      { font-size: 14px; font-weight: 700; color: var(--text3); }
.eq-equals { font-size: 18px; font-weight: 700; color: var(--text3); }
.eq-result { font-size: 30px; font-weight: 900; font-variant-numeric: tabular-nums; letter-spacing: -1px; }

/* vs Budget */
.vs        { display: flex; flex-direction: column; gap: 6px; }
.vs-labels { display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; color: var(--text2); }
.vs-track  { height: 8px; background: rgba(255,255,255,.06); border-radius: 4px; overflow: hidden; }
.vs-fill   { height: 100%; border-radius: 4px; transition: width .5s ease; }
.vs-note   { font-size: 12px; font-weight: 700; }
</style>
