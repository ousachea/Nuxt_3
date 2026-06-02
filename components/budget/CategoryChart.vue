<script setup lang="ts">
import { useCategories } from '~/composables/useCategories'
const props = defineProps<{ totals: Record<string, number>; currency: string }>()
const { getCategoryById } = useCategories()
const series  = computed(() => Object.values(props.totals))
const labels  = computed(() => Object.keys(props.totals).map(id => getCategoryById(id).name))
const colors  = computed(() => Object.keys(props.totals).map(id => getCategoryById(id).color))
const hasData = computed(() => series.value.some(v => v > 0))
const options = computed(() => ({
  chart: { type: 'donut', background: 'transparent', toolbar: { show: false }, fontFamily: 'Outfit, sans-serif', animations: { enabled: true, easing: 'easeinout', speed: 800 } },
  labels: labels.value, colors: colors.value,
  legend: { position: 'bottom', labels: { colors: '#9090c0' }, fontSize: '12px', fontFamily: 'Outfit, sans-serif', fontWeight: 600, itemMargin: { horizontal: 8, vertical: 4 } },
  dataLabels: { enabled: false }, stroke: { width: 0 },
  plotOptions: { pie: { donut: { size: '68%', labels: { show: true,
    total: { show: true, label: 'Total', color: '#9090c0', fontSize: '12px', fontFamily: 'Outfit, sans-serif',
      formatter: (w: any) => `${props.currency}${w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0).toFixed(2)}` },
    value: { color: '#f0f0fe', fontSize: '22px', fontWeight: '900', fontFamily: 'Outfit, sans-serif' }
  }}}},
  tooltip: { theme: 'dark', style: { fontFamily: 'Outfit, sans-serif' }, y: { formatter: (v: number) => `${props.currency}${v.toFixed(2)}` } }
}))
</script>
<template>
  <div class="card">
    <div class="title">Category Breakdown</div>
    <div v-if="!hasData" class="empty"><span>📊</span><p>Add expenses to see breakdown</p></div>
    <ClientOnly v-else><ApexChart type="donut" :options="options" :series="series" height="260"/></ClientOnly>
  </div>
</template>
<style scoped>
.card { background: var(--card-bg); border-radius: var(--card-radius); border: 1px solid var(--card-border); border-top-color: var(--card-border-top); box-shadow: var(--card-shadow); padding: 20px; }
.title { font-size: 15px; font-weight: 800; color: var(--text); margin-bottom: 14px; letter-spacing: -.2px; }
.empty { padding: 28px 0; text-align: center; }
.empty span { font-size: 28px; display: block; margin-bottom: 8px; }
.empty p { font-size: 14px; color: var(--text3); font-weight: 500; }
</style>
