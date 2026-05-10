import { Router } from "express";
import { loadIncidents, filterByDate, filterByYear, getDataBounds } from "@workspace/civic-data";

const router = Router();

router.get("/civic/meta", (_req, res) => {
  res.json(getDataBounds());
});

function applyFilter(incidents: ReturnType<typeof loadIncidents>, req: { query: Record<string, unknown> }) {
  const year = req.query.year ? parseInt(req.query.year as string, 10) : NaN;
  if (!isNaN(year)) return filterByYear(incidents, year);
  const since = req.query.since as string | undefined;
  return filterByDate(incidents, since);
}

router.get("/civic/311", (req, res) => {
  res.json(applyFilter(loadIncidents().filter((i) => i.type === "311"), req));
});

router.get("/civic/crime", (req, res) => {
  res.json(applyFilter(loadIncidents().filter((i) => i.type === "crime"), req));
});

router.get("/civic/permits", (req, res) => {
  res.json(applyFilter(loadIncidents().filter((i) => i.type === "permit"), req));
});

router.get("/civic/water", (req, res) => {
  res.json(applyFilter(loadIncidents().filter((i) => i.type === "water"), req));
});

export default router;
