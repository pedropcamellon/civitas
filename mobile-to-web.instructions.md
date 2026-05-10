---
applyTo: "artifacts/civitas/**"
---

# Mobile → Web Migration: Civitas

Migrate `artifacts/mobile` (Expo / React Native) to a new pure-web app at
`artifacts/civitas` using **React + Vite + Tailwind CSS v4 + Leaflet**.
The new app must be a full-fidelity port of the mobile UI — not a simplified version.
It shares the same API server (`@workspace/api-server`) and should feel like the
mobile app running natively in a browser tab.

---

## Architecture Decision

| Mobile | Web equivalent |
|---|---|
| `react-native-maps` `MapView` | Leaflet + `react-leaflet` (same as mockup-sandbox) |
| `Animated` + `PanResponder` sheets | CSS transitions + pointer drag events |
| `TouchableOpacity` / `Pressable` | `<button>` with Tailwind hover/active |
| `StyleSheet.create` | Tailwind utility classes |
| `expo-haptics` | `navigator.vibrate()` (best-effort, no-op on desktop) |
| `expo-location` | `navigator.geolocation` |
| `@expo-google-fonts/inter` | Inter via `@fontsource/inter` or Google Fonts CDN |
| `react-native-gesture-handler` | Native pointer events |
| `react-native-safe-area-context` | CSS `env(safe-area-inset-*)` |
| `expo-router` Stack | React Router v7 or single-page (no routing needed) |
| `GestureHandlerRootView` / `KeyboardProvider` | Drop — not needed on web |
| `SplashScreen` | Drop — not needed on web |

---

## Target Structure

```
artifacts/civitas/
├── package.json            (@workspace/civitas)
├── tsconfig.json
├── vite.config.ts
├── index.html
├── src/
│   ├── main.tsx            (React root, QueryClientProvider, providers)
│   ├── App.tsx             (layout shell)
│   ├── index.css           (Tailwind v4 directives + CSS vars)
│   ├── constants/
│   │   └── colors.ts       (direct port — no RN deps)
│   ├── context/
│   │   ├── MapContext.tsx  (direct port — no RN deps)
│   │   └── ThemeContext.tsx(port — swap StyleSheet for CSS vars)
│   ├── hooks/
│   │   ├── useCivicData.ts (direct port — pure fetch/TanStack Query)
│   │   ├── useUserLocation.ts (port — use navigator.geolocation only)
│   │   └── useColors.ts    (direct port)
│   └── components/
│       ├── CivicMapView.tsx     (Leaflet map with CircleMarker per incident)
│       ├── CargoRoute.tsx       (Leaflet Polyline + animated marker)
│       ├── IncidentSheet.tsx    (slide-up panel, CSS transitions)
│       ├── LayerSheet.tsx       (slide-up panel, CSS transitions)
│       ├── NeighborhoodReport.tsx (slide-up panel, CSS transitions)
│       ├── TimelineBar.tsx      (filter pill row)
│       ├── LayerControls.tsx    (inline layer toggle pills)
│       └── ErrorBoundary.tsx    (class component, direct port)
```

---

## Progress Tracker

### Phase 0 — Scaffold
- [ ] **0.1** Create `artifacts/civic-flow-web/package.json` with deps:
  - `react`, `react-dom`, `vite`, `@vitejs/plugin-react`, `tailwindcss@^4`
  - `leaflet`, `react-leaflet`
  - `@tanstack/react-query`
  - `@fontsource/inter` (400, 500, 600, 700 weights)
  - `@workspace/api-client-react` (workspace dep)
  - Dev: `typescript`, `@types/react`, `@types/react-dom`, `@types/leaflet`
- [ ] **0.2** Create `tsconfig.json` (extend `../../tsconfig.base.json`)
- [ ] **0.3** Create `vite.config.ts` with proxy `/api → http://localhost:8080`
- [ ] **0.4** Create `index.html` with `<div id="root">` and Inter font link
- [ ] **0.5** Create `src/index.css` with Tailwind v4 `@import "tailwindcss"` + CSS custom properties for theme colors
- [ ] **0.6** Create `src/main.tsx` (React root, QueryClientProvider, ThemeProvider, MapProvider)
- [ ] **0.7** Add `"civitas": "pnpm --filter @workspace/civitas run dev"` to root README dev table

