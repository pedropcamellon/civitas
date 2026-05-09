import { Router, type IRouter } from "express";
import healthRouter from "./health";
import civicRouter from "./civic";
import neighborhoodRouter from "./neighborhood";

const router: IRouter = Router();

router.use(healthRouter);
router.use(civicRouter);
router.use(neighborhoodRouter);

export default router;
