<script setup lang="ts">
import type { BudgetSettings } from '~/types/budget'

const props = defineProps<{ settings: BudgetSettings }>()
const emit  = defineEmits<{ (e: 'update', p: Partial<BudgetSettings>): void; (e: 'reset'): void }>()

const form = reactive({ ...props.settings })
watch(() => props.settings, v => Object.assign(form, v), { deep: true })

const saved = ref(false)
const save  = () => {
  emit('update', { ...form, dailyBudget: +form.dailyBudget, monthlyBudget: +form.monthlyBudget })
  saved.value = true
  setTimeout(() => saved.value = false, 2000)
}
const confirmReset = ref(false)
</script>

<template>
  <div class="tab-root">
    <header class="tab-header">
      <h2 class="tab-title">Settings</h2>
      <p class="tab-sub">Manage your budget preferences</p>
    </header>

    <div class="settings-grid">
      <!-- Left column -->
      <div class="settings-col">
        <section class="section">
          <div class="section-label">Profile</div>
          <div class="field">
            <label class="fl">Your Name</label>
            <input v-model="form.userName" class="fi" placeholder="What's your name?"/>
          </div>
          <div class="field">
            <label class="fl">Currency Symbol</label>
            <input v-model="form.currency" class="fi" style="max-width:100px" maxlength="3"/>
          </div>
        </section>

        <section class="section">
          <div class="section-label">Budget Limits</div>
          <div class="field">
            <label class="fl">Daily Budget</label>
            <div class="fi-wrap">
              <span class="fi-pre">{{ form.currency }}</span>
              <input v-model.number="form.dailyBudget" type="number" min="1" step="0.01" class="fi fi-pfx"/>
            </div>
            <p class="field-hint">Amount you aim to spend per day</p>
          </div>
          <div class="field">
            <label class="fl">Monthly Budget</label>
            <div class="fi-wrap">
              <span class="fi-pre">{{ form.currency }}</span>
              <input v-model.number="form.monthlyBudget" type="number" min="1" step="1" class="fi fi-pfx"/>
            </div>
            <p class="field-hint">Total monthly spending limit</p>
          </div>
        </section>
      </div>

      <!-- Right column -->
      <div class="settings-col">
        <section class="section info-section">
          <div class="section-label">About</div>
          <div class="info-row"><span class="info-k">Daily Budget</span><span class="info-v" style="color:#34d399">{{ form.currency }}{{ form.dailyBudget }}</span></div>
          <div class="info-row"><span class="info-k">Monthly Budget</span><span class="info-v" style="color:var(--indigo)">{{ form.currency }}{{ form.monthlyBudget }}</span></div>
          <div class="info-row"><span class="info-k">Daily ÷ Monthly</span><span class="info-v" style="color:var(--text2)">{{ ((form.dailyBudget / Math.max(form.monthlyBudget,1))*100).toFixed(1) }}%</span></div>
        </section>

        <section class="section danger-section">
          <div class="section-label" style="color:#f87171">Danger Zone</div>
          <p class="danger-p">Permanently deletes all expense history and resets rewards data. This cannot be undone.</p>
          <div v-if="!confirmReset">
            <button class="danger-btn" @click="confirmReset = true">Reset All Data</button>
          </div>
          <div v-else>
            <p class="confirm-q">Are you absolutely sure?</p>
            <div class="confirm-row">
              <button class="danger-btn" @click="emit('reset'); confirmReset = false">Yes, Reset Everything</button>
              <button class="cancel-btn" @click="confirmReset = false">Cancel</button>
            </div>
          </div>
        </section>
      </div>
    </div>

    <button class="save-btn" @click="save">
      {{ saved ? '✓ Saved!' : 'Save Changes' }}
    </button>

    <div class="bottom-pad"/>
  </div>
</template>

<style scoped>
.tab-root   { display: flex; flex-direction: column; gap: 14px; }
.tab-header { padding: 24px 0 4px; }
.tab-title  { font-size: 26px; font-weight: 800; color: var(--text); letter-spacing: -.5px; }
.tab-sub    { font-size: 13px; color: var(--text3); margin-top: 3px; }

/* Mobile: stacked columns */
.settings-grid { display: flex; flex-direction: column; gap: 14px; }
.settings-col  { display: flex; flex-direction: column; gap: 14px; }

.section { background: var(--card-bg); border: 1px solid var(--card-border); border-top-color: var(--card-border-top); box-shadow: var(--card-shadow); border-radius: var(--card-radius); padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.danger-section { border-color: rgba(248,113,113,.2); }
.info-section   { background: rgba(129,140,248,.04); border-color: rgba(129,140,248,.15); }
.section-label  { font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: .08em; }

.field { display: flex; flex-direction: column; gap: 6px; }
.fl    { font-size: 13px; font-weight: 500; color: var(--text2); }
.field-hint { font-size: 11px; color: var(--text3); margin-top: 2px; }
.fi    {
  background: var(--surface2); border: 1px solid var(--border2); border-radius: 10px;
  padding: 11px 14px; color: var(--text); font-size: 15px; outline: none; width: 100%;
}
.fi:focus { border-color: rgba(129,140,248,.45); }
.fi-wrap  { position: relative; }
.fi-pre   { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text3); font-size: 15px; }
.fi-pfx   { padding-left: 28px; }

.info-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border); }
.info-row:last-child { border-bottom: none; }
.info-k   { font-size: 13px; color: var(--text3); }
.info-v   { font-size: 15px; font-weight: 700; font-variant-numeric: tabular-nums; }

.danger-p   { font-size: 13px; color: var(--text3); line-height: 1.5; }
.confirm-q  { font-size: 13px; color: #f87171; margin-bottom: 10px; font-weight: 700; }
.confirm-row { display: flex; gap: 8px; }
.danger-btn {
  width: 100%; padding: 11px; border-radius: 10px; border: 1px solid rgba(248,113,113,.3);
  background: rgba(248,113,113,.1); color: #f87171; font-size: 14px; font-weight: 700; cursor: pointer; transition: background .15s;
}
.danger-btn:hover { background: rgba(248,113,113,.18); }
.cancel-btn {
  flex: 1; padding: 11px; border-radius: 10px; border: 1px solid var(--border2);
  background: var(--surface2); color: var(--text2); font-size: 14px; font-weight: 700; cursor: pointer;
}

.save-btn {
  width: 100%; padding: 15px; border-radius: var(--card-radius); border: none;
  background: var(--grad); color: #fff; font-size: 15px; font-weight: 700;
  cursor: pointer; transition: opacity .2s, transform .15s;
}
.save-btn:active { transform: scale(.99); opacity: .9; }

.bottom-pad { height: 88px; }

@media (min-width: 1024px) {
  .settings-grid { flex-direction: row; align-items: start; }
  .settings-col  { flex: 1; }
  .save-btn      { max-width: 320px; }
  .bottom-pad    { height: 40px; }
}
</style>
