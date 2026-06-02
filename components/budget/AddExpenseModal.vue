<script setup lang="ts">
import { gsap } from 'gsap'
import { DEFAULT_CATEGORIES } from '~/composables/useCategories'

const props = defineProps<{ currency: string }>()
const emit  = defineEmits<{
  (e: 'close'): void
  (e: 'add', d: { amount: number; categoryId: string; notes: string; createdAt: string }): void
}>()

const overlayEl = ref<HTMLElement | null>(null)
const panelEl   = ref<HTMLElement | null>(null)

const amount   = ref('')
const category = ref('food')
const notes    = ref('')

const display   = computed(() => amount.value ? parseFloat(amount.value).toFixed(2) : '0.00')
const canSubmit = computed(() => parseFloat(amount.value || '0') > 0)

const append = (d: string) => {
  if (d === '.' && amount.value.includes('.')) return
  if (amount.value.includes('.') && amount.value.split('.')[1]!.length >= 2) return
  amount.value += d
}
const back   = () => { amount.value = amount.value.slice(0, -1) }
const quick  = (v: number) => { amount.value = String(v) }
const submit = () => {
  if (!canSubmit.value) return
  emit('add', { amount: parseFloat(amount.value), categoryId: category.value, notes: notes.value.trim(), createdAt: new Date().toISOString() })
  animOut()
}
const animIn  = () => {
  gsap.fromTo(overlayEl.value, { opacity: 0 }, { opacity: 1, duration: .2 })
  gsap.fromTo(panelEl.value,   { y: 80 },      { y: 0, duration: .35, ease: 'power3.out' })
}
const animOut = () => {
  gsap.to(overlayEl.value, { opacity: 0, duration: .2 })
  gsap.to(panelEl.value,   { y: 80, duration: .25, ease: 'power2.in', onComplete: () => emit('close') })
}
onMounted(animIn)
</script>

<template>
  <div class="overlay" ref="overlayEl" @click.self="animOut">
    <div class="panel" ref="panelEl">
      <div class="handle"/>

      <div class="amount-row">
        <span class="cur">{{ currency }}</span>
        <span class="amt" :class="{ 'amt--on': canSubmit }">{{ display }}</span>
      </div>

      <div class="quick-row">
        <button v-for="q in [1,2,5,10]" :key="q" class="quick" @click="quick(q)">+{{ currency }}{{ q }}</button>
      </div>

      <div class="cat-grid">
        <button v-for="cat in DEFAULT_CATEGORIES" :key="cat.id"
                class="cat" :class="{ 'cat--on': category === cat.id }"
                :style="category === cat.id ? { background: cat.bgColor, borderColor: cat.color, boxShadow: `0 0 16px ${cat.color}30` } : {}"
                @click="category = cat.id">
          <span class="cat-em">{{ cat.icon }}</span>
          <span class="cat-lbl" :style="{ color: category === cat.id ? cat.color : '' }">{{ cat.name }}</span>
        </button>
      </div>

      <input v-model="notes" class="notes" placeholder="Add a note (optional)" maxlength="60"/>

      <div class="numpad">
        <button v-for="k in ['1','2','3','4','5','6','7','8','9','.','0','⌫']"
                :key="k" class="key" @click="k === '⌫' ? back() : append(k)">{{ k }}</button>
      </div>

      <button class="submit" :class="{ 'submit--on': canSubmit }" :disabled="!canSubmit" @click="submit">
        <span v-if="canSubmit">Add Expense · {{ currency }}{{ display }}</span>
        <span v-else>Enter an amount</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(0,0,0,.8); backdrop-filter: blur(10px);
  display: flex; align-items: flex-end;
}
.panel {
  width: 100%; max-width: 480px; margin: 0 auto;
  background: linear-gradient(160deg, #13132e 0%, #0b0b20 100%);
  border: 1px solid rgba(255,255,255,0.1); border-top-color: rgba(255,255,255,0.18);
  border-bottom: none; border-radius: 26px 26px 0 0;
  padding: 8px 18px 32px;
  max-height: 92dvh; overflow-y: auto;
  box-shadow: 0 -8px 60px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.08);
}
.handle { width: 36px; height: 4px; background: rgba(255,255,255,.12); border-radius: 2px; margin: 0 auto 20px; }

.amount-row { display: flex; align-items: baseline; justify-content: center; gap: 4px; margin-bottom: 14px; }
.cur { font-size: 28px; color: var(--text3); font-weight: 300; }
.amt { font-size: 58px; font-weight: 900; color: var(--text3); letter-spacing: -3px; line-height: 1; font-variant-numeric: tabular-nums; transition: color .2s; }
.amt--on { color: var(--text); }

.quick-row { display: flex; gap: 8px; justify-content: center; margin-bottom: 16px; }
.quick {
  padding: 5px 14px; border-radius: 20px; border: 1px solid var(--border2);
  background: rgba(255,255,255,.04); color: var(--text2); font-size: 12px; font-weight: 700;
  cursor: pointer; font-family: inherit; transition: all .15s;
}
.quick:hover { background: rgba(129,140,248,.15); color: var(--indigo); border-color: rgba(129,140,248,.3); }

.cat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 7px; margin-bottom: 14px; }
.cat {
  display: flex; flex-direction: column; align-items: center; padding: 9px 4px;
  border-radius: 14px; border: 1px solid var(--border); background: rgba(255,255,255,.03);
  cursor: pointer; font-family: inherit; transition: all .15s;
}
.cat:active { transform: scale(.93); }
.cat-em  { font-size: 20px; margin-bottom: 4px; }
.cat-lbl { font-size: 10px; font-weight: 700; color: var(--text3); transition: color .15s; }

.notes {
  width: 100%; background: rgba(255,255,255,.04); border: 1px solid var(--border2);
  border-radius: 12px; padding: 10px 14px; color: var(--text); font-size: 14px; font-weight: 500;
  outline: none; margin-bottom: 14px; font-family: inherit;
}
.notes::placeholder { color: var(--text3); }
.notes:focus { border-color: rgba(129,140,248,.4); }

.numpad { display: grid; grid-template-columns: repeat(3,1fr); gap: 7px; margin-bottom: 14px; }
.key {
  padding: 16px; border-radius: 14px; border: none;
  background: rgba(255,255,255,.05); color: var(--text);
  font-size: 20px; font-weight: 700; font-family: inherit;
  cursor: pointer; transition: background .1s, transform .1s;
  box-shadow: 0 2px 8px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.06);
}
.key:active { background: rgba(255,255,255,.1); transform: scale(.93); }

.submit {
  width: 100%; padding: 16px; border-radius: 16px; border: none;
  background: rgba(255,255,255,.05); color: var(--text3);
  font-size: 16px; font-weight: 800; font-family: inherit;
  cursor: not-allowed; transition: all .2s; letter-spacing: -.2px;
}
.submit--on {
  background: var(--grad); color: #fff; cursor: pointer;
  box-shadow: 0 4px 24px rgba(99,102,241,.45);
}
.submit--on:active { transform: scale(.98); }
</style>
