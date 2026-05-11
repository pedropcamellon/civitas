---
layout: default
title: User Guide
nav_order: 2
---

# Civitas — User Guide

Civitas is a map-first city intelligence tool for South Florida. It shows ingested civic data — crime, 311 calls, building permits, and water events — overlaid on an interactive map. The map is always the center of the experience.

Data is ingested from Miami-Dade open data sources on demand and stored in `data/incidents.json`. The app never calls external APIs during a session — it always queries from the last ingested snapshot, filtered by the year you select.

---

## Getting Around the Map

The map opens centered on Miami at zoom level 11 (neighborhood scale).

| Action                      | Result                                                    |
| --------------------------- | --------------------------------------------------------- |
| Click / tap the map         | Select the nearest neighborhood, open Neighborhood Report |
| Click a colored dot         | Open the Incident detail modal                            |
| Click a diamond marker      | Open the infrastructure detail modal (water layer)        |
| Scroll-wheel / pinch zoom   | Zoom in or out                                            |
| Drag                        | Pan the map                                               |
| Zoom buttons (bottom-right) | ＋ / − zoom control                                       |

Dots are color-coded by data layer:

| Color  | Layer                                 |
| ------ | ------------------------------------- |
| Red    | Crime incidents (jail bookings proxy) |
| Yellow | 311 service calls                     |
| Green  | Building permits                      |
| Cyan   | Water events & infrastructure         |
| Orange | Logistics route (animated truck)      |

Water **infrastructure** (treatment plants, pump stations, reservoirs) renders as a cyan diamond marker with a white dot centre — visually distinct from transient water events.

---

## Layer Controls

The **Layers panel** sits at the top-left of the screen (desktop) or in a compact bar near the bottom (mobile).

- Click the **Layers** header row to **collapse or expand** the layer list.
- Click any layer row to **toggle** it on or off.
- The badge beside the header shows how many layers are currently active.

### Crime ✅
Jail bookings from Miami-Dade — the closest available proxy to crime incidents (MDPD does not publish a public incident feed). Covers May 2015–present.

### 311 Calls ✅
Non-emergency service requests (potholes, graffiti, noise, abandoned vehicles). Currently populated from the public 2023 dataset.

### Permits ✅
Building permits from the Miami-Dade county-wide service (2003–present). Clusters indicate active development.

### Water ✅
Two types of markers:
- **Circle dots** — transient advisories: boil-water notices, main breaks, discolored water.
- **Diamond markers** — fixed infrastructure: treatment plants, pump stations, reservoirs.

### Logistics *(animated)* ✅
An animated truck traces the Port of Miami → Doral industrial corridor. Runs continuously while the layer is active.

---

## Year Filter

The **year selector** at the bottom of the map shows only the years that have real data in the current snapshot. Tap any year to filter all layers to that calendar year. The selector defaults to the most recent year with data.

This replaces the previous 24h / 7d / 30d relative filter — relative windows produced empty results when the ingested data predated today.

---

## Settings & Theme

Click the **⚙ gear icon** in the top-right toolbar to open the Settings menu.

| Option | Description                   |
| ------ | ----------------------------- |
| Dark   | Default dark map theme        |
| Light  | Light basemap for daytime use |
| Neon   | High-contrast neon theme      |

---

## Neighborhood Report

Click anywhere on the map to select the nearest neighborhood and open its report panel (slides in from the right).

The panel shows:
- Crime count and severity score for the selected period
- 311 request volume
- Active permits
- Water advisories (if any)
- An overall safety label

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

| Theme | Feel                                      |
| ----- | ----------------------------------------- |
| Dark  | Navy — default, low-light optimized       |
| Light | CartoDB Voyager — daytime / accessibility |
| Neon  | Pink/cyan glow — high contrast            |

---

## Data

Civitas serves from an ingested snapshot of Miami-Dade open data. Data is pulled from Socrata APIs on a scheduled basis and written to a flat file included with the app. There are no live API calls during a user session.

The **time filter** (24h / 7d / 30d) slices that ingested dataset. Selecting "24h" shows only incidents whose recorded date falls in the last 24 hours of the snapshot — it does not trigger a new fetch.

If no ingest has run yet, the app falls back to seed data (540 generated incidents across 23 Miami neighborhoods) so there is always something meaningful on the map.
