import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createSfxService, createSfxNoop, SFX_DEFAULTS, SFX_KEYS, SFX_PACK, type SfxCatalog, type SfxStorage } from '../utils/sfx'
import type { UISFXPlayer } from 'uisfx'

/** Records every call so ordering (mute before disable) can be asserted. */
function fakePlayer () {
  const calls: string[] = []
  const handles: { stopped: boolean }[] = []
  const player = {
    unlock: vi.fn(async () => { calls.push('unlock'); return true }),
    play: vi.fn((cue: string, options?: { loop?: boolean }) => {
      calls.push(`play:${cue}${options?.loop ? ':loop' : ''}`)
      const handle = { stopped: false, stop () { this.stopped = true; calls.push(`stop:${cue}`) }, ended: Promise.resolve() }
      handles.push(handle)
      return handle
    }),
    preload: vi.fn(async () => {}),
    setPack: vi.fn(), getPack: vi.fn(() => SFX_PACK),
    setVolume: vi.fn((v: number) => { calls.push(`volume:${v}`) }),
    getVolume: vi.fn(() => 0.7),
    setEnabled: vi.fn((v: boolean) => { calls.push(`enabled:${v}`) }),
    isEnabled: vi.fn(() => true),
    stopAll: vi.fn(() => { calls.push('stopAll') }),
    destroy: vi.fn(async () => { calls.push('destroy') }),
  }
  return { player: player as unknown as UISFXPlayer, calls, handles, spy: player }
}

function memoryStorage (seed: Record<string, string> = {}): SfxStorage & { data: Map<string, string> } {
  const data = new Map(Object.entries(seed))
  return { data, getItem: k => data.get(k) ?? null, setItem: (k, v) => { data.set(k, v) } }
}

/** Unlock resolves on a microtask; flush it. */
const flush = () => new Promise<void>(r => setTimeout(r, 0))

describe('sfx service — audio unlock', () => {
  it('suppresses async cues until a gesture has unlocked audio', async () => {
    const { player, spy } = fakePlayer()
    const sfx = createSfxService(player, memoryStorage())

    expect(sfx.playAsync('success')).toBeNull()
    expect(spy.play).not.toHaveBeenCalled()

    sfx.unlock()
    await flush()

    expect(sfx.isUnlocked()).toBe(true)
    sfx.playAsync('success')
    expect(spy.play).toHaveBeenCalledWith('success', undefined)
  })

  it('plays gesture cues immediately and unlocks as a side effect', () => {
    const { player, spy } = fakePlayer()
    const sfx = createSfxService(player, memoryStorage())
    sfx.play('select')
    expect(spy.play).toHaveBeenCalledWith('select', undefined)
    expect(spy.unlock).toHaveBeenCalledTimes(1)
  })

  it('only attempts to unlock once', async () => {
    const { player, spy } = fakePlayer()
    const sfx = createSfxService(player, memoryStorage())
    sfx.unlock(); sfx.unlock()
    await flush()
    sfx.unlock()
    expect(spy.unlock).toHaveBeenCalledTimes(1)
  })

  it('tolerates play() returning null', () => {
    const { player, spy } = fakePlayer()
    ;(spy.play as unknown as { mockReturnValue: (v: null) => void }).mockReturnValue(null)
    const sfx = createSfxService(player, memoryStorage())
    expect(sfx.play('success')).toBeNull()
    expect(() => sfx.startLoop('x', 'loading')).not.toThrow()
  })
})

