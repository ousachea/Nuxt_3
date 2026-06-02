<script setup lang="ts">
const props = defineProps<{ active: string; streak: number; level: number; xp: number }>()
const emit  = defineEmits<{ (e: 'change', tab: string): void }>()

const tabs = [
  { id: 'dashboard',     icon: '⬡', label: 'Dashboard'   },
  { id: 'expenses',      icon: '☰', label: 'Expenses'    },
  { id: 'analytics',    icon: '◫', label: 'Analytics'   },
  { id: 'achievements', icon: '◈', label: 'Achievements' },
  { id: 'settings',     icon: '◎', label: 'Settings'    },
]
const levelProgress = computed(() => (props.xp % 500) / 5)
</script>

<template>
  <aside class="sidebar">
    <div class="brand">
      <div class="brand-mark">◈</div>
      <div>
        <div class="brand-name">BudgetApp</div>
        <div class="brand-sub">Daily Planner</div>
      </div>
    </div>

    <nav class="nav">
      <button v-for="tab in tabs" :key="tab.id"
              class="nav-item" :class="{ active: active === tab.id }"
              @click="emit('change', tab.id)">
        <span class="nav-bar" v-if="active === tab.id"/>
        <span class="nav-icon">{{ tab.icon }}</span>
        <span class="nav-label">{{ tab.label }}</span>
      </button>
    </nav>

    <div class="flex-1"/>

    <div class="sidebar-footer">
      <div class="level-row">
        <span class="level-badge">Lv {{ level }}</span>
        <div class="level-track"><div class="level-fill" :style="{ width: levelProgress + '%' }"/></div>
        <span class="xp-val">{{ xp }}xp</span>
      </div>
      <div class="streak-pill" :class="{ 'streak-active': streak > 0 }">
        <span class="streak-em">{{ streak > 0 ? '🔥' : '💤' }}</span>
        <div>
          <div class="streak-n">{{ streak }}-day streak</div>
          <div class="streak-s">{{ streak > 0 ? 'Keep it going!' : 'Start today' }}</div>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 220px;
  min-height: 100dvh;
  height: 100dvh;
  background: linear-gradient(180deg, #0b0b1c 0%, #080814 100%);
  border-right: 1px solid rgba(255,255,255,0.06);
  display: flex;
  flex-direction: column;
  padding: 0 10px 16px;
  position: sticky;
  top: 0;
  flex-shrink: 0;
  overflow-y: auto;
}
.flex-1 { flex: 1; }

.brand {
  display: flex; align-items: center; gap: 10px;
  padding: 20px 8px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  margin-bottom: 8px;
}
.brand-mark {
  width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
  background: var(--grad);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; color: white;
  box-shadow: 0 4px 16px rgba(99,102,241,.4);
}
.brand-name { font-size: 14px; font-weight: 800; color: var(--text); letter-spacing: -.3px; }
.brand-sub  { font-size: 10px; color: var(--text3); margin-top: 1px; font-weight: 500; }

.nav { display: flex; flex-direction: column; gap: 2px; }
.nav-item {
  position: relative;
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 10px 12px;
  border: none; background: transparent; border-radius: 12px;
  cursor: pointer; text-align: left; overflow: hidden;
  transition: background .15s;
}
.nav-item:hover  { background: rgba(255,255,255,.04); }
.nav-item.active { background: rgba(129,140,248,.12); }
.nav-bar {
  position: absolute; left: 0; top: 22%; bottom: 22%;
  width: 3px; border-radius: 0 3px 3px 0;
  background: linear-gradient(180deg, var(--indigo), var(--purple));
  box-shadow: 0 0 8px rgba(129,140,248,.5);
}
.nav-icon  { font-size: 17px; color: var(--text3); transition: color .15s; }
.nav-label { font-size: 13px; font-weight: 500; color: var(--text3); transition: color .15s; }
.nav-item.active .nav-icon  { color: var(--indigo); }
.nav-item.active .nav-label { color: var(--text); font-weight: 700; }

.sidebar-footer {
  padding-top: 14px;
  border-top: 1px solid rgba(255,255,255,.05);
  display: flex; flex-direction: column; gap: 10px;
}
.level-row  { display: flex; align-items: center; gap: 6px; }
.level-badge { font-size: 10px; font-weight: 800; color: var(--indigo); white-space: nowrap; }
.level-track { flex: 1; height: 4px; background: var(--border); border-radius: 2px; overflow: hidden; }
.level-fill  { height: 100%; background: var(--grad); border-radius: 2px; transition: width .6s; }
.xp-val { font-size: 10px; color: var(--text3); white-space: nowrap; font-weight: 600; }

.streak-pill {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 12px;
  background: var(--surface2);
  border: 1px solid var(--border);
  transition: all .2s;
}
.streak-active {
  background: rgba(251,146,60,.08);
  border-color: rgba(251,146,60,.2);
  box-shadow: 0 0 20px rgba(251,146,60,.07);
}
.streak-em { font-size: 20px; }
.streak-n  { font-size: 12px; font-weight: 700; color: var(--text); }
.streak-s  { font-size: 10px; color: var(--text3); margin-top: 1px; }
</style>
