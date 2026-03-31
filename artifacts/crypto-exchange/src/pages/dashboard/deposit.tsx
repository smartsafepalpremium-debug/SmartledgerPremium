import { useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { useDeposit } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn, formatCurrency } from "@/lib/utils";
import {
  Copy, CheckCircle2, ArrowDownToLine, Clock, ShieldCheck,
  AlertTriangle, ChevronRight, Info, RefreshCw
} from "lucide-react";

const CRYPTO_NETWORKS = [
  {
    id: "btc",
    label: "Bitcoin",
    symbol: "BTC",
    icon: "₿",
    network: "Bitcoin Network",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    btnBg: "bg-orange-500/15 hover:bg-orange-500/25",
    address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    minDeposit: 0.0001,
    minUsd: "$5",
    confirmations: 3,
    time: "~30 min",
    memo: false,
  },
  {
    id: "eth",
    label: "Ethereum",
    symbol: "ETH",
    icon: "Ξ",
    network: "ERC-20",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    btnBg: "bg-blue-500/15 hover:bg-blue-500/25",
    address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    minDeposit: 0.001,
    minUsd: "$3",
    confirmations: 12,
    time: "~5 min",
    memo: false,
  },
  {
    id: "usdt_trc20",
    label: "USDT TRC-20",
    symbol: "USDT",
    icon: "₮",
    network: "Tron (TRC-20)",
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    btnBg: "bg-green-500/15 hover:bg-green-500/25",
    address: "TDsG7ND7s5e4oCKAE1kcHmzJEknxnUFAHY",
    minDeposit: 1,
    minUsd: "$1",
    confirmations: 20,
    time: "~2 min",
    memo: false,
  },
  {
    id: "usdt_erc20",
    label: "USDT ERC-20",
    symbol: "USDT",
    icon: "₮",
    network: "Ethereum (ERC-20)",
    color: "text-emerald-300",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/30",
    btnBg: "bg-emerald-400/15 hover:bg-emerald-400/25",
    address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    minDeposit: 1,
    minUsd: "$1",
    confirmations: 12,
    time: "~5 min",
    memo: false,
  },
  {
    id: "bnb",
    label: "BNB",
    symbol: "BNB",
    icon: "⬡",
    network: "BNB Smart Chain",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    btnBg: "bg-yellow-500/15 hover:bg-yellow-500/25",
    address: "bnb136ns6lfw4zs5hg4n85vdthaad7hq5m4gtkgf23",
    minDeposit: 0.01,
    minUsd: "$2",
    confirmations: 15,
    time: "~1 min",
    memo: false,
  },
  {
    id: "sol",
    label: "Solana",
    symbol: "SOL",
    icon: "◎",
    network: "Solana Network",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    btnBg: "bg-purple-500/15 hover:bg-purple-500/25",
    address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    minDeposit: 0.01,
    minUsd: "$1",
    confirmations: 32,
    time: "~30 sec",
    memo: false,
  },
  {
    id: "xrp",
    label: "XRP",
    symbol: "XRP",
    icon: "✕",
    network: "XRP Ledger",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
    btnBg: "bg-sky-500/15 hover:bg-sky-500/25",
    address: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
    minDeposit: 10,
    minUsd: "$5",
    confirmations: 1,
    time: "~5 sec",
    memo: true,
    memoValue: "104857600",
  },
  {
    id: "ltc",
    label: "Litecoin",
    symbol: "LTC",
    icon: "Ł",
    network: "Litecoin Network",
    color: "text-slate-300",
    bg: "bg-slate-500/10",
    border: "border-slate-500/30",
    btnBg: "bg-slate-500/15 hover:bg-slate-500/25",
    address: "LTdsVS8VDw6syvfQADdhf2PHAm3rMGJvPX",
    minDeposit: 0.01,
    minUsd: "$1",
    confirmations: 6,
    time: "~10 min",
    memo: false,
  },
  {
    id: "trx",
    label: "TRON",
    symbol: "TRX",
    icon: "⬤",
    network: "Tron Network",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    btnBg: "bg-red-500/15 hover:bg-red-500/25",
    address: "TDsG7ND7s5e4oCKAE1kcHmzJEknxnUFAHY",
    minDeposit: 100,
    minUsd: "$2",
    confirmations: 20,
    time: "~1 min",
    memo: false,
  },
  {
    id: "doge",
    label: "Dogecoin",
    symbol: "DOGE",
    icon: "Ð",
    network: "Dogecoin Network",
    color: "text-amber-300",
    bg: "bg-amber-400/10",
    border: "border-amber-400/30",
    btnBg: "bg-amber-400/15 hover:bg-amber-400/25",
    address: "DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L",
    minDeposit: 50,
    minUsd: "$3",
    confirmations: 6,
    time: "~5 min",
    memo: false,
  },
];

