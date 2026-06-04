import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout";
import { Card, Button, Input } from "@/components/ui/shared";
import { useAuth } from "@/hooks/use-auth";
import { useGetMarketPrices, useGetForexPrices, useBuyCrypto, useSellCrypto, useGetPortfolio, useDeposit } from "@workspace/api-client-react";
import { formatCurrency, formatPercent, cn, formatCrypto } from "@/lib/utils";
import {
  Search, TrendingUp, TrendingDown, Zap, Shield, Rocket, Crown, Star,
  Check, ChevronRight, X, ArrowRight, Wallet, AlertCircle, Maximize2, Minimize2
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";

const tradeSchema = z.object({
  usdAmount: z.coerce.number().positive("Amount must be positive"),
});

const investSchema = z.object({
  amount: z.coerce.number().positive("Enter a valid amount"),
});

const INVESTMENT_PLANS = [
  {
    id: "starter",
    name: "Starter",
    icon: TrendingUp,
    color: "text-green-400",
    ringColor: "ring-green-500/40",
    borderColor: "border-green-500/40",
    bgGlow: "bg-green-500",
    btnBg: "bg-green-500 hover:bg-green-600",
    gradientFrom: "from-green-500/15",
    gradientTo: "to-green-500/5",
    minInvest: 50,
    maxInvest: 499,
    dailyReturn: "2%",
    dailyPct: 0.02,
    monthlyReturn: "60%",
    duration: "30 days",
    features: ["Auto-compounding", "Daily payouts", "All coins supported", "Email support"],
    badge: null,
    desc: "Perfect for beginners. Steady daily returns.",
  },
  {
    id: "balanced",
    name: "Balanced",
    icon: Shield,
    color: "text-blue-400",
    ringColor: "ring-blue-500/40",
    borderColor: "border-blue-500/40",
    bgGlow: "bg-blue-500",
    btnBg: "bg-blue-500 hover:bg-blue-600",
    gradientFrom: "from-blue-500/15",
    gradientTo: "to-blue-500/5",
    minInvest: 500,
    maxInvest: 999,
    dailyReturn: "1.5%",
    dailyPct: 0.015,
    monthlyReturn: "45%",
    duration: "30 days",
    features: ["Auto-compounding", "Daily payouts", "All coins supported", "Priority support"],
    badge: null,
    desc: "Balanced risk-reward for steady growth.",
  },
  {
    id: "upgrade",
    name: "Upgrade",
    icon: Rocket,
    color: "text-purple-400",
    ringColor: "ring-purple-500/40",
    borderColor: "border-purple-500/40",
    bgGlow: "bg-purple-500",
    btnBg: "bg-purple-600 hover:bg-purple-700",
    gradientFrom: "from-purple-500/15",
    gradientTo: "to-purple-500/5",
    minInvest: 1000,
    maxInvest: 4999,
    dailyReturn: "1%",
    dailyPct: 0.01,
    monthlyReturn: "30%",
    duration: "30 days",
    features: ["Auto-compounding", "Daily payouts", "All coins supported", "Priority support", "Portfolio analytics"],
    badge: "Most Popular",
    desc: "Step up to higher capital with sustainable returns.",
  },
  {
    id: "pro-trader",
    name: "Pro Trader",
    icon: Star,
    color: "text-orange-400",
    ringColor: "ring-orange-500/40",
    borderColor: "border-orange-500/40",
    bgGlow: "bg-orange-500",
    btnBg: "bg-orange-500 hover:bg-orange-600",
    gradientFrom: "from-orange-500/15",
    gradientTo: "to-orange-500/5",
    minInvest: 5000,
    maxInvest: 9999,
    dailyReturn: "0.80%",
    dailyPct: 0.008,
    monthlyReturn: "24%",
    duration: "30 days",
    features: ["Auto-compounding", "Hourly payouts", "All coins supported", "24/7 support", "Advanced analytics", "Futures trading"],
    badge: "Best Value",
    desc: "Advanced tools and lower fees for active traders.",
  },
  {
    id: "professional",
    name: "Professional",
    icon: Crown,
    color: "text-red-400",
    ringColor: "ring-red-500/40",
    borderColor: "border-red-500/40",
    bgGlow: "bg-red-500",
    btnBg: "bg-red-500 hover:bg-red-600",
    gradientFrom: "from-red-500/15",
    gradientTo: "to-red-500/5",
    minInvest: 10000,
    maxInvest: null,
    dailyReturn: "0.5%",
    dailyPct: 0.005,
    monthlyReturn: "15%",
    duration: "30 days",
    features: ["Auto-compounding", "Real-time payouts", "Unlimited coins", "Dedicated manager", "Institutional tools", "VIP withdrawals", "Custom strategies"],
    badge: "VIP",
    desc: "Institutional-grade tier with a dedicated account manager.",
  },
];

type Plan = typeof INVESTMENT_PLANS[0];

const TV_SYMBOL_MAP: Record<string, string> = {
  XAUUSD: "OANDA:XAUUSD",
  XAGUSD: "TVC:SILVER",
  EURUSD: "FX:EURUSD",
  GBPUSD: "FX:GBPUSD",
  USDJPY: "FX:USDJPY",
  AUDUSD: "FX:AUDUSD",
  USDCAD: "FX:USDCAD",
  USDCHF: "FX:USDCHF",
  AAPL: "NASDAQ:AAPL",
  TSLA: "NASDAQ:TSLA",
  MSFT: "NASDAQ:MSFT",
  NVDA: "NASDAQ:NVDA",
  BTC: "BINANCE:BTCUSDT",
  ETH: "BINANCE:ETHUSDT",
  BNB: "BINANCE:BNBUSDT",
  SOL: "BINANCE:SOLUSDT",
  XRP: "BINANCE:XRPUSDT",
};

let tvScriptLoaded = false;
let tvScriptCallbacks: (() => void)[] = [];

function loadTvScript(cb: () => void) {
  if (tvScriptLoaded) { cb(); return; }
  tvScriptCallbacks.push(cb);
  if (document.getElementById("tv-script")) return;
  const s = document.createElement("script");
  s.id = "tv-script";
  s.src = "https://s3.tradingview.com/tv.js";
  s.async = true;
  s.onload = () => {
    tvScriptLoaded = true;
    tvScriptCallbacks.forEach(fn => fn());
    tvScriptCallbacks = [];
  };
  document.head.appendChild(s);
}

let widgetIdCounter = 0;

function TvChartInner({ tvSymbol, height, id }: { tvSymbol: string; height: number; id: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    const containerId = id;
    let cancelled = false;

    function buildWidget() {
      if (cancelled) return;
      const el = document.getElementById(containerId);
      if (!el || !(window as any).TradingView) return;
      if (widgetRef.current) {
        try { widgetRef.current.remove(); } catch (_) {}
        widgetRef.current = null;
      }
      el.innerHTML = "";
      widgetRef.current = new (window as any).TradingView.widget({
        autosize: true,
        symbol: tvSymbol,
        interval: "60",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#0d0d0d",
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_side_toolbar: false,
        allow_symbol_change: false,
        save_image: false,
        container_id: containerId,
        withdateranges: true,
        hide_volume: false,
        studies: [],
        overrides: {
          "paneProperties.background": "#0d0d0d",
          "paneProperties.backgroundType": "solid",
          "scalesProperties.lineColor": "#333",
          "scalesProperties.textColor": "#888",
          "mainSeriesProperties.candleStyle.upColor": "#22c55e",
          "mainSeriesProperties.candleStyle.downColor": "#ef4444",
          "mainSeriesProperties.candleStyle.borderUpColor": "#22c55e",
          "mainSeriesProperties.candleStyle.borderDownColor": "#ef4444",
          "mainSeriesProperties.candleStyle.wickUpColor": "#22c55e",
          "mainSeriesProperties.candleStyle.wickDownColor": "#ef4444",
        },
      });
    }

    loadTvScript(buildWidget);

    return () => {
      cancelled = true;
      if (widgetRef.current) {
        try { widgetRef.current.remove(); } catch (_) {}
        widgetRef.current = null;
      }
      const el = document.getElementById(containerId);
      if (el) el.innerHTML = "";
    };
  }, [tvSymbol, id]);

  return (
    <div
      ref={containerRef}
      id={id}
      style={{ width: "100%", height }}
    />
  );
}

