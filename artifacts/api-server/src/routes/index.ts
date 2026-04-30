import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import portfolioRouter from "./portfolio";
import transactionsRouter from "./transactions";
import marketRouter from "./market";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/portfolio", portfolioRouter);
router.use("/transactions", transactionsRouter);
router.use("/market", marketRouter);
router.use("/admin", adminRouter);

export default router;
