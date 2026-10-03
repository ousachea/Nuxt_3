<script setup lang="ts">
/**
 * Rate alerts. Market alerts are checked whenever the market rate refreshes
 * (the page refreshes it every 30 minutes while open); shop-rate alerts are
 * checked when you update your rates. A browser notification is shown when
 * one fires, plus an in-page toast. There is no server, so alerts can only
 * fire while this page is open.
 */
import type { AlertKind, RateAlert } from '~/stores/exchange'

const ex = useExchangeStore()
const sfx = useSfx()

const KINDS: { id: AlertKind, label: string, hint: string }[] = [
  { id: 'marketAbove', label: 'Market rate rises above', hint: 'Good moment to sell USD' },
  { id: 'marketBelow', label: 'Market rate falls below', hint: 'Good moment to buy USD' },
  { id: 'buyAbove', label: 'My buy rate rises above', hint: 'Your shop pays more riel per $1' },
  { id: 'sellBelow', label: 'My sell rate falls below', hint: 'Your shop sells $1 for less riel' },
]
const labelOf = (k: AlertKind) => KINDS.find(x => x.id === k)!.label

const draft = reactive({ kind: 'marketAbove' as AlertKind, rate: 0 })
const suggest = (k: AlertKind) => {
  const now = ex.currentFor(k) || 4050
  return Math.round(k === 'marketAbove' || k === 'buyAbove' ? now + 20 : now - 20)
}
watch(() => draft.kind, k => { draft.rate = suggest(k) }, { immediate: true })
watch(() => ex.market?.rate, () => { if (!draft.rate) draft.rate = suggest(draft.kind) })

const permission = ref<NotificationPermission | 'unsupported'>('default')
onMounted(() => {
  permission.value = 'Notification' in window ? Notification.permission : 'unsupported'
})

async function add() {
  if (!draft.rate) return
  ex.addAlert(draft.kind, draft.rate)
  sfx.play('success')
  if (permission.value === 'default') {
    try { permission.value = await Notification.requestPermission() } catch { /* ignore */ }
  }
  ex.checkAlerts()
}

function describe(a: RateAlert) {
  return `${labelOf(a.kind)} ${formatRate(a.rate)} ៛`
}

async function notify(a: RateAlert) {
  const body = `${describe(a)}: now ${formatRate(ex.currentFor(a.kind))} ៛`
  if (permission.value !== 'granted') return
  try {
    // Mobile Chrome only allows notifications through a service worker.
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) await reg.showNotification('USD ⇄ KHR alert', { body, tag: a.id })
    else new Notification('USD ⇄ KHR alert', { body, tag: a.id })
  } catch { /* the in-page toast still shows */ }
}

watch(() => ex.firedNow.length, (n, before) => {
  const fresh = ex.firedNow.slice(before ?? 0)
  if (!fresh.length) return
  sfx.play('success')
  fresh.forEach(notify)
})

function dismiss(id: string) {
  ex.firedNow = ex.firedNow.filter(a => a.id !== id)
}
</script>

