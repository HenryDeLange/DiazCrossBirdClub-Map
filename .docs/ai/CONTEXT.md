# Project Context

DiazCrossBirdClub-Map is a Vite + React 19 + TypeScript PWA for exploring Diaz Cross Bird Club locations on a Leaflet map. `src/main.tsx` registers the VitePWA service worker and renders `App` in `StrictMode`.

## Routing and State

- `src/App.tsx` selects the map, standalone `/astra`, or standalone `/tides` view. `src/appRouting.ts` is base-path aware; `src/map/locationUtils.ts` handles location slugs and reserves `astra` and `tides`.
- `src/map/BirdingMap.tsx` owns the Leaflet map, responsive drawer state/height, nested drawer back navigation, Escape/popstate handling, location deep links, astronomy context, map center/zoom persistence, and layer state.
- `src/map/components/MapDrawer.tsx` is the shared animated, resizable drawer with close/back controls and optional header actions. Embedded pages own their internal scrolling.
- `src/map/controls/` contains the Locations, iNaturalist species, Astra, Tides, locate, and logo controls. Location controls preserve the selected tab and can open nested Astra or iNaturalist views.
- `src/pwa/` contains the custom install prompt flow and the app-cache inspection/clear drawer. `src/theme/` provides the system/light/dark preference context used by the map and applied before the app renders.

## Source Layout

- `src/map/`: map orchestration, controls, feature rendering, static GeoJSON, and persisted layer modules. GeoJSON is grouped under `geojson/{outings,paths,points,spots}`; `features/` handles styles, labels, and popups; `layers/` contains `GenericGeoJSONLayer`, `layerState`, and `LayerStateSync`.
- `src/map/controls/locations/`: location search/tabs, feature details, astronomy summaries, category icons, sharing, and location types. `controls/species/` contains iNaturalist observation hooks, types, and cards.
- `src/calculations/components/`: shared `DateLocationInputs`, its date/coordinate subcomponents, and coordinate/date utilities used by both calculation pages. Astra uses five-decimal coordinates; Tides rounds coordinates to one decimal for station lookup.
- `src/calculations/astra/`: `AstraPage.tsx`, focused page components, `sunTimes.ts`, and `AstraPage.module.css`. The page works standalone or embedded and renders the SVG solar, birding, moonlight, current-time, and outer event-time rings. Event indicators are grouped upright icon/time units placed by minute-of-day angle.
- `src/calculations/tides/`: `TidesPage.tsx`, `TidesHeader.tsx`, `TidesDashboard.tsx`, `TidesResults.tsx`, the tide visual components, `useTidesPage.ts`, `tidesTypes.ts`, `tidesUtils.ts`, `tideData.ts`, and `TidesPage.module.css`. The hook owns station loading and derived predictions; the components render a weighted chart plus station panels. It fetches up to two nearby harmonic stations and calculates high/low tides in-browser.
- `src/assets/astra/` contains custom moonrise/moonset SVG icons. `src/LoadingOrError.tsx`, `src/main.module.css`, and `src/map/map.css` provide shared fallback and application styling.

## Data, Persistence, and PWA

- Tide stations come only from `https://api.openwaters.io/tides/stations`; `@neaps/tide-predictor` calculates predictions from returned harmonic records. Do not add the full `@neaps/tide-database` or `neaps` wrapper to the browser bundle.
- iNaturalist observations/photos and Google map tiles are external runtime data. `vite.config.ts` defines PWA runtime caches for tide station harmonics, map tiles, iNaturalist species counts, and iNaturalist photos.
- The VitePWA service worker is enabled in development, uses `generateSW` with automatic updates, and the install UI defers `beforeinstallprompt` until the user activates the install control.
- Map center/zoom use `mapCenter` and `mapZoom` in local storage; layer selections use `mapLayerState`, drawer height uses `drawerHeight`, and the theme preference uses `themePreference`.

## Agent Guidance

- Follow existing React Leaflet, Leaflet, Lucide, SunCalc, tide predictor, and local helper patterns. Keep changes focused and preserve drawer flex/overflow constraints.
- Use `getBasePathname()`, `getAstraPathname()`, `getTidesPathname()`, and location helpers instead of hard-coded application paths.
- Do not hand-edit generated output (`dist/`, `dev-dist/`) or static GeoJSON unless the task requires it.
- Follow `.docs/ai/TASK_GUIDELINES.md`; builds and linting are run only when requested.

## Commands

- `npm run dev` starts Vite.
- `npm run build` runs the TypeScript and production Vite builds.
- `npm run lint` runs ESLint.
- `npm run preview` serves the production build.
