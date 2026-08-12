/* ------------------------------------------------------------------ *
 * Client-only UI sound player.
 *
 * `.client.ts` keeps this out of the server bundle entirely, so no
 * audio object is ever constructed during SSR/prerender. Exactly one
 * player exists per app instance; an HMR re-run disposes the previous
 * one first, so re-mounting never leaves two players alive.
 * ------------------------------------------------------------------ */
import { CUES, PACKS, createUISFX } from 'uisfx'
import type { PackName } from 'uisfx'
import { createSfxService, SFX_PACK, type SfxService, type SfxStorage } from '~/utils/sfx'

const memoryStorage = new Map<string, string>()

/** localStorage, degrading to memory when it is blocked (private mode, iframes). */
const storage: SfxStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key)
    } catch {
      return memoryStorage.get(key) ?? null
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value)
    } catch {
      memoryStorage.set(key, value)
    }
  },
}

export default defineNuxtPlugin(() => {
  const enabled = storage.getItem('sfx_enabled') !== 'false'
  const storedVolume = storage.getItem('sfx_volume')
  const rawVolume = storedVolume === null || storedVolume === '' ? NaN : Number(storedVolume)
  const volume = Number.isFinite(rawVolume) && rawVolume >= 0 && rawVolume <= 1 ? rawVolume : 0.7

  const storedPack = storage.getItem('sfx_pack')
  const pack = (PACKS.some(p => p.name === storedPack) ? storedPack : SFX_PACK) as PackName

  // Constructing the player is silent — nothing autoplays on load.
  const player = createUISFX({ pack, volume, enabled })
  // The catalog is injected so pages can render pack/cue pickers without
  // importing `uisfx` themselves, which would drag it into the server bundle.
  const sfx: SfxService = createSfxService(player, storage, { packs: PACKS, cues: CUES })

  // Web Audio needs a genuine gesture. `unlock()` runs synchronously inside
  // the handler, before any await, and is a no-op once it has succeeded.
  const onGesture = () => sfx.unlock()
  window.addEventListener('pointerdown', onGesture, { capture: true, passive: true })
  window.addEventListener('keydown', onGesture, { capture: true, passive: true })

  // A loop belongs to the view that started it — never let one outlive it.
  const router = useRouter()
  const stopRouteGuard = router.afterEach(() => sfx.stopAllLoops())

  // A loop must never keep running in a tab the user has left.
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') sfx.stopAllLoops()
  }
  document.addEventListener('visibilitychange', onVisibility)

  async function dispose () {
    window.removeEventListener('pointerdown', onGesture, { capture: true })
    window.removeEventListener('keydown', onGesture, { capture: true })
    document.removeEventListener('visibilitychange', onVisibility)
    stopRouteGuard()
    // We never created our own AudioContext, so the player owns and closes
    // its own — there is no caller-owned context left to close here.
    await sfx.teardown()
  }

  // Nuxt has no runtime `app:unmount` hook, and a production SPA never
  // disposes its app — so the only real remount is an HMR re-run, which
  // would otherwise leave a second player alive holding the old voices.
  if (import.meta.hot) import.meta.hot.dispose(() => { void dispose() })

  return { provide: { sfx } }
})

declare module '#app' {
  interface NuxtApp {
    $sfx: SfxService
  }
}
