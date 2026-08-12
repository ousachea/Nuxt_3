import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { cueNames, packNames } from 'uisfx'
import { SFX_PACK } from '../utils/sfx'

const ROOT = join(__dirname, '..')
const SONIFIED = [
  'pages/salary.vue', 'pages/gold.vue', 'pages/setup.vue', 'pages/Phone.vue',
  'pages/sound.vue', 'components/SoundToggle.vue',
]
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8')

/** Every cue string passed to play/playAsync/throttled/startLoop. */
function cuesUsedIn (source: string): string[] {
  const found = new Set<string>()
  const call = /sfx\.(?:play|playAsync|throttled)\(\s*'([^']+)'/g
  const loop = /sfx\.startLoop\(\s*'[^']+'\s*,\s*'([^']+)'/g
  const ternary = /sfx\.play\(\s*\w+[^)]*\?\s*'([^']+)'\s*:\s*'([^']+)'/g
  for (const m of source.matchAll(call)) found.add(m[1])
  for (const m of source.matchAll(loop)) found.add(m[1])
  for (const m of source.matchAll(ternary)) { found.add(m[1]); found.add(m[2]) }
  return [...found]
}

describe('pack selection', () => {
  it('uses a pack that exists in the installed catalog', () => {
    expect(packNames).toContain(SFX_PACK)
    expect(SFX_PACK).toBe('zen')
  })
})

describe('cue vocabulary', () => {
  it('every cue played anywhere in the product is a real catalog cue', () => {
    const invalid: string[] = []
    for (const file of SONIFIED) {
      for (const cue of cuesUsedIn(read(file))) {
        if (!(cueNames as string[]).includes(cue)) invalid.push(`${file}: ${cue}`)
      }
    }
    expect(invalid).toEqual([])
  })

  it('only the six loop cues are ever started as loops', () => {
    const LOOPS = ['loading', 'processing', 'recording', 'connecting', 'scanning', 'streaming']
    for (const file of SONIFIED) {
      for (const m of read(file).matchAll(/sfx\.startLoop\(\s*'[^']+'\s*,\s*'([^']+)'/g)) {
        expect(LOOPS).toContain(m[1])
      }
    }
  })

  it('never plays a loop cue as a one-shot', () => {
    for (const file of SONIFIED) {
      for (const m of read(file).matchAll(/sfx\.(?:play|playAsync)\(\s*'([^']+)'/g)) {
        expect(['loading', 'processing', 'recording', 'connecting', 'scanning', 'streaming'])
          .not.toContain(m[1])
      }
    }
  })
})

describe('no duplicate playback across input modalities', () => {
  it('cues are bound to @click only, never also to key handlers', () => {
    // A <button> fires click for mouse, touch AND Enter/Space, so binding a
    // key handler alongside would double-play for keyboard users.
    const offenders: string[] = []
    for (const file of SONIFIED) {
      for (const line of read(file).split('\n')) {
        if (!line.includes('sfx.')) continue
        if (/@(keydown|keyup|keypress)/.test(line)) offenders.push(`${file}: ${line.trim()}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('does not bind both a pointer and a click cue on one element', () => {
    const offenders: string[] = []
    for (const file of SONIFIED) {
      for (const line of read(file).split('\n')) {
        if (/@(pointerdown|mousedown|touchstart)[^"]*sfx\./.test(line) && /@click[^"]*sfx\./.test(line)) {
          offenders.push(`${file}: ${line.trim()}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })
})

describe('loop lifecycle in real call sites', () => {
  it('every startLoop has a matching stopLoop for the same key', () => {
    for (const file of SONIFIED) {
      const source = read(file)
      const started = [...source.matchAll(/sfx\.startLoop\(\s*'([^']+)'/g)].map(m => m[1])
      const stopped = [...source.matchAll(/sfx\.stopLoop\(\s*'([^']+)'/g)].map(m => m[1])
      for (const key of started) expect(stopped, `${file} leaks loop "${key}"`).toContain(key)
    }
  })

  it('the gold price loop stops on every exit path, not just success', () => {
    const source = read('pages/gold.vue')
    const fn = source.slice(source.indexOf('async function fetchPrice()'))
    const body = fn.slice(0, fn.indexOf('\n// ─── Purchases'))
    expect(body).toContain("sfx.startLoop('gold-price', 'loading')")
    // The stop sits after `loading.value = false`, the single shared exit
    // that both the success and the catch/fallback paths fall through to.
    expect(body).toContain("sfx.stopLoop('gold-price')")
    expect(body.lastIndexOf("sfx.stopLoop('gold-price')"))
      .toBeGreaterThan(body.lastIndexOf("sfx.startLoop('gold-price', 'loading')"))
  })
})

describe('async outcomes are cued after resolution', () => {
  it('gold routes all outcome cues through flash(), avoiding stacked cues', () => {
    const source = read('pages/gold.vue')
    const flashFn = source.slice(source.indexOf("function flash(msg, type = 'success')"))
    expect(flashFn.slice(0, 400)).toContain("sfx.playAsync(type === 'error' ? 'error' : 'success')")
    // fetchPrice must not also fire its own success — flash() already does.
    const fetchFn = source.slice(source.indexOf('async function fetchPrice()'))
    const body = fetchFn.slice(0, fetchFn.indexOf('\n// ─── Purchases'))
    expect(body).not.toContain("sfx.playAsync('success')")
  })

  it('clipboard cues fire after the write resolves, not before', () => {
    for (const file of ['pages/setup.vue', 'pages/Phone.vue']) {
      const source = read(file)
      const write = source.indexOf('clipboard.writeText')
      const copy = source.indexOf("sfx.playAsync('copy')")
      expect(copy, `${file}`).toBeGreaterThan(write)
    }
  })

  it('destructive cues fire only after the mutation is committed', () => {
    const gold = read('pages/gold.vue')
    const remove = gold.slice(gold.indexOf('function removePurchase'))
    const body = remove.slice(0, remove.indexOf('\n}') + 2)
    expect(body.indexOf("sfx.play('delete')")).toBeGreaterThan(body.indexOf('splice'))
  })
})

describe('sound settings page', () => {
  it('reads the catalog from the service, never importing uisfx directly', () => {
    // A direct import would pull the library into the server bundle.
    const source = read('pages/sound.vue')
    expect(source).not.toMatch(/from ['"]uisfx['"]/)
    expect(source).toContain('sfx.catalog.packs')
    expect(source).toContain('sfx.catalog.cues')
  })

  it('stops its preview loop when leaving the page', () => {
    const source = read('pages/sound.vue')
    expect(source).toContain('onBeforeUnmount(stopPreviewLoop)')
    expect(source).toContain('sfx.stopLoop(PREVIEW_KEY)')
  })

  it('auditions loop cues as toggles under a single reusable key', () => {
    const source = read('pages/sound.vue')
    const keys = [...source.matchAll(/sfx\.startLoop\(\s*([A-Za-z_]+)/g)].map(m => m[1])
    expect(new Set(keys).size).toBe(1)
    expect(keys[0]).toBe('PREVIEW_KEY')
  })

  it('is reachable from the shared toggle', () => {
    expect(read('components/SoundToggle.vue')).toContain('to="/sound"')
  })
})

describe('SSR safety', () => {
  it('the player plugin is client-only', () => {
    const plugins = readdirSync(join(ROOT, 'plugins'))
    expect(plugins).toContain('uisfx.client.ts')
    expect(plugins).not.toContain('uisfx.ts')
  })

  it('the shared service module touches no browser globals at import time', () => {
    const source = read('utils/sfx.ts')
    const topLevel = source
      .split('\n')
      .filter(l => l.length > 0 && !/^\s/.test(l))       // module scope only
      .filter(l => !l.startsWith('import') && !l.startsWith('export type'))
      .join('\n')
    expect(topLevel).not.toMatch(/\b(window|document|localStorage|navigator|AudioContext)\b/)
  })

  it('createUISFX is only ever called from the client plugin', () => {
    const offenders: string[] = []
    for (const dir of ['pages', 'components', 'composables', 'utils', 'layouts']) {
      for (const f of readdirSync(join(ROOT, dir))) {
        if (!/\.(ts|vue)$/.test(f)) continue
        if (read(join(dir, f)).includes('createUISFX(')) offenders.push(`${dir}/${f}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('nothing autoplays: no cue is fired from a lifecycle hook', () => {
    for (const file of SONIFIED) {
      const source = read(file)
      for (const hook of ['onMounted', 'onBeforeMount']) {
        const at = source.indexOf(`${hook}(`)
        if (at === -1) continue
        expect(source.slice(at, at + 400)).not.toMatch(/sfx\.play\(/)
      }
    }
  })
})

describe('remount / teardown cleanup', () => {
  it('the plugin unregisters listeners and tears the player down', () => {
    const source = read('plugins/uisfx.client.ts')
    // Nuxt exposes no runtime app-unmount hook, so HMR dispose is the only
    // real remount path that could leave a second player alive.
    expect(source).toContain('import.meta.hot.dispose(')
    expect(source).toContain("removeEventListener('pointerdown'")
    expect(source).toContain("removeEventListener('keydown'")
    expect(source).toContain("removeEventListener('visibilitychange'")
    expect(source).toContain('await sfx.teardown()')
  })

  it('drops loops when the tab is hidden', () => {
    const source = read('plugins/uisfx.client.ts')
    expect(source).toContain("document.addEventListener('visibilitychange'")
    expect(source).toContain("visibilityState === 'hidden'")
  })

  it('loops are dropped on route change so none outlive their view', () => {
    expect(read('plugins/uisfx.client.ts')).toContain('router.afterEach(() => sfx.stopAllLoops())')
  })
})