### Phase 1 — Pure-TS Ports (no RN deps, copy-paste friendly)
- [ ] **1.1** Port `constants/colors.ts` — identical, zero changes needed
- [ ] **1.2** Port `context/MapContext.tsx` — identical, zero changes needed
- [ ] **1.3** Port `context/ThemeContext.tsx` — identical; also write CSS vars into `:root` on theme change via `document.documentElement.style.setProperty`
- [ ] **1.4** Port `hooks/useCivicData.ts` — identical; remove `EXPO_PUBLIC_DOMAIN` env var reference, use `VITE_API_BASE` instead
- [ ] **1.5** Port `hooks/useColors.ts` — identical
- [ ] **1.6** Port `hooks/useUserLocation.ts` — keep only the `navigator.geolocation` branch; drop `expo-location`

### Phase 2 — Map & Cargo
- [ ] **2.1** Create `components/CivicMapView.tsx`:
  - `<MapContainer>` centered on Miami (25.7617, -80.1918), zoom 11
  - CartoDB dark tile layer (same URL as mockup-sandbox)
  - One `<CircleMarker>` per incident, colored by type, click → `onMarkerPress`
  - Map click → `onMapPress`
  - User location marker if `userHasLocation`
- [ ] **2.2** Create `components/CargoRoute.tsx`:
  - `<Polyline>` along the 12-point Port → Doral waypoints (dashed, cargo color)
  - Animated `<CircleMarker>` truck using `setInterval` + Leaflet `setLatLng`
  - Terminal markers at Port and Doral endpoints
  - Only renders when `showCargoRoute` prop is true

### Phase 3 — Overlay Components
- [ ] **3.1** Port `components/TimelineBar.tsx`:
  - 3 filter pills (24h / 7 days / 30 days)
  - Active state: `bg-primary/30 border-primary text-primary`
  - Calls `setTimeFilter` from `useMapContext`
- [ ] **3.2** Port `components/LayerControls.tsx`:
  - 4 inline toggle pills (crime, 311, permits, water)
  - Color-coded active/inactive states matching color palette
- [ ] **3.3** Port `components/IncidentSheet.tsx`:
  - Fixed bottom sheet (`position: fixed; bottom: 0`)
  - Slide-in via CSS `transform: translateY` transition (220ms ease-out)
  - Drag handle (pointer down → track `pointermove` → release to dismiss if dragged > 80px)
  - Shows: type badge, icon, title, description, date, status, address
  - Close button dismisses via `setSelectedIncident(null)`
- [ ] **3.4** Port `components/LayerSheet.tsx`:
  - Slide-up panel (same transition pattern as IncidentSheet)
  - Semi-transparent backdrop overlay (click to close)
  - Toggle rows for 5 active layers with Switch-style checkboxes
  - "Coming soon" section (greyed out): Traffic Flow, Flood Risk, Transit, Air Quality
- [ ] **3.5** Port `components/NeighborhoodReport.tsx`:
  - Slide-up panel (same pattern)
  - 3 score cards: Crime count, Water grade, 311 count
  - Top crime types list
  - Permits count row
  - Water advisory banner (red, shown if `report.waterAdvisory` is non-null)
  - Refresh button + loading spinner

### Phase 4 — Main App Shell
- [ ] **4.1** Create `src/App.tsx`:
  - Full-viewport layout (`w-screen h-screen overflow-hidden relative`)
  - `<CivicMapView>` fills the entire background
  - Top overlay bar (absolute, top-0): header card + search bar + neighborhood dropdown + TimelineBar
  - FAB buttons (absolute): Near Me (right), Layers (left) — both above bottom bar
  - Bottom bar (absolute, bottom-0): active layer count + hint text
  - All 3 sheets rendered at the bottom of the tree
- [ ] **4.2** Header card:
  - App dot (primary color), "Civic Flow" title, "Miami" subtitle
  - Right side: loading spinner or error chip, event count, theme toggle button