function TradingViewChart({ symbol }: { symbol: string }) {
  const tvSymbol = TV_SYMBOL_MAP[symbol] ?? `FX:${symbol}`;
  const [fullscreen, setFullscreen] = useState(false);
  const idRef = useRef(`tv_${++widgetIdCounter}`);
  const fsIdRef = useRef(`tv_fs_${widgetIdCounter}`);

  useEffect(() => {
    if (fullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [fullscreen]);

  return (
    <>
      <div className="rounded-xl overflow-hidden border border-border bg-[#0d0d0d] mb-4">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">forex.com</span>
          <span className="text-[10px] text-muted-foreground">·</span>
          <span className="text-[11px] font-mono text-foreground font-semibold">{tvSymbol}</span>
          <span className="flex items-center gap-1 text-[10px] text-green-400 font-semibold ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live
          </span>
          <button
            onClick={() => setFullscreen(true)}
            className="ml-auto flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-amber-400 transition-colors px-2 py-1 rounded-lg hover:bg-secondary"
            title="Open fullscreen chart"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Fullscreen
          </button>
        </div>
        <TvChartInner tvSymbol={tvSymbol} height={300} id={idRef.current} />
      </div>

      {fullscreen && (
        <div className="fixed inset-0 z-[100] bg-[#0d0d0d] flex flex-col">
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card shrink-0">
            <span className="text-sm font-bold text-amber-400 uppercase tracking-wider">forex.com</span>
            <span className="text-muted-foreground">·</span>
            <span className="font-mono font-bold text-foreground">{tvSymbol}</span>
            <span className="flex items-center gap-1.5 text-xs text-green-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Live
            </span>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:block">TradingView Advanced Chart · Powered by forex.com</span>
              <button
                onClick={() => setFullscreen(false)}
                className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground bg-secondary hover:bg-border px-3 py-1.5 rounded-lg transition-colors"
              >
                <Minimize2 className="w-4 h-4" />
                Exit
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <TvChartInner tvSymbol={tvSymbol} height={window.innerHeight - 52} id={fsIdRef.current} />
          </div>
        </div>
      )}
    </>
  );
}

function PlanModal({ plan, onClose, userBalance, onSuccess }: {
  plan: Plan;
  onClose: () => void;
  userBalance: number;
  onSuccess: (plan: Plan, amount: number) => void;
}) {
  const Icon = plan.icon;
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [investAmount, setInvestAmount] = useState<number>(0);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<{ amount: number }>({
    resolver: zodResolver(investSchema.refine(d => d.amount >= plan.minInvest, {
      message: `Minimum investment is ${formatCurrency(plan.minInvest)}`,
      path: ["amount"],
    }).refine(d => plan.maxInvest === null || d.amount <= plan.maxInvest, {
      message: `Maximum investment is ${formatCurrency(plan.maxInvest!)}`,
      path: ["amount"],
    }).refine(d => d.amount <= userBalance, {
      message: "Insufficient balance",
      path: ["amount"],
    })),
  });

  const watchAmount = watch("amount") || 0;
  const dailyEarning = watchAmount * plan.dailyPct;
  const monthlyEarning = watchAmount * plan.dailyPct * 30;
  const totalReturn = watchAmount + monthlyEarning;

  const depositMutation = useDeposit({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
        setStep("success");
        onSuccess(plan, investAmount);
      },
    }
  });

  const onFormSubmit = (data: { amount: number }) => {
    setInvestAmount(data.amount);
    setStep("confirm");
  };

  const onConfirm = () => {
    depositMutation.mutate({ data: { amount: monthlyEarning, method: `${plan.name} Plan` } });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className={cn(
        "relative w-full max-w-md bg-card border rounded-2xl shadow-2xl overflow-hidden",
        plan.borderColor
      )}>
        {/* Glow */}
        <div className={cn("absolute -top-16 -right-16 w-48 h-48 blur-3xl rounded-full opacity-20 pointer-events-none", plan.bgGlow)} />

        {/* Header */}
        <div className="relative flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-background border border-border", plan.color)}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{plan.name} Plan</h2>
              <p className="text-xs text-muted-foreground">{plan.monthlyReturn} monthly return · {plan.duration}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors rounded-lg p-1 hover:bg-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative p-6 space-y-5">
          {/* Step: Form */}
          {step === "form" && (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 rounded-xl p-3 border border-border">
                <Wallet className="w-4 h-4 shrink-0" />
                <span>Your balance: <span className="text-foreground font-semibold">{formatCurrency(userBalance)}</span></span>
              </div>

              <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Investment Amount (USD)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-lg">$</span>
                    <input
                      {...register("amount")}
                      type="number"
                      step="any"
                      placeholder={`Min. ${formatCurrency(plan.minInvest)}`}
                      className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-4 text-lg font-semibold text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                    />
                  </div>
                  {errors.amount && (
                    <p className="text-red-400 text-sm flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.amount.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Range: {formatCurrency(plan.minInvest)} – {plan.maxInvest ? formatCurrency(plan.maxInvest) : "Unlimited"}
                  </p>
                </div>

                {/* Live Earnings Preview */}
                {watchAmount >= plan.minInvest && !errors.amount && (
                  <div className={cn("rounded-xl p-4 border space-y-3", plan.borderColor, `bg-gradient-to-br ${plan.gradientFrom} ${plan.gradientTo}`)}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estimated Returns</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Daily</p>
                        <p className={cn("text-sm font-bold", plan.color)}>{formatCurrency(dailyEarning)}</p>
                      </div>
                      <div className="text-center border-x border-border/50">
                        <p className="text-xs text-muted-foreground mb-1">Monthly</p>
                        <p className={cn("text-base font-extrabold", plan.color)}>{formatCurrency(monthlyEarning)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Total</p>
                        <p className="text-sm font-bold text-foreground">{formatCurrency(totalReturn)}</p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className={cn(
                    "w-full py-4 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2",
                    plan.btnBg
                  )}
                >
                  Review Investment <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </>
          )}

          {/* Step: Confirm */}
          {step === "confirm" && (
            <div className="space-y-5">
              <div className="text-center py-2">
                <p className="text-muted-foreground text-sm mb-1">You are investing</p>
                <p className="text-4xl font-extrabold text-foreground">{formatCurrency(investAmount)}</p>
                <p className={cn("text-sm font-medium mt-1", plan.color)}>in the {plan.name} Plan</p>
              </div>

              <div className="bg-secondary/50 rounded-xl p-4 border border-border space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Investment</span>
                  <span className="font-semibold text-foreground">{formatCurrency(investAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily return ({plan.dailyReturn})</span>
                  <span className={cn("font-semibold", plan.color)}>+{formatCurrency(investAmount * plan.dailyPct)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly return ({plan.monthlyReturn})</span>
                  <span className={cn("font-semibold", plan.color)}>+{formatCurrency(investAmount * plan.dailyPct * 30)}</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-medium text-foreground">Total after 30 days</span>
                  <span className="font-bold text-foreground">{formatCurrency(investAmount + investAmount * plan.dailyPct * 30)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("form")}
                  className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                >
                  Back
                </button>
                <button
                  onClick={onConfirm}
                  disabled={depositMutation.isPending}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2",
                    plan.btnBg,
                    depositMutation.isPending && "opacity-60 cursor-not-allowed"
                  )}
                >
                  {depositMutation.isPending ? "Processing..." : "Confirm & Invest"}
                </button>
              </div>
            </div>
          )}

          {/* Step: Success */}
          {step === "success" && (
            <div className="text-center space-y-5 py-4">
              <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mx-auto border-2", plan.borderColor, `bg-gradient-to-br ${plan.gradientFrom} ${plan.gradientTo}`)}>
                <Check className={cn("w-8 h-8", plan.color)} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-1">Investment Activated!</h3>
                <p className="text-muted-foreground text-sm">
                  Your <span className={cn("font-semibold", plan.color)}>{plan.name} Plan</span> is now active.
                  You'll start earning <span className="font-semibold text-foreground">{plan.dailyReturn}</span> daily.
                </p>
              </div>
              <div className={cn("rounded-xl p-4 border text-sm", plan.borderColor, `bg-gradient-to-br ${plan.gradientFrom} ${plan.gradientTo}`)}>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Amount Invested</span>
                  <span className="font-bold text-foreground">{formatCurrency(investAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expected after 30 days</span>
                  <span className={cn("font-bold", plan.color)}>{formatCurrency(investAmount + investAmount * plan.dailyPct * 30)}</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className={cn("w-full py-3 rounded-xl text-sm font-bold text-white transition-all", plan.btnBg)}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InvestPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: cryptoMarkets } = useGetMarketPrices({
    query: { refetchInterval: 5000, refetchOnWindowFocus: true },
  });
  const { data: forexMarkets, isLoading: forexLoading } = useGetForexPrices({
    query: { refetchInterval: 15000, refetchOnWindowFocus: true },
  });
  const markets = forexMarkets;
  const isLoading = forexLoading;
  const { data: portfolio } = useGetPortfolio();

  const initialTab: "plans" | "trade" =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tab") === "trade"
      ? "trade"
      : "plans";
  const [activeTab, setActiveTab] = useState<"plans" | "trade">(initialTab);
  void cryptoMarkets;
  const [openPlan, setOpenPlan] = useState<Plan | null>(null);
  const [activePlans, setActivePlans] = useState<Record<string, number>>({});

  const [search, setSearch] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [tradeSuccess, setTradeSuccess] = useState<string | null>(null);
  const [tradeError, setTradeError] = useState<string | null>(null);

  const buyMutation = useBuyCrypto({
    mutation: {
      onSuccess: () => {
        setTradeSuccess(`Successfully bought ${selectedSymbol}`);
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
        reset();
      },
      onError: (err: any) => setTradeError(err.message || "Failed to complete trade"),
    }
  });

  const sellMutation = useSellCrypto({
    mutation: {
      onSuccess: () => {
        setTradeSuccess(`Successfully sold ${selectedSymbol}`);
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
        reset();
      },
      onError: (err: any) => setTradeError(err.message || "Failed to complete trade"),
    }
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<{ usdAmount: number }>({
    resolver: zodResolver(tradeSchema)
  });

  const watchUsdAmount = watch("usdAmount");

  const filteredMarkets = markets?.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.symbol.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const selectedCoin = markets?.find(c => c.symbol === selectedSymbol);
  const holding = portfolio?.holdings.find(h => h.symbol === selectedSymbol);
  const maxBuy = user?.usdBalance || 0;
  const maxSell = holding ? holding.currentValue : 0;

  const onTradeSubmit = (data: { usdAmount: number }) => {
    if (!selectedSymbol) return;
    setTradeSuccess(null);
    setTradeError(null);
    if (tradeType === "buy") {
      buyMutation.mutate({ data: { symbol: selectedSymbol, usdAmount: data.usdAmount } });
    } else {
      sellMutation.mutate({ data: { symbol: selectedSymbol, usdAmount: data.usdAmount } });
    }
  };

  const isPending = buyMutation.isPending || sellMutation.isPending;

  return (
    <DashboardLayout>
      {/* Plan Purchase Modal */}
      {openPlan && (
        <PlanModal
          plan={openPlan}
          userBalance={user?.usdBalance || 0}
          onClose={() => setOpenPlan(null)}
          onSuccess={(plan, amount) => {
            setActivePlans(prev => ({ ...prev, [plan.id]: amount }));
          }}
        />
      )}

      <div className="space-y-6">
        {/* Tab Switcher */}
        <div className="flex items-center gap-4">
          <div className="flex bg-card border border-border p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("plans")}
              className={cn(
                "px-6 py-2.5 text-sm font-semibold rounded-lg transition-all",
                activeTab === "plans" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Investment Plans
            </button>
            <button
              onClick={() => setActiveTab("trade")}
              className={cn(
                "px-6 py-2.5 text-sm font-semibold rounded-lg transition-all",
                activeTab === "trade" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Forex & Gold
            </button>
          </div>
          <span className="text-sm text-muted-foreground">
            Balance: <span className="text-foreground font-semibold">{formatCurrency(user?.usdBalance || 0)}</span>
          </span>
        </div>

        {/* Investment Plans */}
        {activeTab === "plans" && (
          <div className="space-y-6">
            {/* Hero Banner */}
            <div className="relative rounded-2xl overflow-hidden border border-border bg-card px-8 py-10">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-48 bg-yellow-400/10 blur-[80px] rounded-full" />
                <div className="absolute bottom-0 right-1/4 w-80 h-40 bg-purple-500/10 blur-[80px] rounded-full" />
              </div>
              <div className="relative z-10 max-w-xl">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-primary/20">
                  <Zap className="w-3 h-3" /> Earn while you sleep
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Choose Your Investment Plan</h1>
                <p className="text-muted-foreground text-base">
                  Deposit once, earn daily returns automatically. All plans include auto-compounding and are fully managed by our trading algorithms.
                </p>
              </div>
            </div>

            {/* 4 Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
              {INVESTMENT_PLANS.map((plan) => {
                const Icon = plan.icon;
                const isActive = !!activePlans[plan.id];

                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "relative rounded-2xl border overflow-hidden group transition-all duration-200",
                      isActive ? `${plan.borderColor} ring-1 ring-current` : "border-border hover:border-border/80 hover:scale-[1.01]"
                    )}
                  >
                    <div className={cn("absolute inset-0 bg-gradient-to-b opacity-60", plan.gradientFrom, plan.gradientTo)} />
                    <div className={cn("absolute -top-8 -right-8 w-32 h-32 blur-3xl rounded-full opacity-20 group-hover:opacity-30 transition-opacity", plan.bgGlow)} />

                    {/* Badge */}
                    {plan.badge && (
                      <div className="absolute top-4 right-4 z-10">
                        <span className={cn(
                          "text-xs font-bold px-2.5 py-1 rounded-full",
                          plan.badge === "Most Popular" && "bg-yellow-400/20 text-yellow-400 border border-yellow-400/30",
                          plan.badge === "Best Value" && "bg-purple-400/20 text-purple-400 border border-purple-400/30",
                          plan.badge === "VIP" && "bg-orange-400/20 text-orange-400 border border-orange-400/30",
                        )}>
                          {plan.badge}
                        </span>
                      </div>
                    )}

                    <div className="relative z-10 p-6 flex flex-col h-full">
                      {/* Icon + Name */}
                      <div className="flex items-center gap-3 mb-5">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-card/80 border border-border", plan.color)}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            Min: {formatCurrency(plan.minInvest)}{plan.maxInvest ? ` – ${formatCurrency(plan.maxInvest)}` : "+"}
                          </p>
                        </div>
                      </div>

                      {/* Returns */}
                      <div className="bg-card/60 rounded-xl p-4 mb-5 space-y-2 border border-border/50">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Daily Return</span>
                          <span className={cn("text-sm font-bold", plan.color)}>{plan.dailyReturn}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Monthly Return</span>
                          <span className={cn("text-lg font-extrabold", plan.color)}>{plan.monthlyReturn}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Duration</span>
                          <span className="text-sm font-medium text-foreground">{plan.duration}</span>
                        </div>
                      </div>

                      {/* Features */}
                      <ul className="space-y-2 mb-6 flex-1">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Check className={cn("w-3.5 h-3.5 shrink-0", plan.color)} />
                            {f}
                          </li>
                        ))}
                      </ul>

                      {/* Active plan info */}
                      {isActive && (
                        <div className={cn("mb-3 rounded-lg p-2.5 border text-xs text-center", plan.borderColor, `bg-gradient-to-br ${plan.gradientFrom} ${plan.gradientTo}`)}>
                          <span className="text-muted-foreground">Invested: </span>
                          <span className={cn("font-bold", plan.color)}>{formatCurrency(activePlans[plan.id])}</span>
                        </div>
                      )}

                      {/* CTA Button */}
                      <button
                        onClick={() => setOpenPlan(plan)}
                        className={cn(
                          "w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 text-white",
                          plan.btnBg
                        )}
                      >
                        {isActive ? (
                          <><ChevronRight className="w-4 h-4" /> Add More</>
                        ) : (
                          <><ChevronRight className="w-4 h-4" /> Buy Plan</>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-xs text-muted-foreground pb-2">
              Returns are simulated for demonstration purposes. Past performance does not guarantee future results. Invest responsibly.
            </p>
          </div>
        )}

        {/* Spot Trade Tab */}
        {activeTab === "trade" && (
          <div className="flex flex-col lg:flex-row gap-8" style={{ height: "calc(100vh - 230px)" }}>
            {/* Markets List */}
            <div className="flex-1 flex flex-col min-h-0 bg-card rounded-2xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-bold">Forex, Gold & Stocks</h2>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 border border-success/20 text-success text-[10px] font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Live
                  </span>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search pair (XAUUSD, EURUSD, AAPL...)"
                    className="pl-10 h-10"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-secondary/20 sticky top-0 backdrop-blur-md z-10">
                    <tr>
                      <th className="px-4 py-3 font-medium">Asset</th>
                      <th className="px-4 py-3 font-medium text-right">Price</th>
                      <th className="px-4 py-3 font-medium text-right">24h</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {isLoading && (
                      <tr><td colSpan={3} className="text-center py-8 text-muted-foreground">Loading markets...</td></tr>
                    )}
                    {filteredMarkets.map((coin) => {
                      const isSelected = selectedSymbol === coin.symbol;
                      const isPos = coin.changePercent24h >= 0;
                      return (
                        <tr
                          key={coin.symbol}
                          onClick={() => { setSelectedSymbol(coin.symbol); setTradeSuccess(null); setTradeError(null); }}
                          className={cn(
                            "cursor-pointer transition-colors border-l-2",
                            isSelected ? "bg-secondary/50 border-primary" : "hover:bg-secondary/30 border-transparent"
                          )}
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{coin.icon}</span>
                              <div>
                                <div className="font-bold text-foreground">{coin.symbol}</div>
                                <div className="text-xs text-muted-foreground">{coin.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right font-medium">{formatCurrency(coin.price, 2, 6)}</td>
                          <td className={cn("px-4 py-4 text-right", isPos ? "text-green-400" : "text-red-400")}>
                            {isPos ? "+" : ""}{formatPercent(Math.abs(coin.changePercent24h))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Trade Panel */}
            <div className="w-full lg:w-[400px] shrink-0">
              {selectedCoin ? (
                <Card className="p-6 h-full flex flex-col relative overflow-hidden">
                  <div className={cn(
                    "absolute top-0 right-0 w-64 h-64 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none opacity-20",
                    selectedCoin.changePercent24h >= 0 ? "bg-green-500" : "bg-red-500"
                  )} />
                  <div className="relative z-10 flex-1 overflow-y-auto pr-1">
                    <div className="flex items-center gap-4 mb-6">
                      <span className="text-4xl">{selectedCoin.icon}</span>
                      <div>
                        <h2 className="text-2xl font-bold leading-none">{selectedCoin.symbol}</h2>
                        <p className="text-muted-foreground">{selectedCoin.name}</p>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="text-3xl font-bold text-foreground">{formatCurrency(selectedCoin.price, 2, 6)}</div>
                      <div className={cn("flex items-center gap-1 text-sm font-medium mt-1", selectedCoin.changePercent24h >= 0 ? "text-green-400" : "text-red-400")}>
                        {selectedCoin.changePercent24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {formatPercent(Math.abs(selectedCoin.changePercent24h))} Today
                      </div>
                    </div>

                    <TradingViewChart symbol={selectedCoin.symbol} />

                    <div className="flex bg-secondary p-1 rounded-xl mb-6">
                      <button onClick={() => { setTradeType("buy"); setTradeSuccess(null); }} className={cn("flex-1 py-2 text-sm font-semibold rounded-lg transition-all", tradeType === "buy" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>Buy</button>
                      <button onClick={() => { setTradeType("sell"); setTradeSuccess(null); }} className={cn("flex-1 py-2 text-sm font-semibold rounded-lg transition-all", tradeType === "sell" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>Sell</button>
                    </div>
                    <form onSubmit={handleSubmit(onTradeSubmit)} className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Amount (USD)</span>
                          <span className="text-muted-foreground">Available: <span className="font-medium text-foreground">{formatCurrency(tradeType === "buy" ? maxBuy : maxSell)}</span></span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">$</span>
                          <Input {...register("usdAmount")} placeholder="0.00" className="pl-8 pr-16 text-lg h-14" type="number" step="any" />
                          <button type="button" onClick={() => setValue("usdAmount", tradeType === "buy" ? maxBuy : maxSell)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold bg-secondary hover:bg-border px-2 py-1 rounded-md transition-colors">MAX</button>
                        </div>
                        {errors.usdAmount && <p className="text-red-400 text-sm">{errors.usdAmount.message}</p>}
                        {watchUsdAmount > 0 && !errors.usdAmount && (
                          <div className="text-sm text-center p-3 bg-secondary/50 rounded-lg mt-2">
                            ≈ <span className="font-mono font-medium text-foreground">{formatCrypto(watchUsdAmount / selectedCoin.price, selectedCoin.symbol)}</span>
                          </div>
                        )}
                      </div>
                      {tradeSuccess && <div className="text-green-400 text-sm text-center p-2 bg-green-500/10 rounded-lg font-medium">{tradeSuccess}</div>}
                      {tradeError && <div className="text-red-400 text-sm text-center p-2 bg-red-500/10 rounded-lg font-medium">{tradeError}</div>}
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-14 px-5 font-semibold"
                          disabled={isPending}
                          onClick={() => {
                            reset();
                            setTradeSuccess(null);
                            setTradeError(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" className={cn("flex-1 h-14 text-lg font-bold", tradeType === "buy" ? "bg-green-500 hover:bg-green-600 text-white" : "bg-red-500 hover:bg-red-600 text-white")} disabled={isPending || !watchUsdAmount}>
                          {isPending ? "Processing..." : `${tradeType === "buy" ? "Buy" : "Sell"} ${selectedCoin.symbol}`}
                        </Button>
                      </div>
                    </form>
                  </div>
                </Card>
              ) : (
                <Card className="h-full flex items-center justify-center p-6 border-dashed bg-transparent shadow-none">
                  <div className="text-center text-muted-foreground">
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>Select a market to start trading</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
