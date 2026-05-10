import type { VercelRequest, VercelResponse } from "@vercel/node";
import { MIAMI_INCIDENTS, filterByDate } from "@workspace/civic-data";

const VALID_LAYERS = ["crime", "311", "permit", "water"] as const;
type Layer = (typeof VALID_LAYERS)[number];

const TYPE_MAP: Record<string, Layer> = {
  crime:  "crime",
  "311":  "311",
  permits: "permit",
  water:  "water",
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  const layer = req.query["layer"];
  if (typeof layer !== "string" || !(layer in TYPE_MAP)) {
    return res.status(404).json({ error: "Unknown layer" });
  }

  const incidentType = TYPE_MAP[layer];
  const since = typeof req.query["since"] === "string" ? req.query["since"] : undefined;

  const data = filterByDate(
    MIAMI_INCIDENTS.filter((i) => i.type === incidentType),
    since,
  );

  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  return res.json(data);
}
