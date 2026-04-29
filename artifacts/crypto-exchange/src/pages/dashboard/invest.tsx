import { useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { Card, Button, Input } from "@/components/ui/shared";
import { useAuth } from "@/hooks/use-auth";
import { useGetMarketPrices, useBuyCrypto, useSellCrypto, useGetPortfolio, useDeposit } from "@workspace/api-client-react";
import { formatCurrency, formatPercent, cn, formatCrypto } from "@/lib/utils";
import {
  Search, TrendingUp, TrendingDown, Zap, Shield, Rocket, Crown,
  Check, ChevronRight, X, ArrowRight, Wallet, AlertCircle
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
    icon: Zap,
    color: "text-blue-400",
    ringColor: "ring-blue-500/40",
    borderColor: "border-blue-500/40",
    bgGlow: "bg-blue-500",
    btnBg: "bg-blue-500 hover:bg-blue-600",
    gradientFrom: "from-blue-500/10",
    gradientTo: "to-blue-500/5",
    minInvest: 100,
    maxInvest: 4999,
    dailyReturn: "0.5%",
    dailyPct: 0.005,
    monthlyReturn: "15%",
    duration: "30 days",
    features: ["Auto-compounding", "Daily payouts", "BTC & ETH only", "Email support"],
    badge: null,
    desc: "Perfect for beginners. Low risk, steady daily returns.",
  },
  {
    id: "growth",
    name: "Growth",
    icon: Shield,
    color: "text-yellow-400",
    ringColor: "ring-yellow-400/50",
    borderColor: "border-yellow-500/40",
    bgGlow: "bg-yellow-400",
    btnBg: "bg-yellow-500 hover:bg-yellow-600",
    gradientFrom: "from-yellow-500/15",
    gradientTo: "to-yellow-500/5",
    minInvest: 5000,
    maxInvest: 24999,
    dailyReturn: "1.2%",
    dailyPct: 0.012,
    monthlyReturn: "36%",
    duration: "30 days",
    features: ["Auto-compounding", "Daily payouts", "Top 5 coins", "Priority support", "Portfolio analytics"],
    badge: "Most Popular",
    desc: "Our most popular plan for intermediate investors.",
  },
  {
    id: "pro",
    name: "Pro",
    icon: Rocket,
    color: "text-purple-400",
    ringColor: "ring-purple-500/40",
    borderColor: "border-purple-500/40",
    bgGlow: "bg-purple-500",
    btnBg: "bg-purple-600 hover:bg-purple-700",
    gradientFrom: "from-purple-500/15",
    gradientTo: "to-purple-500/5",
    minInvest: 25000,
    maxInvest: 99999,
    dailyReturn: "2.0%",
    dailyPct: 0.02,
    monthlyReturn: "60%",
    duration: "30 days",
    features: ["Auto-compounding", "Hourly payouts", "All 10+ coins", "24/7 support", "Advanced analytics", "Futures trading"],
    badge: "Best Value",
    desc: "Advanced features with high returns for serious traders.",
  },
  {
    id: "elite",
    name: "Elite",
    icon: Crown,
    color: "text-orange-400",
    ringColor: "ring-orange-500/40",
    borderColor: "border-orange-500/40",
    bgGlow: "bg-orange-500",
    btnBg: "bg-orange-500 hover:bg-orange-600",
    gradientFrom: "from-orange-500/15",
    gradientTo: "to-orange-500/5",
    minInvest: 100000,
    maxInvest: null,
    dailyReturn: "3.5%",
    dailyPct: 0.035,
    monthlyReturn: "105%",
    duration: "30 days",
    features: ["Auto-compounding", "Real-time payouts", "Unlimited coins", "Dedicated manager", "Institutional tools", "VIP withdrawals", "Custom strategies"],
    badge: "VIP",
    desc: "Institutional-grade returns with a dedicated account manager.",
  },
];

type Plan = typeof INVESTMENT_PLANS[0];

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
  const { data: markets, isLoading } = useGetMarketPrices({
    query: { refetchInterval: 5000, refetchOnWindowFocus: true },
  });
  const { data: portfolio } = useGetPortfolio();

  const [activeTab, setActiveTab] = useState<"plans" | "trade">("plans");
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
              Spot Trade
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
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
                <h2 className="text-xl font-bold">Markets</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search coin..."
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
                  <div className="relative z-10 flex-1">
                    <div className="flex items-center gap-4 mb-6">
                      <span className="text-4xl">{selectedCoin.icon}</span>
                      <div>
                        <h2 className="text-2xl font-bold leading-none">{selectedCoin.symbol}</h2>
                        <p className="text-muted-foreground">{selectedCoin.name}</p>
                      </div>
                    </div>
                    <div className="mb-8">
                      <div className="text-3xl font-bold text-foreground">{formatCurrency(selectedCoin.price, 2, 6)}</div>
                      <div className={cn("flex items-center gap-1 text-sm font-medium mt-1", selectedCoin.changePercent24h >= 0 ? "text-green-400" : "text-red-400")}>
                        {selectedCoin.changePercent24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {formatPercent(Math.abs(selectedCoin.changePercent24h))} Today
                      </div>
                    </div>
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
                      <Button type="submit" className={cn("w-full h-14 text-lg font-bold", tradeType === "buy" ? "bg-green-500 hover:bg-green-600 text-white" : "bg-red-500 hover:bg-red-600 text-white")} disabled={isPending || !watchUsdAmount}>
                        {isPending ? "Processing..." : `${tradeType === "buy" ? "Buy" : "Sell"} ${selectedCoin.symbol}`}
                      </Button>
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
