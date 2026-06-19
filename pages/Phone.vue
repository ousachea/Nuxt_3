<script setup lang="ts">
/**
 * Cambodia Carrier Checker — single-file page.
 * Everything (carrier data, parsing/formatting, theme, recent searches,
 * and all three UI sections) lives here on purpose. The only things that
 * couldn't be folded in are Nuxt's own required scaffolding: app.vue,
 * nuxt.config.ts, and server/api/lookup.get.ts (API routes must be their
 * own file under server/api/ — that's a Nuxt routing convention, not a
 * choice made here).
 */

// ---------- Types ----------
interface UssdCodes {
  checkNumber: string[]
  checkBalance: string | null
}

interface Carrier {
  id: string
  name: string
  company: string
  /** Vivid brand color — dots, borders, badges only, never large text */
  color: string
  /** Darker variant of `color`, safe contrast for headings/text */
  colorText: string
  /** Two-digit prefixes, no leading zero, e.g. '12' for 012 */
  prefixes: string[]
  ussd: UssdCodes
}

interface LookupResult {
  raw: string
  localDigits: string
  prefix: string
  carrier: Carrier | null
  isComplete: boolean
  formatted: string
}

interface RecentEntry {
  formatted: string
  carrierId: string | null
  checkedAt: number
}

type Theme = 'light' | 'dark'

// ---------- Carrier data ----------
// Prefixes cross-checked against current published operator lists; carriers
// do occasionally get new prefix blocks reassigned by the regulator, so
// treat this as "best available" and re-verify before anything critical.
const CARRIERS: Carrier[] = [
  {
    id: 'cellcard',
    name: 'Cellcard',
    company: 'CamGSM Co., Ltd.',
    color: '#F2711C',
    colorText: '#C2570E',
    prefixes: ['11', '12', '14', '17', '61', '76', '77', '78', '85', '89', '92', '95', '99'],
    ussd: { checkNumber: ['1#', '2#', '*3#'], checkBalance: '#124#' }
  },
  {
    id: 'smart',
    name: 'Smart',
    company: 'Smart Axiata Co., Ltd.',
    color: '#16A34A',
    colorText: '#0F7C39',
    prefixes: ['10', '15', '16', '69', '70', '81', '86', '87', '93', '96', '98'],
    ussd: { checkNumber: ['2#', '*887#', '*400#'], checkBalance: '*888#' }
  },
  {
    id: 'metfone',
    name: 'Metfone',
    company: 'Viettel (Cambodia) Pte., Ltd.',
    color: '#E11D2E',
    colorText: '#C81527',
    prefixes: ['31', '60', '66', '67', '68', '71', '88', '90', '97'],
    ussd: { checkNumber: ['*99#'], checkBalance: '*097#' }
  },
  {
    id: 'qb',
    name: 'qb',
    company: 'Sotelco Ltd.',
    color: '#7C3AED',
    colorText: '#6D28D9',
    prefixes: ['13', '80', '83', '84'],
    ussd: { checkNumber: ['#3#', '*132#'], checkBalance: '*132#' }
  },
  {
    id: 'yes',
    name: 'Yes',
    company: 'South East Asia Telecom (formerly Seatel)',
    color: '#0EA5E9',
    colorText: '#0B84BD',
    prefixes: ['18'],
    ussd: { checkNumber: [], checkBalance: null }
  }
]

const PREFIX_MAP = new Map<string, Carrier>()
for (const carrier of CARRIERS) {
  for (const prefix of carrier.prefixes) PREFIX_MAP.set(prefix, carrier)
}

// ---------- Parsing / formatting ----------
function normalizeToLocalDigits(raw: string): string {
  let digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('855')) digits = '0' + digits.slice(3)
  return digits
}

function extractPrefix(localDigits: string): string {
  const withoutLeadingZero = localDigits.startsWith('0') ? localDigits.slice(1) : localDigits
  return withoutLeadingZero.slice(0, 2)
}

function formatLocalNumber(localDigits: string): string {
  if (localDigits.length <= 3) return localDigits
  const groups = [localDigits.slice(0, 3)]
  let rest = localDigits.slice(3)
  while (rest.length > 3) {
    groups.push(rest.slice(0, 3))
    rest = rest.slice(3)
  }
  if (rest) groups.push(rest)
  return groups.join(' ')
}

