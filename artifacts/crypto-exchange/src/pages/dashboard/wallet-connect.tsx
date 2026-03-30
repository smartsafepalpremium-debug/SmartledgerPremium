import { useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { cn } from "@/lib/utils";
import {
  Shield, CheckCircle2, XCircle, Loader2, Link2, Unlink,
  AlertTriangle, Copy, ExternalLink, Wifi, Lock, ChevronRight, Info
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
    chains: ["Ethereum", "BNB Chain", "Solana"],
    popular: false,
  },
];

type WalletStatus = "idle" | "connecting" | "connected" | "error";

function fakeAddress(id: string) {
  const seed = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const chars = "0123456789abcdef";
  let addr = "0x";
  for (let i = 0; i < 40; i++) {
    addr += chars[(seed * (i + 7) * 31) % 16];
  }
  return addr;
}

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function WalletConnectPage() {
  const [walletStates, setWalletStates] = useState<Record<string, WalletStatus>>({});
  const [walletAddresses, setWalletAddresses] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeWalletModal, setActiveWalletModal] = useState<string | null>(null);

  const connectingId = Object.entries(walletStates).find(([, s]) => s === "connecting")?.[0];
  const connectedWallets = Object.entries(walletStates).filter(([, s]) => s === "connected");

  const handleConnect = (walletId: string) => {
    if (walletStates[walletId] === "connected") return;
    setActiveWalletModal(walletId);
    setWalletStates(prev => ({ ...prev, [walletId]: "connecting" }));

    setTimeout(() => {
      const success = Math.random() > 0.1;
      if (success) {
        setWalletStates(prev => ({ ...prev, [walletId]: "connected" }));
        setWalletAddresses(prev => ({ ...prev, [walletId]: fakeAddress(walletId) }));
      } else {
        setWalletStates(prev => ({ ...prev, [walletId]: "error" }));
      }
      setActiveWalletModal(null);
    }, 2200);
  };

  const handleDisconnect = (walletId: string) => {
    setWalletStates(prev => ({ ...prev, [walletId]: "idle" }));
    setWalletAddresses(prev => {
      const n = { ...prev };
      delete n[walletId];
      return n;
    });
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
      {/* Connecting Modal Overlay */}
      {activeWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-card border border-border rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl">
            {(() => {
              const w = WALLETS.find(x => x.id === activeWalletModal)!;
              return (
                <>
                  <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border", w.bgColor, w.borderColor)}>
                    {w.icon}
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">Connecting to {w.name}</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Please approve the connection request in your wallet app
                  </p>
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Waiting for approval...</span>
                  </div>
                  <div className="flex justify-center gap-1 mt-4">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-primary animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Wallet Connect</h1>
              <p className="text-sm text-muted-foreground">Link external wallets to your CryptoX account</p>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="flex items-start gap-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-yellow-400 mb-0.5">Security Notice</p>
            <p className="text-muted-foreground">
              CryptoX will never ask for your seed phrase or private key. Only connect wallets you own and trust.
              All connections are encrypted end-to-end using WalletConnect v2 protocol.
            </p>
          </div>
        </div>

        {/* Connected Wallets Summary */}
        {connectedWallets.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 mb-4">
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
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                    </span>
                    <button
                      onClick={() => handleCopy(id)}
                      className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                      title="Copy address"
                    >
                      {copiedId === id ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleDisconnect(id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-400"
                      title="Disconnect"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Popular Wallets */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
            Popular Wallets
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {popularWallets.map(wallet => {
              const status = walletStates[wallet.id] || "idle";
              const isConnected = status === "connected";
              const isConnecting = status === "connecting";
              const isError = status === "error";

              return (
                <div
                  key={wallet.id}
                  className={cn(
                    "relative rounded-2xl border p-5 transition-all duration-200 group",
                    isConnected
                      ? `${wallet.borderColor} ${wallet.bgColor}`
                      : "border-border bg-card hover:border-border/60 hover:bg-card/80"
                  )}
                >
                  {/* Connected badge */}
                  {isConnected && (
                    <div className="absolute top-3 right-3">
                      <span className="flex items-center gap-1 text-xs text-green-400 font-semibold bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        Live
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

                  {/* Chains */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {wallet.chains.map(c => (
                      <span key={c} className="text-xs bg-secondary/60 text-muted-foreground px-2 py-0.5 rounded-md">{c}</span>
                    ))}
                  </div>

                  {/* Address if connected */}
                  {isConnected && walletAddresses[wallet.id] && (
                    <div className="flex items-center justify-between bg-background/50 rounded-lg px-3 py-2 mb-3 text-xs font-mono text-muted-foreground">
                      <span>{shortenAddress(walletAddresses[wallet.id])}</span>
                      <button onClick={() => handleCopy(wallet.id)} className="hover:text-foreground transition-colors">
                        {copiedId === wallet.id ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  )}

                  {/* Error */}
                  {isError && (
                    <div className="flex items-center gap-2 text-xs text-red-400 mb-3 bg-red-500/10 rounded-lg px-3 py-2">
                      <XCircle className="w-3.5 h-3.5 shrink-0" />
                      Connection rejected. Try again.
                    </div>
                  )}

                  {/* CTA */}
                  {isConnected ? (
                    <button
                      onClick={() => handleDisconnect(wallet.id)}
                      className="w-full py-2.5 rounded-xl text-xs font-semibold border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
                    >
                      <Unlink className="w-3.5 h-3.5" /> Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(wallet.id)}
                      disabled={!!connectingId}
                      className={cn(
                        "w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                        isConnecting
                          ? "bg-secondary text-muted-foreground cursor-wait"
                          : isError
                            ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                            : `${wallet.bgColor} ${wallet.color} border ${wallet.borderColor} hover:opacity-80`
                      )}
                    >
                      {isConnecting ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Connecting...</>
                      ) : isError ? (
                        <><XCircle className="w-3.5 h-3.5" /> Retry</>
                      ) : (
                        <><Link2 className="w-3.5 h-3.5" /> Connect</>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Other Wallets */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground inline-block" />
            More Wallets
          </h2>
          <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
            {otherWallets.map(wallet => {
              const status = walletStates[wallet.id] || "idle";
              const isConnected = status === "connected";
              const isConnecting = status === "connecting";
              const isError = status === "error";

              return (
                <div key={wallet.id} className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/20 transition-colors">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xl border shrink-0", wallet.bgColor, wallet.borderColor)}>
                    {wallet.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{wallet.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{wallet.desc}</p>
                    {isConnected && walletAddresses[wallet.id] && (
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">{shortenAddress(walletAddresses[wallet.id])}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isConnected ? (
                      <>
                        <span className="flex items-center gap-1 text-xs text-green-400 font-medium hidden sm:flex">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                        </span>
                        <button
                          onClick={() => handleCopy(wallet.id)}
                          className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                        >
                          {copiedId === wallet.id ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDisconnect(wallet.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-400"
                        >
                          <Unlink className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleConnect(wallet.id)}
                        disabled={!!connectingId}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border",
                          isConnecting
                            ? "bg-secondary text-muted-foreground cursor-wait border-border"
                            : isError
                              ? "bg-red-500/10 text-red-400 border-red-500/30"
                              : `${wallet.bgColor} ${wallet.color} ${wallet.borderColor} hover:opacity-80`
                        )}
                      >
                        {isConnecting ? (
                          <><Loader2 className="w-3 h-3 animate-spin" /> Connecting</>
                        ) : isError ? (
                          <><XCircle className="w-3 h-3" /> Retry</>
                        ) : (
                          <><Link2 className="w-3 h-3" /> Connect</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security Info Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Lock, title: "End-to-End Encrypted", desc: "All wallet connections use WalletConnect v2 with AES-256 encryption." },
            { icon: Shield, title: "Non-Custodial", desc: "We never store your private keys or seed phrases. You stay in full control." },
            { icon: Info, title: "Read-Only by Default", desc: "Connections are read-only unless you explicitly approve a transaction." },
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
