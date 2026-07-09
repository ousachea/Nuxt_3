
import type { DefineComponent, SlotsType } from 'vue'
type IslandComponent<T> = DefineComponent<{}, {refresh: () => Promise<void>}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, SlotsType<{ fallback: { error: unknown } }>> & T

type HydrationStrategies = {
  hydrateOnVisible?: IntersectionObserverInit | true
  hydrateOnIdle?: number | true
  hydrateOnInteraction?: keyof HTMLElementEventMap | Array<keyof HTMLElementEventMap> | true
  hydrateOnMediaQuery?: string
  hydrateAfter?: number
  hydrateWhen?: boolean
  hydrateNever?: true
}
type LazyComponent<T> = DefineComponent<HydrationStrategies, {}, {}, {}, {}, {}, {}, { hydrated: () => void }> & T


export const BorderGlow: typeof import("../components/BorderGlow/BorderGlow.vue")['default']
export const DotGrid: typeof import("../components/DotGrid/DotGrid.vue")['default']
export const BudgetAchievementsTab: typeof import("../components/budget/AchievementsTab.vue")['default']
export const BudgetAddExpenseModal: typeof import("../components/budget/AddExpenseModal.vue")['default']
export const BudgetAnalyticsTab: typeof import("../components/budget/AnalyticsTab.vue")['default']
export const BudgetBottomNav: typeof import("../components/budget/BottomNav.vue")['default']
export const BudgetCategoryChart: typeof import("../components/budget/CategoryChart.vue")['default']
export const BudgetDashboardTab: typeof import("../components/budget/DashboardTab.vue")['default']
export const BudgetExpensesTab: typeof import("../components/budget/ExpensesTab.vue")['default']
export const BudgetInsightsCard: typeof import("../components/budget/InsightsCard.vue")['default']
export const BudgetMealPlanner: typeof import("../components/budget/MealPlanner.vue")['default']
export const BudgetMonthlyHeatmap: typeof import("../components/budget/MonthlyHeatmap.vue")['default']
export const BudgetMonthlyProjection: typeof import("../components/budget/MonthlyProjection.vue")['default']
export const BudgetOverviewCards: typeof import("../components/budget/OverviewCards.vue")['default']
export const BudgetProgressRing: typeof import("../components/budget/ProgressRing.vue")['default']
export const BudgetSavingsJar: typeof import("../components/budget/SavingsJar.vue")['default']
export const BudgetSettingsTab: typeof import("../components/budget/SettingsTab.vue")['default']
export const BudgetSidebarNav: typeof import("../components/budget/SidebarNav.vue")['default']
export const BudgetSpendingTimeline: typeof import("../components/budget/SpendingTimeline.vue")['default']
export const BudgetWeeklyChart: typeof import("../components/budget/WeeklyChart.vue")['default']
export const NuxtWelcome: typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/welcome.vue")['default']
export const NuxtLayout: typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-layout")['default']
export const NuxtErrorBoundary: typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']
export const ClientOnly: typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/client-only")['default']
export const DevOnly: typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/dev-only")['default']
export const ServerPlaceholder: typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/server-placeholder")['default']
export const NuxtLink: typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-link")['default']
export const NuxtLoadingIndicator: typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
export const NuxtTime: typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']
export const NuxtRouteAnnouncer: typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
export const NuxtImg: typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']
export const NuxtPicture: typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']
export const VitePwaManifest: typeof import("../node_modules/.pnpm/@vite-pwa+nuxt@1.1.1_magicast@0.5.3_vite@7.3.3_@types+node@25.9.1_jiti@2.7.0_terser@5.4_b762c78c5490f09b691cf795487f233c/node_modules/@vite-pwa/nuxt/dist/runtime/components/VitePwaManifest")['default']
export const NuxtPwaManifest: typeof import("../node_modules/.pnpm/@vite-pwa+nuxt@1.1.1_magicast@0.5.3_vite@7.3.3_@types+node@25.9.1_jiti@2.7.0_terser@5.4_b762c78c5490f09b691cf795487f233c/node_modules/@vite-pwa/nuxt/dist/runtime/components/VitePwaManifest")['default']
export const NuxtPwaAssets: typeof import("../node_modules/.pnpm/@vite-pwa+nuxt@1.1.1_magicast@0.5.3_vite@7.3.3_@types+node@25.9.1_jiti@2.7.0_terser@5.4_b762c78c5490f09b691cf795487f233c/node_modules/@vite-pwa/nuxt/dist/runtime/components/NuxtPwaAssets")['default']
export const PwaAppleImage: typeof import("../node_modules/.pnpm/@vite-pwa+nuxt@1.1.1_magicast@0.5.3_vite@7.3.3_@types+node@25.9.1_jiti@2.7.0_terser@5.4_b762c78c5490f09b691cf795487f233c/node_modules/@vite-pwa/nuxt/dist/runtime/components/PwaAppleImage.vue")['default']
export const PwaAppleSplashScreenImage: typeof import("../node_modules/.pnpm/@vite-pwa+nuxt@1.1.1_magicast@0.5.3_vite@7.3.3_@types+node@25.9.1_jiti@2.7.0_terser@5.4_b762c78c5490f09b691cf795487f233c/node_modules/@vite-pwa/nuxt/dist/runtime/components/PwaAppleSplashScreenImage.vue")['default']
export const PwaFaviconImage: typeof import("../node_modules/.pnpm/@vite-pwa+nuxt@1.1.1_magicast@0.5.3_vite@7.3.3_@types+node@25.9.1_jiti@2.7.0_terser@5.4_b762c78c5490f09b691cf795487f233c/node_modules/@vite-pwa/nuxt/dist/runtime/components/PwaFaviconImage.vue")['default']
export const PwaMaskableImage: typeof import("../node_modules/.pnpm/@vite-pwa+nuxt@1.1.1_magicast@0.5.3_vite@7.3.3_@types+node@25.9.1_jiti@2.7.0_terser@5.4_b762c78c5490f09b691cf795487f233c/node_modules/@vite-pwa/nuxt/dist/runtime/components/PwaMaskableImage.vue")['default']
export const PwaTransparentImage: typeof import("../node_modules/.pnpm/@vite-pwa+nuxt@1.1.1_magicast@0.5.3_vite@7.3.3_@types+node@25.9.1_jiti@2.7.0_terser@5.4_b762c78c5490f09b691cf795487f233c/node_modules/@vite-pwa/nuxt/dist/runtime/components/PwaTransparentImage.vue")['default']
export const NuxtPage: typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/pages/runtime/page")['default']
export const NoScript: typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['NoScript']
export const Link: typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['Link']
export const Base: typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['Base']
export const Title: typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['Title']
export const Meta: typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['Meta']
export const Style: typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['Style']
export const Head: typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['Head']
export const Html: typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['Html']
export const Body: typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['Body']
export const NuxtIsland: typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-island")['default']
export const LazyBorderGlow: LazyComponent<typeof import("../components/BorderGlow/BorderGlow.vue")['default']>
export const LazyDotGrid: LazyComponent<typeof import("../components/DotGrid/DotGrid.vue")['default']>
export const LazyBudgetAchievementsTab: LazyComponent<typeof import("../components/budget/AchievementsTab.vue")['default']>
export const LazyBudgetAddExpenseModal: LazyComponent<typeof import("../components/budget/AddExpenseModal.vue")['default']>
export const LazyBudgetAnalyticsTab: LazyComponent<typeof import("../components/budget/AnalyticsTab.vue")['default']>
export const LazyBudgetBottomNav: LazyComponent<typeof import("../components/budget/BottomNav.vue")['default']>
export const LazyBudgetCategoryChart: LazyComponent<typeof import("../components/budget/CategoryChart.vue")['default']>
export const LazyBudgetDashboardTab: LazyComponent<typeof import("../components/budget/DashboardTab.vue")['default']>
export const LazyBudgetExpensesTab: LazyComponent<typeof import("../components/budget/ExpensesTab.vue")['default']>
export const LazyBudgetInsightsCard: LazyComponent<typeof import("../components/budget/InsightsCard.vue")['default']>
export const LazyBudgetMealPlanner: LazyComponent<typeof import("../components/budget/MealPlanner.vue")['default']>
export const LazyBudgetMonthlyHeatmap: LazyComponent<typeof import("../components/budget/MonthlyHeatmap.vue")['default']>
export const LazyBudgetMonthlyProjection: LazyComponent<typeof import("../components/budget/MonthlyProjection.vue")['default']>
export const LazyBudgetOverviewCards: LazyComponent<typeof import("../components/budget/OverviewCards.vue")['default']>
export const LazyBudgetProgressRing: LazyComponent<typeof import("../components/budget/ProgressRing.vue")['default']>
export const LazyBudgetSavingsJar: LazyComponent<typeof import("../components/budget/SavingsJar.vue")['default']>
export const LazyBudgetSettingsTab: LazyComponent<typeof import("../components/budget/SettingsTab.vue")['default']>
export const LazyBudgetSidebarNav: LazyComponent<typeof import("../components/budget/SidebarNav.vue")['default']>
export const LazyBudgetSpendingTimeline: LazyComponent<typeof import("../components/budget/SpendingTimeline.vue")['default']>
export const LazyBudgetWeeklyChart: LazyComponent<typeof import("../components/budget/WeeklyChart.vue")['default']>
export const LazyNuxtWelcome: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/welcome.vue")['default']>
export const LazyNuxtLayout: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
export const LazyNuxtErrorBoundary: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']>
export const LazyClientOnly: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/client-only")['default']>
export const LazyDevOnly: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/dev-only")['default']>
export const LazyServerPlaceholder: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/server-placeholder")['default']>
export const LazyNuxtLink: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-link")['default']>
export const LazyNuxtLoadingIndicator: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
export const LazyNuxtTime: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']>
export const LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
export const LazyNuxtImg: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']>
export const LazyNuxtPicture: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']>
export const LazyVitePwaManifest: LazyComponent<typeof import("../node_modules/.pnpm/@vite-pwa+nuxt@1.1.1_magicast@0.5.3_vite@7.3.3_@types+node@25.9.1_jiti@2.7.0_terser@5.4_b762c78c5490f09b691cf795487f233c/node_modules/@vite-pwa/nuxt/dist/runtime/components/VitePwaManifest")['default']>
export const LazyNuxtPwaManifest: LazyComponent<typeof import("../node_modules/.pnpm/@vite-pwa+nuxt@1.1.1_magicast@0.5.3_vite@7.3.3_@types+node@25.9.1_jiti@2.7.0_terser@5.4_b762c78c5490f09b691cf795487f233c/node_modules/@vite-pwa/nuxt/dist/runtime/components/VitePwaManifest")['default']>
export const LazyNuxtPwaAssets: LazyComponent<typeof import("../node_modules/.pnpm/@vite-pwa+nuxt@1.1.1_magicast@0.5.3_vite@7.3.3_@types+node@25.9.1_jiti@2.7.0_terser@5.4_b762c78c5490f09b691cf795487f233c/node_modules/@vite-pwa/nuxt/dist/runtime/components/NuxtPwaAssets")['default']>
export const LazyPwaAppleImage: LazyComponent<typeof import("../node_modules/.pnpm/@vite-pwa+nuxt@1.1.1_magicast@0.5.3_vite@7.3.3_@types+node@25.9.1_jiti@2.7.0_terser@5.4_b762c78c5490f09b691cf795487f233c/node_modules/@vite-pwa/nuxt/dist/runtime/components/PwaAppleImage.vue")['default']>
export const LazyPwaAppleSplashScreenImage: LazyComponent<typeof import("../node_modules/.pnpm/@vite-pwa+nuxt@1.1.1_magicast@0.5.3_vite@7.3.3_@types+node@25.9.1_jiti@2.7.0_terser@5.4_b762c78c5490f09b691cf795487f233c/node_modules/@vite-pwa/nuxt/dist/runtime/components/PwaAppleSplashScreenImage.vue")['default']>
export const LazyPwaFaviconImage: LazyComponent<typeof import("../node_modules/.pnpm/@vite-pwa+nuxt@1.1.1_magicast@0.5.3_vite@7.3.3_@types+node@25.9.1_jiti@2.7.0_terser@5.4_b762c78c5490f09b691cf795487f233c/node_modules/@vite-pwa/nuxt/dist/runtime/components/PwaFaviconImage.vue")['default']>
export const LazyPwaMaskableImage: LazyComponent<typeof import("../node_modules/.pnpm/@vite-pwa+nuxt@1.1.1_magicast@0.5.3_vite@7.3.3_@types+node@25.9.1_jiti@2.7.0_terser@5.4_b762c78c5490f09b691cf795487f233c/node_modules/@vite-pwa/nuxt/dist/runtime/components/PwaMaskableImage.vue")['default']>
export const LazyPwaTransparentImage: LazyComponent<typeof import("../node_modules/.pnpm/@vite-pwa+nuxt@1.1.1_magicast@0.5.3_vite@7.3.3_@types+node@25.9.1_jiti@2.7.0_terser@5.4_b762c78c5490f09b691cf795487f233c/node_modules/@vite-pwa/nuxt/dist/runtime/components/PwaTransparentImage.vue")['default']>
export const LazyNuxtPage: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/pages/runtime/page")['default']>
export const LazyNoScript: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['NoScript']>
export const LazyLink: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['Link']>
export const LazyBase: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['Base']>
export const LazyTitle: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['Title']>
export const LazyMeta: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['Meta']>
export const LazyStyle: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['Style']>
export const LazyHead: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['Head']>
export const LazyHtml: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['Html']>
export const LazyBody: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['Body']>
export const LazyNuxtIsland: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-island")['default']>

export const componentNames: string[]