- [ ] **4.3** Search bar + neighborhood dropdown:
  - Controlled `<input>` with search icon
  - Dropdown appears on focus: scrollable list of all 23 Miami neighborhoods
  - Selecting a neighborhood → fires `setReportLat/Lon`, opens neighborhood report, flies map to coords using Leaflet `flyTo`
- [ ] **4.4** Near Me FAB:
  - Calls `navigator.geolocation.getCurrentPosition` (via `useUserLocation`)
  - On success: opens neighborhood report for user coords, flies map to location
  - Loading state shows spinner inside FAB
- [ ] **4.5** Layers FAB:
  - Badge shows count of active layers
  - Toggles `isLayerSheetOpen`

### Phase 5 — Error Boundary & Polish
- [ ] **5.1** Port `components/ErrorBoundary.tsx` (React class component, no RN deps)
- [ ] **5.2** Create an `ErrorFallback` web component (drop `expo` reload, use `window.location.reload()`)
- [ ] **5.3** Apply CSS `env(safe-area-inset-bottom)` to bottom bar and sheets for notch support
- [ ] **5.4** Add `prefers-color-scheme` media query default (start with dark theme)
- [ ] **5.5** Verify Leaflet CSS import precedes `<MapContainer>` usage (add to `index.css` or `main.tsx`)
- [ ] **5.6** Run `pnpm typecheck` across workspace — fix any type errors

### Phase 6 — Integration & Docs
- [ ] **6.1** Add `@workspace/civic-flow-web` to `pnpm-workspace.yaml`
- [ ] **6.2** Add dev/build scripts to root `package.json` workspace scripts
- [ ] **6.3** Update `README.md` dev table to include the Civitas app URL
- [ ] **6.4** Test all 3 themes (dark/light/miamiVice) cycle correctly in Civitas
- [ ] **6.5** Test all 5 layer toggles from LayerSheet
- [ ] **6.6** Test incident sheet opens on marker click and dismisses
- [ ] **6.7** Test neighborhood report opens from search and Near Me FAB
- [ ] **6.8** Test cargo route animation toggles on/off

---

## Key Conventions to Follow

- **Colors**: Always read from `useColors()` → `useTheme().colors`. Never hardcode hex values; use the palette from `constants/colors.ts`.
- **Tailwind**: Use CSS custom properties for theme colors so Tailwind utilities can reference them. Set `--color-primary`, `--color-background`, etc. on `:root` in `ThemeContext` on each theme switch.
- **API proxy**: All `/api/*` calls go through Vite's `server.proxy`. Never call the API server directly from the browser with a port.
- **Leaflet CSS**: Must be imported before any `react-leaflet` component renders. Add `import 'leaflet/dist/leaflet.css'` at the top of `main.tsx`.
- **No Expo deps**: The new package must have zero Expo / React Native dependencies.
- **Shared types**: `CivicIncident`, `NeighborhoodReport`, `LayerKey`, `TimeFilter` live in `MapContext.tsx`. Import from there.
- **Sheet animation pattern**: Use a CSS class `.translate-y-full` (closed) → `.translate-y-0` (open) with `transition-transform duration-220 ease-out`. Add a `will-change: transform` for GPU compositing.
- **Drag-to-dismiss**: Attach `onPointerDown` on the drag handle, track `onPointerMove` on `window`, release with `onPointerUp`. Dismiss if total `deltaY > 80px` or velocity `> 0.5px/ms`.

---

## What NOT to Do

- Do **not** merge this into `mockup-sandbox` — keep it a separate artifact
- Do **not** use `react-native` or any `expo-*` package
- Do **not** use `Animated` API — use CSS transitions
- Do **not** copy the mockup-sandbox's twin-specific components (`ControlPanel`, `IncidentLayer`, `TimeControls`) — port from mobile instead
- Do **not** use `StyleSheet.create` — use Tailwind classes and inline styles where necessary

---

## Current Status

**Phase 0** — Not started  
**Phase 1** — Not started  
**Phase 2** — Not started  
**Phase 3** — Not started  
**Phase 4** — Not started  
**Phase 5** — Not started  
**Phase 6** — Not started