<template>
  <section class="card alerts">
    <h2>Rate alerts</h2>

    <form class="add" @submit.prevent="add">
      <select v-model="draft.kind" class="plain" aria-label="Alert type">
        <option v-for="k in KINDS" :key="k.id" :value="k.id">{{ k.label }}</option>
      </select>
      <div class="add-row">
        <div class="input-wrap">
          <input v-model.number="draft.rate" type="number" inputmode="decimal" aria-label="Rate">
          <em>៛</em>
        </div>
        <button type="submit" class="btn primary">Add alert</button>
      </div>
      <small>{{ KINDS.find(k => k.id === draft.kind)!.hint }} · now {{ formatRate(ex.currentFor(draft.kind)) }} ៛</small>
    </form>

    <TransitionGroup tag="ul" name="list" class="list">
      <li v-for="a in ex.alerts" :key="a.id" :class="{ fired: a.triggeredAt }">
        <span class="state" :class="a.triggeredAt ? 'fired' : ex.isMet(a) ? 'fired' : 'armed'" />
        <div class="a-main">
          <strong>{{ describe(a) }}</strong>
          <small v-if="a.triggeredAt">Reached {{ formatAgo(a.triggeredAt) }} · now {{ formatRate(ex.currentFor(a.kind)) }} ៛</small>
          <small v-else>Watching · now {{ formatRate(ex.currentFor(a.kind)) }} ៛</small>
        </div>
        <button v-if="a.triggeredAt" type="button" class="btn small" @click="ex.rearmAlert(a.id)">Re-arm</button>
        <button type="button" class="icon" aria-label="Delete alert" @click="ex.removeAlert(a.id)">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" /></svg>
        </button>
      </li>
    </TransitionGroup>

    <p class="note">
      <template v-if="permission === 'denied'">Notifications are blocked for this site, so alerts only show on this page. </template>
      <template v-else-if="permission === 'unsupported'">This browser can't show notifications, so alerts only show on this page. </template>
      Alerts are checked while this page is open: the market rate refreshes every 30 minutes, and shop rates when you update them.
    </p>

    <Teleport to="body">
      <TransitionGroup tag="div" name="toast" class="toasts">
        <div v-for="a in ex.firedNow" :key="a.id" class="toast" role="alert">
          <span class="toast-dot" />
          <div>
            <strong>Alert reached</strong>
            <p>{{ describe(a) }}: now {{ formatRate(ex.currentFor(a.kind)) }} ៛</p>
          </div>
          <button type="button" aria-label="Dismiss" @click="dismiss(a.id)">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" /></svg>
          </button>
        </div>
      </TransitionGroup>
    </Teleport>
  </section>
</template>

<style scoped>
.plain {
  width: 100%;
  padding: 0.6rem 0.7rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--white);
  font: 400 0.9rem var(--font-sans);
  color: var(--black);
}
.add { display: grid; gap: 0.6rem; }
.add-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 0.6rem; }
.add small { font-size: 0.75rem; color: var(--gray); }

.list { list-style: none; display: grid; gap: 0.5rem; margin-top: 1rem; position: relative; }
.list li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  transition: border-color 0.3s, background 0.3s;
}
.list li.fired { border-color: var(--ex-pos); background: var(--ex-pos-bg); }
.a-main strong { display: block; font-weight: 500; font-size: 0.875rem; }
.a-main small { font-size: 0.75rem; color: var(--gray); }
.state { width: 9px; height: 9px; border-radius: 50%; }
.state.armed { background: var(--gray); animation: blink 2s ease-in-out infinite; }
.state.fired { background: var(--ex-pos); }
.icon {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--gray);
  cursor: pointer;
}
.icon:hover { background: var(--light); color: var(--black); }
.note { margin-top: 0.9rem; font-size: 0.75rem; color: var(--gray); line-height: 1.5; }

.toasts { position: fixed; right: 1rem; bottom: 1rem; z-index: 200; display: grid; gap: 0.5rem; width: min(360px, calc(100vw - 2rem)); }
.toast {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.75rem;
  align-items: start;
  padding: 0.85rem 0.9rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--theme-card);
  color: var(--black);
  box-shadow: 0 18px 40px -12px rgba(0, 0, 0, 0.3);
}
.toast strong { font-weight: 500; font-size: 0.875rem; }
.toast p { font-size: 0.8125rem; color: var(--gray); margin-top: 0.15rem; }
.toast button { border: 0; background: transparent; color: var(--gray); cursor: pointer; padding: 0.25rem; }
.toast-dot { width: 10px; height: 10px; margin-top: 0.3rem; border-radius: 50%; background: var(--ex-pos, #2f7d4a); box-shadow: 0 0 0 4px rgba(63, 143, 90, 0.2); }

.toast-enter-active, .toast-leave-active { transition: opacity 0.3s, transform 0.4s cubic-bezier(.2, .8, .2, 1); }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(12px) scale(0.97); }

.list-enter-active, .list-leave-active { transition: opacity 0.25s, transform 0.3s cubic-bezier(.2, .8, .2, 1); }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateY(-6px); }
.list-leave-active { position: absolute; width: 100%; }

@keyframes blink { 50% { opacity: 0.35; } }
</style>
