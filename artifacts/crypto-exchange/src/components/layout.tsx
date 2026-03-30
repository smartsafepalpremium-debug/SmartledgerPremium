import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  Wallet, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  History, 
  Settings,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/shared";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="absolute -top-[300px] left-[50%] -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      
      <header className="container mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:border-primary/50 transition-colors">
            <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="CryptoX" className="w-6 h-6 object-contain" />
          </div>
          <span className="font-display font-bold text-xl tracking-wide">CryptoX</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2">
            Log In
          </Link>
          <Link href="/register">
            <Button size="sm" className="font-semibold">Sign Up</Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1 relative z-10 flex flex-col">
        {children}
      </main>
    </div>
  );
}

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/invest", icon: ArrowRightLeft, label: "Invest & Trade" },
  { href: "/dashboard/portfolio", icon: Wallet, label: "Portfolio" },
  { href: "/dashboard/deposit", icon: ArrowDownToLine, label: "Deposit" },
  { href: "/dashboard/withdraw", icon: ArrowUpFromLine, label: "Withdraw" },
  { href: "/dashboard/transactions", icon: History, label: "Transactions" },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Close mobile menu on route change
  React.useEffect(() => { setIsMobileMenuOpen(false); }, [location]);

  if (!user) return null; // Handled by App router logic

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card z-50">
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="CryptoX" className="w-8 h-8" />
          <span className="font-display font-bold text-lg">CryptoX</span>
        </Link>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-muted-foreground">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {(isMobileMenuOpen || window.innerWidth >= 768) && (
          <motion.aside 
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className={cn(
              "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col",
              "md:static md:translate-x-0",
              isMobileMenuOpen ? "top-[73px]" : "hidden md:flex"
            )}
          >
            <div className="p-6 hidden md:block">
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="CryptoX" className="w-5 h-5 object-contain" />
                </div>
                <span className="font-display font-bold text-xl">CryptoX</span>
              </Link>
            </div>

            <div className="flex-1 px-4 py-6 md:py-2 flex flex-col gap-2 overflow-y-auto">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Menu</div>
              {NAV_ITEMS.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <span className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all group cursor-pointer",
                      isActive 
                        ? "bg-secondary text-foreground" 
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    )}>
                      <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-primary" : "group-hover:text-primary")} />
                      {item.label}
                    </span>
                  </Link>
                );
              })}
              
              <div className="mt-8 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Account</div>
              <Link href="/dashboard/settings">
                <span className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all group cursor-pointer",
                  location === "/dashboard/settings" 
                    ? "bg-secondary text-foreground" 
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}>
                  <Settings className="w-5 h-5 group-hover:text-foreground transition-colors" />
                  Settings
                </span>
              </Link>
            </div>

            <div className="p-4 border-t border-border mt-auto">
              <div className="flex items-center gap-3 px-2 py-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-primary-foreground font-bold font-display">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.experience} Trader</p>
                </div>
              </div>
              <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => logout()}>
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 max-h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