function lookupCarrier(raw: string): LookupResult {
  const localDigits = normalizeToLocalDigits(raw)
  const prefix = extractPrefix(localDigits)
  const carrier = prefix.length === 2 ? PREFIX_MAP.get(prefix) ?? null : null
  const significantLength = localDigits.startsWith('0') ? localDigits.length - 1 : localDigits.length

  return {
    raw,
    localDigits,
    prefix,
    carrier,
    isComplete: significantLength >= 8,
    formatted: formatLocalNumber(
      localDigits.startsWith('0') || !localDigits ? localDigits : '0' + localDigits
    )
  }
}

// ---------- Theme ----------
const THEME_KEY = 'ccc:theme'
const theme = ref<Theme>('light')

function applyTheme(value: Theme) {
  theme.value = value
  if (import.meta.client) {
    document.documentElement.setAttribute('data-theme', value)
    try {
      localStorage.setItem(THEME_KEY, value)
    } catch {
      // ignore storage failures (private browsing, quota, etc.)
    }
  }
}

function initTheme() {
  if (!import.meta.client) return
  let initial: Theme | null = null
  try {
    initial = localStorage.getItem(THEME_KEY) as Theme | null
  } catch {
    initial = null
  }
  if (!initial) {
    initial = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  applyTheme(initial)
}

function toggleTheme() {
  applyTheme(theme.value === 'light' ? 'dark' : 'light')
}

// ---------- Recent searches ----------
const RECENTS_KEY = 'ccc:recent-searches'
const MAX_RECENTS = 6
const recents = ref<RecentEntry[]>([])

function loadRecents() {
  if (!import.meta.client) return
  try {
    const stored = localStorage.getItem(RECENTS_KEY)
    recents.value = stored ? JSON.parse(stored) : []
  } catch {
    recents.value = []
  }
}

function persistRecents() {
  if (!import.meta.client) return
  try {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(recents.value))
  } catch {
    // ignore storage failures
  }
}

function addRecent(entry: Omit<RecentEntry, 'checkedAt'>) {
  if (!entry.formatted) return
  const deduped = recents.value.filter((r) => r.formatted !== entry.formatted)
  recents.value = [{ ...entry, checkedAt: Date.now() }, ...deduped].slice(0, MAX_RECENTS)
  persistRecents()
}

function clearRecents() {
  recents.value = []
  persistRecents()
}

// ---------- Checker state ----------
const raw = ref('')
const copied = ref(false)
let copiedTimeout: ReturnType<typeof setTimeout> | undefined

const result = computed(() => lookupCarrier(raw.value))
const showInvalid = computed(() => raw.value.trim().length >= 2 && !result.value.carrier)
const isTypingFirstDigit = computed(() => raw.value.trim().length === 1 && !result.value.carrier)

const barHeights = [8, 14, 20, 26, 32]

const activeBars = computed(() => {
  if (!raw.value) return 0
  if (result.value.carrier) return 5
  if (showInvalid.value) return 1
  const len = result.value.localDigits.replace(/^0/, '').length
  return Math.min(3, Math.max(1, len))
})

function barStyle(index: number) {
  const filled = index <= activeBars.value
  const style: Record<string, string> = { height: `${barHeights[index - 1]}px` }
  if (filled) {
    style.backgroundColor = result.value.carrier ? result.value.carrier.color : 'var(--danger)'
  }
  return style
}

const inputRowStyle = computed(() => {
  if (result.value.carrier) {
    return { borderColor: `color-mix(in srgb, ${result.value.carrier.color} 55%, var(--border))` }
  }
  if (showInvalid.value) {
    return { borderColor: `color-mix(in srgb, var(--danger) 45%, var(--border))` }
  }
  return {}
})

const resultStyle = computed(() => {
  if (!result.value.carrier) return {}
  return {
    '--carrier-color': result.value.carrier.color,
    '--carrier-text': result.value.carrier.colorText
  }
})

const srAnnouncement = computed(() => {
  if (result.value.carrier) return `Matched ${result.value.carrier.name}, ${result.value.carrier.company}`
  if (showInvalid.value) return 'No Cambodian carrier matches this prefix'
  return ''
})

function clearInput() {
  raw.value = ''
}

function trySample(prefix: string) {
  raw.value = prefix
}

