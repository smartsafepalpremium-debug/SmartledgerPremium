import { useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { Card, Button, Input } from "@/components/ui/shared";
import { useWithdraw } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const withdrawSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  method: z.string().default("bank_transfer"),
  address: z.string().min(5, "Destination account/address required"),
});

type WithdrawForm = z.infer<typeof withdrawSchema>;

export default function WithdrawPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState(false);

  const { mutate, isPending, error } = useWithdraw({
    mutation: {
      onSuccess: () => {
        setSuccess(true);
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
        reset();
      }
    }
  });

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<WithdrawForm>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: { method: "bank_transfer" }
  });

  const watchAmount = watch("amount");
  const maxAvailable = user?.usdBalance || 0;

  const onSubmit = (data: WithdrawForm) => {
    if (data.amount > maxAvailable) return;
    setSuccess(false);
    mutate({ data });
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Withdraw USD</h1>
          <p className="text-muted-foreground mt-1">Transfer funds to your bank account.</p>
        </div>

        <Card className="p-6 md:p-8">
          {success ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold font-display mb-2">Withdrawal Initiated</h2>
              <p className="text-muted-foreground mb-8">Your request is being processed. It may take 1-3 business days.</p>
              <Button onClick={() => setSuccess(false)} variant="outline">Make another withdrawal</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {error && (
                <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm flex items-start gap-2 border border-destructive/20">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{(error as any)?.message || "Failed to submit withdrawal."}</p>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground flex justify-between">
                  <span>Amount</span>
                  <span className="text-muted-foreground font-normal">Available: <span className="font-mono text-foreground">{formatCurrency(maxAvailable)}</span></span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-muted-foreground font-light">$</span>
                  <Input 
                    {...register("amount")} 
                    type="number" 
                    step="any"
                    placeholder="0.00" 
                    className="pl-10 text-2xl h-16 font-semibold"
                  />
                  <button 
                    type="button"
                    onClick={() => setValue("amount", maxAvailable, { shouldValidate: true })}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold bg-secondary hover:bg-border px-3 py-2 rounded-md transition-colors text-foreground"
                  >
                    MAX
                  </button>
                </div>
                {errors.amount && <p className="text-destructive text-sm">{errors.amount.message}</p>}
                {watchAmount > maxAvailable && <p className="text-destructive text-sm">Amount exceeds available balance.</p>}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground">Destination Account (IBAN/SWIFT)</label>
                <Input 
                  {...register("address")} 
                  placeholder="Enter account details..." 
                  className="h-14 bg-secondary/30"
                />
                {errors.address && <p className="text-destructive text-sm">{errors.address.message}</p>}
              </div>

              <div className="bg-secondary/50 p-4 rounded-xl space-y-2 text-sm mt-8">
                <div className="flex justify-between text-muted-foreground">
                  <span>Withdrawal Amount</span>
                  <span className="font-mono">{watchAmount ? formatCurrency(watchAmount) : "$0.00"}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Flat Fee</span>
                  <span className="font-mono">$25.00</span>
                </div>
                <div className="flex justify-between font-bold text-foreground border-t border-border/50 pt-2 mt-2">
                  <span>You Will Receive</span>
                  <span className="font-mono text-foreground">
                    {watchAmount && watchAmount > 25 ? formatCurrency(watchAmount - 25) : "$0.00"}
                  </span>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-bold mt-4" 
                disabled={isPending || !watchAmount || watchAmount > maxAvailable}
              >
                {isPending ? "Processing..." : "Withdraw Funds"}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
