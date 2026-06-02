<script setup lang="ts">
import { gsap } from 'gsap'
import type { Expense } from '~/types/budget'
import { useCategories } from '~/composables/useCategories'

const props = defineProps<{ expenses: Expense[]; currency: string }>()
const emit  = defineEmits<{ (e: 'delete', id: string): void }>()

const { getCategoryById } = useCategories()
const itemRefs = ref<HTMLElement[]>([])

const fmt = (iso: string) =>
  new Date(iso).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: true })

watch(() => props.expenses.length, async () => {
  await nextTick()
  const first = itemRefs.value[0]
  if (first) gsap.from(first, { x: -14, opacity: 0, duration: .35, ease: 'power2.out' })
})
</script>

<template>
  <div class="card">
    <div class="head">
      <span class="title">Today's Spending</span>
      <span class="count">{{ expenses.length }}</span>
    </div>
    <div v-if="!expenses.length" class="empty">
      <span>🍃</span><p>No expenses yet today</p>
    </div>
    <ul v-else class="list">
      <li v-for="e in expenses" :key="e.id" ref="itemRefs" class="row group">
        <div class="icon" :style="{ background: getCategoryById(e.categoryId).bgColor }">
          {{ getCategoryById(e.categoryId).icon }}
        </div>
        <div class="info">
          <span class="name">{{ getCategoryById(e.categoryId).name }}</span>
          <span class="meta">{{ fmt(e.createdAt) }}{{ e.notes ? ' · '+e.notes : '' }}</span>
        </div>
        <div class="right">
          <span class="amt" :style="{ color: getCategoryById(e.categoryId).color }">
            -{{ currency }}{{ e.amount.toFixed(2) }}
          </span>
          <button class="del" @click="emit('delete', e.id)">✕</button>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.card {
  background: var(--card-bg); border-radius: var(--card-radius);
  border: 1px solid var(--card-border); border-top-color: var(--card-border-top);
  box-shadow: var(--card-shadow); padding: 20px;
}
.head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.title { font-size: 15px; font-weight: 800; color: var(--text); letter-spacing: -.2px; }
.count { font-size: 11px; font-weight: 700; color: var(--text3); background: rgba(255,255,255,.05); border: 1px solid var(--border); padding: 2px 8px; border-radius: 20px; }
.empty { padding: 28px 0; text-align: center; }
.empty span { font-size: 32px; display: block; margin-bottom: 8px; }
.empty p { font-size: 14px; color: var(--text3); font-weight: 500; }
.list { list-style: none; display: flex; flex-direction: column; gap: 2px; }
.row { display: flex; align-items: center; gap: 12px; padding: 9px 10px; border-radius: 12px; transition: background .15s; }
.row:hover { background: rgba(255,255,255,.04); }
.icon { width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 18px; }
.info { flex: 1; min-width: 0; }
.name { display: block; font-size: 14px; font-weight: 700; color: var(--text); }
.meta { font-size: 11px; color: var(--text3); font-weight: 500; }
.right { display: flex; align-items: center; gap: 8px; }
.amt { font-size: 14px; font-weight: 800; font-variant-numeric: tabular-nums; }
.del { width: 22px; height: 22px; border-radius: 50%; border: none; background: rgba(248,113,113,.12); color: #f87171; font-size: 9px; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity .2s; }
.row:hover .del { opacity: 1; }
.del:hover { background: rgba(248,113,113,.25); }
</style>
