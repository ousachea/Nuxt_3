// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2024-04-03',
  devServer: {
    host: '0.0.0.0',
    port: 4000
  },
  devtools: { enabled: false },
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt',
    '@vite-pwa/nuxt',
  ],

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Gold Tracker',
      short_name: 'Gold',
      description: 'Live gold price tracker — portfolio, converter & Khmer units',
      theme_color: '#F5C842',
      background_color: '#0C0C12',
      display: 'standalone',
      orientation: 'portrait-primary',
      scope: '/',
      start_url: '/gold',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable any' },
        { src: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/api\.gold-api\.com\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'gold-api-cache',
            expiration: { maxEntries: 5, maxAgeSeconds: 300 },
            networkTimeoutSeconds: 5,
          },
        },
        {
          urlPattern: /^https:\/\/www\.goldapi\.io\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'goldapi-io-cache',
            expiration: { maxEntries: 5, maxAgeSeconds: 300 },
            networkTimeoutSeconds: 5,
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: { maxEntries: 10, maxAgeSeconds: 31536000 },
          },
        },
      ],
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600,
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      navigateFallbackAllowlist: [/^\//],
      type: 'module',
    },
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Outfit:wght@300;400;500;600;700;800;900&display=swap',
        },
        { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' },
      ],
      meta: [
        { name: 'theme-color', content: '#F5C842' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Gold Tracker' },
      ],
    },
  },
});
