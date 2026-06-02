<script setup lang="ts">
import type { Achievement } from '~/types/budget'

defineProps<{
  achievements: Achievement[]; streak: number
  level: number; xp: number; levelProgress: number; xpToNextLevel: number
}>()
</script>

<template>
  <div class="tab-root">
    <header class="tab-header">
      <h2 class="tab-title">Achievements</h2>
      <p class="tab-sub">Your progress & rewards</p>
    </header>

    <!-- Top row: streak + xp side-by-side on desktop -->
    <div class="top-grid">
      <!-- Streak -->
      <div class="streak-card">
        <div class="streak-flame" :class="{ pulse: streak > 0 }">{{ streak > 0 ? '🔥' : '💤' }}</div>
        <div class="streak-num">{{ streak }}</div>
        <div class="streak-lbl">Day Streak</div>
        <div class="streak-sub">{{ streak === 0 ? 'Stay under budget to start' : streak >= 7 ? 'Amazing! Keep it up 🚀' : 'Keep going!' }}</div>
      </div>

      <!-- XP / Level -->
      <div class="xp-card">
        <div class="xp-top">
          <div>
            <div class="level-tag">Level {{ level }}</div>
            <div class="level-name">Budget Master</div>
          </div>
          <div class="xp-badge">
            <div class="xp-num">{{ xp }}</div>
            <div class="xp-lbl">Total XP</div>
          </div>
        </div>
        <div class="xp-bar-bg">
          <div class="xp-bar" :style="{ width: levelProgress + '%' }"/>
        </div>
        <div class="xp-footer">
          <span>{{ xp % 500 }} XP this level</span>
          <span>{{ xpToNextLevel }} XP → Level {{ level + 1 }}</span>
        </div>

        <!-- Mini achievement unlocked count -->
        <div class="unlocked-row">
          <div class="unlocked-stat">
            <div class="us-val">{{ achievements.filter(a => a.unlocked).length }}</div>
            <div class="us-lbl">Unlocked</div>
          </div>
          <div class="unlocked-stat">
            <div class="us-val">{{ achievements.length - achievements.filter(a => a.unlocked).length }}</div>
            <div class="us-lbl">Remaining</div>
          </div>
          <div class="unlocked-stat">
            <div class="us-val" style="color:var(--indigo)">{{ Math.round((achievements.filter(a=>a.unlocked).length / achievements.length)*100) }}%</div>
            <div class="us-lbl">Complete</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Achievement grid -->
    <div class="ach-section">
      <div class="section-heading">All Achievements</div>
      <div class="ach-grid">
        <div v-for="a in achievements" :key="a.id"
             class="ach-card" :class="{ 'ach-card--done': a.unlocked }">
          <div class="ach-icon" :class="{ locked: !a.unlocked }">{{ a.icon }}</div>
          <div class="ach-title" :class="{ 'title-locked': !a.unlocked }">{{ a.title }}</div>
          <div class="ach-desc">{{ a.description }}</div>
          <div class="ach-xp" :class="{ 'xp-done': a.unlocked }">
            {{ a.unlocked ? '✓ ' : '+' }}{{ a.xpReward }} XP
          </div>
        </div>
      </div>
    </div>

    <div class="bottom-pad"/>
  </div>
</template>

<style scoped>
.tab-root   { display: flex; flex-direction: column; gap: 14px; }
.tab-header { padding: 24px 0 4px; }
.tab-title  { font-size: 26px; font-weight: 800; color: var(--text); letter-spacing: -.5px; }
.tab-sub    { font-size: 13px; color: var(--text3); margin-top: 3px; }

/* Top grid: mobile = stack, desktop = side-by-side */
.top-grid { display: flex; flex-direction: column; gap: 14px; }

.streak-card {
  background: linear-gradient(135deg, rgba(251,146,60,.12), rgba(251,191,36,.07));
  border: 1px solid rgba(251,146,60,.25);
  border-radius: var(--card-radius); padding: 28px 20px; text-align: center;
}
.streak-flame { font-size: 48px; display: block; margin-bottom: 8px; }
.pulse { animation: beat 1.4s ease-in-out infinite; }
@keyframes beat { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
.streak-num { font-size: 52px; font-weight: 900; color: #fb923c; line-height: 1; letter-spacing: -2px; }
.streak-lbl { font-size: 14px; font-weight: 700; color: var(--text2); margin-top: 4px; }
.streak-sub { font-size: 12px; color: var(--text3); margin-top: 6px; }

.xp-card { background: var(--card-bg); border: 1px solid var(--card-border); border-top-color: var(--card-border-top); box-shadow: var(--card-shadow); border-radius: var(--card-radius); padding: 22px; display: flex; flex-direction: column; gap: 14px; }
.xp-top  { display: flex; align-items: flex-start; justify-content: space-between; }
.level-tag  { font-size: 10px; font-weight: 700; color: var(--indigo); text-transform: uppercase; letter-spacing: .1em; margin-bottom: 4px; }
.level-name { font-size: 20px; font-weight: 800; color: var(--text); }
.xp-badge   { text-align: right; }
.xp-num     { font-size: 30px; font-weight: 800; color: var(--text); font-variant-numeric: tabular-nums; }
.xp-lbl     { font-size: 11px; color: var(--text3); }
.xp-bar-bg  { height: 8px; background: var(--border2); border-radius: 4px; overflow: hidden; }
.xp-bar     { height: 100%; background: linear-gradient(to right,var(--indigo),var(--purple)); border-radius: 4px; transition: width .6s ease; }
.xp-footer  { display: flex; justify-content: space-between; font-size: 11px; color: var(--text3); }
.unlocked-row { display: flex; gap: 8px; padding-top: 4px; border-top: 1px solid var(--border); }
.unlocked-stat { flex: 1; text-align: center; }
.us-val { font-size: 22px; font-weight: 800; color: var(--text); }
.us-lbl { font-size: 10px; color: var(--text3); text-transform: uppercase; letter-spacing: .05em; margin-top: 2px; }

.ach-section { display: flex; flex-direction: column; gap: 12px; }
.section-heading { font-size: 13px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: .08em; padding: 0 2px; }
.ach-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.ach-card { background: var(--card-bg); border: 1px solid var(--card-border); border-top-color: var(--card-border-top); box-shadow: var(--card-shadow); border-radius: var(--card-radius); padding: 16px; }
.ach-card--done { border-color: rgba(129,140,248,.25); background: rgba(129,140,248,.05); }
.ach-icon { font-size: 26px; margin-bottom: 8px; display: block; }
.ach-icon.locked { filter: grayscale(1); opacity: .3; }
.ach-title { font-size: 13px; font-weight: 700; color: var(--text2); margin-bottom: 3px; }
.ach-title.title-locked { color: var(--text3); }
.ach-desc { font-size: 11px; color: var(--text3); line-height: 1.4; margin-bottom: 8px; }
.ach-xp   { font-size: 11px; font-weight: 700; color: var(--text3); }
.ach-xp.xp-done { color: var(--indigo); }

.bottom-pad { height: 88px; }

@media (min-width: 1024px) {
  .top-grid { flex-direction: row; align-items: stretch; }
  .top-grid > * { flex: 1; }
  .ach-grid { grid-template-columns: repeat(3, 1fr); }
  .bottom-pad { height: 40px; }
}
</style>
