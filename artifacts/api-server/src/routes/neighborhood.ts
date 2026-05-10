import { Router } from "express";
import { NEIGHBORHOODS, buildNeighborhoodReport, loadIncidents } from "@workspace/civic-data";

const router = Router();

router.get("/neighborhood/report", (req, res) => {
  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);

  if (isNaN(lat) || isNaN(lon)) {
    res.status(400).json({ error: "lat and lon are required" });
    return;
  }

  res.json(buildNeighborhoodReport(lat, lon, loadIncidents()));
});

// List all neighborhoods (for client-side search)
router.get("/neighborhoods", (_req, res) => {
  res.json(NEIGHBORHOODS);
});

export default router;
