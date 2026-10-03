<script setup lang="ts">
/**
 * Small floating dock in the bottom-left corner of every page (mounted once
 * in app.vue): Home and full-screen buttons.
 */
</script>

<template>
  <ClientOnly>
    <div class="dock">
      <HomeButton />
      <FullscreenToggle />
    </div>
  </ClientOnly>
</template>

<style>
/* Unscoped so the buttons (separate components) share the look, and so it
   can follow pages that switched on dark mode (usePageTheme). */
.dock {
  position: fixed;
  left: max(1rem, env(safe-area-inset-left));
  bottom: max(1rem, env(safe-area-inset-bottom));
  z-index: 300;
  display: flex;
  gap: 0.5rem;
}
.dock-btn {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid rgba(127, 127, 127, 0.25);
  border-radius: 50%;
  background: rgba(250, 250, 249, 0.94);
  color: #888;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 6px 20px -8px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  text-decoration: none;
  transition: opacity 0.2s, transform 0.25s cubic-bezier(.34, 1.56, .64, 1), background 0.2s, color 0.2s;
}
.dock-btn:hover,
.dock-btn:focus-visible { color: #0d0d0d; transform: scale(1.08); }
.dock-btn:active { transform: scale(0.94); }
html.theme-dark .dock-btn { background: rgba(26, 26, 25, 0.94); color: #8f8e8a; }
html.theme-dark .dock-btn:hover,
html.theme-dark .dock-btn:focus-visible { color: #ecebe7; }

@media (prefers-reduced-motion: reduce) {
  .dock-btn { transition: none; }
}
</style>
