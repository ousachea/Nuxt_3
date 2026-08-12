<template>
  <div class="app-wrapper" @input="sfx.typing($event)">
    <div class="mesh-gradient"></div>

    <div class="container">
      <header class="header">
        <h1 class="title">Workstation Init</h1>
        <p class="subtitle">
          Generate your macOS workstation setup script
        </p>
      </header>

      <main class="steps-grid">
        <!-- Setup Steps -->
        <section
          v-for="(step, index) in staticSteps"
          :key="index"
          class="step-card fade-in"
        >
          <div class="card-header">
            <span class="step-idx">
              {{ String(index + 1).padStart(2, '0') }}
            </span>

            <h2 class="step-label">
              {{ step.title }}
            </h2>
          </div>

          <div class="code-box">
            <code>{{ step.command }}</code>

            <button
              class="copy-btn"
              :class="{ copied: copiedIndex === index }"
              @click="copyToClipboard(step.command, index)"
            >
              {{ copiedIndex === index ? 'Copied' : 'Copy' }}
            </button>
          </div>
        </section>

        <!-- Application Suite -->
        <section class="step-card main-card fade-in" @change="onAppToggle">
          <div class="card-header justify-between">
            <div class="flex-center gap-12">
              <span class="step-idx">04</span>
              <h2 class="step-label">Application Suite</h2>
            </div>

            <div class="actions">
              <button
                class="ghost-btn"
                @click="selectAll"
              >
                Select All
              </button>

              <button
                class="ghost-btn"
                @click="clearAll"
              >
                Clear
              </button>
            </div>
          </div>

          <!-- Search -->
          <div class="toolbar">
            <input
              v-model="search"
              class="search-input"
              placeholder="Search applications..."
            />
          </div>

          <!-- Stats -->
          <div class="stats">
            <span>{{ selectedApps.length }} selected</span>
            <span>{{ allApps.length }} available</span>
          </div>

          <!-- Progress -->
          <div class="progress">
            <div
              class="progress-bar"
              :style="{ width: `${selectionPercent}%` }"
            />
          </div>

          <!-- App Groups -->
          <div
            v-for="(apps, category) in filteredCategories"
            :key="category"
            class="group"
          >
            <template v-if="apps.length">
              <h3 class="group-title">
                {{ category }}
              </h3>

              <div class="chip-grid">
                <label
                  v-for="app in apps"
                  :key="app"
                  class="chip"
                  :class="{ active: selectedApps.includes(app) }"
                  :style="{
                    '--app-color': getAppColor(app),
                    '--app-border': getAppBorderColor(app)
                  }"
                >
                  <input
                    v-model="selectedApps"
                    type="checkbox"
                    :value="app"
                    class="sr-only"
                  />

                  {{ app }}
                </label>
              </div>
            </template>
          </div>

          <!-- Output -->
          <Transition
            name="slide-up"
            mode="out-in"
          >
            <div
              v-if="selectedApps.length === 0"
              class="empty-state"
            >
              Select applications to generate your setup script.
            </div>

            <div
              v-else
              class="output-footer"
            >
              <div class="code-box highlight">
                <code class="wrap">
                  {{ generatedScript }}
                </code>

                <button
                  class="copy-btn primary"
                  :class="{ copied: copiedIndex === 999 }"
                  @click="copyToClipboard(generatedScript, 999)"
                >
                  {{ copiedIndex === 999 ? 'Copied!' : 'Copy Script' }}
                </button>
              </div>
            </div>
          </Transition>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
// Self-contained full-bleed shell: no site nav/footer chrome.
definePageMeta({ layout: false })

import { ref, computed, watch, onMounted } from 'vue'

const staticSteps = [
  {
    title: 'Homebrew',
    command:
      '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
  },
  {
    title: 'Oh My Zsh',
    command:
      'sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"'
  },
  {
    title: 'Hushlogin',
    command: 'touch ~/.hushlogin'
  }
]

const categories = {
  'Dev & Terminal': [
    'figma',
    'keycastr',
    'nucleo',
    'responsively',
    'visual-studio-code'
  ].sort(),

  Productivity: [
    '1password',
    'google-drive',
    'hiddenbar',
    'meetingbar',
    'only-switch',
    'raycast',
    'rectangle'
  ].sort(),

  Communication: [
    'google-chrome',
    'telegram'
  ].sort(),

  Utilities: [
    '4k-video-downloader',
    'folx',
    'iina',
    'ImageOptim',
    'megasync',
    'mylio',
    'omnidisksweeper',
    'pdf-squeezer',
    'shottr',
    'the-unarchiver'
  ].sort()
}

const search = ref('')
const selectedApps = ref([])
const copiedIndex = ref(null)

const allApps = Object.values(categories).flat()

const filteredCategories = computed(() =>
  Object.fromEntries(
    Object.entries(categories).map(([category, apps]) => [
      category,
      apps.filter(app =>
        app.toLowerCase().includes(search.value.toLowerCase())
      )
    ])
  )
)

const selectionPercent = computed(
  () => (selectedApps.value.length / allApps.length) * 100
)

const generatedScript = computed(() => {
  if (!selectedApps.value.length) return ''

  return `#!/bin/bash

echo "Installing Homebrew..."
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

echo "Installing Oh My Zsh..."
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

touch ~/.hushlogin

brew update

brew install --cask \\
${selectedApps.value.map(app => `  ${app}`).join(' \\\n')}
`
})

const sfx = useSfx()

/** App chips are real selections — cue from the resulting checked state. */
const onAppToggle = (event) => {
  const el = event.target
  if (!el || el.type !== 'checkbox') return
  sfx.play(el.checked ? 'check' : 'uncheck')
}

