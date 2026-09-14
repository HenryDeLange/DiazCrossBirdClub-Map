# Agent Instructions

## Start Here

This is a Vite + React 19 + TypeScript PWA for exploring Diaz Cross Bird Club locations on a Leaflet map.

- Read [`.docs/ai/CONTEXT.md`](.docs/ai/CONTEXT.md) for architecture, routing, data, and persistence details.
- Read [`.docs/ai/TASK_GUIDELINES.md`](.docs/ai/TASK_GUIDELINES.md) for validation and scope rules.
- For GitHub Copilot, this file is reached through [`.github/copilot-instructions.md`](.github/copilot-instructions.md).
- For Claude Code, [CLAUDE.md](CLAUDE.md) points here.

## Working Rules

- Prefer the existing React Leaflet, Leaflet, Lucide, SunCalc, tide predictor, and local helper patterns.
- Keep changes focused. Preserve drawer flex and overflow constraints.
- Use the base-path and location helpers instead of hard-coded application paths.
- Do not hand-edit generated output in `dist/` or `dev-dist/`.
- Validate the touched behavior after editing; build and lint rules are in [`.docs/ai/TASK_GUIDELINES.md`](.docs/ai/TASK_GUIDELINES.md).

## Important Deployment Detail

The app uses client-side deep links for locations. The production build must contain `dist/404.html` as a copy of the generated `index.html` so GitHub Pages can serve the app shell when a shared location URL is opened directly.

## Commands

- `npm run dev` starts Vite.
- `npm run build` runs the TypeScript check and production build.
- `npm run lint` runs ESLint.
- `npm run preview` serves the production build locally.