describe('sfx service — loops', () => {
  async function unlocked () {
    const f = fakePlayer()
    const sfx = createSfxService(f.player, memoryStorage())
    sfx.unlock(); await flush()
    return { ...f, sfx }
  }

  it('does not start a loop while audio is locked', () => {
    const { player, spy } = fakePlayer()
    const sfx = createSfxService(player, memoryStorage())
    sfx.startLoop('fetch', 'loading')
    expect(spy.play).not.toHaveBeenCalled()
    expect(sfx.activeLoopCount()).toBe(0)
  })

  it('is idempotent — repeated starts do not stack voices', async () => {
    const { sfx, spy } = await unlocked()
    sfx.startLoop('fetch', 'loading')
    sfx.startLoop('fetch', 'loading')
    sfx.startLoop('fetch', 'loading')
    expect(spy.play).toHaveBeenCalledTimes(1)
    expect(sfx.activeLoopCount()).toBe(1)
  })

  it('stops the loop and clears its retained handle', async () => {
    const { sfx, handles } = await unlocked()
    sfx.startLoop('fetch', 'loading')
    sfx.stopLoop('fetch')
    expect(handles[0].stopped).toBe(true)
    expect(sfx.activeLoopCount()).toBe(0)
    // stopping twice must be safe (finally paths can double-fire)
    expect(() => sfx.stopLoop('fetch')).not.toThrow()
  })

  it('restarts cleanly after being stopped', async () => {
    const { sfx, spy } = await unlocked()
    sfx.startLoop('fetch', 'loading')
    sfx.stopLoop('fetch')
    sfx.startLoop('fetch', 'loading')
    expect(spy.play).toHaveBeenCalledTimes(2)
    expect(sfx.activeLoopCount()).toBe(1)
  })

  it('stopAllLoops clears every retained handle', async () => {
    const { sfx, handles } = await unlocked()
    sfx.startLoop('a', 'loading')
    sfx.startLoop('b', 'processing')
    sfx.stopAllLoops()
    expect(handles.every(h => h.stopped)).toBe(true)
    expect(sfx.activeLoopCount()).toBe(0)
  })

  it('teardown stops loops and destroys the player', async () => {
    const { sfx, calls, handles } = await unlocked()
    sfx.startLoop('a', 'loading')
    await sfx.teardown()
    expect(handles[0].stopped).toBe(true)
    expect(sfx.activeLoopCount()).toBe(0)
    expect(calls).toContain('destroy')
    expect(calls.indexOf('stop:loading')).toBeLessThan(calls.indexOf('destroy'))
  })
})

describe('sfx service — mute is immediate and persistent', () => {
  it('stops loops and voices BEFORE disabling the player', async () => {
    const { player, calls } = fakePlayer()
    const sfx = createSfxService(player, memoryStorage())
    sfx.unlock(); await flush()
    sfx.startLoop('fetch', 'loading')

    sfx.setEnabled(false)

    const stopIdx = calls.indexOf('stop:loading')
    const stopAllIdx = calls.indexOf('stopAll')
    const disableIdx = calls.indexOf('enabled:false')
    expect(stopIdx).toBeGreaterThanOrEqual(0)
    expect(stopIdx).toBeLessThan(stopAllIdx)
    expect(stopAllIdx).toBeLessThan(disableIdx)
    expect(sfx.activeLoopCount()).toBe(0)
  })

  it('plays nothing at all once muted', async () => {
    const { player, spy } = fakePlayer()
    const sfx = createSfxService(player, memoryStorage())
    sfx.unlock(); await flush()
    sfx.setEnabled(false)
    spy.play.mockClear()

    sfx.play('success')
    sfx.playAsync('error')
    sfx.throttled('select')
    sfx.startLoop('x', 'loading')
    expect(spy.play).not.toHaveBeenCalled()
  })

  it('persists the preference and rehydrates it on a fresh service', () => {
    const storage = memoryStorage()
    const a = createSfxService(fakePlayer().player, storage)
    a.setEnabled(false)
    expect(storage.data.get(SFX_KEYS.enabled)).toBe('false')

    const b = createSfxService(fakePlayer().player, storage)
    expect(b.enabled.value).toBe(false)
  })

  it('persists and clamps volume', () => {
    const storage = memoryStorage()
    const sfx = createSfxService(fakePlayer().player, storage)
    sfx.setVolume(0.35)
    expect(storage.data.get(SFX_KEYS.volume)).toBe('0.35')
    sfx.setVolume(9)
    expect(sfx.volume.value).toBe(1)
    sfx.setVolume(-2)
    expect(sfx.volume.value).toBe(0)
  })

  it('defaults to enabled at 0.7 but honours stored values', () => {
    const fresh = createSfxService(fakePlayer().player, memoryStorage())
    expect(fresh.enabled.value).toBe(true)
    expect(fresh.volume.value).toBe(0.7)

    const stored = createSfxService(fakePlayer().player, memoryStorage({
      [SFX_KEYS.enabled]: 'false', [SFX_KEYS.volume]: '0.2',
    }))
    expect(stored.enabled.value).toBe(false)
    expect(stored.volume.value).toBe(0.2)
  })

  it('survives storage that throws', () => {
    const hostile: SfxStorage = {
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('blocked') },
    }
    const sfx = createSfxService(fakePlayer().player, hostile)
    expect(sfx.enabled.value).toBe(true)
    expect(() => sfx.setEnabled(false)).not.toThrow()
  })
})