const selectAll = () => {
  selectedApps.value = [...allApps]
  sfx.play('select')
}

const clearAll = () => {
  selectedApps.value = []
  sfx.play('deselect')
}

const copyToClipboard = async (text, index) => {
  try {
    await navigator.clipboard.writeText(text)
    // Only after the write actually resolves.
    sfx.playAsync('copy')

    copiedIndex.value = index

    setTimeout(() => {
      copiedIndex.value = null
    }, 2000)
  } catch (error) {
    sfx.playAsync('error')
    console.error(error)
  }
}

const getHash = str => {
  let hash = 0

  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  return Math.abs(hash)
}

const getAppColor = app => {
  const hue = getHash(app) % 360
  return `hsla(${hue}, 75%, 95%, 1)`
}

const getAppBorderColor = app => {
  const hue = getHash(app) % 360
  return `hsla(${hue}, 75%, 80%, 1)`
}

watch(
  selectedApps,
  value => {
    localStorage.setItem(
      'selected-apps',
      JSON.stringify(value)
    )
  },
  {
    deep: true
  }
)

onMounted(() => {
  const saved = localStorage.getItem('selected-apps')

  if (saved) {
    selectedApps.value = JSON.parse(saved)
  }
})
</script>

<style scoped>
:global(body) {
  margin: 0;
  background: #f8fafc;
  color: #334155;
  font-family: Inter, sans-serif;
}

.app-wrapper {
  min-height: 100vh;
}

.mesh-gradient {
  position: fixed;
  inset: 0;

  background:
    radial-gradient(at 0% 0%, rgba(56, 189, 248, 0.08), transparent 50%),
    radial-gradient(at 100% 0%, rgba(139, 92, 246, 0.08), transparent 50%),
    radial-gradient(at 50% 100%, rgba(20, 184, 166, 0.06), transparent 50%);

  z-index: -1;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 60px 24px;
}

.header {
  text-align: center;
  margin-bottom: 48px;
}

.title {
  margin: 0;
  font-size: 40px;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: #0f172a;
}

.subtitle {
  margin-top: 8px;
  font-size: 14px;
  color: #64748b;
}

.steps-grid {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.step-card {
  background: rgba(255, 255, 255, 0.8);

  backdrop-filter: blur(16px);

  border: 1px solid rgba(255, 255, 255, 0.7);

  border-radius: 20px;

  padding: 24px;

  box-shadow:
    0 8px 30px rgba(15, 23, 42, 0.05),
    0 2px 8px rgba(15, 23, 42, 0.03);

  transition: all 0.25s ease;
}

.step-card:hover {
  transform: translateY(-4px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.step-idx {
  font-family: monospace;
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
}

.step-label {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.toolbar {
  margin-bottom: 16px;
}

.search-input {
  width: 100%;
  height: 44px;

  padding: 0 14px;

  border: 1px solid #e2e8f0;
  border-radius: 12px;

  background: white;

  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: #14b8a6;
  box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.12);
}

.stats {
  display: flex;
  justify-content: space-between;

  margin-bottom: 12px;

  font-size: 12px;
  color: #64748b;
}

.progress {
  margin-bottom: 24px;

  height: 6px;

  border-radius: 999px;
  background: #e2e8f0;

  overflow: hidden;
}

.progress-bar {
  height: 100%;

  background:
    linear-gradient(
      90deg,
      #06b6d4,
      #14b8a6
    );

  transition: width 0.3s ease;
}

.group {
  margin-bottom: 24px;
}

.group-title {
  margin-bottom: 12px;

  text-transform: uppercase;
  letter-spacing: 0.08em;

  font-size: 11px;
  color: #94a3b8;
}

.chip-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  cursor: pointer;

  padding: 8px 14px;

  border-radius: 999px;

  border: 1px solid #e2e8f0;

  background: white;

  font-size: 12px;
  font-weight: 500;

  transition: all 0.2s ease;
}

.chip:hover {
  background: var(--app-color);
  border-color: var(--app-border);
  transform: translateY(-2px);
}

.chip.active {
  background: var(--app-color);
  border-color: var(--app-border);

  font-weight: 600;

  transform: scale(1.04);

  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}

.code-box {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  gap: 12px;

  padding: 14px;

  border-radius: 14px;

  background: #f1f5f9;

  overflow-x: auto;
}

.highlight {
  background: #f0fdfa;
  border: 1px solid #ccfbf1;
}

code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: #334155;
}

.wrap {
  white-space: pre-wrap;
  word-break: break-word;
}

.copy-btn {
  flex-shrink: 0;

  padding: 8px 14px;

  border-radius: 10px;

  border: 1px solid #e2e8f0;

  background: white;

  cursor: pointer;

  font-size: 12px;
  font-weight: 600;

  transition: all 0.2s ease;
}

.copy-btn:hover {
  transform: translateY(-1px);
}

.copy-btn.copied {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.primary {
  background: #0f172a;
  color: white;
  border: none;
}

.empty-state {
  padding: 40px;

  text-align: center;

  border: 2px dashed #e2e8f0;
  border-radius: 16px;

  color: #94a3b8;
}

.ghost-btn {
  cursor: pointer;

  border: none;
  background: transparent;

  color: #64748b;

  font-size: 12px;
  font-weight: 600;
}

.ghost-btn:hover {
  color: #0f172a;
}

.actions {
  display: flex;
  gap: 12px;
}

.justify-between {
  justify-content: space-between;
}

.flex-center {
  display: flex;
  align-items: center;
}

.gap-12 {
  gap: 12px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;

  padding: 0;
  margin: -1px;

  overflow: hidden;

  clip: rect(0, 0, 0, 0);

  border: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.fade-in {
  animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
