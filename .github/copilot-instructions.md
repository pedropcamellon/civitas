# Copilot Instructions — Civitas

Apply these rules in the order listed: file size, naming, TypeScript, monorepo, components, API.

## File size rule

**Keep every file under 200 lines.** When a file approaches this limit, split it before adding more.

Preferred split strategy:
- `types.ts` — interfaces and type aliases only
- `constants.ts` or a named file — static data arrays and lookup tables
- `utils.ts` or domain-specific name — pure helper functions
- `index.ts` — barrel re-exports only (`export { … } from "./…"`)

Never put logic, data, AND types all in the same file. One responsibility per file.

## Naming conventions

- Barrel files are always named `index.ts` and contain only `export … from` statements
- Data files are named after what they contain: `neighborhoods.ts`, `generate.ts`, `scoring.ts`
- Component files match the component name: `IncidentSheet.tsx`, `CargoRoute.tsx`
- Hook files are prefixed with `use`: `useCivicData.ts`, `useColors.ts`
- Context files are suffixed with `Context`: `MapContext.tsx`, `ThemeContext.tsx`

## TypeScript

- Prefer `type` imports (`import type { Foo } from "…"`) for types-only imports
- No `any` — use `unknown` and narrow, or define a proper interface
- All function parameters and return types should be inferrable or explicit

## Monorepo

- This is a pnpm workspace. All packages live under `artifacts/` or `lib/`
- Shared logic goes in `lib/` packages, not duplicated across artifacts
- API calls always go through `/api` proxy — never hardcode ports in browser code
- Run `pnpm --filter <pkg> run dev` to start individual packages

## Component rules

- One React component per file
- Sheets / panels animate with CSS `transition-transform` — no JS animation libraries
- Colors always come from `useColors()` — never hardcode hex values in components
- Layer types (`LayerKey`, `TimeFilter`, `CivicIncident`) live in `MapContext.tsx`

## API

- All `/api/*` routes are stateless — no DB writes in dev
- Shared data generation and scoring logic lives in `lib/civic-data/src/`
  - `types.ts` — interfaces
  - `neighborhoods.ts` — NEIGHBORHOODS array
  - `generate.ts` — MIAMI_INCIDENTS generation
  - `scoring.ts` — scoring helpers and report builder
  - `index.ts` — barrel re-exports only

