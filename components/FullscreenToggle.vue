<script setup lang="ts">
/**
 * Full-screen toggle in the floating dock (components/FloatingDock.vue), so
 * every page gets it whatever its layout. Also toggles with the F key (ignored while typing).
 * Hidden where the Fullscreen API isn't available, e.g. Safari on iPhone,
 * which only allows video to go full screen.
 */
import { useFullscreen, useEventListener } from '@vueuse/core'

const sfx = useSfx()
const { isFullscreen, isSupported, toggle } = useFullscreen()

async function flip() {
  try {
    await toggle()
    sfx.play(isFullscreen.value ? 'expand' : 'collapse')
  } catch { /* blocked, e.g. inside an iframe without allowfullscreen */ }
}

useEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key !== 'f' && e.key !== 'F') return
  if (e.metaKey || e.ctrlKey || e.altKey) return
  const t = e.target as HTMLElement | null
  if (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName))) return
  e.preventDefault()
  flip()
})
</script>

<template>
  <button
    v-if="isSupported"
    type="button"
    class="dock-btn fs-toggle"
    :class="{ on: isFullscreen }"
    :aria-label="isFullscreen ? 'Exit full screen' : 'Full screen'"
    :title="isFullscreen ? 'Exit full screen (F)' : 'Full screen (F)'"
    @click="flip"
  >
    <Transition name="fs-icon" mode="out-in">
      <svg v-if="!isFullscreen" key="enter" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <svg v-else key="exit" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M6 2v4H2M14 6h-4V2M10 14v-4h4M2 10h4v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </Transition>
  </button>
</template>

<style scoped>
/* Dimmer while in full screen, so it doesn't distract. */
.fs-toggle.on { opacity: 0.45; }
.fs-toggle.on:hover { opacity: 1; }

.fs-icon-enter-active,
.fs-icon-leave-active { transition: opacity 0.15s, transform 0.25s cubic-bezier(.34, 1.56, .64, 1); }
.fs-icon-enter-from { opacity: 0; transform: scale(0.5) rotate(-90deg); }
.fs-icon-leave-to { opacity: 0; transform: scale(0.5) rotate(90deg); }

@media (prefers-reduced-motion: reduce) {
  .fs-icon-enter-active, .fs-icon-leave-active { transition: none; }
}
</style>
