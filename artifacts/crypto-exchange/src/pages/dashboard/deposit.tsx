import { useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { Card, Button, Input } from "@/components/ui/shared";
import { useDeposit } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building, CreditCard, Wallet, CheckCircle2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

const depositSchema = z.object({
  amount: z.coerce.number().min(10, "Minimum deposit is $10").max(100000, "Maximum limit reached"),
  method: z.string().min(1, "Please select a method"),
});

type DepositForm = z.infer<typeof depositSchema>;

export default function DepositPage() {
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState(false);

  const { mutate, isPending } = useDeposit({
    mutation: {
      onSuccess: () => {
        setSuccess(true);
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
        reset();
      }
    }
  });

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<DepositForm>({
    resolver: zodResolver(depositSchema),
    defaultValues: { method: "bank_transfer" }
  });

  const selectedMethod = watch("method");
  const watchAmount = watch("amount");

  const onSubmit = (data: DepositForm) => {
    setSuccess(false);
    mutate({ data });
  };

  const methods = [
    { id: "bank_transfer", name: "Bank Transfer", icon: Building, fee: "Free", time: "1-3 days" },
    { id: "credit_card", name: "Credit/Debit Card", icon: CreditCard, fee: "1.8%", time: "Instant" },
    { id: "crypto", name: "Crypto Deposit", icon: Wallet, fee: "Network fee", time: "Varies" },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Deposit USD</h1>
          <p className="text-muted-foreground mt-1">Add funds to your account balance to start trading.</p>
        </div>

        <Card className="p-6 md:p-8">
          {success ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold font-display mb-2">Deposit Submitted</h2>
              <p className="text-muted-foreground mb-8">Your funds will be credited to your account shortly.</p>
              <Button onClick={() => setSuccess(false)} variant="outline">Make another deposit</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="space-y-4">
                <label className="text-sm font-semibold text-foreground">Select Deposit Method</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {methods.map((m) => (
                    <div 
                      key={m.id}
                      onClick={() => setValue("method", m.id)}
                      className={cn(
                        "p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col gap-2 relative overflow-hidden",
                        selectedMethod === m.id 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-border/80 bg-secondary/30"
                      )}
                    >
                      <m.icon className={cn("w-6 h-6", selectedMethod === m.id ? "text-primary" : "text-muted-foreground")} />
                      <div className="font-semibold mt-2 text-foreground">{m.name}</div>
                      <div className="text-xs text-muted-foreground flex justify-between mt-auto">
                        <span>{m.fee}</span>
                        <span>{m.time}</span>
                      </div>
                      {selectedMethod === m.id && (
                        <div className="absolute top-3 right-3 text-primary">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {errors.method && <p className="text-destructive text-sm">{errors.method.message}</p>}
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <label className="text-sm font-semibold text-foreground flex justify-between">
                  <span>Amount to Deposit</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-muted-foreground font-light">$</span>
                  <Input 
                    {...register("amount")} 
                    type="number" 
                    placeholder="1000" 
                    className="pl-10 text-2xl h-16 font-semibold"
                  />
                </div>
                {errors.amount && <p className="text-destructive text-sm">{errors.amount.message}</p>}
                
                <div className="flex gap-2 mt-3">
                  {[100, 500, 1000, 5000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setValue("amount", val, { shouldValidate: true })}
                      className="px-3 py-1.5 rounded bg-secondary hover:bg-secondary/80 text-xs font-mono font-medium transition-colors"
                    >
                      +${val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-secondary/50 p-4 rounded-xl space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Deposit Amount</span>
                  <span className="font-mono">{watchAmount ? formatCurrency(watchAmount) : "$0.00"}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Estimated Fee</span>
                  <span className="font-mono">$0.00</span>
                </div>
                <div className="flex justify-between font-bold text-foreground border-t border-border/50 pt-2 mt-2">
                  <span>Total Credited</span>
                  <span className="font-mono text-primary">{watchAmount ? formatCurrency(watchAmount) : "$0.00"}</span>
                </div>
              </div>

              <Button type="submit" className="w-full h-14 text-lg font-bold" disabled={isPending}>
                {isPending ? "Processing..." : "Confirm Deposit"}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
