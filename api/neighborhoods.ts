import type { VercelRequest, VercelResponse } from "@vercel/node";
import { NEIGHBORHOODS } from "@workspace/civic-data";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
  return res.json(NEIGHBORHOODS);
}
