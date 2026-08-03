# Project Context

DiazCrossBirdClub-Map is a Vite + React 19 + TypeScript PWA for exploring Diaz Cross Bird Club birding locations on a Leaflet map.

## Application Flow

- `src/App.tsx` dispatches `/` to `BirdingMap` and `/astra` to the standalone astronomy page. `src/appRouting.ts` and `src/map/locationUtils.ts` handle base-path-aware routes, location slugs, and the reserved `astra` path.
- `src/map/BirdingMap.tsx` owns the Leaflet map, localStorage map center/zoom, layer state, drawer state, nested drawer history, location deep links, and astronomy coordinates.
- Shared drawer and map-control primitives are in `src/map/components/`. `MapDrawer` supports resizing, back navigation, and an optional header action.
- `src/map/controls/` contains the feature controls: `locations/`, `species/`, `AstraControl.tsx`, `LocateControl.tsx`, and `logo/`. Location controls preserve the selected tab and nested Astra context.

## Source Layout

- `src/astra/`: `AstraPage.tsx` renders the responsive sun, moon, and birding timeline; `sunTimes.ts` owns SunCalc calculations and event data; `astra.css` owns the astronomy theme and responsive layout. Astra can render standalone or embedded in a drawer.
- `src/map/geojson/`: static GeoJSON grouped as `outings/`, `paths/`, `points/`, and `spots/`, with shared types in `types.ts`.
- `src/map/features/`: GeoJSON feature styling, labels, and popup/text rendering.
- `src/map/layers/`: `GenericGeoJSONLayer`, persisted layer state, and `LayerStateSync`.
- `src/map/controls/species/`: iNaturalist species list/card UI and observation hooks/types.
- `src/map/map.css`, `src/main.module.css`: global map and application styling. `src/LoadingOrError.tsx` handles lazy-load fallback UI.

## Working Notes

- Use existing React Leaflet, Leaflet, Lucide, SunCalc, and local helper patterns; keep edits focused.
- Use `getBasePathname()`, `getAstraPathname()`, and location helpers for links instead of hard-coding `/` paths.
- Keep drawer scrolling owned by the embedded page and preserve the drawer's flex/overflow constraints.
- Do not hand-edit generated files or GeoJSON data unless the task specifically requires it.
- Follow `.docs/ai/TASK_GUIDELINES.md`; builds and linting are run only when requested.

## Commands

- `npm run dev` starts Vite development.
- `npm run build` runs TypeScript build and the production Vite build.
- `npm run lint` runs ESLint.
- `npm run preview` serves the production build locally.
