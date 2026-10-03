import { defineStore } from 'pinia'

/**
 * USD ⇄ KHR exchange state: your money changer's rates, the live market
 * rate, a daily rate history, saved shops, logged trades, rate alerts and the
 * savings comparison inputs. Everything persists to localStorage under `ex_*`
 * keys (the app's usual pattern) and falls back to defaults on any failure.
 */

export interface Market {
  rate: number
  /** When the provider last updated the rate (ms). */
  updated: number
  source: string
  fetchedAt: number
}

export interface Shop {
  id: string
  name: string
  buy: number
  sell: number
  updatedAt: number
}

/** 'buyUsd' = paid riel for dollars (at the sell rate); 'sellUsd' = sold dollars for riel (at the buy rate). */
export interface Trade {
  id: string
  kind: 'buyUsd' | 'sellUsd'
  usd: number
  rate: number
  date: string
  shop?: string
}

export type AlertKind = 'buyAbove' | 'sellBelow' | 'marketAbove' | 'marketBelow'
export interface RateAlert {
  id: string
  kind: AlertKind
  rate: number
  createdAt: number
  triggeredAt: number | null
}

/** One day of history. `market` is the mid-rate; buy / sell are your shop's rates that day. */
export interface HistoryPoint {
  market?: number
  buy?: number
  sell?: number
}

export type Plan = 'toUsd' | 'toKhr'
export type ConvDir = 'usdToKhr' | 'khrToUsd'

const MARKET_MAX_AGE = 60 * 60 * 1000
const HISTORY_DAYS = 365

export const todayKey = (d = new Date()) => {
  const z = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`
}
const daysAgoKey = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return todayKey(d)
}
const uid = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`)

/** Load a localStorage value into a ref and save it back on every change. */
function persisted<T>(key: string, initial: T) {
  const r = ref(initial) as Ref<T>
  if (import.meta.client) {
    try {
      const raw = localStorage.getItem(key)
      if (raw !== null) {
        const saved = JSON.parse(raw)
        // Merge plain objects so new fields keep their defaults.
        r.value = (initial && typeof initial === 'object' && !Array.isArray(initial) && saved && typeof saved === 'object' && !Array.isArray(saved))
          ? { ...initial, ...saved }
          : saved
      }
    } catch { /* corrupted or unavailable — keep defaults */ }
    watch(r, (v) => {
      try { localStorage.setItem(key, JSON.stringify(v)) } catch { /* full or blocked */ }
    }, { deep: true })
  }
  return r
}

