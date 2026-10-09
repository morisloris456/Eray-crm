import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate', // Met à jour le CRM dès qu'une modif est détectée
      includeAssets: ['favicon.ico', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Eray CRM',
        short_name: 'Eray',
        description: 'Système de gestion client et projets Eray',
        theme_color: '#3b82f6', // Ton bleu principal (à ajuster selon ton design)
        background_color: '#ffffff',
        display: 'standalone', // Pour qu'il s'ouvre sans la barre du navigateur
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
  
})
