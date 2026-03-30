import { DashboardLayout } from "@/components/layout";
import { Card, Button } from "@/components/ui/shared";
import { useGetPortfolio } from "@workspace/api-client-react";
import { formatCurrency, formatPercent, formatCrypto, cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Link } from "wouter";

const COLORS = ['#F0B90B', '#627EEA', '#0ECB81', '#14F195', '#00FFA3', '#8C8C8C', '#EAECEF'];

export default function PortfolioPage() {
  const { data: portfolio, isLoading } = useGetPortfolio();

  if (isLoading) {
    return <DashboardLayout><div className="text-center py-20 text-muted-foreground animate-pulse">Loading portfolio...</div></DashboardLayout>;
  }

  if (!portfolio) return null;

  const chartData = portfolio.holdings.map(h => ({
    name: h.symbol,
    value: h.currentValue
  })).filter(h => h.value > 0).sort((a,b) => b.value - a.value);

  // Add USD as part of portfolio chart if there's balance
  if (portfolio.usdBalance > 0) {
    chartData.push({ name: 'USD', value: portfolio.usdBalance });
  }

  const totalPnl = portfolio.holdings.reduce((sum, h) => sum + h.pnl, 0);
  const totalInvested = portfolio.holdings.reduce((sum, h) => sum + (h.avgBuyPrice * h.amount), 0);
  const totalPnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-display font-bold">My Portfolio</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 lg:col-span-2">
            <div className="flex flex-col sm:flex-row justify-between gap-6 mb-8">
              <div>
                <h3 className="text-muted-foreground font-medium mb-1">Total Balance</h3>
                <div className="text-4xl font-display font-bold mono-nums text-foreground">
                  {formatCurrency(portfolio.totalValue)}
                </div>
              </div>
              <div className="sm:text-right">
                <h3 className="text-muted-foreground font-medium mb-1">Total P&L</h3>
                <div className={cn(
                  "text-2xl font-display font-bold mono-nums",
                  totalPnl >= 0 ? "text-success" : "text-destructive"
                )}>
                  {totalPnl >= 0 ? "+" : ""}{formatCurrency(totalPnl)}
                  <span className="text-lg ml-2">({formatPercent(Math.abs(totalPnlPercent))})</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-border mb-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Fiat Balance</div>
                <div className="font-mono font-medium">{formatCurrency(portfolio.usdBalance)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Crypto Value</div>
                <div className="font-mono font-medium">{formatCurrency(portfolio.totalValue - portfolio.usdBalance)}</div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Link href="/dashboard/deposit"><Button variant="secondary">Deposit</Button></Link>
              <Link href="/dashboard/withdraw"><Button variant="outline">Withdraw</Button></Link>
            </div>
          </Card>

          <Card className="p-6 flex flex-col">
            <h3 className="text-lg font-display font-bold mb-4">Asset Allocation</h3>
            {chartData.length > 0 ? (
              <div className="flex-1 min-h-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: '#181A20', borderColor: '#2B3139', borderRadius: '8px' }}
                      itemStyle={{ color: '#EAECEF', fontFamily: 'monospace' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                No assets found
              </div>
            )}
          </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-display font-bold">Crypto Holdings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/30">
                <tr>
                  <th className="px-6 py-4 font-medium">Asset</th>
                  <th className="px-6 py-4 font-medium text-right">Balance</th>
                  <th className="px-6 py-4 font-medium text-right">Price</th>
                  <th className="px-6 py-4 font-medium text-right">Value</th>
                  <th className="px-6 py-4 font-medium text-right hidden md:table-cell">P&L</th>
                  <th className="px-6 py-4 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {portfolio.holdings.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">You don't hold any crypto yet.</td></tr>
                ) : portfolio.holdings.map((h) => {
                  const isPos = h.pnl >= 0;
                  return (
                    <tr key={h.symbol} className="hover:bg-secondary/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground">{h.coin}</div>
                        <div className="text-xs text-muted-foreground">{h.symbol}</div>
                      </td>
                      <td className="px-6 py-4 text-right mono-nums font-medium text-foreground">
                        {formatCrypto(h.amount, h.symbol)}
                      </td>
                      <td className="px-6 py-4 text-right mono-nums text-muted-foreground">
                        {formatCurrency(h.currentPrice)}
                      </td>
                      <td className="px-6 py-4 text-right mono-nums font-medium text-foreground">
                        {formatCurrency(h.currentValue)}
                      </td>
                      <td className={cn(
                        "px-6 py-4 text-right mono-nums hidden md:table-cell",
                        isPos ? "text-success" : "text-destructive"
                      )}>
                        <div>{isPos ? "+" : ""}{formatCurrency(h.pnl)}</div>
                        <div className="text-xs opacity-80">{formatPercent(Math.abs(h.pnlPercent))}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link href={`/dashboard/invest?symbol=${h.symbol}`}>
                          <Button size="sm" variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            Trade
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
