---
layout: default
title: User Guide
nav_order: 2
---

# Civitas — User Guide

> Status: `🚧 In Progress` — updated as features ship

Civitas is a map-first city intelligence tool for South Florida. It shows ingested civic data — crime, 311 calls, permits, and water readings — overlaid on an interactive map. The map is always the center of the experience. Everything else (panels, filters, reports) is a detail layer on top of it.

Data is ingested from Miami-Dade open data sources on a schedule and stored locally. The app never fetches from external APIs during a user session — it always queries from the last ingested snapshot, filtered to the last 30 days.

---

## Getting Around the Map

The map opens centered on Miami at zoom level 11 (neighborhood scale).

| Action | Result |
|--------|--------|
| Click / tap the map | Select the nearest neighborhood, open Neighborhood Report |
| Click a colored dot | Open the Incident detail modal |
| Click a diamond marker | Open the infrastructure detail modal (water layer) |
| Scroll-wheel / pinch zoom | Zoom in or out |
| Drag | Pan the map |
| Zoom buttons (bottom-right) | ＋ / − zoom control |

Dots are color-coded by data layer:

| Color | Layer |
|-------|-------|
| Red | Crime incidents |
| Yellow | 311 service calls |
| Green | Building permits |
| Cyan | Water events & infrastructure |
| Orange | Logistics route (animated truck) |

Water **infrastructure** (treatment plants, pump stations, reservoirs) renders as a cyan diamond marker with a white dot centre — visually distinct from transient water events.

---

## Layer Controls

The **Layers panel** sits at the top-left of the screen (desktop) or in a compact bar near the bottom (mobile).

- Click the **Layers** header row to **collapse or expand** the layer list.
- Click any layer row to **toggle** it on or off.
- The badge beside the header shows how many layers are currently active.
- Inactive layers are hidden from the map and do not clutter the view.

### Crime ✅
Police-reported incidents in Miami-Dade. Concentrated in historically higher-density areas (Liberty City, Overtown, Little Havana, Downtown, Allapattah, Hialeah). Each dot encodes recency — brighter and larger means more recent.

### 311 Calls ✅
Non-emergency service requests (potholes, graffiti, noise, abandoned vehicles). Useful for spotting maintenance pressure in a neighborhood.

### Permits ✅
Active building permits. Clusters indicate active development or renovation.

### Water ✅
Two types of markers on this layer:
- **Circle dots** — transient advisories: boil-water notices, main breaks, discolored water reports, pressure failures.
- **Diamond markers** — fixed infrastructure: Miami-Dade Water & Sewer treatment plants, pump stations, and reservoirs.

### Logistics *(animated)* ✅
An animated truck traces the Port of Miami → Doral industrial corridor — South Florida's primary freight path. The animation runs continuously while the layer is active.

---

## Settings & Theme

Click the **⚙ gear icon** in the top-right area of the toolbar to open the Settings menu.

| Option | Description |
|--------|-------------|
| Dark | Default dark map theme |
| Light | Light basemap for daytime use |
| Neon | High-contrast neon theme |

The current theme is highlighted. Click any option to switch; the menu closes automatically.

---

## Neighborhood Report

Click anywhere on the map to select the nearest neighborhood and open its report panel (slides in from the right).

The panel shows:
- Crime count and severity score for the last 30 days
- 311 request volume
- Active permits
- Water advisories (if any)
- An overall safety label

Use the search bar in the top toolbar to jump directly to a neighborhood by name.

---

## Incident Modal

Click any dot or infrastructure marker on the map to open the detail modal. It shows the full record: title, description, date, status, address, and neighborhood.


Shows:
- **Type badge** (crime / 311 / permit / water)
- **Title** and full description
- **Date** reported
- **Status** (open, closed, in progress)
- **Address**

Drag the sheet downward or tap the close button (×) to dismiss it.

---

## Neighborhood Report

Tap anywhere on the map (not on a dot) to pull up an intelligence summary for the neighborhood under your tap. The report includes:

- **Crime score** — incident count for the selected time window
- **311 count** — service requests in the area
- **Water grade** — A–F based on recent water quality readings
- **Top crime types** — ranked list of offense categories
- **Permit activity** — number of active permits
- **Water advisory banner** — red alert if an active advisory covers this neighborhood

Use the **refresh button** to reload the report from the latest data.

---

## Neighborhood Selector

The dropdown in the top bar lists all 23 Miami neighborhoods. Selecting one flies the map to that neighborhood's centroid and opens its Neighborhood Report automatically.

---

## Near Me

The **Near Me** FAB (floating button, right side) centers the map on your current location. The browser will ask for location permission the first time.

---

## Themes

The theme toggle in the header cycles through three map styles:

| Theme | Feel |
|-------|------|
| Dark | Navy — default, low-light optimized |
| Light | CartoDB Voyager — daytime / accessibility |
| Neon | Pink/cyan glow — high contrast |

---

## Data

Civitas serves from an ingested snapshot of Miami-Dade open data. Data is pulled from Socrata APIs on a scheduled basis and written to a flat file included with the app. There are no live API calls during a user session.

The **time filter** (24h / 7d / 30d) slices that ingested dataset. Selecting "24h" shows only incidents whose recorded date falls in the last 24 hours of the snapshot — it does not trigger a new fetch.

If no ingest has run yet, the app falls back to seed data (540 generated incidents across 23 Miami neighborhoods) so there is always something meaningful on the map.
