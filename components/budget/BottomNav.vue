<script setup lang="ts">
const props = defineProps<{ active: string }>()
const emit = defineEmits<{ (e: 'change', tab: string): void }>()
const tabs = [
  { id: 'dashboard',     icon: '⬡', label: 'Home'      },
  { id: 'expenses',      icon: '☰', label: 'Expenses'  },
  { id: 'analytics',    icon: '◫', label: 'Analytics' },
  { id: 'achievements', icon: '◈', label: 'Rewards'   },
  { id: 'settings',     icon: '◎', label: 'Settings'  },
]
</script>

<template>
  <nav class="nav">
    <button v-for="tab in tabs" :key="tab.id"
            class="tab" :class="{ active: active === tab.id }"
            @click="emit('change', tab.id)">
      <span class="t-icon">{{ tab.icon }}</span>
      <span class="t-lbl">{{ tab.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.nav {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 50; display: flex;
  background: rgba(6,6,13,.97);
  backdrop-filter: blur(24px) saturate(200%);
  border-top: 1px solid rgba(255,255,255,0.07);
  padding: 8px 4px max(10px, env(safe-area-inset-bottom));
  box-shadow: 0 -4px 40px rgba(0,0,0,.5);
}
.tab {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
  padding: 6px 2px; border: none; background: transparent; cursor: pointer; border-radius: 12px;
  transition: all .15s;
}
.t-icon { font-size: 20px; line-height: 1; color: var(--text3); transition: all .2s; }
.t-lbl  { font-size: 9px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--text3); transition: color .2s; }
.tab.active .t-icon { color: var(--indigo); transform: scale(1.18); filter: drop-shadow(0 0 6px rgba(129,140,248,.5)); }
.tab.active .t-lbl  { color: var(--indigo); }
.tab:active .t-icon { transform: scale(.88); }
</style>
