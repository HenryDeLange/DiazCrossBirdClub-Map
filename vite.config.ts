import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, type PluginOption } from 'vite';
import compressionPlugin from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';
import svgr from 'vite-plugin-svgr';
import packageJson from './package.json' with { type: 'json' };

const { version } = packageJson;
const compression = compressionPlugin as unknown as (options?: Record<string, unknown>) => PluginOption;
const ONE_DAY_IN_SECONDS = 60 * 60 * 24;

export default defineConfig({
    define: {
        VITE_APP_VERSION: JSON.stringify(version)
    },
    plugins: [
        react(),
        babel({ presets: [reactCompilerPreset()] }),
        svgr(),
        visualizer(),
        compression({
            algorithm: 'brotliCompress',
            ext: '.br'
        }),
        VitePWA({
            devOptions: {
                enabled: true
            },
            registerType: 'autoUpdate',
            strategies: 'generateSW',
            workbox: {
                cleanupOutdatedCaches: true,
                runtimeCaching: [
                    {
                        // Google Maps tile layers (Street / Hybrid / Satellite base layers)
                        urlPattern: ({ url }) => url.hostname.endsWith('.google.com') && url.pathname.startsWith('/vt'),
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'map-tiles',
                            expiration: {
                                maxEntries: 6000,
                                maxAgeSeconds: ONE_DAY_IN_SECONDS * 180 // ~6 months
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        // iNaturalist species count observations for the visible map area
                        urlPattern: /^https:\/\/api\.inaturalist\.org\/v1\/observations\/species_counts/,
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'inat-species-counts',
                            networkTimeoutSeconds: 4,
                            expiration: {
                                maxEntries: 300,
                                maxAgeSeconds: ONE_DAY_IN_SECONDS * 90 // ~3 months
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        // iNaturalist taxon photos (thumbnails shown in the species list), served either
                        // from static.inaturalist.org or directly from the S3 bucket (region-specific subdomains included)
                        // e.g. https://inaturalist-open-data.s3.amazonaws.com/photos/9818143/medium.jpeg
                        urlPattern: /^https:\/\/(static\.inaturalist\.org|inaturalist-open-data\.s3(?:\.[a-z0-9-]+)?\.amazonaws\.com)\/photos\//i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'inat-photos',
                            expiration: {
                                maxEntries: 1000,
                                maxAgeSeconds: ONE_DAY_IN_SECONDS * 180 // ~6 months
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    }
                ]
            },
            manifest: {
                name: 'Diaz Cross Bird Club Map',
                short_name: 'DCBC Map',
                description: 'Diaz Cross Bird Club map of birding spots.',
                theme_color: 'rgb(0, 0, 0)',
                icons: [
                    {
                        src: 'pwa-64x64.png',
                        sizes: '64x64',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: 'maskable-icon-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    }
                ],
                background_color: 'rgb(0, 0, 0)',
                display: 'standalone',
                launch_handler: {
                    client_mode: [
                        'focus-existing',
                        'auto'
                    ]
                }
            }
        })
    ],
    build: {
        rolldownOptions: {
            output: {
                codeSplitting: {
                    groups: [
                        {
                            name: 'react',
                            test: /node_modules[\\/](react|react-dom)/,
                        },
                        {
                            name: 'leaflet',
                            test: /node_modules[\\/](leaflet|leaflet.locatecontrol|react-leaflet)/,
                        },
                        {
                            name: 'ui',
                            test: /node_modules[\\/](lucide-react|usehooks-ts|geojson)/,
                        },
                        {
                            name: 'geojson',
                            test: /src[\\/]map[\\/]geojson[\\/].*\.json$/,
                        }
                    ]
                }
            }
        }
    }
})
