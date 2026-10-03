/**
 * Light / dark / follow-the-system theme for pages that opt into dark mode.
 *
 * The dark palette lives in `layouts/default.vue` under `html.theme-dark`, so
 * the site nav, footer and page background follow too. The class is removed
 * when the page unmounts, since pages without dark styles stay light. The
 * choice is shared across pages via localStorage.
 */
export type ThemePref = 'light' | 'system' | 'dark'

const THEME_KEY = 'site_theme'
/** Where the Phone Battery page stored the choice before it was shared. */
const LEGACY_KEY = 'pb_theme'
const DARK_CLASS = 'theme-dark'
const VT_CLASS = 'theme-vt'

const isPref = (v: unknown): v is ThemePref => v === 'light' || v === 'dark' || v === 'system'

export function usePageTheme() {
  const sfx = useSfx()
  const themePref = ref<ThemePref>('system')
  const systemDark = ref(false)
  const isDark = computed(() => themePref.value === 'dark' || (themePref.value === 'system' && systemDark.value))

  const apply = () => document.documentElement.classList.toggle(DARK_CLASS, isDark.value)

  let darkQuery: MediaQueryList | null = null
  const onSystemTheme = (e: MediaQueryListEvent) => { systemDark.value = e.matches }

  onMounted(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY) ?? localStorage.getItem(LEGACY_KEY)
      if (isPref(saved)) themePref.value = saved
    } catch { /* storage unavailable */ }
    darkQuery = window.matchMedia('(prefers-color-scheme: dark)')
    systemDark.value = darkQuery.matches
    darkQuery.addEventListener('change', onSystemTheme)
    apply()
  })

  watch(isDark, apply)

  onBeforeUnmount(() => {
    darkQuery?.removeEventListener('change', onSystemTheme)
    document.documentElement.classList.remove(DARK_CLASS, VT_CLASS)
  })

  /** Switch theme, revealing the new one as a circle growing from the click. */
  async function setTheme(next: ThemePref, e?: MouseEvent) {
    if (themePref.value === next) return
    try { localStorage.setItem(THEME_KEY, next) } catch { /* ignore */ }
    const willBeDark = next === 'dark' || (next === 'system' && systemDark.value)
    const changes = willBeDark !== isDark.value
    const commit = () => {
      themePref.value = next
      apply()
    }
    sfx.play(willBeDark ? 'toggle-on' : 'toggle-off')

    const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void>, finished: Promise<void> } }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Only animate when the colours actually change (e.g. not light → system-light).
    if (!doc.startViewTransition || reduce || !changes || !e) return commit()

    const x = e.clientX
    const y = e.clientY
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
    document.documentElement.classList.add(VT_CLASS)
    const t = doc.startViewTransition(commit)
    try {
      await t.ready
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 600, easing: 'cubic-bezier(.2, .8, .2, 1)', pseudoElement: '::view-transition-new(root)' },
      )
      await t.finished
    } finally {
      document.documentElement.classList.remove(VT_CLASS)
    }
  }

  return { themePref, isDark, setTheme }
}
