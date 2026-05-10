import { Router } from "express";
import { loadIncidents, filterByDate } from "@workspace/civic-data";

const router = Router();

router.get("/civic/311", (req, res) => {
  const since = req.query.since as string | undefined;
  res.json(filterByDate(loadIncidents().filter((i) => i.type === "311"), since));
});

router.get("/civic/crime", (req, res) => {
  const since = req.query.since as string | undefined;
  res.json(filterByDate(loadIncidents().filter((i) => i.type === "crime"), since));
});

router.get("/civic/permits", (req, res) => {
  const since = req.query.since as string | undefined;
  res.json(filterByDate(loadIncidents().filter((i) => i.type === "permit"), since));
});

router.get("/civic/water", (req, res) => {
  const since = req.query.since as string | undefined;
  res.json(filterByDate(loadIncidents().filter((i) => i.type === "water"), since));
});

export default router;
