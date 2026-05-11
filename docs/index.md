---
layout: home
title: Home
nav_order: 1
---

# Civitas

**A map-first civic intelligence tool for South Florida.**

Civitas turns Miami-Dade public data — crime incidents, 311 service calls, building permits, water quality readings — into a single interactive map. The map is the entire experience. Filters and panels are how you narrow what you see.

> "Google Maps, but for civic activity."

---

## What Civitas does

Data from Miami-Dade open data sources is ingested on a schedule and stored as a flat file. When you open the app, the map shows the last 30 days of civic activity across all active layers. Change the time window to 24 hours and the map updates instantly — no page reload, no new API call.

Tap a dot to see what happened. Tap a neighborhood to get a summary: crime score, 311 count, water grade, top offense types, active permits. That's it.

---

## Live app

Production: **civitas.vercel.app**

Every push to `main` on GitHub deploys automatically via Vercel's native git integration. Branches and PRs get preview URLs.

---

## Where to start

**Using the app** → [User Guide](user-guide.md)

**Building or contributing** → [Infrastructure](infrastructure.md), then [Open Data Ingest](open-data.md)

**Understanding why it exists** → [Motivation & History](motivation.md)

**Porting from mobile** → [Web Migration](web-migration.md)
