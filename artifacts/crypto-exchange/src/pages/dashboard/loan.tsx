import { useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Landmark, CheckCircle2, AlertCircle, Clock, TrendingDown,
  ShieldCheck, Percent, ChevronRight, Info, BadgeDollarSign, X
} from "lucide-react";

const LOAN_PLANS = [
  {
    id: "micro",
    label: "Micro Loan",
    range: [100, 2500],
    apr: 8.5,
    terms: [7, 14, 30],
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
    badge: null,
    desc: "Quick small loans for short-term needs",
  },
  {
    id: "standard",
    label: "Standard Loan",
    range: [2500, 25000],
    apr: 12.0,
    terms: [30, 60, 90],
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/30",
    badge: "Most Popular",
    desc: "Flexible mid-range loans with competitive rates",
  },
  {
    id: "premium",
    label: "Premium Loan",
    range: [25000, 100000],
    apr: 6.5,
    terms: [90, 180, 365],
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    badge: "Best Rate",
    desc: "Large-scale financing at our lowest APR",
  },
  {
    id: "elite",
    label: "Elite Loan",
    range: [100000, 500000],
    apr: 4.9,
    terms: [180, 365, 730],
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    badge: "Institutional",
    desc: "Institutional-grade credit with dedicated support",
  },
];

const COLLATERAL = [
  { id: "btc",  label: "Bitcoin (BTC)",  ltv: 70, icon: "₿",  color: "text-orange-400" },
  { id: "eth",  label: "Ethereum (ETH)", ltv: 65, icon: "Ξ",  color: "text-blue-400"   },
  { id: "bnb",  label: "BNB",            ltv: 60, icon: "⬡",  color: "text-yellow-400" },
  { id: "usdt", label: "USDT",           ltv: 85, icon: "₮",  color: "text-green-400"  },
  { id: "sol",  label: "Solana (SOL)",   ltv: 55, icon: "◎",  color: "text-purple-400" },
];

type ActiveLoan = {
  id: string;
  plan: string;
  amount: number;
  apr: number;
  termDays: number;
  startDate: string;
  repayAmount: number;
  collateral: string;
  dueDate: string;
};

function calcRepay(amount: number, apr: number, days: number) {
  return +(amount + amount * (apr / 100) * (days / 365)).toFixed(2);
}

function calcSchedule(amount: number, apr: number, days: number) {
  const repay = calcRepay(amount, apr, days);
  const periods = Math.min(days <= 30 ? days : days <= 90 ? Math.ceil(days / 7) : Math.ceil(days / 30), 12);
  const perPeriod = +(repay / periods).toFixed(2);
  const label = days <= 14 ? "day" : days <= 90 ? "week" : "month";
  return { repay, perPeriod, periods, label };
}