type Coin = typeof CRYPTO_NETWORKS[0];

export default function DepositPage() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Coin>(CRYPTO_NETWORKS[0]);
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [copiedMemo, setCopiedMemo] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [amount, setAmount] = useState("");
  const [success, setSuccess] = useState(false);
  const [submittedAmount, setSubmittedAmount] = useState(0);
  const [submittedCoin, setSubmittedCoin] = useState("");

  const { mutate, isPending } = useDeposit({
    mutation: {
      onSuccess: () => {
        setSuccess(true);
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
        setAmount("");
        setConfirmed(false);
      }
    }
  });

  const handleCopy = (text: string, which: "addr" | "memo") => {
    navigator.clipboard.writeText(text).catch(() => {});
    if (which === "addr") {
      setCopiedAddr(true);
      setTimeout(() => setCopiedAddr(false), 2000);
    } else {
      setCopiedMemo(true);
      setTimeout(() => setCopiedMemo(false), 2000);
    }
  };

  const handleConfirmSent = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) return;
    setSubmittedAmount(num);
    setSubmittedCoin(`${selected.label} (${selected.network})`);
    mutate({ data: { amount: num, method: selected.id, address: selected.address } });
  };

  if (success) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto py-16 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Deposit Received</h2>
            <p className="text-muted-foreground text-sm">Your deposit is being confirmed on-chain.</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-foreground mb-1">Deposit Details</h3>
            {[
              ["Amount",   formatCurrency(submittedAmount)],
              ["Network",  submittedCoin],
              ["Status",   "Awaiting Confirmations"],
              ["ETA",      selected.time],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-center text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0">
                <span className="text-muted-foreground">{label}</span>
                <span className={cn("font-semibold", label === "Status" ? "text-yellow-400" : "text-foreground")}>{value}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setSuccess(false)}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            Make Another Deposit
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-7">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <ArrowDownToLine className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Deposit Crypto</h1>
            <p className="text-sm text-muted-foreground">Select a coin and send to your unique deposit address</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left: coin list */}
          <div className="lg:col-span-2 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Select Coin</p>
            <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border max-h-[520px] overflow-y-auto">
              {CRYPTO_NETWORKS.map(coin => (
                <button
                  key={coin.id}
                  onClick={() => { setSelected(coin); setCopiedAddr(false); setCopiedMemo(false); setConfirmed(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all border-l-4",
                    selected.id === coin.id
                      ? `${coin.bg} ${coin.border}`
                      : "border-transparent hover:bg-secondary/30"
                  )}
                >
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold border shrink-0", coin.bg, coin.border, coin.color)}>
                    {coin.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-semibold truncate", selected.id === coin.id ? coin.color : "text-foreground")}>{coin.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{coin.network}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">{coin.time}</p>
                    <p className="text-xs text-muted-foreground">{coin.confirmations} conf.</p>
                  </div>
                  {selected.id === coin.id && <ChevronRight className={cn("w-4 h-4 shrink-0", coin.color)} />}
                </button>
              ))}
            </div>
          </div>

          {/* Right: address panel */}
          <div className="lg:col-span-3 space-y-4">

            {/* Coin header */}
            <div className={cn("flex items-center gap-3 px-5 py-4 rounded-2xl border", selected.bg, selected.border)}>
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold border", selected.bg, selected.border, selected.color)}>
                {selected.icon}
              </div>
              <div>
                <p className="font-bold text-foreground">{selected.label}</p>
                <p className="text-sm text-muted-foreground">{selected.network}</p>
              </div>
              <div className="ml-auto flex flex-col items-end gap-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {selected.time}</span>
                <span>{selected.confirmations} confirmations</span>
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2.5 bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3.5 text-xs">
              <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-muted-foreground">
                Only send <span className="text-foreground font-semibold">{selected.symbol}</span> on the <span className="text-foreground font-semibold">{selected.network}</span> network to this address. Sending any other coin or using a different network will result in permanent loss of funds.
              </p>
            </div>

            {/* Address card */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your {selected.symbol} Deposit Address</p>
                <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Active
                </span>
              </div>

              {/* QR-style block */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                {/* QR placeholder */}
                <div className={cn("w-28 h-28 shrink-0 rounded-xl border-2 flex items-center justify-center mx-auto sm:mx-0", selected.border, selected.bg)}>
                  <div className="grid grid-cols-5 gap-0.5 p-2 w-full h-full">
                    {Array.from({ length: 25 }).map((_, i) => {
                      const seed = selected.id.charCodeAt(i % selected.id.length) + i;
                      const filled = seed % 3 !== 0;
                      return (
                        <div
                          key={i}
                          className={cn("rounded-sm", filled ? selected.bg.replace("/10", "/60") : "bg-transparent")}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="flex-1 w-full space-y-2">
                  <div className={cn("bg-background border rounded-xl px-4 py-3 font-mono text-xs text-foreground break-all leading-relaxed", selected.border)}>
                    {selected.address}
                  </div>
                  <button
                    onClick={() => handleCopy(selected.address, "addr")}
                    className={cn(
                      "w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border",
                      copiedAddr
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : `${selected.btnBg} ${selected.border} ${selected.color}`
                    )}
                  >
                    {copiedAddr
                      ? <><CheckCircle2 className="w-4 h-4" /> Address Copied!</>
                      : <><Copy className="w-4 h-4" /> Copy Address</>
                    }
                  </button>
                </div>
              </div>

              {/* Memo / Destination Tag */}
              {selected.memo && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" /> Memo / Destination Tag Required
                  </div>
                  <p className="text-xs text-muted-foreground">You MUST include this memo/tag when sending or your deposit will be lost.</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-background border border-red-500/30 rounded-xl px-4 py-2.5 font-mono text-sm text-foreground font-bold">
                      {(selected as any).memoValue}
                    </div>
                    <button
                      onClick={() => handleCopy((selected as any).memoValue, "memo")}
                      className="p-2.5 rounded-xl border border-border bg-secondary hover:bg-border transition-colors"
                    >
                      {copiedMemo ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border text-center">
                {[
                  ["Min Deposit", selected.minUsd],
                  ["Confirmations", `${selected.confirmations}x`],
                  ["Est. Time", selected.time],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs text-muted-foreground mb-0.5">{k}</p>
                    <p className="text-sm font-bold text-foreground">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* I've sent section */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-primary" />
                <p className="text-sm font-bold text-foreground">Already sent? Confirm your deposit</p>
              </div>
              <p className="text-xs text-muted-foreground">After sending, enter the amount and click confirm. Your balance will be credited once the network confirms the transaction.</p>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount Sent ({selected.symbol})</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">{selected.icon}</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="any"
                    min="0"
                    className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3.5 text-base font-semibold text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer group">
                <div
                  onClick={() => setConfirmed(v => !v)}
                  className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
                    confirmed ? "bg-primary border-primary" : "border-border group-hover:border-primary/50"
                  )}
                >
                  {confirmed && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                </div>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  I confirm I have sent <span className="text-foreground font-semibold">{selected.symbol}</span> on the <span className="text-foreground font-semibold">{selected.network}</span> network to the address above.
                </span>
              </label>

              <button
                onClick={handleConfirmSent}
                disabled={isPending || !amount || !confirmed || parseFloat(amount) <= 0}
                className={cn(
                  "w-full py-3.5 rounded-xl text-sm font-bold transition-all",
                  isPending || !amount || !confirmed || parseFloat(amount) <= 0
                    ? "bg-secondary text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {isPending ? "Confirming..." : "Confirm Deposit"}
              </button>
            </div>

            {/* Security note */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: ShieldCheck, text: "Addresses are unique to your account and fully secured." },
                { icon: Info, text: "Minimum deposits below the threshold will not be credited." },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-2 bg-card border border-border rounded-xl p-3.5">
                  <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
