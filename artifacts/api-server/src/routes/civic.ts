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
  const data = filterByDate(
    MIAMI_INCIDENTS.filter((i) => i.type === "311"),
    since
  );
  res.json(data);
});

router.get("/civic/crime", (req, res) => {
  const since = req.query.since as string | undefined;
  const data = filterByDate(
    MIAMI_INCIDENTS.filter((i) => i.type === "crime"),
    since
  );
  res.json(data);
});

router.get("/civic/permits", (req, res) => {
  const since = req.query.since as string | undefined;
  const data = filterByDate(
    MIAMI_INCIDENTS.filter((i) => i.type === "permit"),
    since
  );
  res.json(data);
});

export default router;