function selectPrefix(prefix: string) {
  raw.value = prefix
  document.getElementById('checker-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function copyNumber() {
  if (!result.value.carrier) return
  try {
    await navigator.clipboard.writeText(result.value.formatted)
    copied.value = true
    clearTimeout(copiedTimeout)
    copiedTimeout = setTimeout(() => (copied.value = false), 1500)
  } catch {
    // Clipboard API may be unavailable — fail quietly.
  }
}

watch(result, (val) => {
  if (val.carrier && val.isComplete) {
    addRecent({ formatted: val.formatted, carrierId: val.carrier.id })
  }
})

onMounted(() => {
  initTheme()
  loadRecents()
})

// ---------- SEO ----------
useSeoMeta({
  title: 'Cambodia Carrier Checker — find any network in one keystroke',
  description:
    'Paste or type a Cambodian mobile number to instantly see whether it belongs to Cellcard, Smart, Metfone, qb, or Yes — plus the USSD codes to check your own number and balance.'
})
</script>

<template>
  <div class="page">
    <header class="topbar">
      <span class="mark">khSIM<span class="mark-dot">.</span></span>
      <button
        type="button"
        class="theme-toggle"
        :aria-label="theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'"
        @click="toggleTheme"
      >
        <svg v-if="theme === 'light'" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
        </svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4.5" stroke="currentColor" stroke-width="1.8" />
          <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
        <span>{{ theme === 'light' ? 'Dark' : 'Light' }}</span>
      </button>
    </header>

    <main class="hero">
      <p class="hero-eyebrow">CELLCARD · SMART · METFONE · QB · YES</p>
      <h1 class="hero-title">Which network is this number on?</h1>
      <p class="hero-subtitle">
        Type a prefix, paste a full number, or drop in a +855 number with spaces and dashes —
        it'll sort out the rest.
      </p>

      <!-- ===== Checker ===== -->
      <section class="checker-card" aria-labelledby="checker-title">
        <div class="checker-header">
          <span class="eyebrow">PREFIX · FULL NUMBER · +855</span>
          <h2 id="checker-title">Type a number</h2>
        </div>

        <div class="input-row" :style="inputRowStyle">
          <span class="country-chip">+855</span>
          <input
            v-model="raw"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            spellcheck="false"
            placeholder="012 345 678 or just 12"
            class="number-input"
            aria-label="Cambodian phone number or prefix"
          />
          <button v-if="raw" type="button" class="clear-btn" aria-label="Clear input" @click="clearInput">✕</button>
        </div>

        <div class="signal-row" aria-hidden="true">
          <span v-for="i in 5" :key="i" class="bar" :style="barStyle(i)" />
        </div>

        <p class="sr-only" role="status" aria-live="polite">{{ srAnnouncement }}</p>

        <div class="result-stage">
          <transition name="reveal" mode="out-in">
            <div
              v-if="result.carrier"
              :key="result.carrier.id"
              class="result-card result-card--matched"
              :style="resultStyle"
            >
              <div class="result-top">
                <div>
                  <p class="result-eyebrow">Network detected</p>
                  <h3 class="result-name">{{ result.carrier.name }}</h3>
                  <p class="result-company">{{ result.carrier.company }}</p>
                </div>
                <button type="button" class="copy-btn" @click="copyNumber">
                  {{ copied ? 'Copied' : 'Copy' }}
                </button>
              </div>

              <p class="result-number">{{ result.formatted }}</p>

              <div
                v-if="result.carrier.ussd.checkNumber.length || result.carrier.ussd.checkBalance"
                class="ussd-grid"
              >
                <div v-if="result.carrier.ussd.checkNumber.length">
                  <span class="ussd-label">Check your number</span>
                  <span class="ussd-codes">{{ result.carrier.ussd.checkNumber.join(' · ') }}</span>
                </div>
                <div v-if="result.carrier.ussd.checkBalance">
                  <span class="ussd-label">Check balance</span>
                  <span class="ussd-codes">{{ result.carrier.ussd.checkBalance }}</span>
                </div>
              </div>
              <p v-else class="ussd-unavailable">USSD codes for this operator aren't published yet.</p>
            </div>

            <div v-else-if="showInvalid" key="invalid" class="result-card result-card--invalid">
              <p class="result-eyebrow">No match</p>
              <p class="invalid-text">"{{ raw }}" doesn't match a known Cambodian prefix.</p>
            </div>

            <div v-else-if="isTypingFirstDigit" key="typing" class="result-card result-card--empty">
              <p>Keep going — one more digit to identify the network.</p>
            </div>

            <div v-else key="empty" class="result-card result-card--empty">
              <p>
                Start typing — try
                <button type="button" class="sample-btn" @click="trySample('17')">017</button>
                or paste a full number like +855 12 345 678.
              </p>
            </div>
          </transition>
        </div>

        <div v-if="recents.length" class="recents">
          <span class="recents-label">Recent</span>
          <div class="recents-row">
            <button
              v-for="entry in recents"
              :key="entry.formatted + entry.checkedAt"
              type="button"
              class="recent-chip"
              @click="raw = entry.formatted.replace(/\s+/g, '')"
            >
              {{ entry.formatted }}
            </button>
            <button type="button" class="recent-clear" @click="clearRecents">Clear</button>
          </div>
        </div>
      </section>

      <!-- ===== Directory ===== -->
      <section class="directory" aria-labelledby="directory-title">
        <div class="directory-header">
          <span class="eyebrow">5 OPERATORS · {{ CARRIERS.reduce((n, c) => n + c.prefixes.length, 0) }} PREFIXES</span>
          <h2 id="directory-title">Browse by carrier</h2>
        </div>

        <div class="directory-grid">
          <article
            v-for="carrier in CARRIERS"
            :key="carrier.id"
            class="carrier-card"
            :style="{ '--carrier-color': carrier.color, '--carrier-text': carrier.colorText }"
          >
            <header class="carrier-card-header">
              <span class="dot" />
              <div>
                <h3>{{ carrier.name }}</h3>
                <p>{{ carrier.company }}</p>
              </div>
            </header>

            <div class="prefix-list">
              <button
                v-for="prefix in carrier.prefixes"
                :key="prefix"
                type="button"
                class="prefix-chip"
                @click="selectPrefix(prefix)"
              >
                0{{ prefix }}
              </button>
            </div>

            <div v-if="carrier.ussd.checkNumber.length || carrier.ussd.checkBalance" class="carrier-ussd">
              <span v-if="carrier.ussd.checkNumber.length">My number: {{ carrier.ussd.checkNumber.join(' · ') }}</span>
              <span v-if="carrier.ussd.checkBalance">Balance: {{ carrier.ussd.checkBalance }}</span>
            </div>
          </article>
        </div>

        <p class="directory-note">
          Prefix lists reflect current published operator data and may shift if the regulator
          reassigns blocks — worth double-checking before relying on this for anything critical.
        </p>
      </section>
    </main>

    <footer class="footer">
      <p>
        Also available as an API —
        <code>GET /api/lookup?number=012345678</code>
      </p>
    </footer>
  </div>
</template>

<style>
/* ============================================================
   Design tokens — light theme default, dark theme via [data-theme]
   ============================================================ */
:root {
  --font-display: 'Space Grotesk', 'Inter', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace;

  --bg: #EEF0F3;
  --surface: #FFFFFF;
  --surface-2: #F5F6F9;
  --ink: #161A2B;
  --ink-muted: #5B6172;
  --ink-faint: #9499A8;
  --border: #DEE1E7;
  --border-strong: #C7CBD4;
  --accent: #1F2A44;
  --danger: #C2410C;

  --radius-lg: 22px;
  --radius-md: 14px;

  --shadow-md: 0 10px 28px -10px rgba(20, 24, 40, 0.2);
  --dot-color: rgba(22, 26, 43, 0.08);

  color-scheme: light;
}

[data-theme='dark'] {
  --bg: #10131C;
  --surface: #181C28;
  --surface-2: #1E2331;
  --ink: #EDEFF6;
  --ink-muted: #9CA3B8;
  --ink-faint: #6B7184;
  --border: #2A3043;
  --border-strong: #3A4156;
  --accent: #8FA8FF;
  --danger: #FB923C;

  --shadow-md: 0 10px 28px -10px rgba(0, 0, 0, 0.55);
  --dot-color: rgba(255, 255, 255, 0.07);

  color-scheme: dark;
}

* {
  box-sizing: border-box;
}

html,
body,
#__nuxt {
  height: 100%;
}

