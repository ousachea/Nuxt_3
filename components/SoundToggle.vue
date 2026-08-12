<script setup lang="ts">
/* Sound preference control. Lives in the default layout, so every page
   in the product exposes the same switch in the same place. */
const sfx = useSfx()
const open = ref(false)

const label = computed(() => (sfx.enabled.value ? 'Sound on' : 'Sound off'))

function toggleSound () {
  // setEnabled stops loops and voices before muting, so this is immediate.
  sfx.setEnabled(!sfx.enabled.value)
  if (!sfx.enabled.value) open.value = false
}

function onVolume (event: Event) {
  const next = Number((event.target as HTMLInputElement).value) / 100
  sfx.setVolume(next)
  // Audible reference for the level being set, rate-limited while dragging.
  sfx.throttled('select', 140)
}

function toggleTyping () {
  const next = !sfx.typingEnabled.value
  sfx.setTypingEnabled(next)
  sfx.play(next ? 'check' : 'uncheck')
}
</script>

<template>
  <div class="sound-pref">
    <button
      type="button"
      class="sound-btn"
      :class="{ on: sfx.enabled.value }"
      :aria-pressed="sfx.enabled.value"
      :title="label"
      @click="toggleSound"
    >
      <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true" fill="none">
        <path d="M8 2.5 4.5 5.5H2v5h2.5L8 13.5v-11Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" />
        <template v-if="sfx.enabled.value">
          <path d="M10.8 5.6a3.4 3.4 0 0 1 0 4.8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
          <path d="M12.8 3.6a6.2 6.2 0 0 1 0 8.8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
        </template>
        <template v-else>
          <path d="M11 6l4 4m0-4l-4 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
        </template>
      </svg>
      <span>{{ label }}</span>
    </button>

    <button
      v-if="sfx.enabled.value"
      type="button"
      class="sound-more"
      :aria-expanded="open"
      aria-label="Sound settings"
      @click="open = !open"
    >⋯</button>

    <div v-if="open && sfx.enabled.value" class="sound-panel">
      <label class="sound-row">
        <span>Volume</span>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          :value="Math.round(sfx.volume.value * 100)"
          @input="onVolume"
        >
        <b>{{ Math.round(sfx.volume.value * 100) }}%</b>
      </label>

      <button
        type="button"
        class="sound-row as-button"
        :aria-pressed="sfx.typingEnabled.value"
        @click="toggleTyping"
      >
        <span>Key clicks</span>
        <em :class="{ on: sfx.typingEnabled.value }">{{ sfx.typingEnabled.value ? 'On' : 'Off' }}</em>
      </button>

      <NuxtLink to="/sound" class="sound-row as-link" @click="open = false">
        <span>All sound settings</span>
        <em aria-hidden="true">↗</em>
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.sound-pref { position: relative; display: flex; align-items: center; gap: 4px; margin-left: auto; }

.sound-btn, .sound-more {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 9px;
  font-family: inherit;
  font-size: 0.6875rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #888;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 3px;
  cursor: pointer;
  transition: color 0.18s, border-color 0.18s;
}

.sound-btn:hover, .sound-more:hover { color: #0d0d0d; border-color: #e5e3df; }
.sound-btn.on { color: #0d0d0d; }
.sound-btn:focus-visible, .sound-more:focus-visible { outline: 2px solid #0d0d0d; outline-offset: 2px; }
.sound-more { padding: 5px 7px; font-size: 0.75rem; line-height: 1; }

.sound-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 200;
  width: 208px;
  padding: 12px;
  background: #fafaf9;
  border: 1px solid #e5e3df;
  border-radius: 4px;
  box-shadow: 0 10px 24px rgba(13, 13, 13, 0.09);
}

.sound-row {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 5px 0;
  font-family: inherit;
  font-size: 0.6875rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #888;
  background: transparent;
  border: 0;
  text-align: left;
  cursor: pointer;
}

.sound-row span { flex-shrink: 0; }
.sound-row input { flex: 1; min-width: 0; accent-color: #0d0d0d; cursor: pointer; }
.sound-row b { min-width: 30px; font-weight: 500; color: #0d0d0d; text-align: right; }
.sound-row em { margin-left: auto; font-style: normal; color: #888; }
.sound-row em.on { color: #0d0d0d; }
.sound-row.as-button:focus-visible,
.sound-row.as-link:focus-visible { outline: 2px solid #0d0d0d; outline-offset: 2px; }

.sound-row.as-link {
  margin-top: 4px;
  padding-top: 9px;
  border-top: 1px solid #e5e3df;
  text-decoration: none;
}

.sound-row.as-link:hover span, .sound-row.as-link:hover em { color: #0d0d0d; }
</style>
