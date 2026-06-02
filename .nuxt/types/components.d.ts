
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

interface _GlobalComponents {
  BorderGlow: typeof import("../../components/BorderGlow/BorderGlow.vue")['default']
  BudgetAchievementsTab: typeof import("../../components/budget/AchievementsTab.vue")['default']
  BudgetAddExpenseModal: typeof import("../../components/budget/AddExpenseModal.vue")['default']
  BudgetAnalyticsTab: typeof import("../../components/budget/AnalyticsTab.vue")['default']
  BudgetBottomNav: typeof import("../../components/budget/BottomNav.vue")['default']
  BudgetCategoryChart: typeof import("../../components/budget/CategoryChart.vue")['default']
  BudgetDashboardTab: typeof import("../../components/budget/DashboardTab.vue")['default']
  BudgetExpensesTab: typeof import("../../components/budget/ExpensesTab.vue")['default']
  BudgetInsightsCard: typeof import("../../components/budget/InsightsCard.vue")['default']
  BudgetMealPlanner: typeof import("../../components/budget/MealPlanner.vue")['default']
  BudgetMonthlyHeatmap: typeof import("../../components/budget/MonthlyHeatmap.vue")['default']
  BudgetMonthlyProjection: typeof import("../../components/budget/MonthlyProjection.vue")['default']
  BudgetOverviewCards: typeof import("../../components/budget/OverviewCards.vue")['default']
  BudgetProgressRing: typeof import("../../components/budget/ProgressRing.vue")['default']
  BudgetSavingsJar: typeof import("../../components/budget/SavingsJar.vue")['default']
  BudgetSettingsTab: typeof import("../../components/budget/SettingsTab.vue")['default']
  BudgetSidebarNav: typeof import("../../components/budget/SidebarNav.vue")['default']
  BudgetSpendingTimeline: typeof import("../../components/budget/SpendingTimeline.vue")['default']
  BudgetWeeklyChart: typeof import("../../components/budget/WeeklyChart.vue")['default']
  NuxtWelcome: typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/welcome.vue")['default']
  NuxtLayout: typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-layout")['default']
  NuxtErrorBoundary: typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']
  ClientOnly: typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/client-only")['default']
  DevOnly: typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/dev-only")['default']
  ServerPlaceholder: typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/server-placeholder")['default']
  NuxtLink: typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-link")['default']
  NuxtLoadingIndicator: typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
  NuxtTime: typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']
  NuxtRouteAnnouncer: typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
  NuxtImg: typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']
  NuxtPicture: typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']
  NuxtPage: typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/pages/runtime/page")['default']
  NoScript: typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['NoScript']
  Link: typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['Link']
  Base: typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['Base']
  Title: typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['Title']
  Meta: typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['Meta']
  Style: typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['Style']
  Head: typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['Head']
  Html: typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['Html']
  Body: typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['Body']
  NuxtIsland: typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-island")['default']
  LazyBorderGlow: LazyComponent<typeof import("../../components/BorderGlow/BorderGlow.vue")['default']>
  LazyBudgetAchievementsTab: LazyComponent<typeof import("../../components/budget/AchievementsTab.vue")['default']>
  LazyBudgetAddExpenseModal: LazyComponent<typeof import("../../components/budget/AddExpenseModal.vue")['default']>
  LazyBudgetAnalyticsTab: LazyComponent<typeof import("../../components/budget/AnalyticsTab.vue")['default']>
  LazyBudgetBottomNav: LazyComponent<typeof import("../../components/budget/BottomNav.vue")['default']>
  LazyBudgetCategoryChart: LazyComponent<typeof import("../../components/budget/CategoryChart.vue")['default']>
  LazyBudgetDashboardTab: LazyComponent<typeof import("../../components/budget/DashboardTab.vue")['default']>
  LazyBudgetExpensesTab: LazyComponent<typeof import("../../components/budget/ExpensesTab.vue")['default']>
  LazyBudgetInsightsCard: LazyComponent<typeof import("../../components/budget/InsightsCard.vue")['default']>
  LazyBudgetMealPlanner: LazyComponent<typeof import("../../components/budget/MealPlanner.vue")['default']>
  LazyBudgetMonthlyHeatmap: LazyComponent<typeof import("../../components/budget/MonthlyHeatmap.vue")['default']>
  LazyBudgetMonthlyProjection: LazyComponent<typeof import("../../components/budget/MonthlyProjection.vue")['default']>
  LazyBudgetOverviewCards: LazyComponent<typeof import("../../components/budget/OverviewCards.vue")['default']>
  LazyBudgetProgressRing: LazyComponent<typeof import("../../components/budget/ProgressRing.vue")['default']>
  LazyBudgetSavingsJar: LazyComponent<typeof import("../../components/budget/SavingsJar.vue")['default']>
  LazyBudgetSettingsTab: LazyComponent<typeof import("../../components/budget/SettingsTab.vue")['default']>
  LazyBudgetSidebarNav: LazyComponent<typeof import("../../components/budget/SidebarNav.vue")['default']>
  LazyBudgetSpendingTimeline: LazyComponent<typeof import("../../components/budget/SpendingTimeline.vue")['default']>
  LazyBudgetWeeklyChart: LazyComponent<typeof import("../../components/budget/WeeklyChart.vue")['default']>
  LazyNuxtWelcome: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/welcome.vue")['default']>
  LazyNuxtLayout: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
  LazyNuxtErrorBoundary: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']>
  LazyClientOnly: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/client-only")['default']>
  LazyDevOnly: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/dev-only")['default']>
  LazyServerPlaceholder: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/server-placeholder")['default']>
  LazyNuxtLink: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-link")['default']>
  LazyNuxtLoadingIndicator: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
  LazyNuxtTime: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']>
  LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
  LazyNuxtImg: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']>
  LazyNuxtPicture: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']>
  LazyNuxtPage: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/pages/runtime/page")['default']>
  LazyNoScript: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['NoScript']>
  LazyLink: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['Link']>
  LazyBase: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['Base']>
  LazyTitle: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['Title']>
  LazyMeta: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['Meta']>
  LazyStyle: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['Style']>
  LazyHead: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['Head']>
  LazyHtml: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['Html']>
  LazyBody: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/head/runtime/components")['Body']>
  LazyNuxtIsland: LazyComponent<typeof import("../../node_modules/.pnpm/nuxt@3.21.2_@emnapi+core@1.10.0_@emnapi+runtime@1.10.0_@parcel+watcher@2.5.6_@types+nod_6a373931a05b43f71e698adceb9809f4/node_modules/nuxt/dist/app/components/nuxt-island")['default']>
}

declare module 'vue' {
  export interface GlobalComponents extends _GlobalComponents { }
}

export {}