export default function LoanPage() {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(LOAN_PLANS[1]);
  const [loanAmount, setLoanAmount] = useState(5000);
  const [termDays, setTermDays] = useState(30);
  const [collateral, setCollateral] = useState(COLLATERAL[0]);
  const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([]);
  const [success, setSuccess] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [repayId, setRepayId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const { repay, perPeriod, periods, label } = calcSchedule(loanAmount, selectedPlan.apr, termDays);
  const dailyInterest = +(loanAmount * (selectedPlan.apr / 100) / 365).toFixed(4);
  const totalInterest = +(repay - loanAmount).toFixed(2);
  const [min, max] = selectedPlan.range;

  const clampedAmount = Math.min(Math.max(loanAmount, min), max);
  const sliderPct = ((clampedAmount - min) / (max - min)) * 100;

  const handleApply = () => {
    setError("");
    if (loanAmount < min || loanAmount > max) {
      setError(`Loan amount must be between ${formatCurrency(min)} and ${formatCurrency(max)}.`);
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    const now = new Date();
    const due = new Date(now);
    due.setDate(due.getDate() + termDays);
    const loan: ActiveLoan = {
      id: Math.random().toString(36).slice(2, 8).toUpperCase(),
      plan: selectedPlan.label,
      amount: loanAmount,
      apr: selectedPlan.apr,
      termDays,
      startDate: now.toLocaleDateString(),
      repayAmount: repay,
      collateral: collateral.label,
      dueDate: due.toLocaleDateString(),
    };
    setActiveLoans(prev => [loan, ...prev]);
    setConfirmOpen(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
  };

  const handleRepay = (id: string) => {
    setActiveLoans(prev => prev.filter(l => l.id !== id));
    setRepayId(null);
  };

  return (
    <DashboardLayout>
      {/* Confirm Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmOpen(false)} />
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground text-lg">Confirm Loan</h3>
              <button onClick={() => setConfirmOpen(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5 text-sm">
              {[
                ["Plan", selectedPlan.label],
                ["Loan Amount", formatCurrency(loanAmount)],
                ["APR", `${selectedPlan.apr}%`],
                ["Term", `${termDays} days`],
                ["Collateral", collateral.label],
                ["Total Repayment", formatCurrency(repay)],
                ["Due Date", (() => { const d = new Date(); d.setDate(d.getDate() + termDays); return d.toLocaleDateString(); })()],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-semibold text-foreground">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2 bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3 text-xs text-muted-foreground">
              <Info className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              By confirming, you agree to repay {formatCurrency(repay)} by the due date. Failure to repay may result in collateral liquidation.
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setConfirmOpen(false)} className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-secondary transition-colors">
                Cancel
              </button>
              <button onClick={handleConfirm} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors">
                Confirm Loan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Repay Modal */}
      {repayId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setRepayId(null)} />
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            {(() => {
              const loan = activeLoans.find(l => l.id === repayId);
              if (!loan) return null;
              return (
                <>
                  <h3 className="font-bold text-foreground text-lg">Repay Loan #{loan.id}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Original Amount</span><span className="font-semibold">{formatCurrency(loan.amount)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Total Repayment</span><span className="font-bold text-foreground">{formatCurrency(loan.repayAmount)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Due Date</span><span className="font-semibold">{loan.dueDate}</span></div>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setRepayId(null)} className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-secondary transition-colors">Cancel</button>
                    <button onClick={() => handleRepay(repayId)} className="flex-1 py-3 rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-green-500/90 transition-colors">Repay Now</button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      <div className="max-w-4xl space-y-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Landmark className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Crypto Loans</h1>
            <p className="text-sm text-muted-foreground">Borrow against your crypto holdings — no credit check required</p>
          </div>
        </div>

        {success && (
          <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-sm text-green-400 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> Loan approved! Funds have been credited to your account.
          </div>
        )}

        {/* Active Loans */}
        {activeLoans.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" /> Active Loans
            </h2>
            <div className="space-y-3">
              {activeLoans.map(loan => (
                <div key={loan.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold bg-primary/15 text-primary border border-primary/25 px-2 py-0.5 rounded-full">#{loan.id}</span>
                      <span className="text-sm font-semibold text-foreground">{loan.plan}</span>
                      <span className="text-xs text-green-400 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Active
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      {[
                        ["Borrowed", formatCurrency(loan.amount)],
                        ["Repayment", formatCurrency(loan.repayAmount)],
                        ["APR", `${loan.apr}%`],
                        ["Due", loan.dueDate],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <p className="text-muted-foreground">{k}</p>
                          <p className="font-semibold text-foreground">{v}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Collateral: <span className="text-foreground font-medium">{loan.collateral}</span></p>
                  </div>
                  <button
                    onClick={() => setRepayId(loan.id)}
                    className="shrink-0 px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-bold hover:bg-green-500/20 transition-all"
                  >
                    Repay Loan
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plan selector */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Loan Plan</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {LOAN_PLANS.map(plan => (
              <button
                key={plan.id}
                onClick={() => {
                  setSelectedPlan(plan);
                  setLoanAmount(plan.range[0]);
                  setTermDays(plan.terms[0]);
                  setError("");
                }}
                className={cn(
                  "relative text-left p-4 rounded-2xl border transition-all",
                  selectedPlan.id === plan.id ? `${plan.bg} ${plan.border}` : "border-border bg-card hover:border-border/60 hover:bg-secondary/20"
                )}
              >
                {plan.badge && (
                  <span className={cn("absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full border", plan.bg, plan.border, plan.color)}>
                    {plan.badge}
                  </span>
                )}
                <Percent className={cn("w-5 h-5 mb-2", selectedPlan.id === plan.id ? plan.color : "text-muted-foreground")} />
                <p className="text-sm font-bold text-foreground">{plan.label}</p>
                <p className={cn("text-xl font-extrabold", plan.color)}>{plan.apr}% <span className="text-xs font-semibold text-muted-foreground">APR</span></p>
                <p className="text-xs text-muted-foreground mt-1">{formatCurrency(plan.range[0])} – {formatCurrency(plan.range[1])}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left: configurator */}
          <div className="lg:col-span-3 bg-card border border-border rounded-2xl p-6 space-y-6">
            <h2 className="font-bold text-foreground">Configure Your Loan</h2>

            {/* Amount slider */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-foreground">Loan Amount</span>
                <span className="font-mono font-bold text-primary text-lg">{formatCurrency(loanAmount)}</span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={min < 2500 ? 100 : min < 25000 ? 500 : 1000}
                value={loanAmount}
                onChange={e => { setLoanAmount(Number(e.target.value)); setError(""); }}
                className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(min)}</span>
                <span>{formatCurrency(max)}</span>
              </div>
              <div className="flex gap-2 mt-1">
                {[25, 50, 75, 100].map(pct => (
                  <button
                    key={pct}
                    onClick={() => setLoanAmount(Math.round(min + (max - min) * pct / 100))}
                    className="flex-1 py-1.5 rounded-lg bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-border transition-all"
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Term selector */}
            <div className="space-y-2">
              <span className="text-sm font-semibold text-foreground">Loan Term</span>
              <div className="grid grid-cols-3 gap-2">
                {selectedPlan.terms.map(t => (
                  <button
                    key={t}
                    onClick={() => setTermDays(t)}
                    className={cn(
                      "py-2.5 rounded-xl text-sm font-semibold border transition-all",
                      termDays === t ? `${selectedPlan.bg} ${selectedPlan.border} ${selectedPlan.color}` : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t >= 365 ? `${t / 365}yr` : t >= 30 ? `${t / 30}mo` : `${t}d`}
                  </button>
                ))}
              </div>
            </div>

            {/* Collateral */}
            <div className="space-y-2">
              <span className="text-sm font-semibold text-foreground">Collateral Asset</span>
              <div className="grid grid-cols-5 gap-2">
                {COLLATERAL.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCollateral(c)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-semibold transition-all",
                      collateral.id === c.id ? "border-primary/50 bg-primary/5 text-primary" : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className={cn("text-xl", c.color)}>{c.icon}</span>
                    <span>{c.id.toUpperCase()}</span>
                    <span className="text-[10px] text-muted-foreground">{c.ltv}% LTV</span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <button
              onClick={handleApply}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all"
            >
              Apply for Loan
            </button>
          </div>

          {/* Right: summary */}
          <div className="lg:col-span-2 space-y-4">
            {/* Loan summary */}
            <div className={cn("rounded-2xl border p-5 space-y-3", selectedPlan.bg, selectedPlan.border)}>
              <h3 className="font-bold text-foreground text-sm">Loan Summary</h3>
              {[
                ["Principal", formatCurrency(loanAmount)],
                ["APR", `${selectedPlan.apr}%`],
                ["Term", `${termDays} days`],
                ["Interest", formatCurrency(totalInterest)],
                ["Total Repayment", formatCurrency(repay)],
                [`Per ${label}`, formatCurrency(perPeriod)],
              ].map(([k, v], i) => (
                <div key={k} className={cn("flex justify-between text-sm", i === 4 ? "border-t border-border pt-2 font-bold" : "")}>
                  <span className={i === 4 ? "text-foreground" : "text-muted-foreground"}>{k}</span>
                  <span className={cn("font-mono", i === 4 ? `font-extrabold ${selectedPlan.color}` : "text-foreground")}>{v}</span>
                </div>
              ))}
            </div>

            {/* Benefits */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-foreground">Why CryptoX Loans?</h3>
              {[
                { icon: ShieldCheck, text: "No credit check — collateral based" },
                { icon: BadgeDollarSign, text: "Funds disbursed instantly upon approval" },
                { icon: Clock, text: "Flexible repayment — early repay with no penalty" },
                { icon: TrendingDown, text: "Competitive rates starting at 4.9% APR" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <Icon className="w-4 h-4 text-primary shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>

            {/* Repayment schedule preview */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-foreground">Repayment Preview</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {Array.from({ length: Math.min(periods, 6) }).map((_, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{label.charAt(0).toUpperCase() + label.slice(1)} {i + 1}</span>
                    <span className="font-mono text-foreground font-semibold">{formatCurrency(perPeriod)}</span>
                  </div>
                ))}
                {periods > 6 && (
                  <p className="text-xs text-muted-foreground text-center">+{periods - 6} more payments...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
