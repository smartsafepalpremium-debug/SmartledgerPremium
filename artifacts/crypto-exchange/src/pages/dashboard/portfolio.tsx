import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { Card, Button } from "@/components/ui/shared";
import { useGetPortfolio } from "@workspace/api-client-react";
import { formatCurrency, formatPercent, formatCrypto, cn } from "@/lib/utils";
import { Link } from "wouter";
import { Eye, EyeOff, History, LineChart, Search, ChevronDown, Plus, Send, ArrowLeftRight } from "lucide-react";

const COIN_META: Record<string, { name: string; icon: string; color: string; bg: string }> = {
  BTC:   { name: "Bitcoin",   icon: "₿", color: "text-orange-400", bg: "bg-orange-500/15 border-orange-500/30" },
  ETH:   { name: "Ethereum",  icon: "Ξ", color: "text-blue-300",   bg: "bg-blue-500/15 border-blue-500/30" },
  BNB:   { name: "BNB",       icon: "⬡", color: "text-yellow-400", bg: "bg-yellow-500/15 border-yellow-500/30" },
  SOL:   { name: "Solana",    icon: "◎", color: "text-purple-300", bg: "bg-purple-500/15 border-purple-500/30" },
  XRP:   { name: "XRP",       icon: "✕", color: "text-sky-300",    bg: "bg-sky-500/15 border-sky-500/30" },
  ADA:   { name: "Cardano",   icon: "₳", color: "text-blue-200",   bg: "bg-blue-400/15 border-blue-400/30" },
  DOGE:  { name: "Dogecoin",  icon: "Ð", color: "text-amber-300",  bg: "bg-amber-500/15 border-amber-500/30" },
  MATIC: { name: "Polygon",   icon: "⬢", color: "text-indigo-300", bg: "bg-indigo-500/15 border-indigo-500/30" },
  DOT:   { name: "Polkadot",  icon: "●", color: "text-pink-300",   bg: "bg-pink-500/15 border-pink-500/30" },
  LINK:  { name: "Chainlink", icon: "⬡", color: "text-cyan-300",   bg: "bg-cyan-500/15 border-cyan-500/30" },
  USDT:  { name: "TetherUS",  icon: "₮", color: "text-emerald-300", bg: "bg-emerald-500/15 border-emerald-500/30" },
  LTC:   { name: "Litecoin",  icon: "Ł", color: "text-slate-200",  bg: "bg-slate-400/15 border-slate-400/30" },
  TRX:   { name: "TRON",      icon: "⬤", color: "text-red-300",    bg: "bg-red-500/15 border-red-500/30" },
};

function CoinAvatar({ symbol }: { symbol: string }) {
  const m = COIN_META[symbol] ?? { icon: "•", color: "text-foreground", bg: "bg-secondary border-border" };
  return (
    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border", m.bg, m.color)}>
      {m.icon}
    </div>
  );
}