async function fetchJson(url: string, fresh = false, timeoutMs = 8000) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    // A manual refresh skips the browser's HTTP cache so it really re-checks.
    const res = await fetch(url, { signal: ctrl.signal, cache: fresh ? 'no-store' : 'default' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

/** USD→KHR mid-rate for one past date, from the dated currency-api builds. */
async function fetchRateOn(date: string): Promise<number | null> {
  const urls = [
    `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/usd.json`,
    `https://${date}.currency-api.pages.dev/v1/currencies/usd.json`,
  ]
  for (const url of urls) {
    try {
      const d = await fetchJson(url, false, 10000)
      if (typeof d?.usd?.khr === 'number') return d.usd.khr
    } catch { /* try the mirror */ }
  }
  return null
}

export const useExchangeStore = defineStore('exchange', () => {
  // ---------- Your rates & calculators ----------
  const inputs = persisted('ex_inputs', {
    buyRate: 4050,
    sellRate: 4080,
    convAmount: 100,
    convDir: 'usdToKhr' as ConvDir,
    plan: 'toKhr' as Plan,
    planUsd: 100,
    planKhr: 400000,
    activeShopId: null as string | null,
  })
  const spread = computed(() => (inputs.value.sellRate || 0) - (inputs.value.buyRate || 0))

  // ---------- Market rate ----------
  const market = persisted<Market | null>('ex_market_rate', null)
  const marketState = ref<'loading' | 'live' | 'cached' | 'error'>('loading')

  async function fetchMarket(fresh: boolean): Promise<Market> {
    try {
      const d = await fetchJson('https://open.er-api.com/v6/latest/USD', fresh)
      const rate = d?.rates?.KHR
      if (d?.result !== 'success' || typeof rate !== 'number') throw new Error('no KHR rate')
      return { rate, updated: d.time_last_update_unix * 1000, source: 'open.er-api.com', fetchedAt: Date.now() }
    } catch {
      const d = await fetchJson('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json', fresh)
      const rate = d?.usd?.khr
      if (typeof rate !== 'number') throw new Error('no KHR rate')
      return { rate, updated: Date.parse(d.date), source: 'currency-api (fawazahmed0)', fetchedAt: Date.now() }
    }
  }

  /** Returns true when a new rate was fetched. */
  async function loadMarket(force = false) {
    if (!force && market.value && Date.now() - market.value.fetchedAt < MARKET_MAX_AGE) {
      marketState.value = 'live'
      recordMarket()
      return false
    }
    marketState.value = 'loading'
    try {
      market.value = await fetchMarket(force)
      marketState.value = 'live'
      recordMarket()
      return true
    } catch {
      marketState.value = market.value ? 'cached' : 'error'
      throw new Error('market unavailable')
    }
  }

  // ---------- History ----------
  const history = persisted<Record<string, HistoryPoint>>('ex_history', {})

  function recordMarket() {
    if (!market.value) return
    const key = todayKey()
    history.value[key] = { ...history.value[key], market: Math.round(market.value.rate * 100) / 100 }
  }

  // Your shop's rates are logged once per day (the latest values that day).
  watch(() => [inputs.value.buyRate, inputs.value.sellRate], ([buy, sell]) => {
    if (!buy || !sell) return
    const key = todayKey()
    history.value[key] = { ...history.value[key], buy, sell }
  })

  const backfilling = ref(false)
  const backfillProgress = ref(0)

  /**
   * Fill in past market rates: daily for the last 30 days, then weekly back
   * to a year. Past rates never change, so each date is fetched only once.
   */
  async function backfillHistory() {
    if (backfilling.value) return
    const wanted: string[] = []
    for (let i = 1; i <= 30; i++) wanted.push(daysAgoKey(i))
    for (let i = 35; i <= HISTORY_DAYS; i += 7) wanted.push(daysAgoKey(i))
    const missing = wanted.filter(k => history.value[k]?.market === undefined)
    if (!missing.length) return

    backfilling.value = true
    backfillProgress.value = 0
    let done = 0
    const queue = [...missing]
    const worker = async () => {
      while (queue.length) {
        const key = queue.shift()!
        const rate = await fetchRateOn(key)
        if (rate !== null) history.value[key] = { ...history.value[key], market: Math.round(rate * 100) / 100 }
        backfillProgress.value = ++done / missing.length
      }
    }
    await Promise.all(Array.from({ length: 6 }, worker))
    backfilling.value = false
  }

  // Drop anything older than a year so storage stays small.
  function pruneHistory() {
    const cutoff = daysAgoKey(HISTORY_DAYS + 7)
    for (const k of Object.keys(history.value)) if (k < cutoff) delete history.value[k]
  }

  // ---------- Shops ----------
  const shops = persisted<Shop[]>('ex_shops', [])

  function addShop(name: string, buy: number, sell: number) {
    const shop = { id: uid(), name: name.trim() || `Shop ${shops.value.length + 1}`, buy, sell, updatedAt: Date.now() }
    shops.value.push(shop)
    return shop
  }
  function updateShop(id: string, patch: Partial<Omit<Shop, 'id'>>) {
    const s = shops.value.find(x => x.id === id)
    if (!s) return
    Object.assign(s, patch, { updatedAt: Date.now() })
    if (inputs.value.activeShopId === id) {
      inputs.value.buyRate = s.buy
      inputs.value.sellRate = s.sell
    }
  }
  function removeShop(id: string) {
    shops.value = shops.value.filter(s => s.id !== id)
    if (inputs.value.activeShopId === id) inputs.value.activeShopId = null
  }
  function useShop(id: string) {
    const s = shops.value.find(x => x.id === id)
    if (!s) return
    inputs.value.activeShopId = id
    inputs.value.buyRate = s.buy
    inputs.value.sellRate = s.sell
  }
  /** Highest buy rate = best place to sell USD; lowest sell rate = best place to buy USD. */
  const bestToSellUsd = computed(() => shops.value.length ? shops.value.reduce((a, b) => (b.buy > a.buy ? b : a)) : null)
  const bestToBuyUsd = computed(() => shops.value.length ? shops.value.reduce((a, b) => (b.sell < a.sell ? b : a)) : null)

  // Typing rates by hand detaches them from the shop they came from.
  watch(() => [inputs.value.buyRate, inputs.value.sellRate], ([buy, sell]) => {
    const s = shops.value.find(x => x.id === inputs.value.activeShopId)
    if (s && (s.buy !== buy || s.sell !== sell)) inputs.value.activeShopId = null
  })

  // ---------- Trades ----------
  const trades = persisted<Trade[]>('ex_trades', [])

  function addTrade(t: Omit<Trade, 'id'>) {
    trades.value.unshift({ ...t, id: uid() })
  }
  function removeTrade(id: string) {
    trades.value = trades.value.filter(t => t.id !== id)
  }
  /**
   * Profit / loss if the trade were reversed at today's rates:
   *  buyUsd  → sell the dollars back at today's buy rate; result in riel.
   *  sellUsd → buy the dollars back at today's sell rate; result in dollars.
   */
  function tradeResult(t: Trade) {
    if (t.kind === 'buyUsd') {
      return { amount: t.usd * ((inputs.value.buyRate || 0) - t.rate), unit: 'khr' as const, breakEven: t.rate }
    }
    const sell = inputs.value.sellRate || 0
    return { amount: sell ? t.usd * t.rate / sell - t.usd : 0, unit: 'usd' as const, breakEven: t.rate }
  }

  // ---------- Alerts ----------
  const alerts = persisted<RateAlert[]>('ex_alerts', [])
  /** Alerts that fired while the page was open, shown as in-page toasts. */
  const firedNow = ref<RateAlert[]>([])

  function addAlert(kind: AlertKind, rate: number) {
    alerts.value.push({ id: uid(), kind, rate, createdAt: Date.now(), triggeredAt: null })
  }
  function removeAlert(id: string) {
    alerts.value = alerts.value.filter(a => a.id !== id)
  }
  function rearmAlert(id: string) {
    const a = alerts.value.find(x => x.id === id)
    if (a) a.triggeredAt = null
    checkAlerts()
  }
  function currentFor(kind: AlertKind) {
    if (kind === 'buyAbove') return inputs.value.buyRate || 0
    if (kind === 'sellBelow') return inputs.value.sellRate || 0
    return market.value?.rate ?? 0
  }
  function isMet(a: RateAlert) {
    const v = currentFor(a.kind)
    if (!v) return false
    return a.kind === 'buyAbove' || a.kind === 'marketAbove' ? v >= a.rate : v <= a.rate
  }
  function checkAlerts() {
    const hits: RateAlert[] = []
    for (const a of alerts.value) {
      if (a.triggeredAt === null && isMet(a)) {
        a.triggeredAt = Date.now()
        hits.push(a)
      }
    }
    if (hits.length) firedNow.value = [...firedNow.value, ...hits]
    return hits
  }
  watch(() => [inputs.value.buyRate, inputs.value.sellRate, market.value?.rate], () => checkAlerts())

  // ---------- Savings comparison ----------
  const savings = persisted('ex_savings', {
    usd: 1000,
    usdInterest: 3,
    khrInterest: 6,
    months: 12,
  })

  return {
    inputs, spread,
    market, marketState, loadMarket,
    history, backfillHistory, backfilling, backfillProgress, pruneHistory,
    shops, addShop, updateShop, removeShop, useShop, bestToSellUsd, bestToBuyUsd,
    trades, addTrade, removeTrade, tradeResult,
    alerts, firedNow, addAlert, removeAlert, rearmAlert, checkAlerts, currentFor, isMet,
    savings,
  }
})
