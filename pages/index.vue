<script setup>
// Self-contained full-bleed shell: no site nav/footer chrome.
definePageMeta({ layout: false })

const pageFiles = import.meta.glob('~/pages/**/*.vue')

const pageDetails = {
  '/gold': { eyebrow: 'Markets', description: 'Live prices, portfolio tracking and Khmer gold units.', tone: 'gold', symbol: 'Au' },
  '/budget': { eyebrow: 'Finance', description: 'Plan spending, build savings and see the month clearly.', tone: 'blue', symbol: '₿' },
  '/exchange': { eyebrow: 'Currency', description: 'Convert between US dollars and Cambodian riel in seconds.', tone: 'coral', symbol: '៛' },
  '/phone': { eyebrow: 'Utility', description: 'A focused mobile workspace, designed for the small screen.', tone: 'violet', symbol: '⌁' },
  '/salary': { eyebrow: 'Income', description: 'Model a pay rise and see what survives the tax bands.', tone: 'teal', symbol: '%' },
  '/sound': { eyebrow: 'Preferences', description: 'Pick a sound pack and audition every interface cue.', tone: 'slate', symbol: '♪' },
  '/setup': { eyebrow: 'System', description: 'Get a new workstation configured and ready to build.', tone: 'green', symbol: '⌘' },
  '/idol': { eyebrow: 'Culture', description: 'Browse artists, profiles and the people inspiring the moment.', tone: 'pink', symbol: '★' },
  '/js': { eyebrow: 'Code', description: 'A focused JavaScript workspace for experimenting and building.', tone: 'lime', symbol: 'JS' },
}

const pages = computed(() => Object.keys(pageFiles)
  .map((filePath) => {
    const path = filePath
      .replace(/^.*\/pages/, '')
      .replace(/\.vue$/, '')
      .replace(/\/index$/, '') || '/'

    const last = path.split('/').filter(Boolean).at(-1) || 'Home'
    const label = last
      .replace(/\[|\]/g, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, character => character.toUpperCase())

    return {
      path,
      label,
      isDynamic: /\[.*\]/.test(path),
      ...(pageDetails[path.toLowerCase()] || {
        eyebrow: 'Workspace',
        description: `Open the ${label} workspace.`,
        tone: 'neutral',
        symbol: '↗',
      }),
    }
  })
  .filter(page => page.path !== '/')
  .sort((a, b) => a.label.localeCompare(b.label)))

const currentTime = ref('')
let timer

const updateTime = () => {
  currentTime.value = new Intl.DateTimeFormat('en', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(new Date())
}

const sfx = useSfx()

// Auto-imported components are resolved at compile time for template *tags*
// only — they are neither script bindings nor resolvable from a plain string in
// `:is`. Without this the workspace grid rendered as empty comment nodes.
const NuxtLinkComponent = resolveComponent('NuxtLink')

const scrollToWorkspaces = () => {
  sfx.play('expand')
  document.getElementById('workspaces')?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start',
  })
}

/** This index is a launcher, so opening a workspace is its one real outcome. */
const openWorkspace = (page) => {
  if (page.isDynamic) return sfx.play('blocked')
  sfx.play('open')
}

onMounted(() => {
  updateTime()
  timer = window.setInterval(updateTime, 1000)
})

onBeforeUnmount(() => window.clearInterval(timer))

useHead({ title: 'Ousa — Personal Tools' })
</script>

<template>
  <div class="home-shell">
    <div class="grain" aria-hidden="true" />

    <header class="topbar">
      <NuxtLink to="/" class="wordmark" aria-label="Home">
        <span class="wordmark-mark">O</span>
        <span>OUSA / LAB</span>
      </NuxtLink>

      <div class="topbar-status">
        <span class="status-light" />
        <span>ALL SYSTEMS NOMINAL</span>
        <time>{{ currentTime }}</time>
      </div>
    </header>

    <main class="home-main">
      <section class="hero">
        <div class="hero-copy">
          <p class="kicker"><span>00</span> Personal interface / Phnom Penh</p>
          <h1>Useful things,<br><em>made personal.</em></h1>
        </div>

        <div class="hero-aside">
          <p>A small collection of focused tools for money, markets and everyday work.</p>
          <nav class="quick-links" aria-label="Quick open">
            <span>Quick open</span>
            <NuxtLink
              v-for="page in pages"
              :key="`quick-${page.path}`"
              :to="page.path"
              @click="sfx.play('open')"
              @pointerenter="sfx.throttled('hover', 260)"
            >
              {{ page.label }} <span aria-hidden="true">↗</span>
            </NuxtLink>
          </nav>
          <button type="button" class="explore-link" @click="scrollToWorkspaces">
            View large cards
            <span aria-hidden="true">↓</span>
          </button>
        </div>

        <div class="orbit" aria-hidden="true">
          <div class="orbit-ring" />
          <div class="orbit-core">{{ String(pages.length).padStart(2, '0') }}</div>
          <span>ACTIVE<br>MODULES</span>
        </div>
      </section>

      <section id="workspaces" class="workspace-section">
        <div class="section-heading">
          <p>Selected workspaces</p>
          <span>INDEX / {{ String(pages.length).padStart(2, '0') }}</span>
        </div>

        <div class="workspace-grid">
          <component
            :is="page.isDynamic ? 'article' : NuxtLinkComponent"
            v-for="(page, index) in pages"
            :key="page.path"
            :to="page.isDynamic ? undefined : page.path"
            class="workspace-card"
            :class="[`tone-${page.tone}`, { disabled: page.isDynamic }]"
            :style="{ '--delay': `${index * 70}ms` }"
            @click="openWorkspace(page)"
            @pointerenter="sfx.throttled('hover', 260)"
          >
            <div class="card-topline">
              <span>{{ page.eyebrow }}</span>
              <span>{{ String(index + 1).padStart(2, '0') }} — {{ page.isDynamic ? 'DYNAMIC' : 'OPEN' }}</span>
            </div>

            <div class="card-symbol" aria-hidden="true">{{ page.symbol }}</div>

            <div class="card-content">
              <h2>{{ page.label }}</h2>
              <p>{{ page.description }}</p>
            </div>

            <div class="card-footer">
              <code>{{ page.path }}</code>
              <span class="card-arrow" aria-hidden="true">↗</span>
            </div>
          </component>
        </div>
      </section>
    </main>

    <footer class="home-footer">
      <span>DESIGNED FOR DAILY USE</span>
      <span class="footer-line" />
      <span>NUXT / {{ new Date().getFullYear() }}</span>
    </footer>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Mono:wght@300;400;500&family=Newsreader:ital,opsz,wght@1,6..72,300&display=swap');