export default function PortfolioPage() {
  const { data: portfolio, isLoading } = useGetPortfolio();
  const [hideBalance, setHideBalance] = useState(false);
  const [tab, setTab] = useState<"crypto" | "account">("crypto");
  const [search, setSearch] = useState("");

  if (isLoading) {
    return <DashboardLayout><div className="text-center py-20 text-muted-foreground animate-pulse">Loading portfolio...</div></DashboardLayout>;
  }
  if (!portfolio) return null;

  const btcPrice = portfolio.holdings.find((h) => h.symbol === "BTC")?.currentPrice ?? 67500;

  // Total in BTC = sum(USD value) / BTC price
  const totalBtc = portfolio.totalValue / btcPrice;

  const totalPnl = portfolio.holdings.reduce((sum, h) => sum + h.pnl, 0);
  const totalInvested = portfolio.holdings.reduce((sum, h) => sum + h.avgBuyPrice * h.amount, 0);
  const totalPnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  const hide = (s: string) => (hideBalance ? "******" : s);

  // Build row data — show all 13 supported coins, with 0 balance if not held
  const heldBySymbol = new Map(portfolio.holdings.map((h) => [h.symbol, h]));
  const allSymbols = Object.keys(COIN_META);
  const rows = allSymbols
    .map((sym) => {
      const h = heldBySymbol.get(sym);
      const meta = COIN_META[sym];
      return {
        symbol: sym,
        coinName: meta.name,
        amount: h?.amount ?? 0,
        avgBuyPrice: h?.avgBuyPrice ?? 0,
        currentPrice: h?.currentPrice ?? 0,
        currentValue: h?.currentValue ?? 0,
        pnl: h?.pnl ?? 0,
        pnlPercent: h?.pnlPercent ?? 0,
      };
    })
    .filter((r) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return r.symbol.toLowerCase().includes(q) || r.coinName.toLowerCase().includes(q);
    })
    // Held coins first (descending by USD value), then unheld
    .sort((a, b) => {
      if (a.amount > 0 && b.amount === 0) return -1;
      if (a.amount === 0 && b.amount > 0) return 1;
      return b.currentValue - a.currentValue;
    });

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Header tabs */}
        <div className="flex items-center gap-6 border-b border-border pb-3">
          <h1 className="text-2xl font-display font-bold text-foreground">Overview</h1>
          <Link href="/dashboard/transactions" className="text-2xl font-display font-bold text-muted-foreground hover:text-foreground transition-colors">
            Spot
          </Link>
        </div>

        {/* Summary card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
              Est. Total Value
              <button onClick={() => setHideBalance((v) => !v)} className="hover:text-foreground transition-colors" aria-label="Toggle balance visibility">
                {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Link href="/dashboard/transactions" className="hover:text-primary transition-colors" aria-label="Performance"><LineChart className="w-4 h-4" /></Link>
              <Link href="/dashboard/transactions" className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:text-primary hover:border-primary/40 transition-colors" aria-label="History"><History className="w-3.5 h-3.5" /></Link>
            </div>
          </div>

          <div className="flex items-baseline gap-2 mb-1 flex-wrap">
            <div className="text-4xl sm:text-5xl font-display font-bold mono-nums text-foreground tracking-tight">
              {hide(totalBtc.toFixed(8))}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <span className="text-base font-bold">BTC</span>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm text-muted-foreground mono-nums mb-3">
            ≈ {hide(formatCurrency(portfolio.totalValue))}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Link href="/dashboard/transactions" className="text-muted-foreground underline underline-offset-2 decoration-muted-foreground/40 hover:text-foreground">Today's PNL</Link>
            <span className={cn("font-medium mono-nums", totalPnl >= 0 ? "text-success" : "text-destructive")}>
              {totalPnl >= 0 ? "+" : ""}{hide(formatCurrency(totalPnl))} ({totalPnl >= 0 ? "+" : ""}{hide(totalPnlPercent.toFixed(2))}%)
            </span>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2.5 mt-5">
            <Link href="/dashboard/deposit">
              <Button className="w-full font-bold gap-1.5"><Plus className="w-4 h-4" /> Add Funds</Button>
            </Link>
            <Link href="/dashboard/withdraw">
              <Button variant="secondary" className="w-full font-semibold gap-1.5"><Send className="w-4 h-4" /> Send</Button>
            </Link>
            <Link href="/dashboard/convert">
              <Button variant="secondary" className="w-full font-semibold gap-1.5"><ArrowLeftRight className="w-4 h-4" /> Transfer</Button>
            </Link>
          </div>
        </Card>

        {/* Crypto / Account tabs + search */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setTab("crypto")}
              className={cn(
                "relative pb-2 text-base font-bold transition-colors",
                tab === "crypto" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Crypto
              {tab === "crypto" && <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-primary rounded-full" />}
            </button>
            <button
              onClick={() => setTab("account")}
              className={cn(
                "relative pb-2 text-base font-bold transition-colors",
                tab === "account" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Account
              {tab === "account" && <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-primary rounded-full" />}
            </button>
          </div>
          <div className="relative flex-1 max-w-[180px]">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-secondary border border-border rounded-md focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Asset rows */}
        {tab === "crypto" ? (
          <div className="space-y-2">
            {rows.length === 0 && (
              <Card className="p-6 text-center text-sm text-muted-foreground">No assets match "{search}".</Card>
            )}
            {rows.map((r) => {
              const isPos = r.pnl >= 0;
              const balanceInBtc = btcPrice > 0 ? r.currentValue / btcPrice : 0;
              return (
                <Card key={r.symbol} className="p-4 hover:border-border/80 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: icon + name */}
                    <div className="flex items-start gap-3 min-w-0">
                      <CoinAvatar symbol={r.symbol} />
                      <div className="min-w-0">
                        <div className="font-bold text-foreground text-base leading-tight">{r.symbol}</div>
                        <div className="text-xs text-muted-foreground">{r.coinName}</div>
                      </div>
                    </div>
                    {/* Right: balance */}
                    <div className="text-right shrink-0">
                      <div className="text-base font-bold mono-nums text-foreground leading-tight">
                        {hide(formatCrypto(r.amount, r.symbol))}
                      </div>
                      <div className="text-[11px] text-muted-foreground mono-nums">
                        {hide(balanceInBtc.toFixed(8))} BTC
                      </div>
                    </div>
                  </div>

                  {/* Mid: PNL + Avg Price grid */}
                  <div className="mt-3 grid grid-cols-2 gap-y-1.5 text-xs">
                    <div className="text-muted-foreground">Today's PNL</div>
                    <div className={cn("text-right mono-nums font-medium", r.amount > 0 ? (isPos ? "text-success" : "text-destructive") : "text-muted-foreground")}>
                      {r.amount > 0
                        ? `${isPos ? "+" : ""}${hide(formatCurrency(r.pnl))}(${isPos ? "+" : ""}${hide(r.pnlPercent.toFixed(2))}%)`
                        : "$0.00(0.00%)"}
                    </div>
                    <div className="text-muted-foreground">Average Price</div>
                    <div className="text-right mono-nums text-foreground">
                      {hide(formatCurrency(r.avgBuyPrice > 0 ? r.avgBuyPrice : r.currentPrice))}
                    </div>
                  </div>

                  {/* Bottom buttons */}
                  <div className="mt-3 flex justify-end gap-2">
                    <Link href={`/dashboard/invest`}>
                      <button className="px-4 py-1.5 text-xs font-semibold bg-secondary hover:bg-secondary/70 border border-border rounded-md text-foreground transition-colors">
                        Earn
                      </button>
                    </Link>
                    <Link href={`/dashboard/convert`}>
                      <button className="px-4 py-1.5 text-xs font-semibold bg-secondary hover:bg-secondary/70 border border-border rounded-md text-foreground transition-colors">
                        Trade
                      </button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-muted-foreground">Fiat (USD) Balance</div>
                <div className="text-2xl font-bold mono-nums text-foreground">{hide(formatCurrency(portfolio.usdBalance))}</div>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold text-xl">
                $
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard/deposit"><Button variant="secondary" size="sm">Deposit</Button></Link>
              <Link href="/dashboard/withdraw"><Button variant="secondary" size="sm">Withdraw</Button></Link>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
