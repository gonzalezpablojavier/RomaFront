import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            workbox: {
                skipWaiting: true,
                clientsClaim: true,
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                globIgnores: ['**/firebase-messaging-sw.js'],
                // Importar el código de Firebase en el SW generado
                importScripts: ['/firebase-messaging-sw.js'],
                // Aumentar el límite de tamaño para archivos grandes
                maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'gstatic-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                ],
            },
            manifest: {
                name: 'Roma',
                short_name: 'Roma',
                description: 'Roma app de rr.hh - Distrisuper/Aoki',
                theme_color: '#000000',
                background_color: '#ffffff',
                display: 'standalone',
                start_url: '/',
                icons: [
                    {
                        src: '/favicon.png',
                        sizes: '64x64 32x32 24x24 16x16',
                        type: 'image/png',
                    },
                    {
                        src: '/logo192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: '/logo512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                ],
            },
        }),
    ],
    define: {
        'process.env': process.env
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
         
        },
        
    },
    optimizeDeps: {
        include: ['date-fns', 'date-fns/locale']
      },
    server: {
        host: true,
        port: 5173,
    },
    preview: {
        port: 5173,
    },

});