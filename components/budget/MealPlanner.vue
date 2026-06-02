<script setup lang="ts">
import { gsap } from 'gsap'
import { useBudgetStore } from '~/stores/budget'
import { useExpenseStore } from '~/stores/expenses'
import { useCategories } from '~/composables/useCategories'

const props = defineProps<{ currency: string }>()

const budgetStore  = useBudgetStore()
const expenseStore = useExpenseStore()
const { getCategoryById } = useCategories()

const { mealPresets } = storeToRefs(budgetStore)
const { todayExpenses } = storeToRefs(expenseStore)

// Track which presets are "just logged" for animation
const justLogged = ref<Record<string, boolean>>({})
// Track editing state per preset
const editing = ref<Record<string, boolean>>({})
const editVal = ref<Record<string, string>>({})

// How many times each preset was logged today
const loggedCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const e of todayExpenses.value) {
    const preset = mealPresets.value.find(p => e.notes === p.name && e.categoryId === p.categoryId)
    if (preset) counts[preset.id] = (counts[preset.id] || 0) + 1
  }
  return counts
})

// Total spent today from presets
const presetTotalToday = computed(() =>
  todayExpenses.value
    .filter(e => mealPresets.value.some(p => e.notes === p.name && e.categoryId === p.categoryId))
    .reduce((s, e) => s + e.amount, 0)
)

// Projected daily total if all presets logged once
const dailyPresetTotal = computed(() =>
  mealPresets.value.reduce((s, p) => s + p.amount, 0)
)

// Monthly projection from presets
const monthlyPresetTotal = computed(() => {
  const now = new Date()
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return dailyPresetTotal.value * days
})

const logPreset = async (presetId: string) => {
  const preset = mealPresets.value.find(p => p.id === presetId)
  if (!preset) return

  expenseStore.addExpense({
    amount: preset.amount,
    categoryId: preset.categoryId,
    notes: preset.name,
    createdAt: new Date().toISOString(),
  })

  justLogged.value[presetId] = true
  setTimeout(() => { justLogged.value[presetId] = false }, 1400)
}

const startEdit = (preset: { id: string; amount: number }) => {
  editing.value[preset.id] = true
  editVal.value[preset.id] = String(preset.amount)
  nextTick(() => {
    const el = document.getElementById(`edit-${preset.id}`)
    el?.focus()
    el?.select()
  })
}

const commitEdit = (id: string) => {
  const v = parseFloat(editVal.value[id] || '0')
  if (!isNaN(v) && v >= 0) budgetStore.updatePresetAmount(id, +v.toFixed(2))
  editing.value[id] = false
}
</script>

