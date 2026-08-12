<script setup>
// Chrome shared by every laid-out page, so the nav cue lives here rather than
// being repeated per page.
const sfx = useSfx()
</script>

<template>
  <div class="site">
    <header class="nav">
      <NuxtLink
        to="/"
        class="nav-logo"
        @click="sfx.play('back')"
        @pointerenter="sfx.throttled('hover', 400)"
      >
        <svg class="nav-home-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 6.5L7 1l6 5.5V13H9.5v-3.5h-5V13H1V6.5z" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round"/>
        </svg>
        Home
      </NuxtLink>
      <SoundToggle />
    </header>
    <main class="main">
      <slot />
    </main>
    <footer class="footer">
      <span>© {{ new Date().getFullYear() }} — All rights reserved.</span>
    </footer>
  </div>
</template>

<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --black: #0d0d0d;
  --white: #fafaf9;
  --gray: #888;
  --light: #f0efec;
  --accent: #1a1a1a;
  --border: #e5e3df;
  --font-serif: 'Cormorant Garamond', Georgia, serif;
  --font-sans: 'DM Sans', system-ui, sans-serif;
  --max: 960px;
}

@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

html { font-size: 16px; scroll-behavior: smooth; }

body {
  background: var(--white);
  color: var(--black);
  font-family: var(--font-sans);
  font-weight: 300;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

a { color: inherit; text-decoration: none; }

.site {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* NAV */
.nav {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  padding: 1.25rem 2.5rem;
  background: rgba(250, 250, 249, 0.88);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gray);
  transition: color 0.2s;
}

.nav-logo:hover { color: var(--black); }

.nav-home-icon { flex-shrink: 0; }

/* MAIN */
.main { flex: 1; }

/* FOOTER */
.footer {
  padding: 2rem 2.5rem;
  border-top: 1px solid var(--border);
  font-size: 0.75rem;
  color: var(--gray);
  letter-spacing: 0.04em;
}

/* SHARED PAGE STYLES */
.page { padding: 5rem 2.5rem; max-width: var(--max); margin: 0 auto; }

.section-label {
  font-size: 0.6875rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--gray);
  margin-bottom: 1.25rem;
}

.divider {
  width: 2rem;
  height: 1px;
  background: var(--black);
  margin: 2rem 0;
}
</style>