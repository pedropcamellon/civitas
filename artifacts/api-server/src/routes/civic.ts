import { Router } from "express";
import { MIAMI_INCIDENTS } from "../data/miamiCivicData";

const router = Router();

function filterByDate(incidents: typeof MIAMI_INCIDENTS, since?: string) {
  if (!since) return incidents;
  const cutoff = new Date(since).getTime();
  if (isNaN(cutoff)) return incidents;
  return incidents.filter((inc) => new Date(inc.date).getTime() >= cutoff);
}

router.get("/civic/311", (req, res) => {
  const since = req.query.since as string | undefined;
  res.json(filterByDate(MIAMI_INCIDENTS.filter((i) => i.type === "311"), since));
});

router.get("/civic/crime", (req, res) => {
  const since = req.query.since as string | undefined;
  res.json(filterByDate(MIAMI_INCIDENTS.filter((i) => i.type === "crime"), since));
});

router.get("/civic/permits", (req, res) => {
  const since = req.query.since as string | undefined;
  res.json(filterByDate(MIAMI_INCIDENTS.filter((i) => i.type === "permit"), since));
});

router.get("/civic/water", (req, res) => {
  const since = req.query.since as string | undefined;
  res.json(filterByDate(MIAMI_INCIDENTS.filter((i) => i.type === "water"), since));
});

export default router;
