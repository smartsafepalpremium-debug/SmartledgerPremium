import { DashboardLayout } from "@/components/layout";
import { Card } from "@/components/ui/shared";
import { useGetTransactions } from "@workspace/api-client-react";
import { formatCurrency, formatCrypto, cn } from "@/lib/utils";
import { format } from "date-fns";
import { ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft } from "lucide-react";

export default function TransactionsPage() {
  const { data: transactions, isLoading } = useGetTransactions();

  if (isLoading) {
    return <DashboardLayout><div className="text-center py-20 text-muted-foreground animate-pulse">Loading history...</div></DashboardLayout>;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownToLine className="w-5 h-5 text-success" />;
      case 'withdraw': return <ArrowUpFromLine className="w-5 h-5 text-destructive" />;
      default: return <ArrowRightLeft className="w-5 h-5 text-primary" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-success bg-success/10 border-success/20';
      case 'pending': return 'text-primary bg-primary/10 border-primary/20';
      case 'failed': return 'text-destructive bg-destructive/10 border-destructive/20';
      default: return 'text-muted-foreground bg-secondary';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-display font-bold">Transaction History</h1>
        
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/30">
                <tr>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Asset</th>
                  <th className="px-6 py-4 font-medium text-right">Amount</th>
                  <th className="px-6 py-4 font-medium text-right hidden sm:table-cell">Value (USD)</th>
                  <th className="px-6 py-4 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {!transactions || transactions.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">No transactions found.</td></tr>
                ) : transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                          {getIcon(t.type)}
                        </div>
                        <span className="font-semibold text-foreground capitalize">{t.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      {format(new Date(t.createdAt), "MMM d, yyyy HH:mm")}
                    </td>
                    <td className="px-6 py-4">
                      {t.symbol ? (
                        <div className="font-medium text-foreground">{t.symbol}</div>
                      ) : (
                        <div className="text-muted-foreground">USD</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right mono-nums font-medium text-foreground">
                      {t.symbol && t.amount ? formatCrypto(t.amount, t.symbol) : formatCurrency(t.usdAmount)}
                    </td>
                    <td className="px-6 py-4 text-right mono-nums text-muted-foreground hidden sm:table-cell">
                      {formatCurrency(t.usdAmount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                        getStatusColor(t.status)
                      )}>
                        <span className="capitalize">{t.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
