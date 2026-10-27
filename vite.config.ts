/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { tokens } from './src/theme/tokens.ts'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'fonts/*.ttf'],
      manifest: {
        name: 'Dois Amores · clube do livro',
        short_name: 'Dois Amores',
        description: 'Seus livros e seus clubes de leitura.',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        theme_color: tokens.color.page,
        background_color: tokens.color.page,
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,ttf,webmanifest}'],
        // O gerador de PDF (~1,2 MB) não é pré-baixado: só quem exporta a revista precisa dele.
        globIgnores: ['**/react-pdf*.js', '**/template-*.js'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // Depois da primeira exportação, o gerador de PDF fica guardado (funciona offline).
            urlPattern: ({ url }) => /\/assets\/(react-pdf|template-)[^/]*\.js$/.test(url.pathname),
            handler: 'CacheFirst',
            options: { cacheName: 'pdf-generator', expiration: { maxEntries: 10 } },
          },
          {
            // Capas da Open Library (covers.openlibrary.org redireciona para archive.org)
            urlPattern: ({ url }) =>
              url.hostname === 'covers.openlibrary.org' || url.hostname.endsWith('.archive.org'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'book-covers',
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.hostname.endsWith('.supabase.co') && url.pathname.includes('/storage/v1/object/public/'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'supabase-images',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    // O único pedaço acima de 500 kB é o @react-pdf (~1,2 MB), baixado só ao exportar a revista.
    chunkSizeWarningLimit: 1300,
    rolldownOptions: {
      output: {
        // Bibliotecas em pedaços próprios: o código do app muda a cada versão, elas quase nunca.
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/ },
            { name: 'supabase', test: /node_modules[\\/]@supabase[\\/]/ },
            { name: 'query', test: /node_modules[\\/]@tanstack[\\/]/ },
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@templates': fileURLToPath(new URL('./templates', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'templates/**/*.test.{ts,tsx}', 'supabase/functions/**/*.test.ts'],
    css: false,
    env: {
      VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    },
  },
})
