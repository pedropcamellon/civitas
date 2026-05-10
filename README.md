# Civitas — South Florida Digital Twin

An interactive web-first city simulation of South Florida. Visualize live civic data layers, replay 30-day incident history, trace animated cargo routes, and query per-neighborhood intelligence — all on a real Leaflet map with no external API keys.

---

## Features

- **5 data layers** — Crime, 311 calls, Permits, Water Quality, and animated Cargo routes
- **540 incidents** across 23 Miami neighborhoods, served in-memory
- **Time-lapse simulation** — replay the last 30 days, scrub manually, or control playback speed
- **Neighborhood panel** — click any area on the map to get a crime score, water grade, and 311 count
- **Three themes** — Dark (navy), Light (voyager), Neon (pink/cyan glow)
- **Real map tiles** — CartoDB dark/voyager tiles, no API key required

---

## Monorepo Structure

This project uses **pnpm workspaces** and **Node.js 24 / TypeScript 5.9**.

```
civic-watch/
├── artifacts/
│   ├── mockup-sandbox/   # Primary web app (React + Vite + Leaflet)
│   ├── api-server/       # Express 5 API (stateless, in-memory data)
│   └── mobile/           # Legacy Expo mobile app (SDK 54)
├── lib/
│   ├── api-client-react/ # Generated React/fetch API client
│   ├── api-spec/         # OpenAPI spec + orval code-gen config
│   ├── api-zod/          # Generated Zod validation schemas
│   └── db/               # Drizzle ORM schema & client
└── scripts/              # Workspace utility scripts
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) >= 24
- [pnpm](https://pnpm.io/) >= 9

```bash
npm install -g pnpm
pnpm install
```

---

## Running Locally

Each package is started independently. Run these in separate terminals:

| Command | What it starts | URL |
|---|---|---|
| `pnpm --filter @workspace/api-server run dev` | API server | `http://localhost:8080` |
| `pnpm --filter @workspace/mockup-sandbox run dev` | Digital Twin web app | `http://localhost:8081/__mockup` |
| `pnpm --filter @workspace/mobile run dev` | Expo mobile app (scan QR) | — |

> The web app proxies all `/api/*` requests to the API server — start both for full functionality.

---

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/civic/crime?since=<days>` | Crime incidents |
| `GET /api/civic/311?since=<days>` | 311 service calls |
| `GET /api/civic/permits?since=<days>` | Building permits |
| `GET /api/civic/water?since=<days>` | Water quality readings |
| `GET /api/neighborhood/report?lat=X&lon=Y` | Neighborhood intelligence report |
| `GET /api/neighborhoods` | List all 23 neighborhoods with centroids |
| `GET /health` | Health check |

---

## Simulation Controls

| Control | Behavior |
|---|---|
| ▶ / ⏸ | Play/pause 30-day history replay |
| Slider | Scrub to any point in the last 30 days |
| Speed button | Cycle through 0.5× / 1× / 2× / 5× |
| ⏮ | Reset to 30 days ago |
| ⏭ | Jump to now |

---

## Stack

| Layer | Technology |
|---|---|
| Web app | React, Vite, Tailwind CSS v4, Leaflet, react-leaflet |
| API server | Express 5, Pino, esbuild (CJS bundle) |
| Mobile (legacy) | Expo SDK 54, expo-router, react-native-maps 1.18.0 |
| Validation | Zod (generated via orval) |
| Database | Drizzle ORM (schema defined, stateless in dev) |
| Monorepo | pnpm workspaces, TypeScript project references |

---

## Scripts

```bash
# Full typecheck across all packages
pnpm run typecheck

# Build all packages
pnpm run build
```

---

## Adding a New Data Layer

1. Add incident data to `artifacts/api-server/src/data/miamiCivicData.ts`
2. Add a new route in `artifacts/api-server/src/routes/civic.ts`
3. Add a `LayerKey` and color entry to `artifacts/mockup-sandbox/src/twin/types.ts`
4. Add a `useJson` call in `artifacts/mockup-sandbox/src/twin/useIncidents.ts`
5. Add an `<IncidentLayer>` component in `artifacts/mockup-sandbox/src/App.tsx`

---

## Color Palette

| Layer | Color |
|---|---|
| Crime | `#FF453A` |
| 311 Calls | `#FFD60A` |
| Permits | `#32D74B` |
| Water Quality | `#4FC3F7` |
| Cargo | `#FF9500` |
| Background | `#07111F` |
| Primary | `#00B4D8` |

---

## License

MIT
