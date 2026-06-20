<template>
    <div class="app" :class="{ dark: isDark }">
        <!-- Screensaver -->
        <transition name="ss-fade">
            <div v-if="screensaver" class="screensaver" @click="exitScreensaver" @keydown.esc="exitScreensaver">
                <div class="ss-content">
                    <div class="ss-gem">◈</div>
                    <div class="ss-price">
                        <span class="ss-dollar">$</span>
                        <span class="ss-int">{{ animatedPrice ? Math.floor(animatedPrice).toLocaleString() : '——'
                            }}</span>
                        <span v-if="goldPrice" class="ss-dec">.{{ (goldPrice % 1).toFixed(2).slice(2) }}</span>
                    </div>
                    <div class="ss-unit">/ troy oz · XAU</div>
                    <div class="ss-divider"></div>
                    <div class="ss-chi">${{ (pricePerGram * CHI).toFixed(2) }} <span>/ Chi</span></div>
                    <div class="ss-damlung">${{ (pricePerGram * DAMLUNG).toFixed(2) }} <span>/ Damlung</span></div>
                    <div class="ss-time">{{ ssTime }}</div>
                    <div class="ss-hint">Tap anywhere to exit</div>
                </div>
            </div>
        </transition>

        <!-- Password Modal -->
        <transition name="fade">
            <div v-if="showPwModal" class="pw-modal-backdrop" @click.self="showPwModal = false">
                <div class="pw-modal">
                    <div class="pw-modal-header">
                        <span class="pw-modal-title">{{ isOwner ? '🔓 Owner View Active' : '🔒 Owner Unlock' }}</span>
                        <button class="pw-modal-close" @click="showPwModal = false">✕</button>
                    </div>
                    <template v-if="!isOwner">
                        <p class="pw-modal-sub">Enter your password to load owner purchases.</p>
                        <div class="burst-ring-wrap" :class="{ burst: pwUnlockBurst }" style="margin: 8px auto;">
                            <div class="burst-r1"></div>
                            <div class="burst-r2"></div>
                            <div class="lock-ripple-wrap">
                                <div class="lock-ripple r1"></div>
                                <div class="lock-ripple r2"></div>
                                <div class="lock-ripple r3"></div>
                                <div class="pw-icon" :class="{ shake: pwShake }">🔒</div>
                            </div>
                        </div>
                        <input ref="pwInputEl" v-model="pwInput" class="text-input" type="password" :placeholder="t.enterPw"
                            @keyup.enter="unlockFromModal" autocomplete="current-password" />
                        <transition name="fade">
                            <p v-if="pwError" class="pw-error">{{ pwError }}</p>
                        </transition>
                        <button class="primary-btn full-btn" style="margin-top:8px;" @click="unlockFromModal">{{ t.unlock }}</button>
                    </template>
                    <template v-else>
                        <p class="pw-modal-sub">You are viewing owner purchases.</p>
                        <button class="ghost-btn full-btn" style="margin-top:8px;" @click="lockFromModal">🔒 Lock &amp; clear owner data</button>
                    </template>
                </div>
            </div>
        </transition>

        <!-- Ambient Background -->
        <div class="ambient" aria-hidden="true">
            <div class="orb orb-1" />
            <div class="orb orb-2" />
            <div class="orb orb-3" />
        </div>

        <!-- Header -->
        <header class="header">
            <div class="header-inner">
                <div class="logo">
                    <span class="logo-gem">◈</span>
                    <div class="logo-text">
                        <span class="logo-title">{{ t.title }}</span>
                        <span class="logo-sub">gold portfolio tracker</span>
                    </div>
                </div>

                <div class="header-controls">
                    <button class="ctrl-btn" @click="toggleDark" :aria-label="isDark ? 'Light mode' : 'Dark mode'">
                        <span>{{ isDark ? '☀' : '◑' }}</span>
                    </button>
                    <button class="ctrl-btn lang-btn" @click="toggleLang"
                        :aria-label="lang === 'en' ? 'Switch to Khmer' : 'Switch to English'">
                        {{ lang === 'en' ? 'ខ្មែរ' : 'EN' }}
                    </button>
                    <button class="ctrl-btn khr-btn" @click="showKHR = !showKHR; save()"
                        :aria-label="showKHR ? 'Switch to USD' : 'Switch to KHR'">
                        {{ showKHR ? 'USD' : '៛' }}
                    </button>
                    <button class="ctrl-btn lock-nav-btn" @click="openPwModal"
                        :aria-label="isOwner ? 'Owner active' : 'Unlock owner view'">
                        {{ isOwner ? '🔓' : '🔒' }}
                    </button>
                </div>
            </div>
            <div v-if="!isOnline" class="offline-bar" role="alert">
                ⚠ {{ t.offlineWarning }}
            </div>
        </header>

        <!-- Sticky Price Pill -->
        <div class="sticky-price" :class="{ visible: showStickyPrice && goldPrice }">
            <span class="sticky-gem">◈</span>
            <div class="sticky-prices">
                <div class="sticky-row-main">
                    <span class="sticky-val">{{ fmt(renderedPrice) }}</span>
                    <span class="sticky-unit">/ troy oz</span>
                </div>
                <div class="sticky-row-sub" v-if="displayPrice">
                    <span class="sticky-val-sub">{{ fmt(renderedPrice / TROY * DAMLUNG) }}</span>
                    <span class="sticky-unit-sub">/ damlung</span>
                </div>
            </div>
            <div class="sticky-divider" v-if="displayPrice"></div>
            <button class="sticky-refresh" @click="fetchPrice" :disabled="loading">↻</button>
        </div>

        <main class="main">

            <!-- ══════════════════════════════════════════════════════ -->
            <!-- DESKTOP: 3-COLUMN LAYOUT                              -->
            <!-- ══════════════════════════════════════════════════════ -->
            <div class="desktop-grid">

                <!-- ── LEFT COLUMN: Price ── -->
                <div class="col-left">

                    <!-- ── PRICE SECTION ── -->
                    <BorderGlow class="card price-hero" id="section-price"
                        :colors="['#F5C842', '#C08A10', '#FFD700']" glowColor="45 90 61"
                        :backgroundColor="isDark ? '#13131C' : '#FFFFFF'"
                        :borderRadius="20" :glowIntensity="0.7" :fillOpacity="0.1" :glowRadius="32" :coneSpread="22">
                        <!-- Source Toggle -->
                        <div class="seg-ctrl">
                            <button class="seg-btn" :class="{ active: priceSource === 'api' }"
                                @click="priceSource = 'api'">
                                ⬡ {{ t.live }}
                            </button>
                            <button class="seg-btn" :class="{ active: priceSource === 'custom' }"
                                @click="priceSource = 'custom'">
                                ✦ {{ t.custom }}
                            </button>
                        </div>

                        <!-- Big Price -->
                        <div class="hero-price-block">
                            <div class="hero-meta-row">
                                <span class="metal-tag">🥇 {{ t.gold }}</span>
                                <div style="display:flex;align-items:center;gap:6px;">
                                    <transition name="fade">
                                        <span v-if="priceTickDir" class="tick-arrow" :class="priceTickDir">{{
        priceTickDir === 'up' ? '▲' : '▼' }}</span>
                                    </transition>
                                    <span v-if="lastUpdated && priceSource === 'api'" class="last-updated">{{
        lastUpdated }}</span>
                                </div>
                            </div>
                            <transition name="price-flip" mode="out-in">
                                <div class="hero-price" :class="priceTickDir ? `price-tick-${priceTickDir}` : ''"
                                    :key="displayPrice?.toFixed(0) ?? 'null'">
                                    <template v-if="!showKHR">
                                        <span class="price-dollar">$</span>
                                        <span class="price-int">{{ animatedPrice ?
        Math.floor(animatedPrice).toLocaleString() : '——' }}</span>
                                        <span v-if="displayPrice" class="price-dec">.{{ (displayPrice %
        1).toFixed(2).slice(2) }}</span>
                                    </template>
                                    <template v-else>
                                        <span class="price-dollar">៛</span>
                                        <span class="price-int price-int--khr">{{ animatedPrice ?
        Math.floor(animatedPrice * khrRate).toLocaleString() : '——' }}</span>
                                    </template>
                                </div>
                            </transition>
                            <div class="price-unit-meta">
                                <span class="price-unit-label">{{ t.perTroyOz }}</span>
                                <div v-if="showKHR" class="khr-rate-row">
                                    <span class="khr-rate-label">1 USD =</span>
                                    <input v-model.number="khrRate" class="khr-rate-input" type="number" min="1000" max="99999" @change="save()" />
                                    <span class="khr-rate-label">KHR</span>
                                </div>
                            </div>

                            <!-- Sparkline -->
                            <div v-if="priceHistory.length >= 2" class="sparkline-wrap">
                                <svg class="sparkline" viewBox="0 0 280 40" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" :stop-color="sparklineColor" stop-opacity="0.25" />
                                            <stop offset="100%" :stop-color="sparklineColor" stop-opacity="0" />
                                        </linearGradient>
                                    </defs>
                                    <path :d="sparklinePath + 'V40H4Z'" fill="url(#spark-grad)" />
                                    <path :d="sparklinePath" fill="none" :stroke="sparklineColor" stroke-width="1.5"
                                        stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                                <div class="sparkline-meta">
                                    <span class="sparkline-low">${{ Math.min(...priceHistory.map(e => e.price)).toFixed(0) }}</span>
                                    <span class="sparkline-label">{{ sparklineTimeRange }}</span>
                                    <span class="sparkline-high">${{ Math.max(...priceHistory.map(e => e.price)).toFixed(0) }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Per-unit chips -->
                        <div v-if="displayPrice" class="chips-grid" :key="displayPrice">
                            <div v-for="(u, idx) in priceUnits" :key="u.key" class="chip chip-shimmer"
                                :style="{ animationDelay: (idx * 0.08) + 's' }">
                                <div class="shimmer-line"></div>
                                <span class="chip-label">{{ t[u.key] || u.label }}</span>
                                <span class="chip-price">${{ u.price < 1 ? u.price.toFixed(4) : u.price.toFixed(2)
                                        }}</span>
                            </div>
                        </div>

                        <!-- Loading -->
                        <div v-if="loading" class="progress-bar">
                            <div class="progress-fill" />
                        </div>

                        <!-- Flash -->
                        <transition name="fade">
                            <div v-if="flashMsg" class="flash" :class="flashType" role="alert">{{ flashMsg }}</div>
                        </transition>

                        <!-- API Panel -->
                        <div v-if="priceSource === 'api'" class="sub-panel">
                            <div class="sub-panel-row">
                                <div class="api-info">
                                    <span class="api-badge">gold-api.com</span>
                                    <span class="api-hint-text">{{ t.apiHint }}</span>
                                </div>
                                <button class="primary-btn refresh-btn" @click="fetchPrice" :disabled="loading">
                                    <span :class="{ 'spin': loading }">↻</span>
                                    {{ loading ? t.loading : t.refresh }}
                                </button>
                            </div>
                            <div class="api-key-row">
                                <input v-model="customApiUrl" class="text-input" type="text"
                                    :placeholder="t.apiKeyPlaceholder" autocomplete="off" autocorrect="off"
                                    spellcheck="false" />
                                <button class="icon-btn-sm" @click="pasteClipboard" :title="t.paste">📋</button>
                                <button v-if="customApiUrl" class="icon-btn-sm danger"
                                    @click="customApiUrl = ''; save()" :title="t.clear">✕</button>
                            </div>
                            <p class="api-hint">
                                {{ t.freeNoKey }} ·
                                <a href="https://www.goldapi.io/" target="_blank" rel="noopener">goldapi.io</a>
                                {{ t.asBackup }}
                            </p>
                            <div class="auto-refresh-row">
                                <span class="api-hint-text">Auto-refresh</span>
                                <div class="refresh-seg">
                                    <button v-for="opt in [{l:'Off',v:0},{l:'30s',v:30},{l:'1m',v:60},{l:'5m',v:300}]"
                                        :key="opt.v" class="rseg-btn" :class="{ active: autoRefreshInterval === opt.v }"
                                        @click="autoRefreshInterval = opt.v">{{ opt.l }}</button>
                                </div>
                            </div>
                        </div>

                        <!-- Custom Panel -->
                        <div v-if="priceSource === 'custom'" class="sub-panel">
                            <div class="method-tabs">
                                <button v-for="m in ['troyOz', 'damlung', 'chi']" :key="m" class="method-btn"
                                    :class="{ active: priceMethod === m }" @click="switchMethod(m)">
                                    {{ m === 'troyOz' ? t.troyOz : t[m] }}
                                </button>
                            </div>
                            <div class="price-input-row">
                                <span class="input-prefix">$</span>
                                <input v-model.number="customPrice" class="text-input price-input" type="text"
                                    inputmode="decimal"
                                    :placeholder="t.enterPriceFor + ' ' + (priceMethod === 'troyOz' ? t.troyOz : priceMethod === 'damlung' ? t.damlung : t.chi)"
                                    @input="applyCustomPrice" />
                            </div>
                        </div>
                    </BorderGlow>

                    <!-- ── CONVERTER ── -->
                    <BorderGlow class="card"
                        :colors="['#F5C842', '#C08A10', '#FFD700']" glowColor="45 90 61"
                        :backgroundColor="isDark ? '#13131C' : '#FFFFFF'"
                        :borderRadius="20" :glowIntensity="0.7" :fillOpacity="0.1" :glowRadius="32" :coneSpread="22">
                        <h2 class="section-title">{{ t.unitConverter }}</h2>

                        <div class="conv-tabs-scroll">
                            <button v-for="u in converterUnits" :key="u" class="conv-tab"
                                :class="{ active: activeConv === u }" @click="activeConv = u">
                                {{ t[u] || u }}
                            </button>
                        </div>

                        <div class="conv-input-row">
                            <div class="from-badge">{{ t[activeConv] }}</div>
                            <input v-model.number="convInput" class="text-input conv-input" type="text"
                                inputmode="decimal" :placeholder="'1'" />
                        </div>

                        <div class="conv-results">
                            <div v-for="u in converterUnits.filter(x => x !== activeConv)" :key="u" class="conv-row">
                                <span class="conv-label">{{ t[u] }}</span>
                                <span class="conv-val">{{ convertUnit(convInput || 0, activeConv, u) }}</span>
                            </div>
                        </div>

                        <!-- USD value of the converter amount -->
                        <div v-if="displayPrice && convInput" class="conv-usd-row">
                            <span class="conv-usd-label">≈ USD value</span>
                            <span class="conv-usd-val">${{ convValueUSD.toFixed(2) }}</span>
                        </div>
                    </BorderGlow>

                </div>

                <!-- ── CENTER COLUMN: Price Grid + Purchases ── -->
                <div class="col-center">

                    <!-- ── PRICE GRID ── -->
                    <BorderGlow class="card"
                        :colors="['#F5C842', '#C08A10', '#FFD700']" glowColor="45 90 61"
                        :backgroundColor="isDark ? '#13131C' : '#FFFFFF'"
                        :borderRadius="20" :glowIntensity="0.7" :fillOpacity="0.1" :glowRadius="32" :coneSpread="22">
                        <div class="section-header">
                            <h2 class="section-title">{{ t.priceByUnit }}</h2>
                            <span v-if="displayPrice && convInput && convInput !== 1" class="conv-qty-badge">
                                × {{ convInput }} {{ t[activeConv] || activeConv }}
                            </span>
                        </div>
                        <!-- Total value highlight when converter qty > 1 -->
                        <div v-if="displayPrice && convInput && convInput !== 1 && convValueUSD"
                            class="conv-total-tile">
                            <span class="conv-total-label">Total value of {{ convInput }} {{ t[activeConv] || activeConv
                                }}</span>
                            <span class="conv-total-val">${{ convValueUSD.toFixed(2) }}</span>
                        </div>
                        <div v-if="displayPrice" class="unit-grid">
                            <div v-for="u in allUnitsScaled" :key="u.key" class="unit-tile">
                                <div class="tile-top">
                                    <span class="tile-name">{{ t[u.key] || u.label }}</span>
                                    <span class="tile-gram">{{ u.gram }}</span>
                                </div>
                                <span class="tile-price">${{ u.price < 1 ? u.price.toFixed(4) : u.price.toFixed(2)
                                        }}</span>
                            </div>
                        </div>
                        <div v-else class="empty-state">
                            <svg class="empty-svg" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="40" cy="40" r="28" stroke="currentColor" stroke-width="1.5"
                                    stroke-dasharray="4 3" opacity="0.3" />
                                <circle cx="40" cy="40" r="20" stroke="currentColor" stroke-width="1.5" opacity="0.5" />
                                <text x="40" y="45" text-anchor="middle" font-size="18" fill="currentColor"
                                    opacity="0.6" font-family="serif">$</text>
                                <circle cx="40" cy="40" r="28" stroke="currentColor" stroke-width="0.5"
                                    opacity="0.15" />
                            </svg>
                            <p>{{ t.fetchPriceFirst }}</p>
                            <button class="ghost-btn" style="font-size:12px;padding:8px 16px;" @click="fetchPrice">↻
                                Fetch price</button>
                        </div>
                    </BorderGlow>

                    <!-- ── PURCHASES ── -->
                    <BorderGlow class="card" id="purchases-section" :class="{ 'section-glow': purchasesGlow }"
                        :colors="['#F5C842', '#C08A10', '#FFD700']" glowColor="45 90 61"
                        :backgroundColor="isDark ? '#13131C' : '#FFFFFF'"
                        :borderRadius="20" :glowIntensity="0.7" :fillOpacity="0.1" :glowRadius="32" :coneSpread="22">
                        <div class="section-header">
                            <h2 class="section-title">{{ t.myPurchases }}</h2>
                            <div class="section-actions">
                                <select v-model="purchaseSort" class="sort-select">
                                    <option value="date-desc">Date ↓</option>
                                    <option value="date-asc">Date ↑</option>
                                    <option value="gl-desc">G/L ↓</option>
                                    <option value="gl-asc">G/L ↑</option>
                                    <option value="weight-desc">Weight ↓</option>
                                    <option value="weight-asc">Weight ↑</option>
                                </select>
                                <button class="ghost-btn" @click="exportCSV" title="Export CSV">↓ Export</button>
                                <button class="ghost-btn" @click="csvInput.click()" title="Import CSV">↑ Import</button>
                                <input ref="csvInput" type="file" accept=".csv" hidden @change="importCSV" />
                            </div>
                        </div>

                        <!-- ── PURCHASES CONTENT ── -->
                        <div>
                            <!-- FAB-style Add Button -->
                            <button class="add-purchase-btn" @click="showForm = !showForm">
                                <span class="add-icon">{{ showForm ? '✕' : '+' }}</span>
                                <span>{{ showForm ? t.cancel : t.addPurchase }}</span>
                            </button>

                            <!-- Add Form -->
                            <transition name="slide-down">
                                <div v-if="showForm" class="purchase-form">
                                    <div class="form-grid">
                                        <div class="form-field">
                                            <label>{{ t.weight }}</label>
                                            <input v-model.number="draft.weight" type="text" inputmode="decimal"
                                                :placeholder="t.enterWeight" class="text-input" />
                                        </div>
                                        <div class="form-field">
                                            <label>{{ t.unit }}</label>
                                            <select v-model="draft.unit" class="text-input">
                                                <option v-for="u in converterUnits" :key="u" :value="u">{{ t[u] || u }}
                                                </option>
                                            </select>
                                        </div>
                                        <div class="form-field">
                                            <label>{{ t.pricePaid }} (USD)</label>
                                            <input v-model.number="draft.price" type="text" inputmode="decimal"
                                                :placeholder="t.enterPrice" class="text-input" />
                                            <button v-if="goldPrice && !draft.price" type="button" class="today-chip"
                                                @click="draft.price = parseFloat((pricePerGram * toGrams(draft.weight || 1, draft.unit)).toFixed(2))">
                                                ✦ Use current price
                                            </button>
                                        </div>
                                        <div class="form-field">
                                            <label>{{ t.date }}</label>
                                            <input v-model="draft.date" type="date" class="text-input"
                                                :placeholder="today()" />
                                            <button v-if="draft.date !== today()" type="button" class="today-chip"
                                                @click="draft.date = today()">↺ Today</button>
                                        </div>
                                    </div>
                                    <button class="primary-btn full-btn" @click="addPurchase">✦ {{ t.save }}</button>
                                </div>
                            </transition>

                            <!-- Total weight summary -->
                            <div v-if="purchases.length" class="purchases-totals">
                                <span>{{ purchases.length }} purchase{{ purchases.length !== 1 ? 's' : '' }}</span>
                                <span class="purchases-total-weight">◈ {{ totalWeightChi.toFixed(2) }} Chi · {{ totalWeightGrams.toFixed(1) }}g</span>
                            </div>

                            <!-- Purchase Cards -->
                            <div v-if="purchases.length" class="purchases-list">
                                <BorderGlow
                                    v-for="(p, i) in sortedPurchases"
                                    :key="p.id"
                                    class="p-card-stagger"
                                    :style="{ animationDelay: (i * 0.07) + 's' }"
                                    :colors="gainLoss(p) >= 0 ? ['#22C55E', '#4ade80', '#16a34a'] : ['#F87171', '#ef4444', '#dc2626']"
                                    :glowColor="gainLoss(p) >= 0 ? '142 71 55' : '0 84 70'"
                                    :backgroundColor="isDark ? '#1A1A26' : '#F9F7F2'"
                                    :borderRadius="14"
                                    :glowIntensity="0.9"
                                    :fillOpacity="0.2"
                                    :glowRadius="28"
                                    :coneSpread="20"
                                >
                                    <div class="p-card" :style="{
                                        border: 'none',
                                        borderLeft: gainLoss(p) >= 0 ? '3px solid var(--gain)' : '3px solid var(--loss)',
                                        background: gainLoss(p) >= 0 ? 'var(--gain-bg)' : 'var(--loss-bg)',
                                        borderRadius: '13px',
                                    }">
                                        <template v-if="editIdx !== p.id">
                                            <div class="pcard-header">
                                                <div class="pcard-weight-row">
                                                    <span class="pcard-weight">{{ p.weight }} <span class="pcard-unit">{{
            t[p.unit] || p.unit }}</span></span>
                                                    <span class="pcard-date">{{ formatDate(p.date) }}</span>
                                                </div>
                                                <div class="pcard-btns">
                                                    <button class="pcard-btn" @click="startEdit(p)"
                                                        :aria-label="t.edit">✎</button>
                                                    <button class="pcard-btn danger" @click="removePurchase(p)"
                                                        :aria-label="t.delete">✕</button>
                                                </div>
                                            </div>
                                            <div class="gl-row">
                                                <div class="gl-col">
                                                    <span class="gl-label">{{ t.paid }}</span>
                                                    <span class="gl-val">{{ fmt(p.price) }}</span>
                                                </div>
                                                <div class="gl-divider" />
                                                <div class="gl-col">
                                                    <span class="gl-label">{{ t.current }}</span>
                                                    <span class="gl-val"
                                                        :class="gainLoss(p) >= 0 ? 'gain-text' : 'loss-text'">{{ fmt(currentValue(p)) }}</span>
                                                </div>
                                                <div class="gl-divider" />
                                                <div class="gl-col">
                                                    <span class="gl-label"
                                                        :class="gainLoss(p) >= 0 ? 'gain-text' : 'loss-text'">{{ gainLoss(p) >= 0 ? t.gain : t.loss }}</span>
                                                    <span class="gl-val gl-main"
                                                        :class="gainLoss(p) >= 0 ? 'gain-text' : 'loss-text'">
                                                        {{ (gainLoss(p) >= 0 ? '+' : '') + fmt(Math.abs(gainLoss(p))) }}
                                                    </span>
                                                </div>
                                            </div>
                                        </template>

                                        <template v-else>
                                            <div class="form-grid">
                                                <div class="form-field">
                                                    <label>{{ t.weight }}</label>
                                                    <input v-model.number="editDraft.weight" type="text" inputmode="decimal"
                                                        class="text-input" />
                                                </div>
                                                <div class="form-field">
                                                    <label>{{ t.unit }}</label>
                                                    <select v-model="editDraft.unit" class="text-input">
                                                        <option v-for="u in converterUnits" :key="u" :value="u">{{ t[u] || u }}</option>
                                                    </select>
                                                </div>
                                                <div class="form-field">
                                                    <label>{{ t.pricePaid }}</label>
                                                    <input v-model.number="editDraft.price" type="text" inputmode="decimal"
                                                        class="text-input" />
                                                </div>
                                                <div class="form-field">
                                                    <label>{{ t.date }}</label>
                                                    <input v-model="editDraft.date" type="date" class="text-input" />
                                                </div>
                                            </div>
                                            <div class="edit-actions">
                                                <button class="primary-btn" style="flex:1" @click="saveEdit">{{ t.save }}</button>
                                                <button class="ghost-btn" style="flex:1" @click="editIdx = null">{{ t.cancel }}</button>
                                            </div>
                                        </template>
                                    </div>
                                </BorderGlow>
                            </div>

                            <div v-else-if="!showForm" class="empty-state">
                                <svg class="empty-svg" viewBox="0 0 80 80" fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <rect x="20" y="38" width="40" height="24" rx="3" stroke="currentColor"
                                        stroke-width="1.5" opacity="0.5" />
                                    <path d="M28 38V32a12 12 0 0 1 24 0v6" stroke="currentColor" stroke-width="1.5"
                                        stroke-linecap="round" opacity="0.5" />
                                    <circle cx="40" cy="50" r="4" fill="currentColor" opacity="0.4" />
                                    <line x1="40" y1="54" x2="40" y2="58" stroke="currentColor" stroke-width="1.5"
                                        stroke-linecap="round" opacity="0.4" />
                                </svg>
                                <p>{{ t.noPurchases }}</p>
                            </div>
                        </div>
                    </BorderGlow>
                </div>

                <!-- ── RIGHT COLUMN: Portfolio Summary ── -->
                <div class="col-right">

                    <!-- Portfolio KPI Cards -->
                    <BorderGlow class="card summary-card" v-if="purchases.length" id="section-portfolio"
                        :colors="['#F5C842', '#C08A10', '#FFD700']" glowColor="45 90 61"
                        :backgroundColor="isDark ? '#13131C' : '#FFFFFF'"
                        :borderRadius="20" :glowIntensity="0.7" :fillOpacity="0.1" :glowRadius="32" :coneSpread="22">
                        <h2 class="section-title">{{ t.portfolioSummary }}</h2>

                        <div class="kpi-stack">
                            <div class="kpi-item">
                                <span class="kpi-label">{{ t.totalInvested }}</span>
                                <span class="kpi-val">{{ fmt(displayInvested) }}</span>
                            </div>
                            <div class="kpi-item" :class="totalGL >= 0 ? 'kpi-gain' : 'kpi-loss'">
                                <span class="kpi-label">{{ t.currentValue }}</span>
                                <span class="kpi-val">{{ fmt(displayCurrent) }}</span>
                            </div>
                            <div class="kpi-item kpi-big" :class="totalGL >= 0 ? 'kpi-gain' : 'kpi-loss'">
                                <span class="kpi-label">{{ t.totalGainLoss }}</span>
                                <span class="kpi-val kpi-main">{{ (displayGL >= 0 ? '+' : '') + fmt(Math.abs(displayGL)) }}</span>
                            </div>
                            <div class="kpi-item">
                                <span class="kpi-label">Total Weight</span>
                                <span class="kpi-val kpi-weight">{{ totalWeightChi.toFixed(2) }} <small>chi</small> · {{ totalWeightGrams.toFixed(1) }} <small>g</small></span>
                            </div>
                        </div>

                        <div v-if="totalInvested > 0" class="portfolio-bar">
                            <div class="portfolio-fill" :class="totalGL >= 0 ? 'gain' : 'loss'"
                                :style="{ width: Math.min(Math.abs(totalGL / totalInvested) * 100, 100) + '%' }" />
                        </div>
                        <div v-if="totalInvested > 0" class="portfolio-pct" :class="totalGL >= 0 ? 'gain' : 'loss'">
                            {{ totalGL >= 0 ? '▲' : '▼' }} {{ Math.abs(totalGL / totalInvested * 100).toFixed(1) }}%
                        </div>
                    </BorderGlow>

                    <!-- Per-purchase breakdown table -->
                    <BorderGlow class="card" v-if="purchases.length && displayPrice"
                        :colors="['#F5C842', '#C08A10', '#FFD700']" glowColor="45 90 61"
                        :backgroundColor="isDark ? '#13131C' : '#FFFFFF'"
                        :borderRadius="20" :glowIntensity="0.7" :fillOpacity="0.1" :glowRadius="32" :coneSpread="22">
                        <h2 class="section-title">Holdings</h2>
                        <div class="holdings-table">
                            <div class="ht-header">
                                <span>Weight</span>
                                <span>Paid</span>
                                <span>Now</span>
                                <span>G/L</span>
                            </div>
                            <div v-for="(p, i) in sortedPurchases" :key="p.id" class="ht-row"
                                :class="[gainLoss(p) >= 0 ? 'ht-gain' : 'ht-loss', p.id === newestPurchaseId ? 'ht-row-flash' : '']">
                                <span class="ht-weight">{{ p.weight }}<em>{{ t[p.unit] || p.unit }}</em></span>
                                <span>{{ fmt(p.price, 0) }}</span>
                                <span>{{ fmt(currentValue(p), 0) }}</span>
                                <span :class="gainLoss(p) >= 0 ? 'gain-text' : 'loss-text'">
                                    {{ (gainLoss(p) >= 0 ? '+' : '') + fmt(Math.abs(gainLoss(p)), 0) }}
                                </span>
                            </div>
                        </div>
                    </BorderGlow>

                    <!-- Damlung price quick-ref -->
                    <BorderGlow class="card" v-if="displayPrice"
                        :colors="['#F5C842', '#C08A10', '#FFD700']" glowColor="45 90 61"
                        :backgroundColor="isDark ? '#13131C' : '#FFFFFF'"
                        :borderRadius="20" :glowIntensity="0.7" :fillOpacity="0.1" :glowRadius="32" :coneSpread="22">
                        <h2 class="section-title">Quick Reference</h2>
                        <div class="qref-list">
                            <div class="qref-section-label">Chi</div>
                            <div v-for="qty in [1, 2, 5, 10]" :key="qty" class="qref-row">
                                <span class="qref-label">{{ qty }} Chi</span>
                                <span class="qref-val">{{ fmt(renderedPPG * CHI * qty) }}</span>
                            </div>
                            <div class="qref-divider" />
                            <div class="qref-section-label">Damlung</div>
                            <div v-for="qty in [1, 2, 5]" :key="'d'+qty" class="qref-row">
                                <span class="qref-label">{{ qty }} Damlung</span>
                                <span class="qref-val">{{ fmt(renderedPPG * DAMLUNG * qty) }}</span>
                            </div>
                            <template v-if="qrefHoldingsRows.length">
                                <div class="qref-divider" />
                                <div class="qref-section-label">My Holdings</div>
                                <div v-for="row in qrefHoldingsRows" :key="row.key" class="qref-row">
                                    <span class="qref-label">{{ row.weight }} {{ t[row.unit] || row.unit }}</span>
                                    <span class="qref-val">{{ fmt(row.value) }}</span>
                                </div>
                            </template>
                        </div>
                    </BorderGlow>

                </div>
            </div>
            <!-- END DESKTOP GRID -->

        </main>

        <footer class="footer">
            <p>Gold Tracker · Nuxt 3 · Prices {{ showKHR ? 'KHR' : 'USD' }}</p>
        </footer>

        <!-- Mobile Bottom Nav -->
        <nav class="mobile-nav" aria-label="Main navigation">
            <button class="mnav-btn" :class="{ active: mobileTab === 'price' }" @click="navTo('price')">
                <span class="mnav-icon">🥇</span>
                <span class="mnav-label">Price</span>
            </button>
            <button class="mnav-btn" :class="{ active: mobileTab === 'purchases' }" @click="navTo('purchases')">
                <span class="mnav-icon">📋</span>
                <span class="mnav-label">Purchases</span>
            </button>
            <button class="mnav-btn" :class="{ active: mobileTab === 'portfolio' }" @click="navTo('portfolio')">
                <span class="mnav-icon">📊</span>
                <span class="mnav-label">Portfolio</span>
            </button>
        </nav>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