body {
  margin: 0;
  background-color: var(--bg);
  background-image: radial-gradient(var(--dot-color) 1px, transparent 1px);
  background-size: 22px 22px;
  color: var(--ink);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
  transition: background-color 0.25s ease, color 0.25s ease;
}

h1, h2, h3 {
  font-family: var(--font-display);
  margin: 0;
  letter-spacing: -0.01em;
}

p {
  margin: 0;
}

button {
  font-family: inherit;
}

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 4px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* ============================================================
   Page shell
   ============================================================ */
.page {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 20px 60px;
}

.topbar {
  width: 100%;
  max-width: 880px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 48px;
}

.mark {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 18px;
  color: var(--ink);
  letter-spacing: -0.01em;
}

.mark-dot {
  color: var(--accent);
}

.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid var(--border-strong);
  background: var(--surface);
  color: var(--ink-muted);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease, transform 0.1s ease;
}

.theme-toggle:hover {
  color: var(--ink);
  border-color: var(--ink-muted);
}

.theme-toggle:active {
  transform: scale(0.97);
}

.hero {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hero-eyebrow {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.12em;
  color: var(--ink-faint);
  margin-bottom: 14px;
  text-align: center;
}

.hero-title {
  font-size: clamp(28px, 5vw, 42px);
  text-align: center;
  max-width: 640px;
  line-height: 1.15;
  color: var(--ink);
}

.hero-subtitle {
  font-size: 16px;
  color: var(--ink-muted);
  text-align: center;
  max-width: 480px;
  margin: 14px 0 36px;
  line-height: 1.6;
}

/* ============================================================
   Checker card
   ============================================================ */
.checker-card {
  width: 100%;
  max-width: 540px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 32px;
}

.checker-header {
  margin-bottom: 20px;
}

.eyebrow {
  display: block;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--ink-faint);
  margin-bottom: 8px;
}

