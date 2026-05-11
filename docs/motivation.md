---
layout: default
title: Motivation & History
nav_order: 6
---

# Motivation & History

## Origin

Civitas started as a conversation about turning messy public datasets into something residents, journalists, and researchers could actually use. The working name was "Civic Flow Miami."

The core frustration: Miami has real, free, usable civic data — 311 calls, crime incidents, building permits, flood zones — but the only way to access it is through GIS dashboards and raw Socrata tables that feel like analyst tools. Nobody uses them.

The original framing:

> "Google Maps, but for civic activity."

---

## What we're building toward

Three questions that should take no more than two taps to answer:

- What is happening near me?
- What changed in my area recently?
- What risks or services exist around me?

The map is the answer. Panels and filters are how you narrow it.

---

## What this is not

Not a GIS dashboard. Not a PowerBI clone. Not an analyst tool.

No tables. No raw dataset views. No complex forms. Everything must be map-first. Max two clicks to insight.

---

## UX philosophy

Single-handed mobile use. Fast loading. Touch-friendly filters. The timeline filter alone makes the map feel alive — seeing what changed in the last 24 hours versus 30 days is enough to make patterns visible.

Insight over data: the value is not showing raw dots — it's showing human-readable civic activity patterns. Trash complaints spiking on a particular street, permit clusters suggesting a construction boom, crime density shifting month over month. That's the layer that matters.

---

## MVP scope decision

The original guidance was deliberately conservative: three layers only — 311 requests, crime incidents, building permits. That's enough for a strong demo, meaningful UX, and real city insights. Everything else comes later.

This is a weekend prototype, not a platform. If it takes more than a few evenings to get a working map, it's already too big.

---

## Cost constraint

Keep it near zero. Vercel free hosting, static JSON or serverless functions, Miami-Dade ArcGIS Hub (free public tier), OpenStreetMap tiles. Avoid paid GIS APIs, heavy backends, always-on servers.

---

## Data sources identified at origin

These were identified as the real, usable, free sources for South Florida:

**Miami-Dade Open Data Hub** (`opendata.miamidade.gov`) — 311 service requests, jail bookings, building permits, and more. The portal runs on **ArcGIS Hub** (migrated from Socrata). All datasets are ArcGIS Feature Services queried via the ArcGIS REST API. This is the primary source.

**City of Miami Open Data** — 311 requests (geo points), building permits, zoning layers, parks and cultural venues.

**Miami-Dade Transit (MDT)** — GTFS feeds for bus routes, stops, schedules, real-time updates. Flagged as optional for MVP.

**Miami-Dade GIS Services** — parcels, zoning, land use, building footprints, address points. ArcGIS services. Flagged for later.

**Flooding and climate risk** — FEMA flood zones, NOAA sea level and tide data, USGS groundwater data. Flagged as later overlays.

---

## Long-term framing

If this evolves beyond MVP, the clean positioning is:

> "A mobile civic observability layer for South Florida."

That framing is worth holding onto. It captures what makes this different from a dashboard — it's an observability layer, not a reporting tool.
