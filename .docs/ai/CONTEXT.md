# Project Context

DiazCrossBirdClub-Map is a Vite + React 19 + TypeScript PWA for exploring Diaz Cross Bird Club birding locations on a Leaflet map.

## Application Flow

- `src/App.tsx` dispatches `/` to `BirdingMap`, `/astra` to the standalone astronomy page, and `/tides` to the standalone tide page. `src/appRouting.ts` and `src/map/locationUtils.ts` handle base-path-aware routes, location slugs, and the reserved `astra` and `tides` paths.
- `src/map/BirdingMap.tsx` owns the Leaflet map, localStorage map center/zoom, layer state, drawer state, nested drawer history, location deep links, and astronomy coordinates.
- Shared drawer and map-control primitives are in `src/map/components/`. `MapDrawer` supports resizing, back navigation, and an optional header action.
- `src/map/controls/` contains the feature controls: `locations/`, `species/`, `AstraControl.tsx`, `TidesControl.tsx`, `LocateControl.tsx`, and `logo/`. Location controls preserve the selected tab and nested Astra context.

## Source Layout

- `src/astra/`: `AstraPage.tsx` renders the responsive sun, moon, and birding timeline; `sunTimes.ts` owns SunCalc calculations and event data; `astra.css` owns the astronomy theme and responsive layout. Astra can render standalone or embedded in a drawer.
- `src/tides/`: `TidesPage.tsx` renders the standalone or drawer tide view; `tideData.ts` fetches the two nearest station harmonic records from the Open Waters API, caches the last successful response locally, and uses `@neaps/tide-predictor` for local high/low calculations; `tides.css` owns the matching sparse theme.
- `src/inputfields/`: `DateLocationControls.tsx` and `dateLocationUtils.ts` provide the shared date, coordinate, and current-location inputs used by Astra and Tides. Tides rounds coordinates to one decimal before requesting station harmonics; Astra keeps five-decimal precision.
- `src/map/geojson/`: static GeoJSON grouped as `outings/`, `paths/`, `points/`, and `spots/`, with shared types in `types.ts`.
- `src/map/features/`: GeoJSON feature styling, labels, and popup/text rendering.
- `src/map/layers/`: `GenericGeoJSONLayer`, persisted layer state, and `LayerStateSync`.
- `src/map/controls/species/`: iNaturalist species list/card UI and observation hooks/types.
- `src/map/map.css`, `src/main.module.css`: global map and application styling. `src/LoadingOrError.tsx` handles lazy-load fallback UI.

## Working Notes

- Use existing React Leaflet, Leaflet, Lucide, SunCalc, and local helper patterns; keep edits focused.
- Tides uses only `https://api.openwaters.io/tides/stations` for station harmonics. Tide times are calculated in-browser with `@neaps/tide-predictor`; it does not use the Open Waters prediction endpoints. VitePWA caches coarse station responses in `tide-station-harmonics` for ten years, with a last-successful response fallback in local storage.
- Do not import the `neaps` wrapper or `@neaps/tide-database` into the browser bundle: the full station database is approximately 58 MB unpacked. The lightweight predictor is used with fetched station records instead.
- Use `getBasePathname()`, `getAstraPathname()`, and location helpers for links instead of hard-coding `/` paths.
- Keep drawer scrolling owned by the embedded page and preserve the drawer's flex/overflow constraints.
- Do not hand-edit generated files or GeoJSON data unless the task specifically requires it.
- Follow `.docs/ai/TASK_GUIDELINES.md`; builds and linting are run only when requested.

## Commands

- `npm run dev` starts Vite development.
- `npm run build` runs TypeScript build and the production Vite build.
- `npm run lint` runs ESLint.
- `npm run preview` serves the production build locally.
