<script setup lang="ts">
/**
 * Light / Auto / Dark segmented switch. Stateless: the page owns the theme
 * (via `usePageTheme`) and passes the click event through so the switch can
 * start the circular reveal from where it was pressed.
 */
import type { ThemePref } from '~/composables/usePageTheme'

defineProps<{ pref: ThemePref }>()
const emit = defineEmits<{ select: [pref: ThemePref, event: MouseEvent] }>()

const OPTIONS: { id: ThemePref, label: string, title: string }[] = [
  { id: 'light', label: 'Light', title: 'Light' },
  { id: 'system', label: 'Auto', title: 'Match system' },
  { id: 'dark', label: 'Dark', title: 'Dark' },
]
</script>

<template>
  <div class="theme-switch" role="radiogroup" aria-label="Theme">
    <button
      v-for="o in OPTIONS"
      :key="o.id"
      type="button"
      role="radio"
      :aria-checked="pref === o.id"
      :class="{ on: pref === o.id }"
      :title="o.title"
      @click="emit('select', o.id, $event)"
    >
      <svg v-if="o.id === 'light'" width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.3" /><path d="M8 1v1.6M8 13.4V15M1 8h1.6M13.4 8H15M3.05 3.05l1.13 1.13M11.82 11.82l1.13 1.13M3.05 12.95l1.13-1.13M11.82 4.18l1.13-1.13" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" /></svg>
      <svg v-else-if="o.id === 'system'" width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6.2" stroke="currentColor" stroke-width="1.3" /><path d="M8 1.8a6.2 6.2 0 0 1 0 12.4z" fill="currentColor" /></svg>
      <svg v-else width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M13.5 10.2A6 6 0 0 1 5.8 2.5a6 6 0 1 0 7.7 7.7z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" /></svg>
      <span>{{ o.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.theme-switch {
  display: inline-grid;
  grid-template-columns: repeat(3, auto);
  gap: 4px;
  padding: 4px;
  border-radius: 10px;
  background: var(--light);
  flex-shrink: 0;
}
button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.8rem;
  border: 0;
  border-radius: 7px;
  background: transparent;
  font: 400 0.8125rem var(--font-sans);
  color: var(--gray);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
button.on {
  background: var(--theme-card);
  color: var(--black);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}
svg { transition: transform 0.45s cubic-bezier(.34, 1.56, .64, 1); }
button.on svg { transform: rotate(-25deg) scale(1.1); }
</style>
