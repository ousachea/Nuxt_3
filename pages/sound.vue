<script setup>
/* Sound settings — the one place to change the pack, level and behaviour,
   and to audition every cue the product can play. */
const sfx = useSfx()

/** Cues arrive grouped by category; keep the catalog's own ordering. */
const cueGroups = computed(() => {
  const groups = new Map()
  for (const cue of sfx.catalog.cues) {
    if (!groups.has(cue.category)) groups.set(cue.category, [])
    groups.get(cue.category).push(cue)
  }
  return [...groups].map(([category, cues]) => ({ category, cues }))
})

const defaultPackLabel = computed(
  () => sfx.catalog.packs.find(p => p.name === 'zen')?.label ?? 'Zen',
)

const activePack = computed(() => sfx.catalog.packs.find(p => p.name === sfx.pack.value))

/* --- auditioning ---------------------------------------------------- */
const PREVIEW_KEY = 'sound-preview'
const activeLoop = ref(null)
const lastPlayed = ref('')

function stopPreviewLoop () {
  sfx.stopLoop(PREVIEW_KEY)
  activeLoop.value = null
}

async function audition (cue) {
  lastPlayed.value = cue.name
  if (!cue.loop) {
    stopPreviewLoop()
    sfx.play(cue.name, { retrigger: 'restart' })
    return
  }
  // Loop cues toggle, so the browser can never strand one playing.
  if (activeLoop.value === cue.name) return stopPreviewLoop()
  stopPreviewLoop()
  sfx.unlock()
  sfx.startLoop(PREVIEW_KEY, cue.name)
  if (sfx.activeLoopCount() === 0) {
    // First gesture of the session: audio was still unlocking. Try once more.
    await new Promise(resolve => setTimeout(resolve, 80))
    sfx.startLoop(PREVIEW_KEY, cue.name)
  }
  activeLoop.value = sfx.activeLoopCount() > 0 ? cue.name : null
}

function choosePack (name) {
  stopPreviewLoop()
  sfx.setPack(name) // plays a cue in the newly selected pack
}

function onVolume (event) {
  sfx.setVolume(Number(event.target.value) / 100)
  sfx.throttled('select', 140)
}

function toggleTyping () {
  const next = !sfx.typingEnabled.value
  sfx.setTypingEnabled(next)
  sfx.play(next ? 'check' : 'uncheck')
}

function resetAll () {
  stopPreviewLoop()
  sfx.resetPreferences()
  sfx.play('undo')
}

// A preview loop belongs to this screen only.
onBeforeUnmount(stopPreviewLoop)

useHead({ title: 'Sound settings' })
</script>

