<script setup lang="ts">
const props = defineProps<{ saved: number; dailyBudget: number; currency: string }>()
const fill = computed(() => Math.min((props.saved / Math.max(props.dailyBudget, 1)) * 100, 100))
const showCoin = ref(false)
watch(() => props.saved, (n, o) => {
  if (n > o) { showCoin.value = true; setTimeout(() => showCoin.value = false, 1200) }
})
</script>

<template>
  <div class="card">
    <div class="inner">
      <div class="jar-area">
        <div class="jar">
          <div class="water" :style="{ height: fill + '%' }"/>
          <div v-if="showCoin" class="coin">🪙</div>
        </div>
        <div class="pct">{{ fill.toFixed(0) }}%</div>
      </div>
      <div class="info">
        <div class="lbl">Savings Jar</div>
        <div class="amount">{{ currency }}{{ saved.toFixed(2) }}</div>
        <div class="sub">saved today</div>
        <div class="bar-bg"><div class="bar" :style="{ width: fill + '%' }"/></div>
        <div class="bar-lbl">{{ fill.toFixed(0) }}% of daily budget saved</div>
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
.inner { display: flex; align-items: center; gap: 20px; }
.jar-area { display: flex; flex-direction: column; align-items: center; gap: 6px; flex-shrink: 0; }
.jar {
  width: 50px; height: 68px; position: relative; overflow: hidden;
  border: 2px solid var(--border2); border-radius: 5px 5px 12px 12px;
  background: rgba(255,255,255,.03);
  box-shadow: inset 0 0 20px rgba(52,211,153,.05);
}
.jar::before {
  content: ''; position: absolute; top: -8px; left: 22%; right: 22%;
  height: 8px; border: 2px solid var(--border2); border-bottom: none; border-radius: 4px 4px 0 0;
}
.water {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: linear-gradient(to top, rgba(52,211,153,.55), rgba(52,211,153,.22));
  transition: height .8s cubic-bezier(.4,0,.2,1);
}
.water::after { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: rgba(52,211,153,.75); animation: wave 2.5s ease-in-out infinite; }
@keyframes wave { 0%,100%{transform:scaleX(1)} 50%{transform:scaleX(1.04)} }
.coin { position: absolute; top: -22px; left: 50%; transform: translateX(-50%); font-size: 14px; animation: drop 1.2s ease-in forwards; }
@keyframes drop { 0%{top:-22px;opacity:1} 80%{top:80%;opacity:1} 100%{top:90%;opacity:0} }
.pct { font-size: 10px; font-weight: 800; color: #34d399; }
.info { flex: 1; }
.lbl    { font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: .07em; margin-bottom: 4px; }
.amount { font-size: 28px; font-weight: 900; color: #34d399; font-variant-numeric: tabular-nums; line-height: 1; letter-spacing: -1px; }
.sub    { font-size: 12px; color: var(--text3); margin-top: 3px; margin-bottom: 12px; font-weight: 500; }
.bar-bg { height: 5px; background: rgba(255,255,255,.06); border-radius: 3px; overflow: hidden; }
.bar    { height: 100%; background: linear-gradient(to right,#34d399,#6ee7b7); border-radius: 3px; transition: width .8s ease; }
.bar-lbl { font-size: 11px; color: var(--text3); margin-top: 5px; font-weight: 500; }
</style>
