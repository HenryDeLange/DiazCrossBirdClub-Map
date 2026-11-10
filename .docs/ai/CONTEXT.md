# Project Context

DiazCrossBirdClub-Map is a Vite + React 19 + TypeScript PWA for exploring Diaz Cross Bird Club locations on a Leaflet map. `src/main.tsx` registers the VitePWA service worker and renders `App` in `StrictMode`.

## Routing and State

- `src/App.tsx` lazy-loads only the selected map, standalone `/astra`, standalone `/tides`, or `/edit` route. `src/appRouting.ts` is base-path aware; `src/map/locationUtils.ts` handles location slugs and reserves `astra` and `tides`.
- `src/map/BirdingMap.tsx` owns the Leaflet map, responsive drawer state/height, nested drawer back navigation, Escape/popstate handling, location deep links, astronomy context, map center/zoom persistence, layer state, and the active GBIF species occurrence layer. Drawer-only Escape/popstate listeners are attached only while a drawer is open. Leaflet vector paths use the Canvas renderer.
- `src/map/components/MapDrawer.tsx` is the shared animated, resizable drawer with close/back controls and optional header actions. Closed drawer content is omitted from the DOM outside its close animation; embedded Astra/Tides pages are lazy-loaded when opened. Embedded pages own their internal scrolling.
- `src/map/controls/` contains the Locations, iNaturalist species, Astra, Tides, locate, and logo controls. Location controls preserve the selected tab and can open nested Astra or iNaturalist views.
- `src/pwa/` contains the custom install prompt flow and the app-cache inspection/clear drawer. `src/theme/` provides the system/light/dark preference context used by the map and applied before the app renders.

## Source Layout

- `src/map/`: map orchestration, controls, feature rendering, static GeoJSON, and persisted layer modules. GeoJSON is grouped under `geojson/{outings,paths,points,spots}`; `features/` handles styles, labels, and popups; `layers/` contains `GenericGeoJSONLayer`, `SpeciesOccurrenceLayer`, `layerState`, and `LayerStateSync`.
- `src/map/controls/locations/`: location search/tabs, feature details, astronomy summaries, category icons, sharing, and location types. `controls/species/` contains iNaturalist observation hooks, types, and cards; its species and photo grids are virtualized, and iNaturalist/GBIF API calls use a shared adaptive per-origin request queue.
- `src/calculations/components/`: shared `DateLocationInputs`, its date/coordinate subcomponents, and coordinate/date utilities used by both calculation pages. Astra uses five-decimal coordinates; Tides rounds coordinates to one decimal for station lookup.
- `src/calculations/astra/`: `AstraPage.tsx`, focused page components, `sunTimes.ts`, and `AstraPage.module.css`. The page works standalone or embedded and renders the SVG solar, birding, moonlight, current-time, and outer event-time rings. Event indicators are grouped upright icon/time units placed by minute-of-day angle.
- `src/calculations/tides/`: `TidesPage.tsx`, `TidesHeader.tsx`, `TidesDashboard.tsx`, `TidesResults.tsx`, the tide visual components, `useTidesPage.ts`, `tidesTypes.ts`, `tidesUtils.ts`, `tideData.ts`, and `TidesPage.module.css`. The hook owns station loading and derived predictions; the components render a weighted chart plus station panels. It fetches up to two nearby harmonic stations and calculates high/low tides in-browser.
- `src/edit/`: standalone `/edit` GeoJSON editor. `geojsonValidation.ts` requires every Point to use category `spot` or `title`; single-feature collections may use either category, while collections with multiple features require exactly one title Point as the first feature. All geometries may use `linkMap`, `linkDocument`, and `linkWeb`. Canonical property definitions are in `src/map/geojson/types.ts`.
- `src/assets/astra/` contains custom moonrise/moonset SVG icons. `src/LoadingOrError.tsx`, `src/main.module.css`, and `src/map/map.css` provide shared fallback and application styling.

## Data, Persistence, and PWA

- Tide stations come only from `https://api.openwaters.io/tides/stations`; `@neaps/tide-predictor` calculates predictions from returned harmonic records. Do not add the full `@neaps/tide-database` or `neaps` wrapper to the browser bundle.
- iNaturalist observations/photos, GBIF species data/media, and Google map tiles are external runtime data. `vite.config.ts` defines targeted PWA runtime caches for these sources and tide station harmonics, plus a NetworkFirst fallback for any other GET API requests. iNaturalist species counts are fetched in full before render pagination (up to 500 results per API page); GBIF media loads in 10-occurrence pages only as virtualized cards or photo grids need them. Each GBIF media page uses CacheFirst with a 180-day lifetime so visible cards can reuse results offline.
- iNaturalist and GBIF requests share per-origin queues; GBIF uses bounded concurrency and increases pacing/cooldown after retryable server responses, while retries re-enter the scheduler. Fresh cached GBIF taxon responses are checked before entering the queue. GBIF checklist facet requests filter to GBIF-accepted taxa and include a small occurrence sample to seed species names, then missing names resolve in the background before checklist copy/print is enabled. GBIF media pages try the 0.5° nearby bounds, then 2°, then a global search, and GBIF photo navigation does not imply a known total or wrap before more results are loaded.
- Species occurrence layers use GBIF's 512px density tiles with Leaflet `tileSize={512}` and `zoomOffset={-1}` so tile coordinates align with the 256px map zoom grid. They use the yellow-red `classic.poly` style with hex bins (`hexPerTile=17`) and are filtered by taxon key; iNaturalist species resolve through an exact GBIF scientific-name match before the layer is shown.
- Screen-bound iNaturalist and GBIF requests share `getBufferedMapBounds`, which adds a 64-pixel margin and snaps the map center to 128-pixel buckets at the current zoom so small pans can reuse the same query bounds.
- The VitePWA service worker is enabled in development, uses `generateSW` with automatic updates, and the install UI defers `beforeinstallprompt` until the user activates the install control.
- Map center/zoom use `mapCenter` and `mapZoom` in local storage; layer selections use `mapLayerState`, drawer height uses `drawerHeight`, and the theme preference uses `themePreference`.

## Agent Guidance

- Follow existing React Leaflet, Leaflet, Lucide, SunCalc, tide predictor, and local helper patterns. Keep changes focused and preserve drawer flex/overflow constraints.
- Use `getBasePathname()`, `getAstraPathname()`, `getTidesPathname()`, and location helpers instead of hard-coded application paths.
- Do not hand-edit generated output (`dist/`, `dev-dist/`) or static GeoJSON unless the task requires it.
- `/edit` lists GeoJSON paths bundled with the app, fetches the selected public file from the repository's `main` branch, and validates locally. It copies the collection and opens the GitHub file editor; GitHub handles sign-in, branch selection, commits, and deletions. Do not put file contents or credentials in URLs or browser storage.
- Follow `.docs/ai/TASK_GUIDELINES.md` for focused validation and scope rules.

## Commands

- `npm run dev` starts Vite.
- `npm run build` runs the TypeScript and production Vite builds.
- `npm run lint` runs ESLint.
- `npm run preview` serves the production build.

## Deployment

The app uses client-side paths for location links, such as `/cape-padrone`. The production build creates `dist/404.html` as a copy of the generated `index.html`, which lets GitHub Pages serve the app shell for a direct deep-link request. The browser keeps the original path, so the app can open the shared location after loading.
