import { Router, type IRouter, type Request } from "express";
import { db, usersTable, holdingsTable, transactionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { BuyCryptoBody, SellCryptoBody, DepositBody, WithdrawBody } from "@workspace/api-zod";
import { fetchForexPrices, getForexAssetMeta } from "../lib/forex";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

const COIN_INFO: Record<string, { name: string; price: number }> = {
  BTC: { name: "Bitcoin", price: 67500 },
  ETH: { name: "Ethereum", price: 3450 },
  BNB: { name: "BNB", price: 580 },
  SOL: { name: "Solana", price: 175 },
  XRP: { name: "XRP", price: 0.58 },
  ADA: { name: "Cardano", price: 0.45 },
  DOGE: { name: "Dogecoin", price: 0.162 },
  MATIC: { name: "Polygon", price: 0.87 },
  DOT: { name: "Polkadot", price: 7.2 },
  LINK: { name: "Chainlink", price: 18.5 },
};

async function resolveAssetPrice(req: Request, symbol: string): Promise<{ name: string; price: number } | null> {
  const sym = symbol.toUpperCase();
  if (COIN_INFO[sym]) return COIN_INFO[sym];

  const meta = getForexAssetMeta(sym);
  if (!meta) return null;

  const rows = await fetchForexPrices(req);
  const row = rows.find((r) => r.symbol === sym);
  if (!row) return null;
  return { name: meta.name, price: row.price };
}

const router: IRouter = Router();

router.get("/", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const txs = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, req.session.userId))
    .orderBy(transactionsTable.createdAt);

  res.json(
    txs.reverse().map((tx) => ({
      id: tx.id,
      type: tx.type,
      coin: tx.coin,
      symbol: tx.symbol,
      amount: tx.amount,
      usdAmount: tx.usdAmount,
      price: tx.price,
      status: tx.status,
      createdAt: tx.createdAt.toISOString(),
    }))
  );
});

router.post("/buy", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const parsed = BuyCryptoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { symbol, usdAmount } = parsed.data;
  const assetInfo = await resolveAssetPrice(req, symbol);
  if (!assetInfo) {
    res.status(400).json({ error: "Unknown asset" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
  if (!user || user.usdBalance < usdAmount) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }

  const price = assetInfo.price * (1 + (Math.random() - 0.5) * 0.005);
  const coinAmount = usdAmount / price;
  const sym = symbol.toUpperCase();
  const coinName = assetInfo.name;

  await db.update(usersTable).set({ usdBalance: user.usdBalance - usdAmount }).where(eq(usersTable.id, user.id));

  const existingHolding = await db
    .select()
    .from(holdingsTable)
    .where(and(eq(holdingsTable.userId, user.id), eq(holdingsTable.symbol, sym)))
    .limit(1);

  if (existingHolding.length > 0) {
    const h = existingHolding[0];
    const newAmount = h.amount + coinAmount;
    const newAvg = (h.avgBuyPrice * h.amount + price * coinAmount) / newAmount;
    await db
      .update(holdingsTable)
      .set({ amount: newAmount, avgBuyPrice: newAvg, updatedAt: new Date() })
      .where(eq(holdingsTable.id, h.id));
  } else {
    await db.insert(holdingsTable).values({
      userId: user.id,
      coin: coinName,
      symbol: sym,
      amount: coinAmount,
      avgBuyPrice: price,
    });
  }

  const [tx] = await db
    .insert(transactionsTable)
    .values({
      userId: user.id,
      type: "buy",
      coin: coinName,
      symbol: sym,
      amount: coinAmount,
      usdAmount,
      price,
      status: "completed",
    })
    .returning();

  res.json({
    id: tx.id,
    type: tx.type,
    coin: tx.coin,
    symbol: tx.symbol,
    amount: tx.amount,
    usdAmount: tx.usdAmount,
    price: tx.price,
    status: tx.status,
    createdAt: tx.createdAt.toISOString(),
  });
});

router.post("/sell", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const parsed = SellCryptoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { symbol, usdAmount } = parsed.data;
  const assetInfo = await resolveAssetPrice(req, symbol);
  if (!assetInfo) {
    res.status(400).json({ error: "Unknown asset" });
    return;
  }

  const sym = symbol.toUpperCase();
  const price = assetInfo.price * (1 + (Math.random() - 0.5) * 0.005);
  const coinAmount = usdAmount / price;

  const [holding] = await db
    .select()
    .from(holdingsTable)
    .where(and(eq(holdingsTable.userId, req.session.userId), eq(holdingsTable.symbol, sym)))
    .limit(1);

  if (!holding || holding.amount < coinAmount) {
    res.status(400).json({ error: "Insufficient holdings" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);

  await db.update(usersTable).set({ usdBalance: user.usdBalance + usdAmount }).where(eq(usersTable.id, user.id));
  await db
    .update(holdingsTable)
    .set({ amount: holding.amount - coinAmount, updatedAt: new Date() })
    .where(eq(holdingsTable.id, holding.id));

  const [tx] = await db
    .insert(transactionsTable)
    .values({
      userId: user.id,
      type: "sell",
      coin: holding.coin,
      symbol: sym,
      amount: coinAmount,
      usdAmount,
      price,
      status: "completed",
    })
    .returning();

  res.json({
    id: tx.id,
    type: tx.type,
    coin: tx.coin,
    symbol: tx.symbol,
    amount: tx.amount,
    usdAmount: tx.usdAmount,
    price: tx.price,
    status: tx.status,
    createdAt: tx.createdAt.toISOString(),
  });
});

router.post("/deposit", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const parsed = DepositBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { amount } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
  await db.update(usersTable).set({ usdBalance: user.usdBalance + amount }).where(eq(usersTable.id, user.id));

  const [tx] = await db
    .insert(transactionsTable)
    .values({
      userId: user.id,
      type: "deposit",
      usdAmount: amount,
      status: "completed",
    })
    .returning();

  res.json({
    id: tx.id,
    type: tx.type,
    coin: tx.coin,
    symbol: tx.symbol,
    amount: tx.amount,
    usdAmount: tx.usdAmount,
    price: tx.price,
    status: tx.status,
    createdAt: tx.createdAt.toISOString(),
  });
});

router.post("/withdraw", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const parsed = WithdrawBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { amount } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
  if (!user || user.usdBalance < amount) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }

  await db.update(usersTable).set({ usdBalance: user.usdBalance - amount }).where(eq(usersTable.id, user.id));

  const [tx] = await db
    .insert(transactionsTable)
    .values({
      userId: user.id,
      type: "withdraw",
      usdAmount: amount,
      status: "pending",
    })
    .returning();

  res.json({
    id: tx.id,
    type: tx.type,
    coin: tx.coin,
    symbol: tx.symbol,
    amount: tx.amount,
    usdAmount: tx.usdAmount,
    price: tx.price,
    status: tx.status,
    createdAt: tx.createdAt.toISOString(),
  });
});

export default router;
