# Project Context

DiazCrossBirdClub-Map is a Vite + React + TypeScript web app that shows birding spots for the Diaz Cross Bird Club on an interactive Leaflet map.

## What matters

- Main app entry: `src/App.tsx` renders `src/map/BirdingMap.tsx`.
- The map uses React Leaflet, Google tile layers, and localStorage for saved map state.
- Core UI controls live in `src/map/` and include location search, species search, locate control, and drawer panels.
- GeoJSON data is grouped under `src/map/geojson/` by type: `outings`, `paths`, `points`, and `spots`.

## Useful commands

- `npm run dev` for local development
- `npm run build` for typecheck + production build
- `npm run lint` for ESLint

## Editing notes

- Keep changes focused and minimal.
- Do not hand-edit generated GeoJSON unless the task specifically requires data changes.