// ─── Constants ────────────────────────────────────────────────────────────────
const TROY = 31.1035
const DAMLUNG = 37.5
const CHI = 3.75
const HUN = 0.375
const LI = 0.0375

const converterUnits = ['li', 'hun', 'chi', 'gram', 'damlung', 'troyOz']

// ─── Pre-loaded purchases (owner only) ───────────────────────────────────────
const OWNER_PW_HASH = '5b91bc1234678bc03abe05d9966d30d1911a16d510605ea015b37cd3be316e05'
const PRE_PURCHASES = [
    { id: 'pre_1', weight: 1, unit: 'chi', price: 610, date: '2024-01-01' },
    { id: 'pre_2', weight: 1, unit: 'chi', price: 518, date: '2024-01-01' },
    { id: 'pre_3', weight: 1, unit: 'chi', price: 590, date: '2024-01-01' },
    { id: 'pre_4', weight: 1, unit: 'chi', price: 505, date: '2024-01-01' },
    { id: 'pre_5', weight: 2, unit: 'chi', price: 1030, date: '2024-01-01' },
    { id: 'pre_6', weight: 2, unit: 'chi', price: 1100, date: '2024-01-01' },
    { id: 'pre_7', weight: 3, unit: 'chi', price: 1440, date: '2024-01-01' },
    { id: 'pre_8', weight: 5, unit: 'chi', price: 2000, date: '2024-01-01' },
    { id: 'pre_9', weight: 10, unit: 'chi', price: 4900, date: '2024-01-01' },
]

