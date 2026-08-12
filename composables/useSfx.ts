import { createSfxNoop, type SfxService } from '~/utils/sfx'

let noop: SfxService | null = null

/**
 * Access the shared UI sound player.
 *
 * Returns an inert no-op when the client plugin has not provided one —
 * during SSR/prerender, or in a unit test — so callers never need to
 * null-check before playing a cue.
 */
export function useSfx (): SfxService {
  const provided = useNuxtApp().$sfx as SfxService | undefined
  if (provided) return provided
  noop ??= createSfxNoop()
  return noop
}
