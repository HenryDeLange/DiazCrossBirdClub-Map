import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import compressionPlugin from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';
import svgr from 'vite-plugin-svgr';
import packageJson from './package.json' with { type: 'json' };
const { version } = packageJson;
const compression = compressionPlugin as unknown as (options?: Record<string, unknown>) => any;

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
  // build: {
  //       rolldownOptions: {
  //           output: {
  //               codeSplitting: {
  //                   groups: [
  //                       {
  //                           name: 'react',
  //                           test: /node_modules\/(react|react-dom)/,
  //                       },
  //                       {
  //                           name: 'routing',
  //                           test: /node_modules\/(react-error-boundary|@tanstack\/react-router|@tanstack\/router)/,
  //                       }
  //                   ]
  //               }
  //           }
  //       }
  //   }
})