.checker-header h2 {
  font-size: 24px;
  color: var(--ink);
}

.input-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--surface-2);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  padding: 6px 10px 6px 14px;
  transition: border-color 0.2s ease;
}

.country-chip {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--ink-muted);
  padding: 4px 8px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 999px;
  flex-shrink: 0;
}

.number-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  outline: none;
  font-family: var(--font-mono);
  font-size: 21px;
  letter-spacing: 0.03em;
  color: var(--ink);
  padding: 10px 4px;
}

.number-input::placeholder {
  color: var(--ink-faint);
  font-size: 16px;
  letter-spacing: normal;
}

.clear-btn {
  border: none;
  background: var(--surface);
  border-radius: 999px;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  cursor: pointer;
  color: var(--ink-muted);
  font-size: 13px;
}

.clear-btn:hover {
  color: var(--ink);
}

.signal-row {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 32px;
  margin: 14px 2px 22px;
}

.bar {
  width: 7px;
  border-radius: 3px;
  background: var(--border);
  transition: background-color 0.25s ease, height 0.25s ease;
}

.result-stage {
  min-height: 150px;
}

.result-card {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--surface-2);
  padding: 20px;
}

.result-card--matched {
  border-color: color-mix(in srgb, var(--carrier-color) 45%, var(--border));
  background: linear-gradient(180deg, color-mix(in srgb, var(--carrier-color) 8%, var(--surface-2)), var(--surface-2));
}

.result-card--matched::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(100deg, transparent, rgba(255, 255, 255, 0.45), transparent);
  animation: shimmer 0.9s ease-out;
  border-radius: inherit;
}

[data-theme='dark'] .result-card--matched::after {
  background: linear-gradient(100deg, transparent, rgba(255, 255, 255, 0.1), transparent);
}

@keyframes shimmer {
  0% { transform: translateX(-120%) skewX(-12deg); opacity: 0; }
  35% { opacity: 0.6; }
  100% { transform: translateX(220%) skewX(-12deg); opacity: 0; }
}

.result-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.result-eyebrow {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-faint);
  margin-bottom: 4px;
}

.result-name {
  font-size: 26px;
  color: var(--carrier-text, var(--ink));
}

.result-company {
  font-size: 13px;
  color: var(--ink-muted);
  margin-top: 3px;
}

