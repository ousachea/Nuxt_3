<script setup lang="ts">
import type { Expense } from '~/types/budget'
import { useCategories } from '~/composables/useCategories'

const props = defineProps<{ expenses: Expense[]; currency: string }>()
const emit  = defineEmits<{ (e: 'delete', id: string): void }>()

const { getCategoryById } = useCategories()
const search = ref('')

const filtered = computed(() =>
  props.expenses.filter(e => {
    const q = search.value.toLowerCase()
    return !q || getCategoryById(e.categoryId).name.toLowerCase().includes(q) || e.notes.toLowerCase().includes(q)
  })
)

const grouped = computed(() => {
  const g: Record<string, Expense[]> = {}
  for (const e of filtered.value) {
    const k = new Date(e.createdAt).toDateString()
    ;(g[k] ??= []).push(e)
  }
  return g
})

const groupLabel = (k: string) => {
  const today = new Date().toDateString()
  const yest  = new Date(); yest.setDate(yest.getDate() - 1)
  return k === today ? 'Today' : k === yest.toDateString() ? 'Yesterday'
    : new Date(k).toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })
}

const fmt = (iso: string) => new Date(iso).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: true })
</script>

<template>
  <div class="tab-root">
    <header class="tab-header">
      <div>
        <h2 class="tab-title">Expenses</h2>
        <p class="tab-sub">{{ expenses.length }} total transactions</p>
      </div>
    </header>

    <div class="search-wrap">
      <span class="search-icon">🔍</span>
      <input v-model="search" class="search" placeholder="Search by category or note…"/>
    </div>

    <div v-if="!expenses.length" class="empty-full">
      <div class="empty-em">🍃</div>
      <p class="empty-title">No expenses yet</p>
      <p class="empty-sub">Tap the + button to log your first one</p>
    </div>

    <template v-for="(exps, dk) in grouped" :key="dk">
      <div class="group-header">
        <span class="group-label">{{ groupLabel(dk) }}</span>
        <span class="group-total">{{ currency }}{{ exps.reduce((s,e) => s+e.amount,0).toFixed(2) }}</span>
      </div>
      <div class="group-card">
        <div v-for="e in exps" :key="e.id" class="row group">
          <div class="cat-icon" :style="{ background: getCategoryById(e.categoryId).bgColor }">
            {{ getCategoryById(e.categoryId).icon }}
          </div>
          <div class="row-info">
            <span class="row-name">{{ getCategoryById(e.categoryId).name }}</span>
            <span class="row-meta">{{ fmt(e.createdAt) }}{{ e.notes ? ' · '+e.notes : '' }}</span>
          </div>
          <div class="row-right">
            <span class="row-amt" :style="{ color: getCategoryById(e.categoryId).color }">
              -{{ currency }}{{ e.amount.toFixed(2) }}
            </span>
            <button class="del" @click="emit('delete', e.id)">✕</button>
          </div>
        </div>
      </div>
    </template>

    <div style="height:88px"/>
  </div>
</template>

<style scoped>
.tab-root  { display: flex; flex-direction: column; gap: 10px; }
.tab-header { padding: 20px 0 4px; }
.tab-title  { font-size: 24px; font-weight: 800; color: var(--text); letter-spacing: -.5px; }
.tab-sub    { font-size: 13px; color: var(--text3); margin-top: 2px; }
.search-wrap { position: relative; }
.search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 14px; }
.search {
  width: 100%; background: var(--card-bg); border: 1px solid var(--card-border); border-top-color: var(--card-border-top); box-shadow: var(--card-shadow);
  border-radius: 14px; padding: 11px 14px 11px 38px;
  color: var(--text); font-size: 14px; outline: none;
}
.search::placeholder { color: var(--text3); }
.search:focus { border-color: rgba(129,140,248,.4); }
.empty-full { padding: 60px 0; text-align: center; }
@media (min-width: 1024px) { .tab-root { padding-bottom: 40px; } }
.empty-em    { font-size: 48px; margin-bottom: 12px; }
.empty-title { font-size: 18px; font-weight: 700; color: var(--text2); }
.empty-sub   { font-size: 13px; color: var(--text3); margin-top: 4px; }
.group-header { display: flex; align-items: center; justify-content: space-between; padding: 0 2px; }
.group-label  { font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: .08em; }
.group-total  { font-size: 12px; color: var(--text3); font-variant-numeric: tabular-nums; }
.group-card   { background: var(--card-bg); border: 1px solid var(--card-border); border-top-color: var(--card-border-top); box-shadow: var(--card-shadow); border-radius: var(--card-radius); padding: 4px 12px; }
.row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 0; border-bottom: 1px solid var(--border);
}
.row:last-child { border-bottom: none; }
.row:hover { background: transparent; }
.cat-icon { width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 18px; }
.row-info  { flex: 1; min-width: 0; }
.row-name  { display: block; font-size: 14px; font-weight: 700; color: var(--text); }
.row-meta  { font-size: 11px; color: var(--text3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.row-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.row-amt   { font-size: 14px; font-weight: 700; font-variant-numeric: tabular-nums; }
.del { width: 22px; height: 22px; border-radius: 50%; border: none; background: rgba(248,113,113,.15); color: #f87171; font-size: 9px; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity .2s; }
.row:hover .del { opacity: 1; }
</style>
