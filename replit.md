# South Florida Digital Twin

A web-first city simulation / digital twin of South Florida — interactive Leaflet map with live civic data layers, animated cargo routes, time-lapse simulation, and neighborhood intelligence.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/mockup-sandbox run dev` — Digital Twin web app (port 8081, served at `/__mockup`)
- `pnpm --filter @workspace/mobile run dev` — Legacy Expo app (scan QR with Expo Go)
- `pnpm run typecheck` — full typecheck across all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- **Web app**: React + Vite + Tailwind v4 + Leaflet + react-leaflet (real map tiles)
- **API**: Express 5 (stateless proxy + in-memory civic data, 540 incidents)
- **Mobile (legacy)**: Expo SDK 54, expo-router, react-native-maps@1.18.0 (pinned)
- Build: esbuild (CJS bundle for API)

## Where things live

### Digital Twin Web App (`artifacts/mockup-sandbox/`)
- `src/App.tsx` — main orchestrator: state, layout, map container, panels
- `src/twin/types.ts` — shared types + theme definitions (Dark/Light/Neon) + cargo route coords
- `src/twin/useIncidents.ts` — data fetching hooks (all civic layers + neighborhood report)
- `src/twin/CargoLayer.tsx` — animated truck on real Leaflet map (Port of Miami → Doral)
- `src/twin/IncidentLayer.tsx` — CircleMarker layer per data type, fades by recency
- `src/twin/ControlPanel.tsx` — floating left sidebar with layer toggles + coming-soon list
- `src/twin/TimeControls.tsx` — bottom bar: play/pause, time slider, speed control
- `src/twin/NeighborhoodPanel.tsx` — right panel: crime score, water grade, 311 count
- `src/twin/IncidentModal.tsx` — bottom sheet on marker click

### API Server (`artifacts/api-server/`)
- `src/routes/civic.ts` — `/api/civic/{311,crime,permits,water}` with `?since=` filter
- `src/routes/neighborhood.ts` — `/api/neighborhood/report?lat=X&lon=Y`, `/api/neighborhoods`
- `src/data/miamiCivicData.ts` — 540 in-memory incidents across 23 Miami neighborhoods

## Architecture

- **Stateless API**: zero DB writes; all data in-memory, pulled on demand
- **Real map tiles**: CartoDB dark/voyager (no API key required)
- **Time simulation**: slider controls `simDayOffset` (0=now, 30=30 days ago); incidents fade by recency; play button animates 30→0
- **Cargo animation**: `requestAnimationFrame` loop interpolates truck along 12-point Port→Doral route
- **Neighborhood click**: map click → nearest centroid match → API report fetch
- **Three themes**: Dark (navy), Light (voyager tiles), Neon (pink/cyan glow)
- **Layer system**: 5 active (crime/311/permits/water/cargo) + 4 coming-soon stubs

## Simulation Controls

- **Play/Pause**: press ▶ to replay 30-day history (events appear chronologically)
- **Slider**: scrub manually through any point in the last 30 days
- **Speed**: 0.5× / 1× / 2× / 5× — click the speed button to cycle
- **Skip**: ⏮ resets to 30 days ago; ⏭ jumps to now
- **Cargo On/Off**: toggle the Cargo layer to show/hide the Port→Doral truck route

## User preferences

- Miami dark navy palette: `#07111F` bg, `#00B4D8` primary
- Colors: crime=`#FF453A`, 311=`#FFD60A`, permits=`#32D74B`, water=`#4FC3F7`, cargo=`#FF9500`

## Gotchas

- CORS: all API calls go through `/api` proxy (never call Socrata/ArcGIS direct from browser)
- react-native-maps@1.18.0 is pinned in mobile — do NOT upgrade
- Leaflet CSS must be imported before react-leaflet renders (done in `main.tsx`)
- `BASE_PATH = /__mockup` — all Vite asset URLs are relative to this base; do not use root-relative `/api/...` — use `/api/...` directly (proxy handles it)

## Adding a new layer

1. Add data type to `miamiCivicData.ts` and a new route in `routes/civic.ts`
2. Add `LayerKey` to `types.ts` and a color entry in each theme
3. Add layer config entry in `LAYER_CONFIG` array in `types.ts`
4. Add `useJson` call in `useIncidents.ts`
5. Add `<IncidentLayer>` in `App.tsx`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
