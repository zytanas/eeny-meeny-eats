import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favico.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Pick For Me',
        short_name: 'PickForMe',
        description: 'Explore nearby restaurants and cafes, then let the randomizer decide.',
        // Matches --color-bg in src/style.css
        theme_color: '#fff9f4',
        background_color: '#fff9f4',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        // TODO: replace placeholder icons in public/icons/
        icons: [
          { src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Include self-hosted fonts and icons so the app works offline
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Never serve the SPA shell for API calls
        navigateFallbackDenylist: [/^\/api\//, /^\/\.netlify\//],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