.home-shell {
  --ink: #171813;
  --paper: #efeee8;
  --line: rgba(23, 24, 19, 0.2);
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  color: var(--ink);
  background: var(--paper);
  font-family: 'DM Mono', monospace;
}

.grain {
  position: fixed;
  inset: 0;
  z-index: 10;
  opacity: 0.035;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.8'/%3E%3C/svg%3E");
}

.topbar {
  height: 76px;
  padding: 0 clamp(24px, 5vw, 76px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--line);
}

.wordmark, .topbar-status, .card-topline, .section-heading, .home-footer {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.12em;
}

.wordmark { display: flex; align-items: center; gap: 12px; }
.wordmark-mark { display: grid; place-items: center; width: 30px; height: 30px; border: 1px solid currentColor; border-radius: 50%; font-family: 'Newsreader', serif; font-size: 18px; font-style: italic; }
.topbar-status { display: flex; align-items: center; gap: 12px; }
.topbar-status time { min-width: 58px; margin-left: 18px; }
.status-light { width: 7px; height: 7px; border-radius: 50%; background: #59a05b; box-shadow: 0 0 0 4px rgba(89, 160, 91, 0.13); animation: pulse 2.4s ease infinite; }

.home-main { width: min(1460px, 100%); margin: 0 auto; padding: 0 clamp(24px, 5vw, 76px); }
.hero { position: relative; min-height: 590px; padding: clamp(80px, 10vw, 150px) 0 80px; display: grid; grid-template-columns: minmax(0, 1fr) 290px; align-items: end; border-bottom: 1px solid var(--line); }
.kicker { margin-bottom: 30px; font-size: 10px; letter-spacing: 0.11em; text-transform: uppercase; }
.kicker span { margin-right: 20px; color: #7c7c72; }
.hero h1 { max-width: 1020px; font-family: ui-monospace, sans-serif; font-size: clamp(54px, 8.4vw, 136px); line-height: 0.83; letter-spacing: -0.075em; text-transform: uppercase; }
.hero h1 em { font-family: 'Newsreader', serif; font-weight: 300; letter-spacing: -0.055em; text-transform: none; }
.hero-aside { padding-bottom: 8px; font-size: 12px; line-height: 1.75; }
.hero-aside p { color: #62625a; }
.quick-links { display: grid; grid-template-columns: 1fr 1fr; margin-top: 24px; border-top: 1px solid var(--line); border-left: 1px solid var(--line); }
.quick-links > span { grid-column: 1 / -1; padding: 8px 10px; color: #7c7c72; font-size: 8px; letter-spacing: .12em; text-transform: uppercase; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.quick-links a { display: flex; justify-content: space-between; gap: 8px; padding: 8px 10px; font-size: 9px; line-height: 1.4; letter-spacing: .04em; text-transform: uppercase; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); transition: color .18s ease, background .18s ease; }
.quick-links a:hover { color: var(--paper); background: var(--ink); }
.quick-links a span { transition: transform .18s ease; }
.quick-links a:hover span { transform: translate(2px, -2px); }
.explore-link { width: 100%; display: flex; justify-content: space-between; align-items: center; margin-top: 32px; padding: 15px 0 12px; color: inherit; background: transparent; border: 0; border-top: 1px solid var(--ink); font: inherit; text-align: left; text-transform: uppercase; font-size: 10px; letter-spacing: 0.1em; cursor: pointer; }
.explore-link span { transition: transform 0.25s ease; }
.explore-link:hover span { transform: translateY(4px); }

.orbit { position: absolute; right: 18%; top: 70px; width: 134px; height: 134px; display: grid; place-items: center; border: 1px solid var(--line); border-radius: 50%; }
.orbit::after { content: ''; position: absolute; width: 7px; height: 7px; border-radius: 50%; background: var(--ink); top: -4px; animation: orbit 7s linear infinite; transform-origin: 3px 70px; }
.orbit-ring { position: absolute; inset: 11px; border: 1px dashed var(--line); border-radius: inherit; }
.orbit-core { font-family: 'Archivo Black', sans-serif; font-size: 30px; }
.orbit span { position: absolute; left: calc(100% + 14px); width: 80px; font-size: 8px; line-height: 1.5; letter-spacing: 0.1em; }

.workspace-section { padding: 76px 0 110px; scroll-margin-top: 20px; }
.section-heading { display: flex; justify-content: space-between; margin-bottom: 24px; text-transform: uppercase; }
.section-heading span { color: #7c7c72; }
.workspace-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 14px; }
.workspace-card { position: relative; grid-column: span 4; min-height: 390px; overflow: hidden; display: flex; flex-direction: column; padding: 22px; border: 1px solid rgba(23,24,19,.32); background: #e3e2dc; color: var(--ink); animation: reveal 0.7s both; animation-delay: var(--delay); transition: transform .35s cubic-bezier(.2,.8,.2,1), box-shadow .35s ease; }
.workspace-card:nth-child(1), .workspace-card:nth-child(5) { grid-column: span 6; }
.workspace-card:hover { z-index: 2; transform: translateY(-8px) rotate(-.25deg); box-shadow: 12px 16px 0 rgba(23,24,19,.12); }
.card-topline, .card-footer { display: flex; align-items: center; justify-content: space-between; text-transform: uppercase; }
.card-symbol { position: absolute; top: 42px; right: 18px; font-family: 'Newsreader', serif; font-size: clamp(95px, 12vw, 160px); font-weight: 300; line-height: 1; opacity: .16; transition: transform .5s cubic-bezier(.2,.8,.2,1), opacity .35s; }
.workspace-card:hover .card-symbol { transform: scale(1.08) rotate(5deg); opacity: .24; }
.card-content { position: relative; margin-top: auto; max-width: 440px; }
.card-content h2 { font-family: 'Archivo Black', sans-serif; font-size: clamp(31px, 4vw, 54px); line-height: .95; letter-spacing: -.055em; text-transform: uppercase; }
.card-content p { max-width: 390px; margin-top: 18px; font-size: 11px; line-height: 1.65; }
.card-footer { margin-top: 28px; padding-top: 15px; border-top: 1px solid rgba(23,24,19,.32); }
.card-footer code { font-family: inherit; font-size: 9px; }
.card-arrow { font-size: 21px; transition: transform .25s ease; }
.workspace-card:hover .card-arrow { transform: translate(4px, -4px); }
.tone-gold { background: #f1c84b; }
.tone-blue { background: #8bb5d9; }
.tone-coral { background: #ed765f; }
.tone-violet { background: #b7a9d8; }
.tone-green { background: #9fbd87; }
.tone-pink { background: #e6a5b9; }
.tone-lime { background: #c7d86b; }
.tone-teal { background: #8ac9bb; }
.tone-slate { background: #a8adbb; }
.disabled { opacity: .55; pointer-events: none; }

.home-footer { display: flex; align-items: center; gap: 20px; height: 94px; padding: 0 clamp(24px, 5vw, 76px); border-top: 1px solid var(--line); }
.footer-line { flex: 1; height: 1px; background: var(--line); }

@keyframes pulse { 50% { opacity: .45; } }
@keyframes orbit { to { transform: rotate(360deg); } }
@keyframes reveal { from { opacity: 0; transform: translateY(24px); } }

@media (max-width: 900px) {
  .hero { min-height: 520px; grid-template-columns: 1fr; gap: 54px; }
  .hero-aside { max-width: 360px; }
  .orbit { right: 11%; top: 62px; transform: scale(.8); }
  .workspace-card, .workspace-card:nth-child(1), .workspace-card:nth-child(5) { grid-column: span 6; }
}

@media (max-width: 620px) {
  .topbar { height: 66px; }
  .topbar-status > span:not(.status-light) { display: none; }
  .topbar-status time { margin-left: 8px; }
  .hero { min-height: auto; padding: 88px 0 60px; }
  .hero h1 { font-size: clamp(48px, 16vw, 76px); line-height: .88; }
  .orbit { display: none; }
  .workspace-section { padding: 56px 0 80px; }
  .workspace-grid { gap: 10px; }
  .workspace-card, .workspace-card:nth-child(1), .workspace-card:nth-child(5) { grid-column: 1 / -1; min-height: 330px; }
  .card-content h2 { font-size: 42px; }
  .home-footer { height: 76px; }
  .home-footer > span:first-child { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; }
}
</style>
