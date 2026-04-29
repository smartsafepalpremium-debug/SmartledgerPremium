import { Router, type IRouter } from "express";
import { db, usersTable, holdingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { COIN_INFO as CURRENT_PRICES } from "../lib/coins";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

const router: IRouter = Router();

router.get("/", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const holdings = await db.select().from(holdingsTable).where(eq(holdingsTable.userId, req.session.userId));

  const holdingsWithValue = holdings
    .filter((h) => h.amount > 0)
    .map((h) => {
      const market = CURRENT_PRICES[h.symbol] || { name: h.coin, price: h.avgBuyPrice };
      const currentPrice = market.price * (1 + (Math.random() - 0.5) * 0.02);
      const currentValue = h.amount * currentPrice;
      const costBasis = h.amount * h.avgBuyPrice;
      const pnl = currentValue - costBasis;
      const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

      return {
        coin: h.coin,
        symbol: h.symbol,
        amount: h.amount,
        avgBuyPrice: h.avgBuyPrice,
        currentPrice,
        currentValue,
        pnl,
        pnlPercent,
      };
    });

  const totalValue = holdingsWithValue.reduce((sum, h) => sum + h.currentValue, 0) + user.usdBalance;

  res.json({
    usdBalance: user.usdBalance,
    totalValue,
    holdings: holdingsWithValue,
  });
});

export default router;
