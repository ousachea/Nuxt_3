<script setup lang="ts">
/**
 * Floating link back to the launcher, shown on every page except the home
 * page itself. Also responds to the H key (ignored while typing).
 */
import { useEventListener } from '@vueuse/core'

const route = useRoute()
const router = useRouter()
const sfx = useSfx()
const visible = computed(() => route.path !== '/')

function goHome() {
  sfx.play('back')
}

useEventListener('keydown', (e: KeyboardEvent) => {
  if (!visible.value || (e.key !== 'h' && e.key !== 'H')) return
  if (e.metaKey || e.ctrlKey || e.altKey) return
  const t = e.target as HTMLElement | null
  if (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName))) return
  e.preventDefault()
  goHome()
  router.push('/')
})
</script>

<template>
  <Transition name="home-pop">
    <NuxtLink
      v-if="visible"
      to="/"
      class="dock-btn home-btn"
      aria-label="Home"
      title="Home (H)"
      @click="goHome"
    >
      <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M1 6.5L7 1l6 5.5V13H9.5v-3.5h-5V13H1V6.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" />
      </svg>
    </NuxtLink>
  </Transition>
</template>

<style scoped>
.home-btn:hover svg { transform: translateY(-1px); }
svg { transition: transform 0.25s cubic-bezier(.34, 1.56, .64, 1); }

.home-pop-enter-active,
.home-pop-leave-active { transition: opacity 0.2s, transform 0.3s cubic-bezier(.34, 1.56, .64, 1); }
.home-pop-enter-from,
.home-pop-leave-to { opacity: 0; transform: scale(0.6); }
</style>
