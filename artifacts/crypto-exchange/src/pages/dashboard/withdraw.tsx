import { useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { useWithdraw } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { cn, formatCurrency } from "@/lib/utils";
import {
  CheckCircle2, AlertCircle, ChevronRight, Clock, Zap,
  Building2, ArrowUpFromLine, Copy, Info
} from "lucide-react";

const CRYPTO_METHODS = [
  { id: "btc",        label: "Bitcoin",       symbol: "BTC", icon: "₿",  network: "Bitcoin Network",   fee: 0.0005,  feeLabel: "0.0005 BTC", time: "~30 min",  color: "text-orange-400",  bg: "bg-orange-500/10", border: "border-orange-500/30" },
  { id: "eth",        label: "Ethereum",      symbol: "ETH", icon: "Ξ",  network: "ERC-20",             fee: 5,       feeLabel: "$5.00",      time: "~5 min",   color: "text-blue-400",    bg: "bg-blue-500/10",   border: "border-blue-500/30"   },
  { id: "usdt_trc20", label: "USDT TRC-20",   symbol: "USDT",icon: "₮",  network: "Tron (TRC-20)",     fee: 1,       feeLabel: "$1.00",      time: "~2 min",   color: "text-green-400",   bg: "bg-green-500/10",  border: "border-green-500/30"  },
  { id: "usdt_erc20", label: "USDT ERC-20",   symbol: "USDT",icon: "₮",  network: "Ethereum (ERC-20)", fee: 5,       feeLabel: "$5.00",      time: "~5 min",   color: "text-green-300",   bg: "bg-green-400/10",  border: "border-green-400/30"  },
  { id: "bnb",        label: "BNB",           symbol: "BNB", icon: "⬡",  network: "BNB Smart Chain",   fee: 0.5,     feeLabel: "$0.50",      time: "~1 min",   color: "text-yellow-400",  bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  { id: "sol",        label: "Solana",        symbol: "SOL", icon: "◎",  network: "Solana Network",    fee: 0.1,     feeLabel: "$0.10",      time: "~30 sec",  color: "text-purple-400",  bg: "bg-purple-500/10", border: "border-purple-500/30" },
  { id: "xrp",        label: "XRP",           symbol: "XRP", icon: "✕",  network: "XRP Ledger",        fee: 0.2,     feeLabel: "$0.20",      time: "~5 sec",   color: "text-sky-400",     bg: "bg-sky-500/10",    border: "border-sky-500/30"    },
  { id: "ltc",        label: "Litecoin",      symbol: "LTC", icon: "Ł",  network: "Litecoin Network",  fee: 0.3,     feeLabel: "$0.30",      time: "~10 min",  color: "text-slate-300",   bg: "bg-slate-500/10",  border: "border-slate-500/30"  },
  { id: "trx",        label: "TRON",          symbol: "TRX", icon: "⬤",  network: "Tron Network",      fee: 0.1,     feeLabel: "$0.10",      time: "~1 min",   color: "text-red-400",     bg: "bg-red-500/10",    border: "border-red-500/30"    },
  { id: "doge",       label: "Dogecoin",      symbol: "DOGE",icon: "Ð",  network: "Dogecoin Network",  fee: 5,       feeLabel: "5 DOGE",     time: "~5 min",   color: "text-amber-300",   bg: "bg-amber-400/10",  border: "border-amber-400/30"  },
];

const FIAT_METHODS = [
  { id: "bank",  label: "Bank Transfer",  icon: Building2, desc: "Standard ACH / SEPA transfer",  fee: 25, feeLabel: "$25.00", time: "1–3 business days", fields: ["Account Name", "Account Number", "Routing / Sort Code", "Bank Name"] },
  { id: "wire",  label: "Wire Transfer",  icon: Zap,       desc: "International SWIFT / WIRE",      fee: 45, feeLabel: "$45.00", time: "1–2 business days", fields: ["Beneficiary Name", "IBAN / Account Number", "SWIFT / BIC Code", "Bank Address"] },
];

type Tab = "crypto" | "fiat";

function FieldInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={`Enter ${label.toLowerCase()}...`}
        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
      />
    </div>
  );
}