// ─── Pre-loaded purchases (standard user vault) ──────────────────────────────
// Example hash for password "user123" (Generate your own SHA-256 hash as needed)
const USER_PW_HASH = 'f3d688238d76ea5e57f5599393e566870c54ace15c5c1d105482ca1a8356b65b' 
const USER_PRE_PURCHASES = [
    { id: 'user_pre_1', weight: 0.5, unit: 'chi', price: 246.5, date: '2026-06-12' },
    { id: 'user_pre_2', weight: 0.5, unit: 'chi', price: 283.5, date: '2026-05-10' },
    { id: 'user_pre_3', weight: 1.5, unit: 'chi', price: 853.5, date: '2026-04-25' },
    { id: 'user_pre_4', weight: 0.5, unit: 'chi', price: 295, date: '2026-03-25' },
    { id: 'user_pre_5', weight: 2, unit: 'chi', price: 988, date: '2025-11-25' },
]


// ─── State ────────────────────────────────────────────────────────────────────
const lang = ref('en')
const isDark = ref(true)
const isOnline = ref(true)
const priceSource = ref('api')
const priceMethod = ref('troyOz')
const customPrice = ref(null)
const customApiUrl = ref('')
const goldPrice = ref(null)
const lastUpdated = ref('')
const loading = ref(false)
const flashMsg = ref('')
const flashType = ref('success')
const activeConv = ref('chi')
const convInput = ref(1)
const showForm = ref(false)
const showStickyPrice = ref(false)
const purchases = ref([])
const draft = ref({ weight: '', unit: 'chi', price: '', date: today() })
const editIdx = ref(null)
const editDraft = ref({})
const csvInput = ref(null)

// ─── Auto-refresh ─────────────────────────────────────────────────────────────
const autoRefreshInterval = ref(0) // 0=off, 30, 60, 300 (seconds)
let autoRefreshTimer = null

// ─── Purchase sorting ─────────────────────────────────────────────────────────
const purchaseSort = ref('date-desc')

// ─── KHR currency ────────────────────────────────────────────────────────────
const showKHR = ref(false)
const khrRate = ref(4100)

// ─── Mobile nav ───────────────────────────────────────────────────────────────
const mobileTab = ref('price')

// ─── Animation State ──────────────────────────────────────────────────────────
const animatedPrice = ref(null)
const priceTickDir = ref(null)
let priceSimTimer = null
let rafId = null

function animateCounterTo(target, duration = 900) {
    if (rafId) cancelAnimationFrame(rafId)
    const start = animatedPrice.value || target
    if (Math.abs(start - target) < 0.01) {
        animatedPrice.value = target
        rafId = null
        return Promise.resolve()
    }
    const startTime = performance.now()
    return new Promise(resolve => {
        function step(now) {
            const t = Math.min((now - startTime) / duration, 1)
            const ease = 1 - Math.pow(1 - t, 3)
            animatedPrice.value = start + (target - start) * ease
            if (t < 1) { rafId = requestAnimationFrame(step) }
            else { animatedPrice.value = target; rafId = null; resolve() }
        }
        rafId = requestAnimationFrame(step)
    })
}

// ─── Price Simulation ─────────────────────────────────────────────────────────
let simRunning = false

function startPriceSim() {
    stopPriceSim()
    simRunning = true
    async function tick() {
        if (!simRunning || !goldPrice.value || loading.value || priceSource.value !== 'api') return
        const delta = (Math.random() * 5) * (Math.random() < 0.5 ? 1 : -1)
        const display = goldPrice.value + delta
        priceTickDir.value = delta > 0 ? 'up' : 'down'
        if (typeof navigator.vibrate === 'function') navigator.vibrate(12)
        await animateCounterTo(display, 800)
        setTimeout(() => { priceTickDir.value = null }, 200)
        if (simRunning) priceSimTimer = setTimeout(tick, 3000 + Math.random() * 3000)
    }
    priceSimTimer = setTimeout(tick, 4000)
}

function stopPriceSim() {
    simRunning = false
    if (priceSimTimer) { clearTimeout(priceSimTimer); priceSimTimer = null }
}

// ─── Auto-refresh ─────────────────────────────────────────────────────────────
function startAutoRefresh() {
    if (autoRefreshTimer) { clearInterval(autoRefreshTimer); autoRefreshTimer = null }
    if (!autoRefreshInterval.value) return
    autoRefreshTimer = setInterval(() => {
        if (priceSource.value === 'api' && !loading.value) fetchPrice()
    }, autoRefreshInterval.value * 1000)
}

function stopAutoRefresh() {
    if (autoRefreshTimer) { clearInterval(autoRefreshTimer); autoRefreshTimer = null }
}

// ─── Price History (sparkline) ────────────────────────────────────────────────
const priceHistory = ref([])
const MAX_HISTORY = 20

function pushHistory(price) {
    const entry = { price, time: Date.now() }
    priceHistory.value = [...priceHistory.value, entry].slice(-MAX_HISTORY)
    try { localStorage.setItem('gt4_history', JSON.stringify(priceHistory.value)) } catch { }
}

function loadHistory() {
    try {
        const raw = JSON.parse(localStorage.getItem('gt4_history') || '[]')
        priceHistory.value = raw.map(e => typeof e === 'number' ? { price: e, time: Date.now() } : e)
    } catch { }
}

