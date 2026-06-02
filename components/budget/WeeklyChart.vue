<script setup lang="ts">
const props = defineProps<{ days: { label: string; total: number; isToday: boolean }[]; dailyBudget: number; currency: string }>()
const series = computed(() => [{ name: 'Spent', data: props.days.map(d => +d.total.toFixed(2)) }])
const options = computed(() => ({
  chart: { type: 'bar', background: 'transparent', toolbar: { show: false }, fontFamily: 'Outfit, sans-serif', animations: { enabled: true, easing: 'easeinout', speed: 700 } },
  plotOptions: { bar: { borderRadius: 8, columnWidth: '52%', colors: { ranges: [
    { from: props.dailyBudget,        to: 9999,                   color: '#f87171' },
    { from: props.dailyBudget * .85,  to: props.dailyBudget,      color: '#fb923c' },
    { from: props.dailyBudget * .6,   to: props.dailyBudget*.85,  color: '#fbbf24' },
    { from: 0,                        to: props.dailyBudget * .6, color: '#818cf8' },
  ]}}},
  dataLabels: { enabled: false },
  xaxis: { categories: props.days.map(d => d.label), labels: { style: { colors: '#4e4e78', fontSize: '11px', fontFamily: 'Outfit, sans-serif', fontWeight: 600 } }, axisBorder: { show: false }, axisTicks: { show: false } },
  yaxis: { labels: { style: { colors: '#4e4e78', fontSize: '11px', fontFamily: 'Outfit, sans-serif' }, formatter: (v: number) => `${props.currency}${v}` } },
  grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 3 },
  tooltip: { theme: 'dark', style: { fontFamily: 'Outfit, sans-serif' }, y: { formatter: (v: number) => `${props.currency}${v.toFixed(2)}` } },
  annotations: { yaxis: [{ y: props.dailyBudget, borderColor: '#34d399', borderWidth: 2, strokeDashArray: 5, label: { text: 'Budget', style: { color: '#34d399', background: 'transparent', fontSize: '10px', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }, position: 'right', offsetX: -55, offsetY: 4 } }] }
}))
</script>
<template>
  <div class="card">
    <div class="head"><span class="title">Last 7 Days</span><span class="pill">Budget: {{ currency }}{{ dailyBudget }}</span></div>
    <ClientOnly><ApexChart type="bar" :options="options" :series="series" height="190"/></ClientOnly>
  </div>
</template>
<style scoped>
.card { background: var(--card-bg); border-radius: var(--card-radius); border: 1px solid var(--card-border); border-top-color: var(--card-border-top); box-shadow: var(--card-shadow); padding: 20px; }
.head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.title { font-size: 15px; font-weight: 800; color: var(--text); letter-spacing: -.2px; }
.pill  { font-size: 11px; font-weight: 700; color: #34d399; background: rgba(52,211,153,.1); padding: 3px 10px; border-radius: 20px; }
</style>