const CATALOG = {
  packs: [
    { name: 'zen', label: 'Zen', description: '' },
    { name: 'glass', label: 'Glass', description: '' },
    { name: 'minimal', label: 'Minimal', description: '' },
  ],
  cues: [{ name: 'select', label: 'Select', category: 'selection', description: '' }],
} as unknown as SfxCatalog

describe('sfx service — pack selection', () => {
  it('defaults to the chosen pack when nothing is stored', () => {
    const sfx = createSfxService(fakePlayer().player, memoryStorage(), CATALOG)
    expect(sfx.pack.value).toBe(SFX_PACK)
    expect(SFX_PACK).toBe('zen')
  })

  it('switches pack, persists it, and auditions the change', () => {
    const storage = memoryStorage()
    const { player, spy } = fakePlayer()
    const sfx = createSfxService(player, storage, CATALOG)

    sfx.setPack('glass')

    expect(sfx.pack.value).toBe('glass')
    expect(spy.setPack).toHaveBeenCalledWith('glass')
    expect(storage.data.get(SFX_KEYS.pack)).toBe('glass')
    // changing the pack should immediately demonstrate it
    expect(spy.play).toHaveBeenCalledWith('select', undefined)
  })

  it('rehydrates a stored pack on a fresh service', () => {
    const storage = memoryStorage({ [SFX_KEYS.pack]: 'minimal' })
    expect(createSfxService(fakePlayer().player, storage, CATALOG).pack.value).toBe('minimal')
  })

  it('falls back to the default when the stored pack is not in the catalog', () => {
    const storage = memoryStorage({ [SFX_KEYS.pack]: 'not-a-real-pack' })
    expect(createSfxService(fakePlayer().player, storage, CATALOG).pack.value).toBe(SFX_PACK)
  })

  it('refuses to set a pack the catalog does not know', () => {
    const { player, spy } = fakePlayer()
    const sfx = createSfxService(player, memoryStorage(), CATALOG)
    sfx.setPack('bogus' as never)
    expect(sfx.pack.value).toBe(SFX_PACK)
    expect(spy.setPack).not.toHaveBeenCalled()
  })

  it('re-selecting the active pack is a no-op', () => {
    const { player, spy } = fakePlayer()
    const sfx = createSfxService(player, memoryStorage(), CATALOG)
    sfx.setPack(SFX_PACK)
    expect(spy.setPack).not.toHaveBeenCalled()
    expect(spy.play).not.toHaveBeenCalled()
  })
})

