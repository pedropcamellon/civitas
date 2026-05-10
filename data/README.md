This directory holds data/incidents.json — the output of `pnpm run ingest`.

The file is generated on demand and committed to the repo so Vercel can bundle it
at build time. It is never fetched from an external API during a user request.

Run `pnpm --filter @workspace/scripts run ingest` to populate it.
