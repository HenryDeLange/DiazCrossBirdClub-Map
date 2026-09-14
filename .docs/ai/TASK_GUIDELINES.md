# Task Guidelines

## Validation

- After an edit, run the narrowest available validation for the touched behavior.
- For build or deployment changes, run `npm run build` and inspect the generated artifact.
- Run `npm run lint` when the change affects TypeScript, React, or configuration code.
- Report unavailable or failing validation clearly; do not hide unrelated pre-existing failures.

## Scope

- Keep changes focused and preserve existing public APIs unless the task requires otherwise.
- Do not hand-edit generated output in `dist/` or `dev-dist/`.
