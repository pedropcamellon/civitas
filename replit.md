# Civic Flow Miami

A mobile-first Expo app that displays Miami/South Florida civic data on an interactive map — 311 service requests, crime incidents, and building permits as colored markers with layer toggles and timeline filters.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/mobile run dev` — run the Expo app (scan QR with Expo Go for native experience)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (proxy + static civic data)
- Mobile: Expo SDK 54, expo-router, React Native Maps (native), React Query
- Build: esbuild (CJS bundle for API)

## Where things live

- `artifacts/mobile/` — Expo mobile app
  - `app/(tabs)/index.tsx` — main map screen (single tab)
  - `components/CivicMapView.native.tsx` — react-native-maps (iOS/Android)
  - `components/CivicMapView.tsx` — web fallback (dot grid)
  - `context/MapContext.tsx` — global state (layers, timeline, selected incident)
  - `hooks/useCivicData.ts` — data fetching via API proxy
  - `constants/colors.ts` — Miami dark palette
- `artifacts/api-server/` — Express API server
  - `src/routes/civic.ts` — `/api/civic/311`, `/api/civic/crime`, `/api/civic/permits`
  - `src/data/miamiCivicData.ts` — 450 realistic Miami incidents (MVP static dataset)

## Architecture decisions

- **Platform split**: `CivicMapView.native.tsx` uses react-native-maps (pinned at 1.18.0); Metro resolves `.native.tsx` on device. The `.tsx` file is a web dot-grid fallback.
- **API proxy**: All data goes through the Express server at `/api/civic/*` — avoids browser CORS issues and allows future swap to live ArcGIS/Socrata feeds.
- **Static dataset for MVP**: 450 incidents seeded across real Miami neighborhoods. Field names match what the live Miami-Dade ArcGIS API would return.
- **react-native-maps pinned at 1.18.0**: do not upgrade — newer versions break web bundler in Expo SDK 54.
- **No tabs**: `app/(tabs)/_layout.tsx` renders a Stack (not TabBar) — single-screen map app.

## Product

Full-screen interactive map of Miami civic activity. Users can:
- Toggle three data layers: Crime (red), 311 Requests (yellow), Permits (green)
- Filter by timeline: 24h / 7 days / 30 days
- Tap "Near Me" to center on their location
- Tap any marker to see a bottom sheet with incident details (address, status, description, date)

## User preferences

- Miami dark navy palette: `#0A1628` background, `#00B4D8` primary
- Colors: crime=`#FF453A`, 311=`#FFD60A`, permits=`#32D74B`

## Gotchas

- CORS on web: Socrata/ArcGIS calls blocked in browser — always proxy through the API server
- react-native-maps@1.18.0 is pinned — do NOT run `pnpm update` on it
- For native full experience: scan the Expo QR code with Expo Go on iOS or Android

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
