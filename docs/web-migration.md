---
layout: default
title: Web Migration
nav_order: 5
---

# Civitas Web Migration Plan

## Already Done

### Phase 0 — Scaffold ✅
- `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html` (existed)
- `src/index.css` — Tailwind v4 + Inter font imports + Leaflet CSS + sheet animation classes
- `src/main.tsx` — React root with QueryClientProvider, ThemeProvider, MapProvider

### Phase 1 — Pure-TS Ports ✅
- `src/constants/colors.ts` — direct port + added `THEME_META` emoji icons (no Ionicons)
- `src/context/MapContext.tsx` — direct port, zero RN deps
- `src/context/ThemeContext.tsx` — port + writes CSS vars to `:root` on theme change
- `src/hooks/useColors.ts` — direct port
- `src/hooks/useUserLocation.ts` — web-only `navigator.geolocation` branch, expo-location dropped
- `src/hooks/useCivicData.ts` — direct port, `EXPO_PUBLIC_DOMAIN` removed, always uses `/api` proxy

---

## Remaining Work

### Phase 2 — Map & Cargo
**`src/components/CivicMapView.tsx`**
- `<MapContainer>` centered on Miami (25.7617, −80.1918), zoom 11
- CartoDB dark tiles (`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`)
- `<CircleMarker>` per incident colored by type, click → `onMarkerPress`
- Map background click → `onMapPress`
- User location blue dot if `userHasLocation`

**`src/components/CargoRoute.tsx`**
- `<Polyline>` through the 12 Port→Doral waypoints, dashed, cargo color
- Animated `<CircleMarker>` truck using `setInterval` + Leaflet `setLatLng` on a ref
- Terminal ring markers at Port and Doral endpoints
- Only renders when `layers.cargo` is active (controlled by `useMapContext`)
- No prop drilling — reads layer state from context directly

### Phase 3 — Overlay Components
**`src/components/TimelineBar.tsx`**
- 3 filter pills (24h / 7 days / 30 days)
- Active: `bg-primary/30 border-primary text-primary` (inline styles using `useColors()`)
- Calls `setTimeFilter` from `useMapContext`

**`src/components/LayerControls.tsx`**
- 4 inline toggle pills (crime, 311, permits, water) with color-coded active/inactive states
- Calls `toggleLayer` from `useMapContext`

**`src/components/IncidentSheet.tsx`**
- `position: fixed; bottom: 0; left: 0; right: 0`
- Slide via CSS `transform: translateY` + `transition: transform 220ms ease-out`
- Drag-to-dismiss: `onPointerDown` on handle → `pointermove` on `window` → dismiss if `deltaY > 80` or velocity `> 0.5px/ms`
- Shows: type badge, title, description, date, status, address
- Close button → `setSelectedIncident(null)`
- No Ionicons — use inline SVG icons or Unicode symbols

**`src/components/LayerSheet.tsx`**
- Slide-up panel (same CSS transition pattern)
- Semi-transparent backdrop `div` (click to close)
- Toggle rows for 5 active layers with `<input type="checkbox">` styled as a switch
- "Coming soon" section greyed out

**`src/components/NeighborhoodReport.tsx`**
- Slide-up panel (same pattern)
- 3 score cards: Crime count, Water grade, 311 count
- Top crime types list
- Permits count row
- Water advisory banner (red) when `report.waterAdvisory` is non-null
- Refresh button + spinner

### Phase 4 — App Shell
**`src/App.tsx`**
- Full-viewport layout (`w-screen h-screen overflow-hidden relative`)
- `<CivicMapView>` fills background
- Top overlay (absolute, top-0): header card + search bar + neighborhood dropdown + `<TimelineBar>`
- Near Me FAB (right side)
- Layers FAB (left side) with active-layer badge
- Bottom bar with active layer count hint
- All 3 sheets at bottom of tree
- Neighborhood list hardcoded (23 Miami neighborhoods from mobile index.tsx)
- Map fly-to via Leaflet `map.flyTo()` using a ref passed down to `CivicMapView`

### Phase 5 — Error Boundary & Polish
- `src/components/ErrorBoundary.tsx` — direct port (class component, no RN deps)
- `src/components/ErrorFallback.tsx` — web version: `window.location.reload()` instead of `reloadAppAsync`; no Modal, no SafeArea; simple centered card
- CSS `env(safe-area-inset-bottom)` on bottom bar and sheets
- `prefers-color-scheme: dark` default already handled (dark theme is initial state)
- Verify Leaflet CSS import order in `index.css`
- Run `pnpm --filter @workspace/civitas typecheck`

### Phase 6 — Integration & Cleanup
- Remove `artifacts/mobile` from workspace (delete folder + drop `@expo/ngrok-bin` overrides from `pnpm-workspace.yaml`)
- Remove `# Must be this exact version because expo requires it` comments from catalog in `pnpm-workspace.yaml`
- Remove `mobile-to-web.instructions.md` (migration complete)
- Run `pnpm install` to sync lockfile
- Update `docker-compose.yml` to replace the `twin` service with `civitas` (port 8082)
- Verify `docker compose up` starts api + civitas cleanly

---

## Icon Strategy
Using **`lucide-react`** (already in the workspace catalog). Import named icons directly — `import { Shield, MessageSquare, Wrench, Droplets, Package, X, RefreshCw, MapPin, Layers, Navigation, Search, Sun, Moon, Sparkles } from "lucide-react"`.

## Data Loading Strategy
- **Lazy / on-demand** — each layer's query is only `enabled` when that layer is toggled on in `layers` state
- Queries are kept in `App.tsx` and passed down as props (or read from context) — no upfront fetching
- `useCrimeData`, `use311Data`, `usePermitData`, `useWaterData` each receive an `enabled` boolean derived from `layers.<key>`
- Data is cached by TanStack Query so toggling a layer off and back on does not re-fetch within `staleTime`
- Cargo route is purely client-side animation — no API call needed

## Key Constraints
- Zero `react-native` or `expo-*` imports anywhere in `artifacts/civitas`
- All `/api/*` calls through Vite proxy (no hardcoded ports)
- Colors always from `useColors()` — no hardcoded hex in components
- One component per file, files stay under approximately 150 lines
- CSS transitions only — no JS animation libraries
- `lucide-react` for all icons
