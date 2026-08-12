/* ------------------------------------------------------------------ *
 * UI sound service (pack: zen)
 *
 * Pure factory: it takes a player and a storage adapter so it can be
 * unit-tested without a browser, and so nothing here touches `window`
 * at module scope — the module stays safe to evaluate during SSR.
 * The client-only plugin supplies the real dependencies.
 * ------------------------------------------------------------------ */
import { ref, type Ref } from 'vue'
import type { CueDefinition, CueName, PackDefinition, PackName, PlayOptions, PlayingSFX, UISFXPlayer } from 'uisfx'

/** Default pack. Chosen for this product: dry, tail-free, paper-adjacent. */
export const SFX_PACK: PackName = 'zen'

/**
 * Pack and cue metadata, injected by the client plugin.
 *
 * Passing it in keeps the runtime `uisfx` import confined to the
 * client-only plugin — importing PACKS/CUES here would pull the library
 * into the server bundle for anything that touches this module.
 */
export interface SfxCatalog {
  packs: readonly PackDefinition[]
  cues: readonly CueDefinition[]
}

/** The six continuous cues. Anything else must not be started as a loop. */
export type LoopCue = 'loading' | 'processing' | 'recording' | 'connecting' | 'scanning' | 'streaming'

export const SFX_KEYS = {
  enabled: 'sfx_enabled',
  volume: 'sfx_volume',
  typing: 'sfx_typing',
  pack: 'sfx_pack',
} as const

export const SFX_DEFAULTS = { enabled: true, volume: 0.7, typing: false, pack: SFX_PACK } as const

/** Input types that are not text entry and must never fire the typing cue. */
const NON_TEXT_INPUTS = new Set([
  'range', 'checkbox', 'radio', 'button', 'submit', 'reset', 'file', 'color', 'image',
])

export interface SfxStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

export interface SfxService {
  /** Cue caused directly by a user gesture. Also unlocks Web Audio. */
  play: (cue: CueName, options?: PlayOptions) => PlayingSFX | null
  /** Outcome of async/background work — suppressed while audio is locked. */
  playAsync: (cue: CueName, options?: PlayOptions) => PlayingSFX | null
  /** Rate-limited cue for continuous controls (sliders, hover). */
  throttled: (cue: CueName, ms?: number, options?: PlayOptions) => PlayingSFX | null
  /** One brief cue per text-entry input event. Never throttled. */
  typing: (event: Event) => void
  startLoop: (key: string, cue: LoopCue) => void
  stopLoop: (key: string) => void
  stopAllLoops: () => void
  unlock: () => void
  isUnlocked: () => boolean
  activeLoopCount: () => number
  enabled: Ref<boolean>
  volume: Ref<number>
  typingEnabled: Ref<boolean>
  pack: Ref<PackName>
  catalog: SfxCatalog
  setEnabled: (value: boolean) => void
  setVolume: (value: number) => void
  setTypingEnabled: (value: boolean) => void
  setPack: (value: PackName) => void
  resetPreferences: () => void
  teardown: () => Promise<void>
}

function readBool (storage: SfxStorage, key: string, fallback: boolean): boolean {
  try {
    const raw = storage.getItem(key)
    return raw === null ? fallback : raw === 'true'
  } catch {
    return fallback
  }
}

function readVolume (storage: SfxStorage, key: string, fallback: number): number {
  try {
    const stored = storage.getItem(key)
    // Guard the null case explicitly: Number(null) is 0, which would pass the
    // range check and silently mute a first-time listener.
    if (stored === null || stored === '') return fallback
    const raw = Number(stored)
    return Number.isFinite(raw) && raw >= 0 && raw <= 1 ? raw : fallback
  } catch {
    return fallback
  }
}

function writeKey (storage: SfxStorage, key: string, value: string): void {
  try {
    storage.setItem(key, value)
  } catch {
    /* storage blocked or full — preferences just won't survive a reload */
  }
}

