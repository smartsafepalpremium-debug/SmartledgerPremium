import { Router, type IRouter } from "express";

const router: IRouter = Router();

const COINS = [
  { symbol: "BTC", name: "Bitcoin", basePrice: 67500, icon: "₿" },
  { symbol: "ETH", name: "Ethereum", basePrice: 3450, icon: "Ξ" },
  { symbol: "BNB", name: "BNB", basePrice: 580, icon: "B" },
  { symbol: "SOL", name: "Solana", basePrice: 175, icon: "◎" },
  { symbol: "XRP", name: "XRP", basePrice: 0.58, icon: "✕" },
  { symbol: "ADA", name: "Cardano", basePrice: 0.45, icon: "₳" },
  { symbol: "DOGE", name: "Dogecoin", basePrice: 0.162, icon: "Ð" },
  { symbol: "MATIC", name: "Polygon", basePrice: 0.87, icon: "P" },
  { symbol: "DOT", name: "Polkadot", basePrice: 7.2, icon: "●" },
  { symbol: "LINK", name: "Chainlink", basePrice: 18.5, icon: "⬡" },
];

function randomDelta(base: number, pct: number): number {
  return base * (1 + (Math.random() - 0.5) * pct * 2);
}

router.get("/prices", (_req, res) => {
  const prices = COINS.map((c) => {
    const price = randomDelta(c.basePrice, 0.02);
    const change24h = randomDelta(c.basePrice * 0.025, 1);
    const changePercent24h = (change24h / c.basePrice) * 100;
    return {
      symbol: c.symbol,
      name: c.name,
      price,
      change24h,
      changePercent24h,
      volume24h: randomDelta(c.basePrice * 50000, 0.3),
      marketCap: randomDelta(c.basePrice * 18_000_000, 0.01),
      icon: c.icon,
    };
  });

  res.json(prices);
});

export default router;