<template>
  <div class="page sound-page" @input="sfx.typing($event)">
    <header class="head">
      <p class="section-label">Preferences</p>
      <h1>Sound</h1>
      <p class="lede">
        Interface sound is off by default in most tools. Here it is on, quiet, and
        yours to change — every cue below can be auditioned before you commit to it.
      </p>
    </header>

    <div class="divider" />

    <!-- MASTER -->
    <section class="block">
      <p class="section-label">Output</p>

      <div class="row">
        <div class="row-copy">
          <h2>Interface sound</h2>
          <p>Cues for state changes, outcomes and toggles. Never the only feedback.</p>
        </div>
        <button
          type="button"
          class="switch"
          :class="{ on: sfx.enabled.value }"
          :aria-pressed="sfx.enabled.value"
          aria-label="Interface sound"
          @click="sfx.setEnabled(!sfx.enabled.value)"
        ><i /></button>
      </div>

      <div class="row" :class="{ dim: !sfx.enabled.value }">
        <div class="row-copy">
          <h2>Volume</h2>
          <p>Applies to every cue; individual cues keep their own relative level.</p>
        </div>
        <div class="row-control">
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            :value="Math.round(sfx.volume.value * 100)"
            :disabled="!sfx.enabled.value"
            aria-label="Volume"
            @input="onVolume"
          >
          <b>{{ Math.round(sfx.volume.value * 100) }}%</b>
        </div>
      </div>

      <div class="row" :class="{ dim: !sfx.enabled.value }">
        <div class="row-copy">
          <h2>Key clicks</h2>
          <p>A brief tick on every keystroke in a text field. Off by default — this
            product is mostly numeric entry.</p>
        </div>
        <button
          type="button"
          class="switch"
          :class="{ on: sfx.typingEnabled.value }"
          :aria-pressed="sfx.typingEnabled.value"
          :disabled="!sfx.enabled.value"
          aria-label="Key clicks"
          @click="toggleTyping"
        ><i /></button>
      </div>
    </section>

    <div class="divider" />

    <!-- PACK -->
    <section class="block">
      <p class="section-label">
        Sound pack
        <em v-if="activePack">— {{ activePack.label }}</em>
      </p>
      <p class="block-note">
        Changing the pack re-voices every cue in the product. Selecting one plays it
        immediately so you can compare.
      </p>

      <div class="packs">
        <button
          v-for="p in sfx.catalog.packs"
          :key="p.name"
          type="button"
          class="pack"
          :class="{ on: p.name === sfx.pack.value }"
          :aria-pressed="p.name === sfx.pack.value"
          :disabled="!sfx.enabled.value"
          @click="choosePack(p.name)"
        >
          <span class="pack-name">
            <i class="pack-dot" :style="{ background: p.color }" aria-hidden="true" />
            {{ p.label }}
          </span>
          <span class="pack-desc">{{ p.description }}</span>
          <span v-if="p.bestFor" class="pack-for">{{ p.bestFor }}</span>
          <span v-if="p.name === sfx.pack.value" class="pack-mark" aria-hidden="true">In use</span>
        </button>
      </div>
    </section>

    <div class="divider" />

    <!-- CUES -->
    <section class="block">
      <p class="section-label">
        Cue library
        <em>— {{ sfx.catalog.cues.length }} cues</em>
      </p>
      <p class="block-note">
        Every sound the product can make, in the pack above. Click to hear one;
        the six looping cues toggle on and off.
      </p>

      <div v-for="group in cueGroups" :key="group.category" class="cue-group">
        <h3>{{ group.category }}</h3>
        <div class="cues">
          <button
            v-for="cue in group.cues"
            :key="cue.name"
            type="button"
            class="cue"
            :class="{
              playing: activeLoop === cue.name,
              recent: lastPlayed === cue.name && activeLoop !== cue.name,
              loop: cue.loop,
            }"
            :disabled="!sfx.enabled.value"
            :title="cue.description"
            @click="audition(cue)"
          >
            <span class="cue-name">{{ cue.label }}</span>
            <span v-if="cue.loop" class="cue-tag">{{ activeLoop === cue.name ? 'Stop' : 'Loop' }}</span>
          </button>
        </div>
      </div>
    </section>

    <div class="divider" />

    <section class="block foot">
      <div class="row">
        <div class="row-copy">
          <h2>Reset</h2>
          <p>Back to the defaults: sound on, 70%, key clicks off, {{ defaultPackLabel }} pack.</p>
        </div>
        <button type="button" class="reset" @click="resetAll">Reset preferences</button>
      </div>
      <p class="fine">
        Preferences are stored on this device under <code>sfx_*</code> and apply across
        every page. Sound reinforces the interface; it never replaces the visible or
        written feedback.
      </p>
    </section>
  </div>
</template>


<style scoped>
.sound-page { padding-bottom: 6rem; }

.head { max-width: 46rem; }

.head h1 {
  font-family: var(--font-serif);
  font-size: clamp(2.75rem, 7vw, 4.5rem);
  font-weight: 300;
  line-height: 1;
  letter-spacing: -0.01em;
}