describe('sfx service — reset', () => {
  it('restores every default and persists them', async () => {
    const storage = memoryStorage()
    const { player, calls } = fakePlayer()
    const sfx = createSfxService(player, storage, CATALOG)

    sfx.unlock(); await flush()
    sfx.setPack('glass')
    sfx.setVolume(0.1)
    sfx.setTypingEnabled(true)
    sfx.startLoop('busy', 'processing')
    sfx.setEnabled(false)

    sfx.resetPreferences()

    expect(sfx.enabled.value).toBe(SFX_DEFAULTS.enabled)
    expect(sfx.volume.value).toBe(SFX_DEFAULTS.volume)
    expect(sfx.typingEnabled.value).toBe(SFX_DEFAULTS.typing)
    expect(sfx.pack.value).toBe(SFX_DEFAULTS.pack)
    expect(storage.data.get(SFX_KEYS.pack)).toBe(SFX_DEFAULTS.pack)
    expect(storage.data.get(SFX_KEYS.volume)).toBe(String(SFX_DEFAULTS.volume))
    expect(storage.data.get(SFX_KEYS.enabled)).toBe('true')
    // Only *loop* handles are retained and stopped; one-shots end on their own.
    expect(calls).toContain('stop:processing')
    expect(sfx.activeLoopCount()).toBe(0)
  })

  it('survives a reset on a fresh service', () => {
    const sfx = createSfxService(fakePlayer().player, memoryStorage(), CATALOG)
    expect(() => sfx.resetPreferences()).not.toThrow()
  })
})

describe('sfx service — typing and throttling', () => {
  const evt = (tagName: string, type?: string) =>
    ({ target: { tagName, type } } as unknown as Event)

  it('is silent unless keyboard sonification is opted into', () => {
    const { player, spy } = fakePlayer()
    const sfx = createSfxService(player, memoryStorage())
    expect(sfx.typingEnabled.value).toBe(false)
    sfx.typing(evt('INPUT', 'number'))
    expect(spy.play).not.toHaveBeenCalled()
  })

  it('plays once per text-entry event, at low volume, unthrottled', () => {
    const { player, spy } = fakePlayer()
    const sfx = createSfxService(player, memoryStorage())
    sfx.setTypingEnabled(true)
    sfx.typing(evt('INPUT', 'number'))
    sfx.typing(evt('INPUT', 'text'))
    sfx.typing(evt('TEXTAREA'))
    expect(spy.play).toHaveBeenCalledTimes(3)
    expect(spy.play).toHaveBeenCalledWith('typing', { volume: 0.25, retrigger: 'restart' })
  })

  it('ignores non-text inputs so sliders and checkboxes stay silent', () => {
    const { player, spy } = fakePlayer()
    const sfx = createSfxService(player, memoryStorage())
    sfx.setTypingEnabled(true)
    for (const t of ['range', 'checkbox', 'radio', 'button', 'submit', 'file', 'color']) {
      sfx.typing(evt('INPUT', t))
    }
    sfx.typing(evt('DIV'))
    expect(spy.play).not.toHaveBeenCalled()
  })

  it('throttles rapid repeats of the same cue', () => {
    const { player, spy } = fakePlayer()
    const sfx = createSfxService(player, memoryStorage())
    for (let i = 0; i < 12; i++) sfx.throttled('snap', 5000)
    expect(spy.play).toHaveBeenCalledTimes(1)
  })

  it('throttles each cue independently', () => {
    const { player, spy } = fakePlayer()
    const sfx = createSfxService(player, memoryStorage())
    sfx.throttled('snap', 5000)
    sfx.throttled('select', 5000)
    expect(spy.play).toHaveBeenCalledTimes(2)
  })
})

describe('sfx service — SSR / no-plugin safety', () => {
  it('the no-op never throws and reports a silent, locked state', async () => {
    const noop = createSfxNoop()
    expect(noop.play('success')).toBeNull()
    expect(noop.playAsync('success')).toBeNull()
    expect(noop.throttled('select')).toBeNull()
    expect(noop.isUnlocked()).toBe(false)
    expect(noop.activeLoopCount()).toBe(0)
    expect(noop.pack.value).toBe(SFX_PACK)
    expect(noop.catalog.packs).toEqual([])
    expect(noop.catalog.cues).toEqual([])
    expect(() => {
      noop.typing({ target: { tagName: 'INPUT' } } as unknown as Event)
      noop.startLoop('a', 'loading')
      noop.stopLoop('a')
      noop.stopAllLoops()
      noop.unlock()
      noop.setEnabled(true)
      noop.setVolume(1)
      noop.setTypingEnabled(true)
      noop.setPack('zen')
      noop.resetPreferences()
    }).not.toThrow()
    await expect(noop.teardown()).resolves.toBeUndefined()
  })
})