const sparklinePath = computed(() => {
    const h = priceHistory.value
    if (h.length < 2) return ''
    const prices = h.map(e => e.price)
    const W = 280, H = 40, pad = 4
    const min = Math.min(...prices), max = Math.max(...prices)
    const range = max - min || 1
    const pts = prices.map((v, i) => {
        const x = pad + (i / (prices.length - 1)) * (W - pad * 2)
        const y = H - pad - ((v - min) / range) * (H - pad * 2)
        return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    return 'M' + pts.join('L')
})

const sparklineColor = computed(() => {
    const h = priceHistory.value
    if (h.length < 2) return '#F5C842'
    return h[h.length - 1].price >= h[0].price ? '#22C55E' : '#F87171'
})

const sparklineTimeRange = computed(() => {
    const h = priceHistory.value
    if (h.length < 2) return `${h.length} pt`
    const diffMs = Date.now() - h[0].time
    const mins = Math.round(diffMs / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m range`
    return `${(diffMs / 3600000).toFixed(1)}h range`
})

// ─── Password State ───────────────────────────────────────────────────────────
const isOwner = ref(false)
const isStandardUser = ref(false)
const showPwModal = ref(false)
const pwInput = ref('')
const pwInputEl = ref(null)
const pwError = ref('')
const pwShake = ref(false)
const pwUnlockBurst = ref(false)
const purchasesGlow = ref(false)

// ─── Portfolio count-up display values ───────────────────────────────────────
const displayInvested = ref(0)
const displayCurrent = ref(0)
const displayGL = ref(0)
const newestPurchaseId = ref(null)

function animatePortfolio() {
    const targets = {
        invested: totalInvested.value,
        current: totalCurrent.value,
        gl: totalGL.value,
    }
    const duration = 1100
    const startTime = performance.now()
    function step(now) {
        const t = Math.min((now - startTime) / duration, 1)
        const ease = 1 - Math.pow(1 - t, 3)
        displayInvested.value = targets.invested * ease
        displayCurrent.value = targets.current * ease
        displayGL.value = targets.gl * ease
        if (t < 1) requestAnimationFrame(step)
        else {
            displayInvested.value = targets.invested
            displayCurrent.value = targets.current
            displayGL.value = targets.gl
        }
    }
    requestAnimationFrame(step)
}

// ─── i18n ─────────────────────────────────────────────────────────────────────
const translations = {
    en: {
        title: 'Gold Tracker',
        gold: 'Gold',
        live: 'Live',
        custom: 'Custom',
        refresh: 'Refresh',
        loading: 'Loading…',
        pricesUpdated: '✓ Updated',
        perTroyOz: '/ troy oz',
        priceByUnit: 'Price by Unit',
        unitConverter: 'Unit Converter',
        myPurchases: 'My Purchases',
        addPurchase: 'Add Purchase',
        cancel: 'Cancel',
        weight: 'Weight',
        unit: 'Unit',
        pricePaid: 'Price Paid',
        date: 'Date',
        save: 'Save',
        edit: 'Edit',
        delete: 'Delete',
        paid: 'Paid',
        current: 'Current',
        gainLoss: 'G / L',
        gain: 'Gain',
        loss: 'Loss',
        portfolioSummary: 'Portfolio',
        totalInvested: 'Invested',
        currentValue: 'Value Now',
        totalGainLoss: 'Total G/L',
        exportCSV: 'Export',
        importCSV: 'Import',
        enterWeight: 'e.g. 2',
        enterPrice: 'e.g. 240',
        enterPriceFor: 'Price per',
        apiHint: 'Optional API key for higher rate limits',
        apiKeyPlaceholder: 'Paste goldapi.io key (optional)…',
        freeNoKey: 'Free, no key needed',
        asBackup: 'key as fallback',
        paste: 'Paste',
        clear: 'Clear',
        gram: 'Gram', li: 'Li', hun: 'Hun', chi: 'Chi',
        damlung: 'Damlung', troyOunce: 'Troy Oz', troyOz: 'Troy Oz',
        fetchPriceFirst: 'Fetch a price first',
        offlineWarning: 'You are offline — prices may be outdated',
        noPurchases: 'No purchases yet. Tap + Add above.',
        lock: 'Lock purchases',
        locked: 'Enter password to view purchases',
        pwSub: 'Enter your owner password to load pre-loaded purchases.',
        unlock: 'Unlock',
        enterPw: 'Enter password…',
    },
    km: {
        title: 'តាមដានមាស',
        gold: 'មាស',
        live: 'បន្តផ្ទាល់',
        custom: 'កំណត់ផ្ទាល់',
        refresh: 'ធ្វើបច្ចុប្បន្នភាព',
        loading: 'កំពុងផ្ទុក…',
        pricesUpdated: '✓ បានធ្វើបច្ចុប្បន្នភាព',
        perTroyOz: '/ ត្រយ អោន',
        priceByUnit: 'តម្លៃតាមឯកតា',
        unitConverter: 'បម្លែងឯកតា',
        myPurchases: 'ការទិញរបស់ខ្ញុំ',
        addPurchase: 'បន្ថែម',
        cancel: 'បោះបង់',
        weight: 'ទម្ងន់',
        unit: 'ឯកតា',
        pricePaid: 'តម្លៃបង់',
        date: 'កាលបរិច្ឆេទ',
        save: 'រក្សាទុក',
        edit: 'កែ',
        delete: 'លុប',
        paid: 'បង់',
        current: 'បច្ចុប្បន្ន',
        gainLoss: 'ចំណេញ/ខាត',
        gain: 'ចំណេញ',
        loss: 'ខាត',
        portfolioSummary: 'សង្ខេប',
        totalInvested: 'វិនិយោគ',
        currentValue: 'តម្លៃ',
        totalGainLoss: 'ចំណេញ/ខាត',
        exportCSV: 'នាំចេញ',
        importCSV: 'នាំចូល',
        enterWeight: 'ឧ. ២',
        enterPrice: 'ឧ. ២៤០',
        enterPriceFor: 'តម្លៃ',
        apiHint: 'ស្រេចចិត្ត API key',
        apiKeyPlaceholder: 'បិទភ្ជាប់ goldapi.io key…',
        freeNoKey: 'ឥតគិតថ្លៃ',
        asBackup: 'key ជាបម្រុង',
        paste: 'បិទភ្ជាប់',
        clear: 'លុប',
        gram: 'ក្រាម', li: 'លី', hun: 'ហុន', chi: 'ជី',
        damlung: 'ដំឡឹង', troyOunce: 'ត្រយ អោន', troyOz: 'ត្រយ អោន',
        fetchPriceFirst: 'សូមទាញតម្លៃជាមុន',
        offlineWarning: '⚠ ក្រៅបណ្តាញ',
        noPurchases: 'មិនទាន់មានការទិញ។ ចុច + បន្ថែម',
        lock: 'ចាក់សោ',
        locked: 'បញ្ចូលពាក្យសម្ងាត់ដើម្បីមើលការទិញ',
        pwSub: 'បញ្ចូលពាក្យសម្ងាត់ម្ចាស់ដើម្បីមើលការទិញ។',
        unlock: 'ដោះសោ',
        enterPw: 'បញ្ចូលពាក្យសម្ងាត់…',
    }
}
const t = computed(() => translations[lang.value])

// ─── Price computations ───────────────────────────────────────────────────────
const pricePerGram = computed(() => displayPrice.value ? displayPrice.value / TROY : 0)

const displayPrice = computed(() => animatedPrice.value ?? goldPrice.value)
const priceUnits = computed(() => [
    { key: 'li', label: 'Li', price: renderedPPG.value * LI },
    { key: 'hun', label: 'Hun', price: renderedPPG.value * HUN },
    { key: 'chi', label: 'Chi', price: renderedPPG.value * CHI },
    { key: 'gram', label: 'Gram', price: renderedPPG.value },
    { key: 'damlung', label: 'Damlung', price: renderedPPG.value * DAMLUNG },
    { key: 'troyOz', label: 'Troy Oz', price: renderedPrice.value || 0 },
])
const allUnits = computed(() => [
    { key: 'li', label: 'Li', price: renderedPPG.value * LI, gram: '0.0375g' },
    { key: 'hun', label: 'Hun', price: renderedPPG.value * HUN, gram: '0.375g' },
    { key: 'chi', label: 'Chi', price: renderedPPG.value * CHI, gram: '3.75g' },
    { key: 'gram', label: 'Gram', price: renderedPPG.value, gram: '1g' },
    { key: 'damlung', label: 'Damlung', price: renderedPPG.value * DAMLUNG, gram: '37.5g' },
    { key: 'troyOz', label: 'Troy Oz', price: renderedPrice.value || 0, gram: '31.1g' },
])

const convValueUSD = computed(() => {
    if (!displayPrice.value || !convInput.value) return 0
    const grams = toGrams(convInput.value, activeConv.value)
    return pricePerGram.value * grams
})

const allUnitsScaled = computed(() => allUnits.value)

const totalInvested = computed(() => purchases.value.reduce((s, p) => s + p.price, 0))
const totalCurrent = computed(() => purchases.value.reduce((s, p) => s + currentValue(p), 0))
const totalGL = computed(() => totalCurrent.value - totalInvested.value)
const totalWeightGrams = computed(() => purchases.value.reduce((s, p) => s + toGrams(p.weight, p.unit), 0))
const totalWeightChi = computed(() => totalWeightGrams.value / CHI)

const sortedPurchases = computed(() => {
    const list = [...purchases.value]
    if (purchaseSort.value === 'date-asc') return list.sort((a, b) => a.date.localeCompare(b.date))
    if (purchaseSort.value === 'date-desc') return list.sort((a, b) => b.date.localeCompare(a.date))
    if (purchaseSort.value === 'gl-asc') return list.sort((a, b) => gainLoss(a) - gainLoss(b))
    if (purchaseSort.value === 'gl-desc') return list.sort((a, b) => gainLoss(b) - gainLoss(a))
    if (purchaseSort.value === 'weight-asc') return list.sort((a, b) => toGrams(a.weight, a.unit) - toGrams(b.weight, b.unit))
    if (purchaseSort.value === 'weight-desc') return list.sort((a, b) => toGrams(b.weight, b.unit) - toGrams(a.weight, a.unit))
    return list
})

const qrefHoldingsRows = computed(() => {
    if (!purchases.value.length || !renderedPPG.value) return []
    const seen = new Set()
    return purchases.value.reduce((acc, p) => {
        const key = `${p.weight}-${p.unit}`
        if (!seen.has(key)) {
            seen.add(key)
            acc.push({ key, weight: p.weight, unit: p.unit, value: renderedPPG.value * toGrams(p.weight, p.unit) })
        }
        return acc
    }, []).slice(0, 5)
})

// ─── Methods ──────────────────────────────────────────────────────────────────
function today() { return new Date().toISOString().split('T')[0] }
function toggleLang() { lang.value = lang.value === 'en' ? 'km' : 'en'; save() }
function toggleDark() { isDark.value = !isDark.value; save() }

function toGrams(w, u) {
    return w * ({ li: LI, hun: HUN, chi: CHI, gram: 1, damlung: DAMLUNG, troyOz: TROY }[u] || 1)
}
function fromGrams(g, u) {
    return g / ({ li: LI, hun: HUN, chi: CHI, gram: 1, damlung: DAMLUNG, troyOz: TROY }[u] || 1)
}
function convertUnit(val, from, to) { return fromGrams(toGrams(val, from), to).toFixed(4) }
function currentValue(p) { return displayPrice.value ? pricePerGram.value * toGrams(p.weight, p.unit) : 0 }
function gainLoss(p) { return currentValue(p) - p.price }
function formatDate(d) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) }

function fmt(n, dec = 2) {
    if (n == null) return '—'
    if (showKHR.value) return '៛' + Math.round(n * khrRate.value).toLocaleString()
    return '$' + n.toFixed(dec)
}

function flash(msg, type = 'success') {
    flashMsg.value = msg; flashType.value = type
    setTimeout(() => flashMsg.value = '', 3000)
}

function switchMethod(m) {
    priceMethod.value = m; customPrice.value = null; goldPrice.value = null; save()
}

function applyCustomPrice() {
    const p = customPrice.value
    if (!p || p <= 0) { goldPrice.value = null; return }
    if (priceMethod.value === 'troyOz') goldPrice.value = p
    else if (priceMethod.value === 'damlung') goldPrice.value = (p / DAMLUNG) * TROY
    else if (priceMethod.value === 'chi') goldPrice.value = (p / CHI) * TROY
    lastUpdated.value = new Date().toLocaleTimeString() + ' (custom)'
    animateCounterTo(goldPrice.value)
    save()
}

async function pasteClipboard() {
    try {
        const text = await navigator.clipboard.readText()
        if (text?.trim()) customApiUrl.value = text.trim()
        else flash('Clipboard is empty', 'error')
    } catch { flash('Allow clipboard access or paste manually', 'error') }
}

// ─── Password Methods ─────────────────────────────────────────────────────────
async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function openPwModal() {
    showPwModal.value = true
    pwInput.value = ''
    pwError.value = ''
    await nextTick()
    pwInputEl.value?.focus()
}

async function unlockFromModal() {
    if (!pwInput.value) {
        pwError.value = 'Enter a password'
        pwShake.value = false
        await nextTick(); pwShake.value = true
        setTimeout(() => pwShake.value = false, 600)
        return
    }
    
    const hash = await sha256(pwInput.value)
    
    // 1. Check for OWNER profile
    if (hash === OWNER_PW_HASH) {
        isOwner.value = true
        isStandardUser.value = false
        
        const extra = JSON.parse(localStorage.getItem('gt4_owner_extra') || '[]')
        const existingIds = new Set(PRE_PURCHASES.map(p => p.id))
        const userAdded = purchases.value.filter(p => !existingIds.has(p.id))
        
        purchases.value = [...PRE_PURCHASES, ...extra, ...userAdded]
        successfulUnlock()
        
    // 2. Check for STANDARD USER profile
    } else if (hash === USER_PW_HASH) {
        isStandardUser.value = true
        isOwner.value = false
        
        const existingIds = new Set(USER_PRE_PURCHASES.map(p => p.id))
        const userAdded = purchases.value.filter(p => !existingIds.has(p.id))
        
        // Prepend the new user-specific vault assets instead
        purchases.value = [...USER_PRE_PURCHASES, ...userAdded]
        successfulUnlock()
        
    } else {
        pwError.value = 'Incorrect password'
        pwShake.value = false
        await nextTick(); pwShake.value = true
        setTimeout(() => pwShake.value = false, 600)
    }
}

// Helper abstraction to keep the unlock function clean
function successfulUnlock() {
    pwUnlockBurst.value = true
    setTimeout(() => pwUnlockBurst.value = false, 800)
    pwInput.value = ''
    pwError.value = ''
    showPwModal.value = false
    setTimeout(() => animatePortfolio(), 120)
}

function lockFromModal() {
    isOwner.value = false
    isStandardUser.value = false
    
    // Clean out both sets of IDs to restore back to the anonymous local state
    const ownerIds = new Set(PRE_PURCHASES.map(p => p.id))
    const userIds = new Set(USER_PRE_PURCHASES.map(p => p.id))
    
    purchases.value = purchases.value.filter(p => !ownerIds.has(p.id) && !userIds.has(p.id))
    showPwModal.value = false
    save()
}

function scrollToPurchases() {
    const el = document.getElementById('purchases-section')
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        purchasesGlow.value = false
        setTimeout(() => {
            purchasesGlow.value = true
            setTimeout(() => purchasesGlow.value = false, 1000)
        }, 300)
    }
}

// ─── Price Fetch ──────────────────────────────────────────────────────────────
async function fetchPrice() {
    loading.value = true
    let ok = false
    try {
        const r = await fetch('https://api.gold-api.com/price/XAU', { mode: 'cors' })
        if (r.ok) {
            const d = await r.json()
            const p = d?.price ?? d?.ask ?? d?.bid
            if (p && !isNaN(p)) { goldPrice.value = parseFloat(p); ok = true }
        }
    } catch (_) { }

    if (!ok && customApiUrl.value?.trim()) {
        try {
            const r = await fetch('https://www.goldapi.io/api/XAU/USD', {
                headers: { 'x-access-token': customApiUrl.value.trim(), Accept: 'application/json' },
                mode: 'cors'
            })
            if (r.ok) {
                const d = await r.json()
                if (d?.price) { goldPrice.value = parseFloat(d.price); ok = true }
            }
        } catch (_) { }
    }

    if (ok) {
        lastUpdated.value = new Date().toLocaleTimeString()
        pushHistory(goldPrice.value)
        animateCounterTo(goldPrice.value)
        save(); flash(t.value.pricesUpdated)
        startPriceSim()
    } else {
        const cached = load()?.goldPrice
        if (cached) {
            goldPrice.value = cached
            lastUpdated.value = (load()?.lastUpdated || '') + ' (cached)'
            flash('Using cached price — live fetch failed', 'error')
        } else {
            flash('Could not fetch price. Try Custom mode.', 'error')
        }
    }
    loading.value = false
}

// ─── Purchases ────────────────────────────────────────────────────────────────
function addPurchase() {
    if (!draft.value.weight || !draft.value.price) { flash('Fill in weight and price', 'error'); return }
    const id = Date.now()
    purchases.value.push({ ...draft.value, id })
    newestPurchaseId.value = id
    setTimeout(() => { newestPurchaseId.value = null }, 1400)
    draft.value = { weight: '', unit: 'chi', price: '', date: today() }
    showForm.value = false
    save()
    displayInvested.value = totalInvested.value
    displayCurrent.value = totalCurrent.value
    displayGL.value = totalGL.value
}

function startEdit(p) { editIdx.value = p.id; editDraft.value = { ...p } }

function saveEdit() {
    if (!editDraft.value.weight || !editDraft.value.price) { flash('Fill in weight and price', 'error'); return }
    const idx = purchases.value.findIndex(p => p.id === editIdx.value)
    if (idx !== -1) purchases.value[idx] = { ...editDraft.value }
    editIdx.value = null; save()
}

function removePurchase(p) {
    if (confirm('Delete this purchase?')) {
        const idx = purchases.value.findIndex(x => x.id === p.id)
        if (idx !== -1) purchases.value.splice(idx, 1)
        save()
    }
}

const NAV_IDS = { price: 'section-price', purchases: 'purchases-section', portfolio: 'section-portfolio' }
function navTo(tab) {
    mobileTab.value = tab
    const el = document.getElementById(NAV_IDS[tab])
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function exportCSV() {
    const rows = purchases.value.map(p => [p.weight, p.unit, p.price.toFixed(2), p.date])
    const csv = [['Weight', 'Unit', 'Paid', 'Date'], ...rows].map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `gold-${today()}.csv`; a.click()
}

function importCSV(e) {
    const file = e.target?.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
        try {
            const lines = evt.target.result.trim().split('\n').map(l => l.trim()).filter(Boolean)
            if (lines.length < 2) { flash('CSV empty or no data rows', 'error'); return }
            const hdr = lines[0].split(',').map(h => h.trim().toLowerCase())
            const wi = hdr.indexOf('weight'), ui = hdr.indexOf('unit'), pi = hdr.indexOf('paid'), di = hdr.indexOf('date')
            if (wi === -1 || pi === -1) { flash('CSV must have Weight and Paid columns', 'error'); return }
            let added = 0
            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(',').map(c => c.trim())
                const weight = parseFloat(cols[wi]), price = parseFloat(cols[pi])
                if (isNaN(weight) || isNaN(price)) continue
                const unit = (ui !== -1 && converterUnits.includes(cols[ui])) ? cols[ui] : 'chi'
                const date = (di !== -1 && cols[di]) ? cols[di] : today()
                purchases.value.push({ weight, unit, price, date, id: Date.now() + i })
                added++
            }
            if (added > 0) { save(); flash(`✓ Imported ${added} purchase${added > 1 ? 's' : ''}`) }
            else flash('No valid rows found', 'error')
        } catch { flash('Failed to parse CSV', 'error') }
    }
    reader.readAsText(file); e.target.value = ''
}

// ─── Screensaver ──────────────────────────────────────────────────────────────
const screensaver = ref(false)
const ssTime = ref('')
let idleTimer = null
const IDLE_MS = 60000

function resetIdle() {
    if (screensaver.value) return
    clearTimeout(idleTimer)
    idleTimer = setTimeout(() => { if (goldPrice.value) screensaver.value = true }, IDLE_MS)
}

function exitScreensaver() { screensaver.value = false; resetIdle() }

function startIdleWatch() {
    ;['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'].forEach(e =>
        window.addEventListener(e, resetIdle, { passive: true })
    )
    resetIdle()
}

function stopIdleWatch() {
    clearTimeout(idleTimer)
        ;['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'].forEach(e =>
            window.removeEventListener(e, resetIdle)
        )
}

watch(screensaver, v => { v ? startSSClock() : stopSSClock() })
watch(autoRefreshInterval, () => { startAutoRefresh(); save() })

watch(displayPrice, () => {
    startPriceRenderLoop()
    if (purchases.value.length) {
        displayInvested.value = totalInvested.value
        displayCurrent.value = totalCurrent.value
        displayGL.value = totalGL.value
    }
})

// screensaver clock
let ssClockTimer = null
function startSSClock() {
    function tick() { ssTime.value = new Date().toLocaleTimeString(); ssClockTimer = setTimeout(tick, 1000) }
    tick()
}
function stopSSClock() { clearTimeout(ssClockTimer) }

// ─── Smooth per-unit prices ───────────────────────────────────────────────────
const renderedPrice = ref(null)
let renderRafId = null

function startPriceRenderLoop() {
    if (renderRafId) return
    function loop() {
        const target = displayPrice.value
        if (target == null) { renderRafId = null; return }
        if (renderedPrice.value == null) { renderedPrice.value = target; renderRafId = null; return }
        const diff = target - renderedPrice.value
        if (Math.abs(diff) < 0.005) {
            renderedPrice.value = target
            renderRafId = null
            return
        }
        renderedPrice.value += diff * 0.12
        renderRafId = requestAnimationFrame(loop)
    }
    renderRafId = requestAnimationFrame(loop)
}

const renderedPPG = computed(() => renderedPrice.value ? renderedPrice.value / TROY : 0)

function save() {
    try {
        localStorage.setItem('gt4', JSON.stringify({
            lang: lang.value, isDark: isDark.value, goldPrice: goldPrice.value,
            lastUpdated: lastUpdated.value, priceMethod: priceMethod.value,
            customPrice: customPrice.value, customApiUrl: customApiUrl.value,
            priceSource: priceSource.value,
            autoRefreshInterval: autoRefreshInterval.value,
            purchaseSort: purchaseSort.value,
            showKHR: showKHR.value, khrRate: khrRate.value,
        }))
        if (isOwner.value) {
            const extra = purchases.value.filter(p => !PRE_PURCHASES.find(pp => pp.id === p.id))
            localStorage.setItem('gt4_owner_extra', JSON.stringify(extra))
        } else {
            const userKey = sessionStorage.getItem('gt4_ukey')
            if (userKey) localStorage.setItem(userKey, JSON.stringify(purchases.value))
            else localStorage.setItem('gt4_user_purchases', JSON.stringify(purchases.value))
        }
    } catch { }
}

function load() { try { return JSON.parse(localStorage.getItem('gt4') || 'null') } catch { return null } }

function handleOnline() { isOnline.value = true; fetchPrice() }
function handleOffline() { isOnline.value = false }
function handleScroll() { showStickyPrice.value = window.scrollY > 100 }

onMounted(() => {
    const d = load()
    if (d) {
        lang.value = d.lang || 'en'; isDark.value = d.isDark ?? true
        goldPrice.value = d.goldPrice || null; lastUpdated.value = d.lastUpdated || ''
        priceMethod.value = d.priceMethod || 'troyOz'
        customPrice.value = d.customPrice || null; customApiUrl.value = d.customApiUrl || ''
        priceSource.value = d.priceSource || 'api'
        autoRefreshInterval.value = d.autoRefreshInterval || 0
        purchaseSort.value = d.purchaseSort || 'date-desc'
        showKHR.value = d.showKHR ?? false
        khrRate.value = d.khrRate || 4100
    }
    // Load user's own purchases (non-owner) on start
    try {
        const saved = JSON.parse(localStorage.getItem('gt4_user_purchases') || '[]')
        purchases.value = saved
    } catch { }
    loadHistory()
    if (priceSource.value === 'api') fetchPrice()
    if (autoRefreshInterval.value) startAutoRefresh()
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('scroll', handleScroll, { passive: true })
    startIdleWatch()
    startPriceRenderLoop()
})
onBeforeUnmount(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
    window.removeEventListener('scroll', handleScroll)
    stopPriceSim()
    stopAutoRefresh()
    stopIdleWatch()
    stopSSClock()
    if (rafId) cancelAnimationFrame(rafId)
    if (renderRafId) cancelAnimationFrame(renderRafId)
})
</script>

<style scoped>
*,
*::before,
*::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

.app {
    --gold: #F5C842;
    --gold-dim: #C08A10;
    --gold-alpha: rgba(245, 200, 66, 0.12);
    --gold-border: rgba(245, 200, 66, 0.28);
    --gain: #22C55E;
    --gain-bg: rgba(34, 197, 94, 0.08);
    --gain-border: rgba(34, 197, 94, 0.35);
    --loss: #F87171;
    --loss-bg: rgba(248, 113, 113, 0.08);
    --loss-border: rgba(248, 113, 113, 0.35);
    --radius-sm: 10px;
    --radius: 16px;
    --radius-lg: 20px;
    --font: 'Outfit', system-ui, sans-serif;
    --mono: 'DM Mono', ui-monospace, monospace;
    --touch: 44px;
}

.app.dark {
    --bg: #0C0C12;
    --surface: #13131C;
    --surface2: #1A1A26;
    --surface3: #222232;
    --border: rgba(255, 255, 255, 0.07);
    --border-hi: rgba(255, 255, 255, 0.14);
    --text: #F2EFE8;
    --text-2: #9490A0;
    --text-3: #5A576A;
}

.app:not(.dark) {
    --bg: #F4F1EB;
    --surface: #FFFFFF;
    --surface2: #F9F7F2;
    --surface3: #EEEBDF;
    --border: rgba(0, 0, 0, 0.08);
    --border-hi: rgba(0, 0, 0, 0.15);
    --text: #1A1810;
    --text-2: #6B665C;
    --text-3: #A09A8E;
    --gold: #B8820A;
    --gold-alpha: rgba(160, 110, 0, 0.1);
    --gold-border: rgba(160, 110, 0, 0.25);
}

.app {
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    font-family: var(--font);
    font-size: 15px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
}

.empty-svg {
    width: 64px;
    height: 64px;
    color: var(--text-3);
}

/* ── Screensaver ── */
.screensaver {
    position: fixed;
    inset: 0;
    z-index: 999;
    background: #0A0A10;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.ss-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 40px;
    animation: ssDrift 8s ease-in-out infinite alternate;
}

@keyframes ssDrift {
    from { transform: translate(0, 0); }
    to { transform: translate(12px, -16px); }
}

.ss-gem {
    font-size: 32px;
    color: #F5C842;
    animation: gemPulse 4s ease-in-out infinite;
    margin-bottom: 8px;
}

.ss-price {
    display: flex;
    align-items: baseline;
    gap: 3px;
}

.ss-dollar {
    font-size: 32px;
    font-weight: 800;
    color: #F5C842;
    align-self: flex-start;
    margin-top: 6px;
}

.ss-int {
    font-size: clamp(64px, 14vw, 120px);
    font-weight: 800;
    color: #F5C842;
    letter-spacing: -4px;
    font-variant-numeric: tabular-nums;
    font-family: 'DM Mono', monospace;
}

.ss-dec {
    font-size: 32px;
    font-weight: 700;
    color: #C08A10;
}

.ss-unit {
    font-size: 13px;
    color: rgba(245, 200, 66, 0.45);
    letter-spacing: 0.12em;
    font-family: 'DM Mono', monospace;
}

.ss-divider {
    width: 60px;
    height: 1px;
    background: rgba(245, 200, 66, 0.2);
    margin: 6px 0;
}

.ss-chi {
    font-size: 20px;
    font-weight: 700;
    color: rgba(245, 200, 66, 0.75);
    font-family: 'DM Mono', monospace;
}

.ss-chi span,
.ss-damlung span {
    font-size: 12px;
    font-weight: 500;
    color: rgba(245, 200, 66, 0.4);
    margin-left: 4px;
}

.ss-damlung {
    font-size: 20px;
    font-weight: 700;
    color: rgba(245, 200, 66, 0.6);
    font-family: 'DM Mono', monospace;
}

.ss-time {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.2);
    font-family: 'DM Mono', monospace;
    margin-top: 16px;
}

.ss-hint {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.12);
    letter-spacing: 0.08em;
    margin-top: 4px;
}

.ss-fade-enter-active,
.ss-fade-leave-active {
    transition: opacity 0.6s ease;
}

.ss-fade-enter-from,
.ss-fade-leave-to {
    opacity: 0;
}

/* ── Ambient ── */
.ambient {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
}

.orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(90px);
    opacity: 0.13;
    will-change: transform;
}

.orb-1 {
    width: 500px;
    height: 500px;
    background: #F5C842;
    top: -150px;
    right: -100px;
    animation: orbDrift1 16s ease-in-out infinite alternate;
}

.orb-2 {
    width: 300px;
    height: 300px;
    background: #A07020;
    bottom: 20%;
    left: -80px;
    animation: orbDrift2 20s ease-in-out infinite alternate-reverse;
}

.orb-3 {
    width: 200px;
    height: 200px;
    background: #F5A623;
    bottom: 10%;
    right: 15%;
    animation: orbDrift3 24s ease-in-out infinite alternate;
}

.app:not(.dark) .orb { opacity: 0.07; }

@keyframes orbDrift1 {
    0% { transform: translate(0, 0) scale(1); opacity: 0.13; }
    33% { transform: translate(-18px, 24px) scale(1.06); opacity: 0.17; }
    66% { transform: translate(12px, 10px) scale(0.96); opacity: 0.11; }
    100% { transform: translate(24px, 36px) scale(1.1); opacity: 0.15; }
}

@keyframes orbDrift2 {
    0% { transform: translate(0, 0) scale(1); opacity: 0.13; }
    50% { transform: translate(20px, -16px) scale(1.08); opacity: 0.17; }
    100% { transform: translate(-10px, 30px) scale(0.94); opacity: 0.10; }
}

@keyframes orbDrift3 {
    0% { transform: translate(0, 0) scale(1); opacity: 0.13; }
    40% { transform: translate(-14px, 20px) scale(1.12); opacity: 0.18; }
    100% { transform: translate(18px, -12px) scale(0.92); opacity: 0.09; }
}

/* ── Header ── */
.header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(12, 12, 18, 0.88);
    backdrop-filter: blur(24px) saturate(1.4);
    -webkit-backdrop-filter: blur(24px) saturate(1.4);
    border-bottom: 1px solid var(--border);
}

.app:not(.dark) .header { background: rgba(244, 241, 235, 0.92); }

.header-inner {
    max-width: 2200px;
    margin: 0 auto;
    padding: 10px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
}

.logo {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    flex-shrink: 0;
}

.logo-gem {
    font-size: 22px;
    color: var(--gold);
    flex-shrink: 0;
    line-height: 1;
    display: inline-block;
    animation: gemPulse 4s ease-in-out infinite;
}

@keyframes gemPulse {
    0%, 100% { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 0px transparent); }
    50% { transform: scale(1.15) rotate(45deg); filter: drop-shadow(0 0 6px rgba(245, 200, 66, 0.55)); }
}

.logo-text { display: flex; flex-direction: column; }

.logo-title {
    font-size: 17px;
    font-weight: 800;
    letter-spacing: -0.3px;
    white-space: nowrap;
}

.logo-sub {
    font-size: 10px;
    color: var(--text-3);
    letter-spacing: 0.05em;
    margin-top: 1px;
}

.header-controls {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
}

.ctrl-btn {
    background: var(--surface2);
    border: 1px solid var(--border);
    color: var(--text);
    border-radius: var(--radius-sm);
    font-size: 14px;
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s;
    min-height: var(--touch);
    min-width: var(--touch);
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.ctrl-btn:hover {
    border-color: var(--gold);
    color: var(--gold);
}

.lang-btn {
    font-size: 12px;
    padding: 0 12px;
    min-width: unset;
}

.lock-nav-btn { font-size: 16px; }

.offline-bar {
    text-align: center;
    padding: 8px;
    font-size: 12px;
    font-weight: 600;
    background: var(--gold-alpha);
    color: var(--gold);
    border-top: 1px solid var(--gold-border);
}

/* ── Password Modal ── */
.pw-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.pw-modal {
    background: var(--surface);
    border: 1px solid var(--border-hi);
    border-radius: var(--radius-lg);
    padding: 24px 20px;
    width: 100%;
    max-width: 360px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
}

.pw-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.pw-modal-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--text);
}

.pw-modal-close {
    background: var(--surface2);
    border: 1px solid var(--border);
    color: var(--text-2);
    border-radius: 8px;
    width: 32px;
    height: 32px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    transition: all 0.2s;
}

.pw-modal-close:hover {
    border-color: var(--loss-border);
    color: var(--loss);
}

.pw-modal-sub {
    font-size: 13px;
    color: var(--text-2);
    line-height: 1.5;
}

/* ── Sticky Price ── */
.sticky-price {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    transform: translateY(-90px);
    z-index: 99;
    background: var(--surface);
    border: none;
    border-bottom: 1px solid var(--gold-border);
    border-radius: 0;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: transform 0.55s cubic-bezier(0.34, 1.7, 0.64, 1);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.sticky-price.visible { transform: translateY(0); }

@media (min-width: 640px) {
    .sticky-price {
        left: 50%;
        right: auto;
        transform: translateX(-50%) translateY(-90px);
        border: 1px solid var(--gold-border);
        border-radius: 0 0 18px 18px;
        padding: 10px 22px;
        box-shadow: 0 6px 28px rgba(0, 0, 0, 0.35);
    }
    .sticky-price.visible { transform: translateX(-50%) translateY(0); }
}

.sticky-gem {
    font-size: 18px;
    color: var(--gold);
    flex-shrink: 0;
}

.sticky-prices { display: flex; flex-direction: column; gap: 1px; }
.sticky-row-main { display: flex; align-items: baseline; gap: 4px; }
.sticky-row-sub { display: flex; align-items: baseline; gap: 4px; }

.sticky-val {
    font-size: 22px;
    font-weight: 800;
    color: var(--gold);
    font-family: var(--mono);
    letter-spacing: -0.5px;
}

.sticky-unit { font-size: 12px; color: var(--text-3); }

.sticky-val-sub {
    font-size: 14px;
    font-weight: 700;
    color: var(--gold-dim);
    font-family: var(--mono);
}

.sticky-unit-sub { font-size: 11px; color: var(--text-3); }

.sticky-divider {
    width: 1px;
    height: 32px;
    background: var(--border);
    flex-shrink: 0;
}

.sticky-refresh {
    background: none;
    border: none;
    color: var(--text-2);
    cursor: pointer;
    font-size: 20px;
    padding: 4px;
    transition: color 0.2s;
    margin-left: auto;
}

.sticky-refresh:hover { color: var(--gold); }

/* ── Main layout ── */
.main {
    position: relative;
    z-index: 1;
    max-width: 2200px;
    margin: 0 auto;
    padding: 16px 16px 72px;
}

.desktop-grid {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.col-left,
.col-center,
.col-right {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
}

/* ── Cards ── */
.card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 18px 16px;
    position: relative;
}

/* ── Seg control ── */
.seg-ctrl {
    display: flex;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 3px;
    margin-bottom: 16px;
    gap: 3px;
}

.seg-btn {
    flex: 1;
    padding: 10px 12px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--text-2);
    font-family: var(--font);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.seg-btn.active {
    background: var(--gold-alpha);
    color: var(--gold);
    border: 1px solid var(--gold-border);
}

/* ── Hero Price ── */
.hero-price-block { margin-bottom: 14px; }

.hero-meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
}

.metal-tag {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-2);
    letter-spacing: 0.04em;
}

.last-updated {
    font-size: 11px;
    color: var(--text-3);
    font-family: var(--mono);
}

.tick-arrow {
    font-size: 11px;
    font-weight: 700;
    font-family: var(--mono);
}

.tick-arrow.up { color: #4ade80; }
.tick-arrow.down { color: #f87171; }

.hero-price {
    display: flex;
    align-items: baseline;
    gap: 2px;
    line-height: 1;
    margin-bottom: 4px;
    position: relative;
    overflow: hidden;
}

.hero-price::after {
    content: '';
    position: absolute;
    top: 0;
    left: -80%;
    width: 55%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.14), transparent);
    animation: priceShimmer 5s ease-in-out infinite;
    pointer-events: none;
}

.app:not(.dark) .hero-price::after {
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
}

@keyframes priceShimmer {
    0% { left: -80%; }
    45%, 100% { left: 130%; }
}

.price-tick-up .price-int,
.price-tick-up .price-dec,
.price-tick-up .price-dollar { animation: tickUp 0.85s ease-out forwards; }

.price-tick-down .price-int,
.price-tick-down .price-dec,
.price-tick-down .price-dollar { animation: tickDown 0.85s ease-out forwards; }

@keyframes tickUp {
    0% { color: var(--gold); }
    15% { color: #4ade80; text-shadow: 0 0 16px rgba(74, 222, 128, 0.7); }
    100% { color: var(--gold); text-shadow: none; }
}

@keyframes tickDown {
    0% { color: var(--gold); }
    15% { color: #f87171; text-shadow: 0 0 16px rgba(248, 113, 113, 0.7); }
    100% { color: var(--gold); text-shadow: none; }
}

.price-dollar {
    font-size: 24px;
    font-weight: 800;
    color: var(--gold);
    align-self: flex-start;
    margin-top: 4px;
}

.price-int {
    font-size: clamp(40px, 10vw, 64px);
    font-weight: 800;
    color: var(--gold);
    letter-spacing: -2px;
    font-variant-numeric: tabular-nums;
}

.price-dec {
    font-size: 20px;
    font-weight: 700;
    color: var(--gold-dim);
}

.price-unit-label {
    font-size: 12px;
    color: var(--text-3);
    font-family: var(--mono);
}

.chips-scroll {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding: 2px 0 10px;
}

.chips-scroll::-webkit-scrollbar { display: none; }

.chips-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    margin-bottom: 10px;
}

.chip {
    display: flex;
    flex-direction: column;
    gap: 2px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 8px 10px;
}

.chip-label {
    font-size: 10px;
    font-weight: 700;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.chip-price {
    font-size: 12px;
    font-weight: 600;
    color: var(--text);
    font-family: var(--mono);
}

/* ── Progress / Flash ── */
.progress-bar {
    height: 3px;
    background: var(--surface3);
    border-radius: 2px;
    overflow: hidden;
    margin: 10px 0;
}

.progress-fill {
    height: 100%;
    background: var(--gold);
    animation: progress 1.4s ease-in-out infinite;
}

@keyframes progress {
    0% { transform: translateX(-100%) scaleX(0.4); }
    50% { transform: translateX(60%) scaleX(0.8); }
    100% { transform: translateX(200%) scaleX(0.4); }
}

.flash {
    padding: 10px 14px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
    margin-top: 10px;
}

.flash.success {
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: var(--gain);
}

.flash.error {
    background: rgba(248, 113, 113, 0.1);
    border: 1px solid rgba(248, 113, 113, 0.3);
    color: var(--loss);
}

/* ── Sub panel ── */
.sub-panel {
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid var(--border);
}

.sub-panel-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 10px;
    flex-wrap: wrap;
}

.api-info {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
    min-width: 0;
}

.api-badge {
    display: inline-block;
    width: fit-content;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.05em;
    background: var(--gold-alpha);
    border: 1px solid var(--gold-border);
    color: var(--gold);
    padding: 3px 8px;
    border-radius: 6px;
}

.api-hint-text { font-size: 12px; color: var(--text-3); }

.api-key-row {
    display: flex;
    gap: 6px;
    margin-bottom: 8px;
}

.api-hint {
    font-size: 12px;
    color: var(--text-3);
    line-height: 1.5;
}

.api-hint a { color: var(--gold); text-decoration: none; }
.api-hint a:hover { text-decoration: underline; }

.method-tabs {
    display: flex;
    gap: 6px;
    margin-bottom: 12px;
}

.method-btn {
    flex: 1;
    padding: 10px 8px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface2);
    color: var(--text-2);
    font-family: var(--font);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.method-btn.active {
    background: var(--gold-alpha);
    border-color: var(--gold-border);
    color: var(--gold);
}

.price-input-row { display: flex; }

.input-prefix {
    background: var(--surface3);
    border: 1px solid var(--border);
    border-right: none;
    border-radius: 10px 0 0 10px;
    padding: 14px 14px;
    font-size: 20px;
    color: var(--gold);
    font-family: var(--mono);
    display: flex;
    align-items: center;
    flex-shrink: 0;
}

.price-input { border-radius: 0 10px 10px 0 !important; }

/* ── Inputs / Buttons ── */
.text-input {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 10px;
    color: var(--text);
    font-family: var(--font);
    font-size: 16px;
    font-weight: 500;
    padding: 8px 12px;
    width: 100%;
    transition: border-color 0.2s;
    -webkit-appearance: none;
    appearance: none;
}

.text-input:focus { outline: none; border-color: var(--gold-border); }
.text-input::placeholder { color: var(--text-3); }

.primary-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: var(--gold);
    color: #1A1000;
    border: none;
    border-radius: 12px;
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 700;
    font-family: var(--font);
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
}

.primary-btn:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
.primary-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.app:not(.dark) .primary-btn { color: #fff; background: var(--gold-dim); }

.refresh-btn { flex-shrink: 0; }
.full-btn { width: 100%; }

.ghost-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: var(--surface2);
    border: 1px solid var(--border);
    color: var(--text-2);
    border-radius: 12px;
    padding: 10px 16px;
    font-size: 13px;
    font-weight: 600;
    font-family: var(--font);
    cursor: pointer;
    transition: all 0.2s;
}

.ghost-btn:hover { border-color: var(--border-hi); color: var(--text); }

.icon-btn-sm {
    background: var(--surface2);
    border: 1px solid var(--border);
    color: var(--text-2);
    border-radius: 10px;
    font-size: 16px;
    cursor: pointer;
    min-height: var(--touch);
    min-width: var(--touch);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
}

.icon-btn-sm:hover { border-color: var(--gold-border); }
.icon-btn-sm.danger:hover { border-color: var(--loss-border); }

.spin {
    display: inline-block;
    animation: spin 1s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ── Section titles ── */
.section-title {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: var(--text);
    margin-bottom: 14px;
}

.section-title::before { content: '◈ '; color: var(--gold); font-size: 10px; }

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    gap: 8px;
    flex-wrap: wrap;
}

.section-header .section-title { margin-bottom: 0; }

.section-actions {
    display: flex;
    gap: 6px;
    align-items: center;
}

/* ── Converter ── */
.conv-tabs-scroll {
    display: flex;
    gap: 5px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding-bottom: 2px;
    margin-bottom: 12px;
}

.conv-tabs-scroll::-webkit-scrollbar { display: none; }

.conv-tab {
    padding: 8px 12px;
    border: 1px solid var(--border);
    background: var(--surface2);
    color: var(--text-2);
    font-family: var(--font);
    font-size: 12px;
    font-weight: 600;
    border-radius: 8px;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
}

.conv-tab.active {
    background: var(--gold-alpha);
    border-color: var(--gold-border);
    color: var(--gold);
}

.conv-input-row {
    display: flex;
    gap: 0;
    margin-bottom: 10px;
}

.from-badge {
    background: var(--gold-alpha);
    border: 1px solid var(--gold-border);
    border-right: none;
    border-radius: 10px 0 0 10px;
    padding: 12px 12px;
    color: var(--gold);
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    white-space: nowrap;
    flex-shrink: 0;
}

.conv-input {
    border-radius: 0 10px 10px 0 !important;
    font-size: 16px !important;
    font-family: var(--mono) !important;
}

.conv-results {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
}

.conv-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border);
    gap: 8px;
}

.conv-row:last-child { border-bottom: none; }
.conv-label { font-size: 13px; color: var(--text-2); font-weight: 500; }
.conv-val { font-size: 13px; font-family: var(--mono); font-weight: 600; color: var(--text); }

/* ── Unit grid ── */
.unit-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
}

.unit-tile {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    transition: border-color 0.2s;
}

.unit-tile:hover { border-color: var(--gold-border); }

.tile-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.tile-name {
    font-size: 10px;
    font-weight: 700;
    color: var(--text-2);
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.tile-gram { font-size: 10px; color: var(--text-3); font-family: var(--mono); }

.tile-price {
    font-size: 14px;
    font-weight: 700;
    color: var(--text);
    font-family: var(--mono);
    font-variant-numeric: tabular-nums;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* ── Password gate remnants (modal reuses these) ── */
.pw-icon {
    font-size: 32px;
    text-align: center;
    margin-bottom: 4px;
}

.pw-error {
    font-size: 13px;
    color: var(--loss);
    text-align: center;
    font-weight: 500;
}

/* ── Lock ripple rings ── */
.lock-ripple-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
}

.lock-ripple {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 1.5px solid var(--gold);
    opacity: 0;
    animation: lockRipple 2.8s ease-out infinite;
}

.lock-ripple.r2 { animation-delay: 0.9s; }
.lock-ripple.r3 { animation-delay: 1.8s; }

@keyframes lockRipple {
    0% { transform: scale(0.7); opacity: 0.65; }
    100% { transform: scale(2.4); opacity: 0; }
}

/* ── Holdings row flash ── */
@keyframes rowFlash {
    0% { background: rgba(34, 197, 94, 0.28); }
    100% { background: transparent; }
}

.ht-row-flash { animation: rowFlash 1.4s ease-out forwards; }

/* ── Add purchase ── */
.add-purchase-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    background: var(--surface2);
    border: 1.5px dashed var(--border-hi);
    border-radius: 14px;
    color: var(--text-2);
    font-family: var(--font);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    padding: 14px 20px;
    margin-bottom: 12px;
}

.add-purchase-btn:hover {
    border-color: var(--gold-border);
    color: var(--gold);
    background: var(--gold-alpha);
}

.add-icon { font-size: 20px; line-height: 1; }

.purchase-form {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 14px;
    margin-bottom: 12px;
}

.form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 12px;
}

.form-field {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.form-field label {
    font-size: 11px;
    font-weight: 700;
    color: var(--text-2);
    text-transform: uppercase;
    letter-spacing: 0.07em;
}

/* ── Purchase cards ── */
.purchases-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 14px;
}

.p-card {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 14px;
    transition: all 0.2s;
    border-left: 3px solid var(--border);
    height: 100%;
    box-sizing: border-box;
}

.pcard-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
    gap: 8px;
}

.pcard-weight-row {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
}

.pcard-weight {
    font-size: 16px;
    font-weight: 800;
    color: var(--text);
    font-variant-numeric: tabular-nums;
}

.pcard-unit { font-size: 12px; font-weight: 600; color: var(--text-2); }
.pcard-date { font-size: 11px; color: var(--text-3); font-family: var(--mono); }
.pcard-btns { display: flex; gap: 6px; flex-shrink: 0; }

.pcard-btn {
    background: var(--surface3);
    border: 1px solid var(--border);
    color: var(--text-2);
    border-radius: 8px;
    font-size: 13px;
    cursor: pointer;
    min-height: 36px;
    min-width: 36px;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.pcard-btn:hover { border-color: var(--gold-border); color: var(--gold); }
.pcard-btn.danger:hover { border-color: var(--loss-border); color: var(--loss); }

.gl-row { display: flex; align-items: stretch; }

.gl-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 0 4px;
}

.gl-col:first-child { padding-left: 0; }
.gl-col:last-child { padding-right: 0; }

.gl-divider {
    width: 1px;
    background: var(--border);
    flex-shrink: 0;
    margin: 0 4px;
}

.gl-label {
    font-size: 10px;
    font-weight: 600;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.gl-val { font-size: 12px; font-weight: 700; font-family: var(--mono); color: var(--text); }
.gl-main { font-size: 13px; }
.gain-text { color: var(--gain) !important; }
.loss-text { color: var(--loss) !important; }
.edit-actions { display: flex; gap: 8px; }

/* ── Portfolio / KPI ── */
.summary-card { position: relative; overflow: hidden; }

.kpi-stack {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 14px;
}

.kpi-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px 14px;
}

.kpi-item.kpi-gain { background: var(--gain-bg); border-color: var(--gain-border); border-left: 3px solid var(--gain); }
.kpi-item.kpi-loss { background: var(--loss-bg); border-color: var(--loss-border); border-left: 3px solid var(--loss); }
.kpi-item.kpi-big { padding: 16px 14px; }

.kpi-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.kpi-val {
    font-size: 18px;
    font-weight: 800;
    color: var(--text);
    font-family: var(--mono);
    font-variant-numeric: tabular-nums;
}

.kpi-main { font-size: 22px; }

.kpi-gain .kpi-val { color: var(--gain); animation: gainGlow 3.5s ease-in-out infinite; }
.kpi-loss .kpi-val { color: var(--loss); animation: lossGlow 3.5s ease-in-out infinite; }

@keyframes gainGlow {
    0%, 100% { text-shadow: none; }
    50% { text-shadow: 0 0 14px rgba(34, 197, 94, 0.5); }
}

@keyframes lossGlow {
    0%, 100% { text-shadow: none; }
    50% { text-shadow: 0 0 14px rgba(248, 113, 113, 0.5); }
}

.portfolio-bar {
    height: 5px;
    background: var(--surface3);
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 6px;
}

.portfolio-fill { height: 100%; border-radius: 3px; transition: width 0.6s ease; }
.portfolio-fill.gain { background: var(--gain); animation: barPulse 3.5s ease-in-out infinite; }
.portfolio-fill.loss { background: var(--loss); animation: barPulseLoss 3.5s ease-in-out infinite; }

@keyframes barPulse {
    0%, 100% { filter: brightness(1); }
    50% { filter: brightness(1.35); }
}

@keyframes barPulseLoss {
    0%, 100% { filter: brightness(1); }
    50% { filter: brightness(1.35); }
}

.portfolio-pct { font-size: 12px; font-weight: 700; text-align: right; font-family: var(--mono); }
.portfolio-pct.gain { color: var(--gain); }
.portfolio-pct.loss { color: var(--loss); }

/* ── Holdings table ── */
.holdings-table {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
}

.ht-header {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 0;
    padding: 8px 12px;
    background: var(--surface3);
    border-bottom: 1px solid var(--border);
}

.ht-header span {
    font-size: 10px;
    font-weight: 700;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.ht-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 0;
    padding: 9px 12px;
    border-bottom: 1px solid var(--border);
    align-items: center;
    font-size: 12px;
    font-family: var(--mono);
    font-weight: 600;
    transition: background 0.15s;
}

.ht-row:last-child { border-bottom: none; }
.ht-row:hover { background: var(--surface3); }
.ht-weight { font-weight: 700; color: var(--text); }
.ht-weight em { font-style: normal; font-size: 10px; color: var(--text-3); margin-left: 2px; }
.ht-gain { border-left: 2px solid var(--gain); }
.ht-loss { border-left: 2px solid var(--loss); }

/* ── Quick Reference ── */
.qref-list {
    display: flex;
    flex-direction: column;
    gap: 0;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
}

.qref-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 9px 14px;
    border-bottom: 1px solid var(--border);
}

.qref-row:last-child { border-bottom: none; }
.qref-label { font-size: 13px; color: var(--text-2); font-weight: 500; }
.qref-val { font-size: 13px; font-family: var(--mono); font-weight: 700; color: var(--gold); }
.qref-divider { height: 1px; background: var(--border-hi); margin: 0; }

/* ── Empty state ── */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 32px 20px;
    background: var(--surface2);
    border-radius: 12px;
    border: 1.5px dashed var(--border);
}

.empty-icon { font-size: 24px; color: var(--text-3); }
.empty-state p { font-size: 13px; color: var(--text-2); font-weight: 500; text-align: center; }

/* ── Footer ── */
.footer {
    text-align: center;
    padding: 20px 16px;
    font-size: 11px;
    color: var(--text-3);
    font-weight: 500;
    border-top: 1px solid var(--border);
}

/* ── Sparkline ── */
.sparkline-wrap { margin-top: 10px; }
.sparkline { width: 100%; height: 40px; display: block; }

.sparkline-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 3px;
}

.sparkline-low,
.sparkline-high { font-size: 10px; font-family: var(--mono); color: var(--text-3); }
.sparkline-label { font-size: 10px; color: var(--text-3); }

/* ── Today chip ── */
.today-chip {
    display: inline-block;
    margin-top: 4px;
    font-size: 11px;
    font-weight: 600;
    font-family: var(--font);
    color: var(--gold);
    background: var(--gold-alpha);
    border: 1px solid var(--gold-border);
    border-radius: 6px;
    padding: 3px 8px;
    cursor: pointer;
    transition: background 0.15s;
}

.today-chip:hover { background: rgba(245, 200, 66, 0.2); }

.conv-usd-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;
    padding: 10px 14px;
    background: var(--gold-alpha);
    border: 1px solid var(--gold-border);
    border-radius: 10px;
}

.conv-usd-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--gold);
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.conv-usd-val { font-size: 16px; font-weight: 800; color: var(--gold); font-family: var(--mono); }

.conv-qty-badge {
    font-size: 11px;
    font-weight: 700;
    background: var(--gold-alpha);
    border: 1px solid var(--gold-border);
    color: var(--gold);
    padding: 3px 10px;
    border-radius: 20px;
    white-space: nowrap;
    margin-bottom: 14px;
}

.conv-total-tile {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: var(--gold-alpha);
    border: 1px solid var(--gold-border);
    border-radius: 12px;
    margin-bottom: 10px;
}

.conv-total-label { font-size: 12px; font-weight: 600; color: var(--gold); }
.conv-total-val { font-size: 20px; font-weight: 800; color: var(--gold); font-family: var(--mono); }

/* ── Transitions ── */
@keyframes priceFlipOut {
    to { opacity: 0; transform: translateY(10px) rotateX(20deg); }
}

@keyframes priceFlipIn {
    from { opacity: 0; transform: translateY(-10px) rotateX(-20deg); }
    to { opacity: 1; transform: translateY(0) rotateX(0); }
}

.price-flip-leave-active { animation: priceFlipOut 0.18s ease-in forwards; }
.price-flip-enter-active { animation: priceFlipIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

.fade-enter-active,
.fade-leave-active { transition: opacity 0.3s; }

.fade-enter-from,
.fade-leave-to { opacity: 0; }

.slide-down-enter-active,
.slide-down-leave-active { transition: all 0.3s ease; overflow: hidden; }

.slide-down-enter-from,
.slide-down-leave-to { opacity: 0; transform: translateY(-10px); max-height: 0; }

.slide-down-enter-to,
.slide-down-leave-from { max-height: 700px; }

/* ── Chip shimmer ── */
@keyframes shimmerSwipe {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(300%); }
}

.chip-shimmer { position: relative; overflow: hidden; }

.chip-shimmer .shimmer-line {
    position: absolute;
    top: 0;
    left: 0;
    width: 40%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(245, 200, 66, 0.3), transparent);
    transform: translateX(-100%);
    animation: shimmerSwipe 0.7s ease forwards;
}

/* ── Card stagger ── */
@keyframes cardSlideIn {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
}

.p-card-stagger {
    opacity: 0;
    animation: cardSlideIn 0.35s ease forwards;
}

/* ── Lock shake ── */
@keyframes lockShake {
    0%, 100% { transform: translateX(0); }
    15% { transform: translateX(-7px); }
    30% { transform: translateX(7px); }
    45% { transform: translateX(-5px); }
    60% { transform: translateX(5px); }
    75% { transform: translateX(-3px); }
    90% { transform: translateX(3px); }
}

.pw-icon.shake { animation: lockShake 0.5s ease; }

/* ── Unlock burst ── */
@keyframes burstRing {
    0% { transform: scale(0.5); opacity: 0.9; }
    100% { transform: scale(2.4); opacity: 0; }
}

@keyframes burstRing2 {
    0% { transform: scale(0.5); opacity: 0.6; }
    100% { transform: scale(1.9); opacity: 0; }
}

.burst-ring-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.burst-r1,
.burst-r2 {
    position: absolute;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    border: 2px solid var(--gold);
    opacity: 0;
    pointer-events: none;
}

.burst-r2 { width: 40px; height: 40px; border-color: rgba(245, 200, 66, 0.5); }
.burst-ring-wrap.burst .burst-r1 { animation: burstRing 0.65s ease-out forwards; }
.burst-ring-wrap.burst .burst-r2 { animation: burstRing2 0.55s ease-out 0.1s forwards; }

/* ── Section glow ── */
@keyframes sectionGlow {
    0% { box-shadow: 0 0 0 0 rgba(245, 200, 66, 0); }
    30% { box-shadow: 0 0 0 8px rgba(245, 200, 66, 0.2); }
    100% { box-shadow: 0 0 0 0 rgba(245, 200, 66, 0); }
}

.section-glow { animation: sectionGlow 0.9s ease-out forwards; }

/* ══════════════════════════════════════════════════════════════════════════ */
/* DESKTOP BREAKPOINTS                                                       */
/* ══════════════════════════════════════════════════════════════════════════ */

@media (min-width: 768px) {
    .main { padding: 20px 20px 72px; }

    .desktop-grid {
        display: grid;
        grid-template-columns: 300px 1fr;
        grid-template-rows: auto;
        gap: 12px;
        align-items: start;
    }

    .col-left { grid-column: 1; grid-row: 1 / 3; position: sticky; top: 72px; align-self: start; }
    .col-center { grid-column: 2; grid-row: 1; }
    .col-right { grid-column: 2; grid-row: 2; }
    .unit-grid { grid-template-columns: repeat(3, 1fr); }
    .purchases-list { display: grid; grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1100px) {
    .main { padding: 24px 24px 72px; }

    .desktop-grid {
        grid-template-columns: 280px 1fr 260px;
        grid-template-rows: auto;
        gap: 14px;
    }

    .col-left { grid-column: 1; grid-row: 1; position: sticky; top: 72px; align-self: start; }
    .col-center { grid-column: 2; grid-row: 1; }
    .col-right { grid-column: 3; grid-row: 1; position: sticky; top: 72px; align-self: start; }
    .unit-grid { grid-template-columns: repeat(3, 1fr); }
    .purchases-list { display: grid; grid-template-columns: 1fr; }
    .price-int { font-size: 52px; }
    .chips-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1280px) {
    .desktop-grid { grid-template-columns: 320px 1fr 300px; gap: 16px; }
    .purchases-list { grid-template-columns: repeat(2, 1fr); }
    .unit-grid { grid-template-columns: repeat(6, 1fr); }
    .chips-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (min-width: 1600px) {
    .main { padding: 28px 32px 72px; }
    .header-inner { max-width: 1800px; padding: 12px 32px; }

    .desktop-grid {
        grid-template-columns: 360px 1fr 320px;
        gap: 20px;
        max-width: 1800px;
        margin: 0 auto;
    }

    .price-int { font-size: 68px; letter-spacing: -3px; }
    .price-dollar { font-size: 32px; }
    .price-dec { font-size: 26px; }
    .card { padding: 24px 22px; border-radius: 22px; }
    .purchases-list { grid-template-columns: repeat(3, 1fr); }
    .unit-grid { grid-template-columns: repeat(6, 1fr); }
    .chips-grid { grid-template-columns: repeat(3, 1fr); }
    .kpi-val { font-size: 22px; }
    .kpi-main { font-size: 28px; }
    .kpi-item { padding: 16px 18px; }
    .kpi-item.kpi-big { padding: 20px 18px; }
    .sparkline { height: 52px; }
    .ht-row { padding: 11px 16px; font-size: 13px; }
    .ht-header { padding: 10px 16px; }
}

@media (min-width: 2000px) {
    .main { padding: 32px 40px 72px; }
    .header-inner { max-width: 2200px; padding: 14px 40px; }

    .desktop-grid {
        grid-template-columns: 400px 1fr 380px;
        gap: 24px;
        max-width: 2200px;
    }

    .price-int { font-size: 80px; letter-spacing: -4px; }
    .price-dollar { font-size: 38px; }
    .price-dec { font-size: 30px; }
    .card { padding: 28px 26px; border-radius: 24px; }
    .section-title { font-size: 15px; margin-bottom: 18px; }
    .purchases-list { grid-template-columns: repeat(3, 1fr); }
    .unit-grid { grid-template-columns: repeat(6, 1fr); }
    .chips-grid { grid-template-columns: repeat(3, 1fr); }
    .kpi-val { font-size: 26px; }
    .kpi-main { font-size: 34px; }
    .kpi-item { padding: 20px 22px; }
    .conv-row { padding: 13px 18px; }
    .conv-label { font-size: 15px; }
    .conv-val { font-size: 15px; }
    .sparkline { height: 64px; }
    .ht-row { padding: 13px 18px; font-size: 14px; }
}

@supports (padding-bottom: env(safe-area-inset-bottom)) {
    .main { padding-bottom: calc(72px + env(safe-area-inset-bottom)); }
    .header { padding-top: env(safe-area-inset-top); }
}

/* ── KHR button ── */
.khr-btn { font-size: 13px; padding: 0 12px; min-width: unset; font-weight: 700; }

/* ── KHR rate row ── */
.price-unit-meta { display: flex; flex-direction: column; gap: 6px; }

.khr-rate-row {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 2px;
}

.khr-rate-label { font-size: 11px; color: var(--text-3); white-space: nowrap; }

.khr-rate-input {
    background: var(--surface2);
    border: 1px solid var(--gold-border);
    border-radius: 7px;
    color: var(--text);
    font-family: var(--mono);
    font-size: 13px;
    font-weight: 600;
    padding: 3px 8px;
    width: 80px;
    text-align: right;
    -webkit-appearance: none;
    appearance: none;
}

.khr-rate-input:focus { outline: none; border-color: var(--gold); }

/* ── KHR hero price ── */
.price-int--khr { font-size: clamp(28px, 6vw, 48px) !important; letter-spacing: -1px !important; }

/* ── Auto-refresh ── */
.auto-refresh-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--border);
    flex-wrap: wrap;
}

.refresh-seg {
    display: flex;
    gap: 2px;
    background: var(--surface3);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 2px;
}

.rseg-btn {
    padding: 5px 9px;
    border-radius: 6px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--text-2);
    font-family: var(--font);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
}

.rseg-btn.active {
    background: var(--gold-alpha);
    border-color: var(--gold-border);
    color: var(--gold);
}

/* ── Sort select ── */
.sort-select {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-2);
    font-family: var(--font);
    font-size: 12px;
    font-weight: 600;
    padding: 6px 22px 6px 8px;
    cursor: pointer;
    -webkit-appearance: none;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239490a0' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 7px center;
    background-size: 10px;
    min-height: 36px;
    transition: border-color 0.2s;
}

.sort-select:focus { outline: none; border-color: var(--gold-border); color: var(--text); }

/* ── Purchases total weight bar ── */
.purchases-totals {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: var(--text-3);
    font-weight: 500;
    margin-bottom: 10px;
    padding: 7px 12px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 9px;
}

.purchases-total-weight {
    font-family: var(--mono);
    color: var(--gold);
    font-weight: 700;
    font-size: 12px;
}

/* ── Total weight KPI ── */
.kpi-weight {
    font-size: 15px !important;
    color: var(--text) !important;
}

.kpi-weight small { font-size: 10px; color: var(--text-3); font-weight: 500; margin-left: 1px; }

/* ── Quick ref section label ── */
.qref-section-label {
    font-size: 10px;
    font-weight: 700;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 6px 14px 2px;
}

/* ── Mobile bottom nav ── */
.mobile-nav {
    display: none;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 150;
    background: rgba(12, 12, 18, 0.96);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid var(--border);
    padding: 6px 0 max(8px, env(safe-area-inset-bottom));
    flex-direction: row;
    align-items: center;
    justify-content: space-around;
}

.app:not(.dark) .mobile-nav { background: rgba(244, 241, 235, 0.96); }

.mnav-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 5px 24px;
    border-radius: 10px;
    transition: all 0.15s;
    -webkit-tap-highlight-color: transparent;
}

.mnav-icon { font-size: 22px; line-height: 1; transition: transform 0.15s; }
.mnav-label { font-size: 10px; font-weight: 600; color: var(--text-3); font-family: var(--font); letter-spacing: 0.03em; transition: color 0.15s; }
.mnav-btn.active .mnav-label { color: var(--gold); }
.mnav-btn.active .mnav-icon { transform: translateY(-2px); filter: drop-shadow(0 0 4px rgba(245, 200, 66, 0.55)); }

@media (max-width: 767px) {
    .mobile-nav { display: flex; }
    .main { padding-bottom: calc(80px + env(safe-area-inset-bottom)) !important; }
}
</style>