<template>
  <div class="card">
    <!-- Header -->
    <div class="head">
      <div>
        <div class="title">Daily Meal Planner</div>
        <div class="sub">Tap to log · tap amount to edit</div>
      </div>
      <div class="head-stats">
        <div class="stat-chip">
          <span class="sc-label">Today</span>
          <span class="sc-val green">{{ currency }}{{ presetTotalToday.toFixed(2) }}</span>
        </div>
        <div class="stat-chip">
          <span class="sc-label">Monthly est.</span>
          <span class="sc-val indigo">{{ currency }}{{ monthlyPresetTotal.toFixed(0) }}</span>
        </div>
      </div>
    </div>

    <!-- Preset grid -->
    <div class="presets">
      <div v-for="preset in mealPresets" :key="preset.id"
           class="preset"
           :class="{
             'preset--logged': justLogged[preset.id],
             'preset--done': (loggedCounts[preset.id] || 0) > 0,
           }"
           :style="{ '--cat-color': getCategoryById(preset.categoryId).color }">

        <!-- Count badge -->
        <div v-if="(loggedCounts[preset.id] || 0) > 0" class="count-badge">
          {{ loggedCounts[preset.id] }}×
        </div>

        <!-- Icon -->
        <div class="preset-icon">{{ preset.icon }}</div>

        <!-- Name -->
        <div class="preset-name">{{ preset.name }}</div>

        <!-- Editable amount -->
        <div class="amount-wrap" @click.stop="startEdit(preset)">
          <template v-if="editing[preset.id]">
            <span class="amount-cur">{{ currency }}</span>
            <input
              :id="`edit-${preset.id}`"
              v-model="editVal[preset.id]"
              class="amount-input"
              type="number" min="0" step="0.25"
              @blur="commitEdit(preset.id)"
              @keydown.enter="commitEdit(preset.id)"
              @keydown.escape="editing[preset.id] = false"
              @click.stop
            />
          </template>
          <template v-else>
            <span class="amount-display">{{ currency }}{{ preset.amount.toFixed(2) }}</span>
            <span class="edit-hint">✎</span>
          </template>
        </div>

        <!-- Log button -->
        <button class="log-btn" @click="logPreset(preset.id)">
          <span v-if="justLogged[preset.id]" class="log-check">✓</span>
          <span v-else>+ Log</span>
        </button>
      </div>
    </div>

    <!-- Footer summary -->
    <div class="footer">
      <div class="footer-row">
        <span class="footer-label">Daily preset total</span>
        <span class="footer-val">{{ currency }}{{ dailyPresetTotal.toFixed(2) }} / day</span>
      </div>
      <div class="footer-row">
        <span class="footer-label">Projected this month</span>
        <span class="footer-val indigo">{{ currency }}{{ monthlyPresetTotal.toFixed(2) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  background: var(--card-bg); border-radius: var(--card-radius);
  border: 1px solid var(--card-border); border-top-color: var(--card-border-top);
  box-shadow: var(--card-shadow); padding: 20px;
}

/* Header */
.head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 18px; flex-wrap: wrap; }
.title { font-size: 15px; font-weight: 800; color: var(--text); letter-spacing: -.2px; }
.sub   { font-size: 11px; color: var(--text3); margin-top: 2px; font-weight: 500; }
.head-stats { display: flex; gap: 8px; flex-shrink: 0; }
.stat-chip { display: flex; flex-direction: column; align-items: flex-end; background: rgba(255,255,255,.04); border: 1px solid var(--border); border-radius: 10px; padding: 6px 10px; }
.sc-label { font-size: 9px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: .06em; }
.sc-val   { font-size: 13px; font-weight: 900; margin-top: 1px; font-variant-numeric: tabular-nums; }
.green  { color: #34d399; }
.indigo { color: var(--indigo); }

/* Presets grid */
.presets {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.preset {
  position: relative;
  display: flex; flex-direction: column; align-items: center; gap: 5px;
  padding: 12px 8px 10px;
  background: rgba(255,255,255,.03);
  border: 1px solid var(--border);
  border-radius: 14px;
  transition: all .2s;
  cursor: default;
}
.preset--done {
  border-color: rgba(var(--cat-color-raw, 129,140,248), .25);
  background: rgba(255,255,255,.05);
}
.preset--logged {
  transform: scale(.96);
  border-color: #34d399 !important;
  background: rgba(52,211,153,.08) !important;
}

.count-badge {
  position: absolute; top: 6px; right: 6px;
  font-size: 9px; font-weight: 900; color: var(--cat-color, var(--indigo));
  background: rgba(255,255,255,.08); border-radius: 20px; padding: 1px 5px;
}

.preset-icon { font-size: 22px; line-height: 1; }
.preset-name { font-size: 11px; font-weight: 700; color: var(--text2); text-align: center; }

/* Amount */
.amount-wrap {
  display: flex; align-items: center; gap: 1px;
  cursor: pointer; padding: 3px 7px; border-radius: 8px;
  transition: background .15s;
}
.amount-wrap:hover { background: rgba(255,255,255,.07); }
.amount-display { font-size: 14px; font-weight: 900; color: var(--cat-color, var(--text)); font-variant-numeric: tabular-nums; }
.amount-cur     { font-size: 12px; color: var(--text3); }
.edit-hint      { font-size: 9px; color: var(--text3); margin-left: 2px; opacity: .5; }
.amount-input {
  width: 48px; font-size: 14px; font-weight: 900; font-variant-numeric: tabular-nums;
  background: transparent; border: none; outline: none;
  color: var(--indigo); font-family: inherit;
  text-align: center;
}

/* Log button */
.log-btn {
  width: 100%; padding: 6px 4px; border-radius: 9px; border: none;
  background: rgba(255,255,255,.06); color: var(--text2);
  font-size: 11px; font-weight: 800; font-family: inherit;
  cursor: pointer; transition: all .15s; letter-spacing: .02em;
}
.log-btn:hover { background: rgba(129,140,248,.2); color: var(--indigo); }
.log-btn:active { transform: scale(.94); }
.log-check { color: #34d399; }

/* Footer */
.footer { border-top: 1px solid var(--border); padding-top: 12px; display: flex; flex-direction: column; gap: 6px; }
.footer-row { display: flex; justify-content: space-between; align-items: center; }
.footer-label { font-size: 12px; color: var(--text3); font-weight: 500; }
.footer-val   { font-size: 13px; font-weight: 800; color: var(--text2); font-variant-numeric: tabular-nums; }
.footer-val.indigo { color: var(--indigo); }

@media (min-width: 480px) {
  .presets { grid-template-columns: repeat(3, 1fr); }
}
@media (min-width: 1024px) {
  .presets { grid-template-columns: repeat(6, 1fr); }
}
</style>
