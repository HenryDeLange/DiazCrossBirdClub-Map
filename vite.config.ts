/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => ({
    base: '',
    test: {
        css: false,
        include: ['src/**/__tests__/*'],
        globals: true,
        environment: 'jsdom',
        setupFiles: 'src/setupTests.ts',
        clearMocks: true,
        coverage: {
            include: ['src/**/*'],
            exclude: ['src/main.tsx'],
            thresholds: {
                100: true
            },
            provider: 'istanbul',
            enabled: true,
            reporter: ['text', 'lcov'],
            reportsDirectory: 'coverage'
        }
    },
    plugins: [
        tsconfigPaths(),
        react(),
        ...(mode === 'test'
            ? []
            : [
                VitePWA({
                    registerType: 'autoUpdate',
                    includeAssets: [
                        'favicon.png',
                        'robots.txt',
                        'apple-touch-icon.png',
                        'icons/*.svg',
                        'fonts/*.woff2'
                    ],
                    manifest: {
                        name: 'Diaz Cross Bird Club Map',
                        short_name: 'DCBC Map',
                        theme_color: '#52a339',
                        icons: [
                            {
                                src: '/android-chrome-192x192.png',
                                sizes: '192x192',
                                type: 'image/png',
                                purpose: 'any maskable'
                            },
                            {
                                src: '/android-chrome-512x512.png',
                                sizes: '512x512',
                                type: 'image/png'
                            }
                        ]
                    }
                })
            ])
    ]
}));
