import { useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { Card, Button, Input } from "@/components/ui/shared";
import { useAuth } from "@/hooks/use-auth";
import { useGetMarketPrices, useBuyCrypto, useSellCrypto, useGetPortfolio } from "@workspace/api-client-react";
import { formatCurrency, formatPercent, cn, formatCrypto } from "@/lib/utils";
import { Search, TrendingUp, TrendingDown } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";

const tradeSchema = z.object({
  usdAmount: z.coerce.number().positive("Amount must be positive"),
});

export default function InvestPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: markets, isLoading } = useGetMarketPrices();
  const { data: portfolio } = useGetPortfolio();
  
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

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<{usdAmount: number}>({
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

  const onTradeSubmit = (data: {usdAmount: number}) => {
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
      <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-120px)]">
        
        {/* Markets List (Left Side) */}
        <div className="flex-1 flex flex-col min-h-0 bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border space-y-4">
            <h2 className="text-xl font-display font-bold">Markets</h2>
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
                      <td className="px-4 py-4 text-right mono-nums font-medium">
                        {formatCurrency(coin.price, 2, 6)}
                      </td>
                      <td className={cn(
                        "px-4 py-4 text-right mono-nums",
                        isPos ? "text-success" : "text-destructive"
                      )}>
                        {formatPercent(Math.abs(coin.changePercent24h))}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trade Panel (Right Side) */}
        <div className="w-full lg:w-[400px] shrink-0">
          {selectedCoin ? (
            <Card className="p-6 h-full flex flex-col relative overflow-hidden">
              {/* Background gradient hint based on price action */}
              <div className={cn(
                "absolute top-0 right-0 w-64 h-64 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none opacity-20",
                selectedCoin.changePercent24h >= 0 ? "bg-success" : "bg-destructive"
              )} />
              
              <div className="relative z-10 flex-1">
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-4xl">{selectedCoin.icon}</span>
                  <div>
                    <h2 className="text-2xl font-display font-bold leading-none">{selectedCoin.symbol}</h2>
                    <p className="text-muted-foreground">{selectedCoin.name}</p>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="text-3xl font-display font-bold mono-nums text-foreground">
                    {formatCurrency(selectedCoin.price, 2, 6)}
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 text-sm font-medium mt-1",
                    selectedCoin.changePercent24h >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {selectedCoin.changePercent24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {formatPercent(Math.abs(selectedCoin.changePercent24h))} Today
                  </div>
                </div>

                {/* Trade Tabs */}
                <div className="flex bg-secondary p-1 rounded-xl mb-6">
                  <button 
                    onClick={() => { setTradeType("buy"); setTradeSuccess(null); }}
                    className={cn(
                      "flex-1 py-2 text-sm font-semibold rounded-lg transition-all",
                      tradeType === "buy" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >Buy</button>
                  <button 
                    onClick={() => { setTradeType("sell"); setTradeSuccess(null); }}
                    className={cn(
                      "flex-1 py-2 text-sm font-semibold rounded-lg transition-all",
                      tradeType === "sell" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >Sell</button>
                </div>

                <form onSubmit={handleSubmit(onTradeSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount (USD)</span>
                      <span className="text-muted-foreground">
                        Available: <span className="font-medium text-foreground mono-nums">
                          {formatCurrency(tradeType === "buy" ? maxBuy : maxSell)}
                        </span>
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">$</span>
                      <Input 
                        {...register("usdAmount")} 
                        placeholder="0.00" 
                        className="pl-8 pr-16 text-lg h-14"
                        type="number"
                        step="any"
                      />
                      <button 
                        type="button"
                        onClick={() => setValue("usdAmount", tradeType === "buy" ? maxBuy : maxSell)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold bg-secondary hover:bg-border px-2 py-1 rounded-md transition-colors"
                      >
                        MAX
                      </button>
                    </div>
                    {errors.usdAmount && <p className="text-destructive text-sm">{errors.usdAmount.message}</p>}
                    
                    {/* Est. output */}
                    {watchUsdAmount > 0 && !errors.usdAmount && (
                      <div className="text-sm text-center p-3 bg-secondary/50 rounded-lg mt-2">
                        ≈ <span className="font-mono font-medium text-foreground">{formatCrypto(watchUsdAmount / selectedCoin.price, selectedCoin.symbol)}</span>
                      </div>
                    )}
                  </div>

                  {tradeSuccess && <div className="text-success text-sm text-center p-2 bg-success/10 rounded-lg font-medium">{tradeSuccess}</div>}
                  {tradeError && <div className="text-destructive text-sm text-center p-2 bg-destructive/10 rounded-lg font-medium">{tradeError}</div>}

                  <Button 
                    type="submit" 
                    className="w-full h-14 text-lg font-bold"
                    variant={tradeType === "buy" ? "success" : "destructive"}
                    disabled={isPending || !watchUsdAmount}
                  >
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
    </DashboardLayout>
  );
}