.lede { margin-top: 1.25rem; max-width: 38rem; color: #5c5c58; line-height: 1.75; }

.section-label em { font-style: normal; color: #b4b0a8; }

.block { padding: 0.5rem 0; }
.block-note { max-width: 40rem; margin: -0.25rem 0 1.75rem; font-size: 0.8125rem; color: var(--gray); line-height: 1.7; }

/* rows */
.row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 2rem;
  padding: 1.25rem 0;
  border-bottom: 1px solid var(--border);
  transition: opacity 0.2s;
}

.row:last-of-type { border-bottom: 0; }
.row.dim { opacity: 0.42; }
.row-copy { max-width: 34rem; }
.row-copy h2 { font-size: 0.875rem; font-weight: 500; letter-spacing: 0.01em; }
.row-copy p { margin-top: 0.35rem; font-size: 0.8125rem; color: var(--gray); line-height: 1.65; }

.row-control { display: flex; align-items: center; gap: 0.875rem; flex-shrink: 0; }
.row-control input { width: 170px; accent-color: var(--black); cursor: pointer; }
.row-control input:disabled { cursor: not-allowed; }
.row-control b { min-width: 2.5rem; font-size: 0.8125rem; font-weight: 500; text-align: right; font-variant-numeric: tabular-nums; }

/* switch */
.switch {
  position: relative;
  flex-shrink: 0;
  width: 40px;
  height: 22px;
  padding: 0;
  background: #e3e0da;
  border: 0;
  border-radius: 11px;
  cursor: pointer;
  transition: background 0.2s;
}

.switch i {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--white);
  box-shadow: 0 1px 3px rgba(13, 13, 13, 0.28);
  transition: transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.switch.on { background: var(--black); }
.switch.on i { transform: translateX(18px); }
.switch:disabled { opacity: 0.4; cursor: not-allowed; }
.switch:focus-visible { outline: 2px solid var(--black); outline-offset: 3px; }

/* packs */
.packs { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.625rem; }

.pack {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 1rem 1.125rem 1.125rem;
  font-family: inherit;
  text-align: left;
  color: inherit;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 3px;
  cursor: pointer;
  transition: border-color 0.18s, background 0.18s, transform 0.18s;
}

.pack:hover:not(:disabled) { border-color: #c9c5bd; transform: translateY(-2px); }
.pack:focus-visible { outline: 2px solid var(--black); outline-offset: 2px; }
.pack:disabled { opacity: 0.45; cursor: not-allowed; }
.pack.on { background: var(--black); border-color: var(--black); color: var(--white); }

.pack-name { display: flex; align-items: center; gap: 0.5rem; font-family: var(--font-serif); font-size: 1.375rem; line-height: 1; }
.pack-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.pack-desc { font-size: 0.75rem; line-height: 1.55; color: var(--gray); }
.pack.on .pack-desc { color: rgba(250, 250, 249, 0.72); }
.pack-for { font-size: 0.625rem; letter-spacing: 0.09em; text-transform: uppercase; color: #b4b0a8; }
.pack.on .pack-for { color: rgba(250, 250, 249, 0.5); }

.pack-mark {
  position: absolute;
  top: 0.85rem;
  right: 0.9rem;
  font-size: 0.5625rem;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  color: rgba(250, 250, 249, 0.62);
}

/* cues */
.cue-group + .cue-group { margin-top: 1.75rem; }

.cue-group h3 {
  margin-bottom: 0.75rem;
  font-size: 0.625rem;
  font-weight: 400;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--gray);
}

.cues { display: flex; flex-wrap: wrap; gap: 0.375rem; }

.cue {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.8125rem;
  font-family: inherit;
  font-size: 0.75rem;
  color: #3d3d39;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.15s;
}

.cue:hover:not(:disabled) { color: var(--black); border-color: #a8a49c; }
.cue:focus-visible { outline: 2px solid var(--black); outline-offset: 2px; }
.cue:disabled { opacity: 0.4; cursor: not-allowed; }
.cue.recent { border-color: var(--black); color: var(--black); }
.cue.loop { border-style: dashed; }

.cue.playing {
  color: var(--white);
  background: var(--black);
  border-color: var(--black);
  border-style: solid;
}

.cue-tag { font-size: 0.5625rem; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.6; }

/* foot */
.reset {
  flex-shrink: 0;
  padding: 0.625rem 1.125rem;
  font-family: inherit;
  font-size: 0.6875rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #3d3d39;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.18s;
}

.reset:hover { color: var(--black); border-color: var(--black); }
.reset:focus-visible { outline: 2px solid var(--black); outline-offset: 2px; }

.fine { margin-top: 1.5rem; max-width: 40rem; font-size: 0.75rem; line-height: 1.8; color: var(--gray); }
.fine code { font-family: ui-monospace, monospace; font-size: 0.6875rem; color: #3d3d39; }

@media (max-width: 640px) {
  .row { flex-direction: column; align-items: stretch; gap: 1rem; }
  .row-control input { flex: 1; width: auto; }
  .packs { grid-template-columns: 1fr 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition-duration: 0.01ms !important; }
}
</style>