export function createSfxService (
  player: UISFXPlayer,
  storage: SfxStorage,
  catalog: SfxCatalog = { packs: [], cues: [] },
): SfxService {
  /** Never trust a stored pack name — the catalog can change between versions. */
  const isKnownPack = (name: string): name is PackName =>
    catalog.packs.length === 0 || catalog.packs.some(p => p.name === name)

  function readPack (): PackName {
    try {
      const stored = storage.getItem(SFX_KEYS.pack)
      return stored && isKnownPack(stored) ? stored : SFX_PACK
    } catch {
      return SFX_PACK
    }
  }

  const enabled = ref(readBool(storage, SFX_KEYS.enabled, true))
  const volume = ref(readVolume(storage, SFX_KEYS.volume, 0.7))
  // Keyboard sonification is opt-in: this product is mostly numeric forms.
  const typingEnabled = ref(readBool(storage, SFX_KEYS.typing, false))
  const pack = ref<PackName>(readPack())

  const loops = new Map<string, PlayingSFX>()
  const lastPlayedAt = new Map<string, number>()

  let unlocked = false
  let unlocking = false

  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

  /** Must be called synchronously from a real pointer/keyboard handler. */
  function unlock (): void {
    if (unlocked || unlocking) return
    unlocking = true
    Promise.resolve(player.unlock())
      .then((ok) => { unlocked = ok !== false })
      .catch(() => { /* audio unavailable — cues stay suppressed */ })
      .finally(() => { unlocking = false })
  }

  function play (cue: CueName, options?: PlayOptions): PlayingSFX | null {
    if (!enabled.value) return null
    unlock()
    return player.play(cue, options) ?? null
  }

  function playAsync (cue: CueName, options?: PlayOptions): PlayingSFX | null {
    // Never queue stale feedback from before the user engaged with the page.
    if (!enabled.value || !unlocked) return null
    return player.play(cue, options) ?? null
  }

  function throttled (cue: CueName, ms = 120, options?: PlayOptions): PlayingSFX | null {
    const at = now()
    const previous = lastPlayedAt.get(cue)
    if (previous !== undefined && at - previous < ms) return null
    lastPlayedAt.set(cue, at)
    return play(cue, options)
  }

  function typing (event: Event): void {
    if (!typingEnabled.value) return
    const target = event.target as { tagName?: string; type?: string } | null
    if (!target?.tagName) return
    const tag = target.tagName.toLowerCase()
    const isText =
      tag === 'textarea' ||
      (tag === 'input' && !NON_TEXT_INPUTS.has(String(target.type ?? 'text').toLowerCase()))
    if (!isText) return
    play('typing', { volume: 0.25, retrigger: 'restart' })
  }

  function startLoop (key: string, cue: LoopCue): void {
    // Only for visible, in-flight work — and never while audio is locked,
    // or we would leave a loop that can never be heard or stopped cleanly.
    if (!enabled.value || !unlocked) return
    if (loops.has(key)) return // idempotent: repeated starts are a no-op
    const handle = player.play(cue, { loop: true })
    if (handle) loops.set(key, handle)
  }

  function stopLoop (key: string): void {
    const handle = loops.get(key)
    if (!handle) return
    handle.stop()
    loops.delete(key)
  }

  function stopAllLoops (): void {
    for (const handle of loops.values()) handle.stop()
    loops.clear()
  }

  function setEnabled (value: boolean): void {
    if (value === enabled.value) return
    if (!value) {
      // Mute must be immediate: kill loops and voices *before* disabling.
      stopAllLoops()
      player.stopAll()
      player.setEnabled(false)
      enabled.value = false
      writeKey(storage, SFX_KEYS.enabled, 'false')
      return
    }
    enabled.value = true
    player.setEnabled(true)
    writeKey(storage, SFX_KEYS.enabled, 'true')
    play('toggle-on')
  }

  function setVolume (value: number): void {
    const next = Math.min(1, Math.max(0, Number(value) || 0))
    volume.value = next
    player.setVolume(next)
    writeKey(storage, SFX_KEYS.volume, String(next))
  }

  function setTypingEnabled (value: boolean): void {
    typingEnabled.value = value
    writeKey(storage, SFX_KEYS.typing, String(value))
  }

  function setPack (value: PackName): void {
    if (!isKnownPack(value) || value === pack.value) return
    pack.value = value
    player.setPack(value)
    writeKey(storage, SFX_KEYS.pack, value)
    // Audition the new pack straight away — that is the point of changing it.
    play('select')
  }

  function resetPreferences (): void {
    stopAllLoops()
    player.stopAll()
    enabled.value = SFX_DEFAULTS.enabled
    player.setEnabled(SFX_DEFAULTS.enabled)
    writeKey(storage, SFX_KEYS.enabled, String(SFX_DEFAULTS.enabled))
    volume.value = SFX_DEFAULTS.volume
    player.setVolume(SFX_DEFAULTS.volume)
    writeKey(storage, SFX_KEYS.volume, String(SFX_DEFAULTS.volume))
    typingEnabled.value = SFX_DEFAULTS.typing
    writeKey(storage, SFX_KEYS.typing, String(SFX_DEFAULTS.typing))
    pack.value = SFX_DEFAULTS.pack
    player.setPack(SFX_DEFAULTS.pack)
    writeKey(storage, SFX_KEYS.pack, SFX_DEFAULTS.pack)
  }

  async function teardown (): Promise<void> {
    stopAllLoops()
    player.stopAll()
    await player.destroy()
  }

  return {
    play,
    playAsync,
    throttled,
    typing,
    startLoop,
    stopLoop,
    stopAllLoops,
    unlock,
    isUnlocked: () => unlocked,
    activeLoopCount: () => loops.size,
    enabled,
    volume,
    typingEnabled,
    pack,
    catalog,
    setEnabled,
    setVolume,
    setTypingEnabled,
    setPack,
    resetPreferences,
    teardown,
  }
}

/** No-op used during SSR or if the client plugin has not run yet. */
export function createSfxNoop (): SfxService {
  return {
    play: () => null,
    playAsync: () => null,
    throttled: () => null,
    typing: () => {},
    startLoop: () => {},
    stopLoop: () => {},
    stopAllLoops: () => {},
    unlock: () => {},
    isUnlocked: () => false,
    activeLoopCount: () => 0,
    enabled: ref(false),
    volume: ref(0),
    typingEnabled: ref(false),
    pack: ref<PackName>(SFX_PACK),
    catalog: { packs: [], cues: [] },
    setEnabled: () => {},
    setVolume: () => {},
    setTypingEnabled: () => {},
    setPack: () => {},
    resetPreferences: () => {},
    teardown: async () => {},
  }
}
