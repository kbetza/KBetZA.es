import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// App KBetZA 2026 — SPA estática que habla directamente con Supabase.
// PWA: instalable en el móvil de cara al futuro, pero funciona como web en Netlify.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'assets/teams/*.png'],
      manifest: {
        name: 'KBetZA',
        short_name: 'KBetZA',
        description: 'La quiniela de KBetZA · LaLiga',
        lang: 'es',
        theme_color: '#090D0A',
        background_color: '#090D0A',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