export default function WithdrawPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("crypto");
  const [selectedCrypto, setSelectedCrypto] = useState(CRYPTO_METHODS[0]);
  const [selectedFiat, setSelectedFiat] = useState(FIAT_METHODS[0]);
  const [amount, setAmount] = useState("");
  const [cryptoAddress, setCryptoAddress] = useState("");
  const [fiatFields, setFiatFields] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [copied, setCopied] = useState(false);

  const { mutate, isPending, error } = useWithdraw({
    mutation: {
      onSuccess: () => {
        setSuccess(true);
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
        setAmount("");
        setCryptoAddress("");
        setFiatFields({});
      }
    }
  });

  const maxAvailable = user?.usdBalance ?? 0;
  const numAmount = parseFloat(amount) || 0;
  const fee = tab === "crypto" ? selectedCrypto.fee : selectedFiat.fee;
  const receive = numAmount > fee ? numAmount - fee : 0;
  const overBalance = numAmount > maxAvailable;

  const handleSubmit = () => {
    setFieldError("");
    if (!numAmount || numAmount <= 0) { setFieldError("Enter a valid amount."); return; }
    if (overBalance) { setFieldError("Amount exceeds your available balance."); return; }
    if (numAmount <= fee) { setFieldError(`Amount must be greater than the fee (${tab === "crypto" ? selectedCrypto.feeLabel : selectedFiat.feeLabel}).`); return; }

    if (tab === "crypto") {
      if (!cryptoAddress.trim()) { setFieldError("Enter a valid wallet address."); return; }
      mutate({ data: { amount: numAmount, method: selectedCrypto.id, address: cryptoAddress.trim() } });
    } else {
      const method = selectedFiat;
      const missing = method.fields.find(f => !fiatFields[f]?.trim());
      if (missing) { setFieldError(`Please fill in: ${missing}`); return; }
      mutate({ data: { amount: numAmount, method: method.id, address: Object.values(fiatFields).join(" | ") } });
    }
  };

  const handleCopyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (success) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto text-center py-20 space-y-5">
          <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Withdrawal Submitted</h2>
          <p className="text-muted-foreground text-sm">
            Your withdrawal of <span className="text-foreground font-semibold">{formatCurrency(numAmount)}</span> has been submitted and is being processed.
            Estimated arrival: <span className="text-foreground font-semibold">{tab === "crypto" ? selectedCrypto.time : selectedFiat.time}</span>.
          </p>
          <button onClick={() => setSuccess(false)} className="px-6 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-secondary transition-colors">
            Make another withdrawal
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-7">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <ArrowUpFromLine className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Withdraw</h1>
            <p className="text-sm text-muted-foreground">
              Available: <span className="text-foreground font-mono font-semibold">{formatCurrency(maxAvailable)}</span>
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-card border border-border p-1 rounded-xl gap-1 w-fit">
          {(["crypto", "fiat"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setFieldError(""); }}
              className={cn(
                "px-5 py-2.5 rounded-lg text-sm font-semibold transition-all",
                tab === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "crypto" ? "Crypto Withdrawal" : "Bank / Wire Transfer"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left: method selector */}
          <div className="lg:col-span-2 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {tab === "crypto" ? "Select Network" : "Transfer Method"}
            </p>

            {tab === "crypto" && (
              <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border max-h-[480px] overflow-y-auto">
                {CRYPTO_METHODS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedCrypto(m); setFieldError(""); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all",
                      selectedCrypto.id === m.id ? `${m.bg} ${m.border} border-l-4` : "hover:bg-secondary/30 border-l-4 border-transparent"
                    )}
                  >
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg border", m.bg, m.border, m.color)}>
                      {m.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-semibold", selectedCrypto.id === m.id ? m.color : "text-foreground")}>{m.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.network}</p>
                    </div>
                    {selectedCrypto.id === m.id && <ChevronRight className={cn("w-4 h-4 shrink-0", m.color)} />}
                  </button>
                ))}
              </div>
            )}

            {tab === "fiat" && (
              <div className="space-y-3">
                {FIAT_METHODS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedFiat(m); setFiatFields({}); setFieldError(""); }}
                    className={cn(
                      "w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition-all",
                      selectedFiat.id === m.id
                        ? "border-primary/50 bg-primary/5"
                        : "border-border bg-card hover:border-border/60 hover:bg-secondary/20"
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", selectedFiat.id === m.id ? "bg-primary/10 border border-primary/30" : "bg-secondary border border-border")}>
                      <m.icon className={cn("w-5 h-5", selectedFiat.id === m.id ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{m.label}</p>
                      <p className="text-xs text-muted-foreground">{m.desc}</p>
                      <p className="text-xs text-muted-foreground mt-1">Fee: {m.feeLabel} · {m.time}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: form */}
          <div className="lg:col-span-3 space-y-5">
            <div className="bg-card border border-border rounded-2xl p-5 space-y-5">

              {/* Selected method info banner */}
              {tab === "crypto" && (
                <div className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border text-sm", selectedCrypto.bg, selectedCrypto.border)}>
                  <span className={cn("text-xl font-bold", selectedCrypto.color)}>{selectedCrypto.icon}</span>
                  <div>
                    <span className="font-semibold text-foreground">{selectedCrypto.label}</span>
                    <span className="text-muted-foreground"> · {selectedCrypto.network}</span>
                  </div>
                  <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" /> {selectedCrypto.time}
                  </div>
                </div>
              )}

              {/* Amount */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex justify-between">
                  <span>Amount (USD)</span>
                  <button onClick={() => setAmount(String(maxAvailable))} className="text-primary hover:text-primary/80 font-bold transition-colors">MAX</button>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-muted-foreground">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => { setAmount(e.target.value); setFieldError(""); }}
                    placeholder="0.00"
                    step="any"
                    min="0"
                    className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-4 text-xl font-semibold text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  />
                </div>
                {overBalance && <p className="text-xs text-red-400">Amount exceeds available balance.</p>}
                <div className="flex gap-2">
                  {[25, 50, 75, 100].map(pct => (
                    <button
                      key={pct}
                      onClick={() => setAmount(String(+(maxAvailable * pct / 100).toFixed(2)))}
                      className="flex-1 py-1.5 rounded-lg bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-border transition-all"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Crypto: wallet address */}
              {tab === "crypto" && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {selectedCrypto.label} Wallet Address
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cryptoAddress}
                      onChange={e => { setCryptoAddress(e.target.value); setFieldError(""); }}
                      placeholder={`Paste your ${selectedCrypto.symbol} address here...`}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3.5 pr-10 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
                    />
                    {cryptoAddress && (
                      <button onClick={() => handleCopyAddress(cryptoAddress)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="w-3 h-3" /> Only send to a <span className="font-semibold text-foreground">{selectedCrypto.network}</span> address. Wrong network = lost funds.
                  </p>
                </div>
              )}

              {/* Fiat: bank fields */}
              {tab === "fiat" && (
                <div className="space-y-3">
                  {selectedFiat.fields.map(f => (
                    <FieldInput
                      key={f}
                      label={f}
                      value={fiatFields[f] || ""}
                      onChange={v => setFiatFields(prev => ({ ...prev, [f]: v }))}
                    />
                  ))}
                </div>
              )}

              {/* Fee breakdown */}
              <div className="bg-secondary/40 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Withdrawal Amount</span>
                  <span className="font-mono">{numAmount > 0 ? formatCurrency(numAmount) : "—"}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Network / Processing Fee</span>
                  <span className="font-mono text-red-400">− {tab === "crypto" ? selectedCrypto.feeLabel : selectedFiat.feeLabel}</span>
                </div>
                <div className="flex justify-between font-bold text-foreground border-t border-border pt-2">
                  <span>You Will Receive</span>
                  <span className="font-mono text-green-400">{receive > 0 ? formatCurrency(receive) : "—"}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
                  <Clock className="w-3 h-3" />
                  Estimated: {tab === "crypto" ? selectedCrypto.time : selectedFiat.time}
                </div>
              </div>

              {(error || fieldError) && (
                <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{fieldError || (error as any)?.message || "Withdrawal failed. Please try again."}</span>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={isPending || !numAmount || overBalance}
                className={cn(
                  "w-full py-4 rounded-xl text-sm font-bold transition-all",
                  isPending || !numAmount || overBalance
                    ? "bg-secondary text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {isPending ? "Processing..." : `Withdraw ${numAmount > 0 ? formatCurrency(numAmount) : ""}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
