import { defineConfig } from 'vitest/config'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import * as esbuild from 'esbuild'

function pitchWorkletPlugin(): Plugin {
  return {
    name: 'pitch-worklet',
    resolveId(id) {
      if (id === 'virtual:pitch-processor') return '\0virtual:pitch-processor'
      return null
    },
    async load(id) {
      if (id !== '\0virtual:pitch-processor') return null
      const result = await esbuild.build({
        entryPoints: ['src/audio/worklets/pitch-processor.ts'],
        bundle: true,
        format: 'iife',
        write: false,
        platform: 'browser',
        target: 'es2022',
      })
      const code = result.outputFiles[0].text
      return `export default ${JSON.stringify(code)}`
    },
  }
}

export default defineConfig({
  plugins: [
    pitchWorkletPlugin(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Fretwise',
        short_name: 'Fretwise',
        description: 'A browser guitar coach for adult beginners.',
        theme_color: '#332014',
        background_color: '#332014',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icons/pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/pwa-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
})
