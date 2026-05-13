import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildNeighborhoodReport } from "../../lib/civic-data/src/index";

export default function handler(req: VercelRequest, res: VercelResponse) {
  const lat = parseFloat(req.query["lat"] as string);
  const lon = parseFloat(req.query["lon"] as string);

  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ error: "lat and lon are required" });
  }

  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  return res.json(buildNeighborhoodReport(lat, lon));
}
