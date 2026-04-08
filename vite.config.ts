import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

const host = process.env.TAURI_DEV_HOST
const isTauri = !!process.env.TAURI_ENV_PLATFORM

// https://vite.dev/config/
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/.worktrees/**',
    ],
  },

  // Tauri: prevent Vite from obscuring Rust errors
  clearScreen: false,

  base: '/',
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routeFileIgnorePattern: '.test.',
    }),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    // PWA only for web builds — service workers conflict with Tauri's native webview
    ...(!isTauri
      ? [
          VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
            manifest: {
              name: 'Grimorium',
              short_name: 'Grimorium',
              description:
                'A companion app for Blood on the Clocktower that handles the clockwork so you can focus on the story.',
              theme_color: '#0D0D0D',
              background_color: '#0D0D0D',
              display: 'standalone',
              scope: '/',
              start_url: '/',
              icons: [
                {
                  src: 'pwa-192x192.png',
                  sizes: '192x192',
                  type: 'image/png',
                },
                {
                  src: 'pwa-512x512.png',
                  sizes: '512x512',
                  type: 'image/png',
                },
                {
                  src: 'pwa-512x512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'maskable',
                },
              ],
            },
          }),
        ]
      : []),
  ],

  // Tauri: WebView engine differs per platform
  build: {
    target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
  },

  server: {
    // Tauri: fixed port so Tauri can reliably connect
    port: 5173,
    strictPort: true,
    // Tauri: expose to network for mobile dev
    host: host ?? false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // Tauri: don't trigger HMR on Rust file changes
      ignored: ['**/src-tauri/**'],
    },
  },

  // Tauri: expose Tauri env vars to frontend
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
})