.copy-btn {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 500;
  padding: 7px 14px;
  border-radius: 999px;
  border: 1px solid var(--border-strong);
  background: var(--surface);
  color: var(--ink);
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.copy-btn:hover {
  border-color: var(--ink-muted);
}

.result-number {
  font-family: var(--font-mono);
  font-size: 20px;
  letter-spacing: 0.04em;
  color: var(--ink);
  margin: 16px 0;
}

.ussd-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  padding-top: 16px;
  border-top: 1px dashed var(--border);
}

.ussd-label {
  display: block;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-faint);
  margin-bottom: 4px;
}

.ussd-codes {
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--ink);
}

.ussd-unavailable {
  font-size: 13px;
  color: var(--ink-muted);
  padding-top: 16px;
  border-top: 1px dashed var(--border);
  margin-top: 16px;
}

.result-card--invalid {
  border-color: color-mix(in srgb, var(--danger) 35%, var(--border));
}

.invalid-text {
  font-size: 14px;
  color: var(--ink-muted);
}

.result-card--empty {
  font-size: 14px;
  color: var(--ink-muted);
  line-height: 1.6;
}

.sample-btn {
  font-family: var(--font-mono);
  font-size: 13px;
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: 6px;
  padding: 1px 7px;
  cursor: pointer;
  color: var(--ink);
}

.recents {
  margin-top: 20px;
}

.recents-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-faint);
}

.recents-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}

.recent-chip {
  font-family: var(--font-mono);
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--ink-muted);
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
}

.recent-chip:hover {
  border-color: var(--ink-muted);
  color: var(--ink);
}

.recent-clear {
  font-size: 12px;
  color: var(--ink-faint);
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
}

.reveal-enter-active {
  transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), clip-path 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.reveal-leave-active {
  transition: opacity 0.15s ease;
}

.reveal-enter-from {
  opacity: 0;
  clip-path: inset(0 100% 0 0);
}

.reveal-enter-to {
  opacity: 1;
  clip-path: inset(0 0 0 0);
}

.reveal-leave-to {
  opacity: 0;
}

/* ============================================================
   Carrier directory
   ============================================================ */
.directory {
  width: 100%;
  max-width: 880px;
  margin-top: 56px;
}

.directory-header {
  margin-bottom: 22px;
  text-align: center;
}

.directory-header h2 {
  font-size: 22px;
}

.directory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 16px;
}

.carrier-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 18px;
  border-top: 3px solid var(--carrier-color);
}

.carrier-card-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 14px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--carrier-color);
  margin-top: 6px;
  flex-shrink: 0;
}

.carrier-card-header h3 {
  font-size: 17px;
  color: var(--carrier-text);
}

.carrier-card-header p {
  font-size: 12px;
  color: var(--ink-muted);
  margin-top: 2px;
}

.prefix-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
}

.prefix-chip {
  font-family: var(--font-mono);
  font-size: 12px;
  padding: 5px 9px;
  border-radius: 7px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--ink-muted);
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
}

.prefix-chip:hover {
  border-color: var(--carrier-color);
  color: var(--ink);
}

.carrier-ussd {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--ink-muted);
  padding-top: 12px;
  border-top: 1px dashed var(--border);
  font-family: var(--font-mono);
}

.directory-note {
  margin-top: 26px;
  font-size: 12px;
  color: var(--ink-faint);
  text-align: center;
  max-width: 480px;
  margin-inline: auto;
  line-height: 1.6;
}

/* ============================================================
   Footer
   ============================================================ */
.footer {
  margin-top: 56px;
  font-size: 12px;
  color: var(--ink-faint);
  text-align: center;
}

.footer code {
  font-family: var(--font-mono);
  background: var(--surface-2);
  border: 1px solid var(--border);
  padding: 2px 6px;
  border-radius: 6px;
  color: var(--ink-muted);
}

@media (max-width: 480px) {
  .topbar {
    margin-bottom: 32px;
  }

  .checker-card {
    padding: 22px 18px;
    border-radius: var(--radius-md);
  }

  .checker-header h2 {
    font-size: 20px;
  }

  .number-input {
    font-size: 18px;
  }

  .ussd-grid {
    grid-template-columns: 1fr;
  }

  .result-name {
    font-size: 22px;
  }

  .directory {
    margin-top: 40px;
  }

  .directory-grid {
    grid-template-columns: 1fr;
  }
}
</style>