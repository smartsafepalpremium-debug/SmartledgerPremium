import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { PublicLayout } from "@/components/layout";
import { Button, Input, Card } from "@/components/ui/shared";
import { motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const registerSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "At least 6 characters"),
  name: z.string().min(2, "Name required"),
  experience: z.enum(["beginner", "experienced"]),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser, isRegisterPending } = useAuth();
  const [error, setError] = useState<string | null>(null);
  
  // Extract level from query params
  const searchParams = new URLSearchParams(window.location.search);
  const defaultLevel = searchParams.get("level") === "experienced" ? "experienced" : "beginner";

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      experience: defaultLevel as "beginner" | "experienced",
    }
  });

  const selectedExperience = watch("experience");

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError(null);
      await registerUser(data);
    } catch (err: any) {
      setError(err.message || "Failed to register. Please try again.");
    }
  };

  return (
    <PublicLayout>
      <div className="flex-1 flex items-center justify-center p-6 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="p-8 backdrop-blur-xl bg-card/90">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-display font-bold text-foreground">Create Account</h1>
              <p className="text-muted-foreground mt-2">Start your crypto journey today</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground ml-1">Full Name</label>
                <Input {...register("name")} />
                {errors.name && <p className="text-destructive text-sm ml-1">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground ml-1">Email</label>
                <Input {...register("email")} type="email" />
                {errors.email && <p className="text-destructive text-sm ml-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground ml-1">Password</label>
                <Input {...register("password")} type="password" />
                {errors.password && <p className="text-destructive text-sm ml-1">{errors.password.message}</p>}
              </div>

              <div className="space-y-3 pt-2">
                <label className="text-sm font-medium text-foreground ml-1">Experience Level</label>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    onClick={() => setValue("experience", "beginner")}
                    className={cn(
                      "p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2 text-center",
                      selectedExperience === "beginner" 
                        ? "border-primary bg-primary/10 text-primary" 
                        : "border-border hover:border-primary/50 text-muted-foreground"
                    )}
                  >
                    <CheckCircle2 className={cn("w-6 h-6", selectedExperience === "beginner" ? "opacity-100" : "opacity-0")} />
                    <span className="font-semibold">Beginner</span>
                  </div>
                  <div 
                    onClick={() => setValue("experience", "experienced")}
                    className={cn(
                      "p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2 text-center",
                      selectedExperience === "experienced" 
                        ? "border-accent bg-accent/10 text-accent" 
                        : "border-border hover:border-accent/50 text-muted-foreground"
                    )}
                  >
                    <CheckCircle2 className={cn("w-6 h-6", selectedExperience === "experienced" ? "opacity-100" : "opacity-0")} />
                    <span className="font-semibold">Experienced</span>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full mt-6" size="lg" disabled={isRegisterPending}>
                {isRegisterPending ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Log In
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </PublicLayout>
  );
}
