<script setup>
useHead({
  bodyAttrs: { style: 'background:#06060d;margin:0;padding:0;' },
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap' },
  ]
})
</script>

<template>
  <div class="budget-shell">
    <slot />
  </div>
</template>

<style>
body { background: #06060d !important; color: #f0f0fe; }

.budget-shell {
  /* Color tokens */
  --bg:       #06060d;
  --surface:  #0e0e22;
  --surface2: #131332;
  --border:   #1e1e3c;
  --border2:  #28285a;
  --text:     #f0f0fe;
  --text2:    #9090c0;
  --text3:    #4e4e78;
  --green:    #34d399;
  --yellow:   #fbbf24;
  --orange:   #fb923c;
  --red:      #f87171;
  --indigo:   #818cf8;
  --purple:   #c084fc;
  --grad:     linear-gradient(135deg, #6366f1, #8b5cf6);

  /* Depth tokens */
  --card-bg:         linear-gradient(145deg, #161640 0%, #0d0d26 100%);
  --card-border:     rgba(255,255,255,0.08);
  --card-border-top: rgba(255,255,255,0.16);
  --card-shadow:     0 4px 28px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06);
  --card-radius:     18px;

  min-height: 100dvh;
  background: var(--bg);
  color: var(--text);
  font-family: 'Outfit', -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
}
</style>
