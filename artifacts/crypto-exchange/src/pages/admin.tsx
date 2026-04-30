import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/shared";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  Users,
  Activity,
  CheckCircle2,
  XCircle,
  Search,
  TrendingUp,
  DollarSign,
  Clock,
  Trash2,
  Edit,
  AlertTriangle,
  Wallet,
} from "lucide-react";
import {
  useGetAdminStats,
  useGetAdminUsers,
  useGetAdminTransactions,
  useUpdateAdminUser,
  useDeleteAdminUser,
  useApproveAdminTransaction,
  useRejectAdminTransaction,
} from "@workspace/api-client-react";
import type { User, AdminTransaction } from "@workspace/api-client-react/src/generated/api.schemas";
import { useQueryClient } from "@tanstack/react-query";

type Tab = "overview" | "approvals" | "users" | "transactions";

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
              <h1 className="text-2xl md:text-3xl font-display font-bold">Admin Panel</h1>
              <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                ADMIN
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Approve deposits & withdrawals, manage users, KYC, balances and full transaction history.
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "approvals", label: "Pending Approvals", icon: Clock },
            { id: "users", label: "Users", icon: Users },
            { id: "transactions", label: "All Transactions", icon: TrendingUp },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px",
                tab === t.id
                  ? "border-amber-400 text-amber-300"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && <OverviewTab />}
        {tab === "approvals" && <ApprovalsTab />}
        {tab === "users" && <UsersTab />}
        {tab === "transactions" && <TransactionsTab />}
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon: Icon, label, value, hint, accent }: { icon: any; label: string; value: string; hint?: string; accent?: string }) {
  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <div className="flex items-center justify-between mb-2">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", accent ?? "bg-primary/15")}>
          <Icon className={cn("w-4 h-4", accent ? "text-amber-400" : "text-primary")} />
        </div>
        {hint && <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{hint}</span>}
      </div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-xl md:text-2xl font-display font-bold">{value}</div>
    </div>
  );
}

function OverviewTab() {
  const { data: stats, isLoading } = useGetAdminStats();
  if (isLoading || !stats) {
    return <div className="text-muted-foreground text-sm">Loading stats...</div>;
  }
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Total Users" value={String(stats.totalUsers)} hint={`${stats.totalAdmins} admin`} />
        <StatCard icon={ShieldCheck} label="KYC Verified" value={String(stats.verifiedUsers)} />
        <StatCard icon={DollarSign} label="Total USD" value={`$${stats.totalUsdBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
        <StatCard icon={Wallet} label="Total Crypto" value={`$${stats.totalCryptoValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Clock} label="Pending Deposits" value={String(stats.pendingDeposits)} accent="bg-amber-500/15" />
        <StatCard icon={Clock} label="Pending Withdrawals" value={String(stats.pendingWithdrawals)} accent="bg-amber-500/15" />
        <StatCard icon={CheckCircle2} label="Completed Txns" value={String(stats.completedTransactions)} />
        <StatCard icon={TrendingUp} label="Total Volume" value={`$${stats.totalVolumeUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
      </div>

      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-sm">
          <div className="font-semibold text-amber-200 mb-1">Approval workflow active</div>
          <div className="text-amber-200/80">
            All new deposits and withdrawals are <strong>pending</strong> until you approve them on the
            Pending Approvals tab. KYC submissions also require your approval before users are marked verified.
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    completed: "bg-green-500/15 text-green-400 border-green-500/30",
    rejected: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  return (
    <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full border uppercase tracking-wider", styles[status] ?? "bg-secondary border-border text-muted-foreground")}>
      {status}
    </span>
  );
}

function TxRow({ tx, showActions, onChange }: { tx: AdminTransaction; showActions?: boolean; onChange: () => void }) {
  const queryClient = useQueryClient();
  const approve = useApproveAdminTransaction({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries();
        onChange();
      },
    },
  });
  const reject = useRejectAdminTransaction({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries();
        onChange();
      },
    },
  });
  const isBusy = approve.isPending || reject.isPending;

  return (
    <div className="p-3 md:p-4 rounded-xl bg-card border border-border">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-sm capitalize">{tx.type}</span>
            <StatusBadge status={tx.status} />
            {tx.symbol && (
              <span className="text-xs px-2 py-0.5 rounded bg-secondary text-foreground">{tx.symbol}</span>
            )}
            <span className="text-xs text-muted-foreground">#{tx.id}</span>
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {tx.userName} · {tx.userEmail}
          </div>
          <div className="text-xs text-muted-foreground">
            {new Date(tx.createdAt).toLocaleString()}
          </div>
        </div>
        <div className="text-right">
          <div className="font-display font-bold text-base">
            ${tx.usdAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
          {tx.amount != null && tx.symbol && (
            <div className="text-xs text-muted-foreground">
              {tx.amount.toLocaleString(undefined, { maximumFractionDigits: 8 })} {tx.symbol}
            </div>
          )}
          {tx.coin && <div className="text-[11px] text-muted-foreground">{tx.coin}</div>}
        </div>
      </div>
      {showActions && tx.status === "pending" && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-border">
          <Button
            size="sm"
            variant="success"
            disabled={isBusy}
            onClick={() => approve.mutate({ id: tx.id })}
            className="flex-1"
          >
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={isBusy}
            onClick={() => reject.mutate({ id: tx.id })}
            className="flex-1"
          >
            <XCircle className="w-4 h-4 mr-1" />
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}

function ApprovalsTab() {
  const { data: txs, isLoading, refetch } = useGetAdminTransactions({ status: "pending" });
  if (isLoading) return <div className="text-muted-foreground text-sm">Loading...</div>;
  if (!txs || txs.length === 0) {
    return (
      <div className="p-12 rounded-xl bg-card border border-border text-center">
        <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
        <h3 className="font-semibold mb-1">All clear</h3>
        <p className="text-sm text-muted-foreground">No pending deposits or withdrawals.</p>
      </div>
    );
  }
  const deposits = txs.filter((t) => t.type === "deposit");
  const withdraws = txs.filter((t) => t.type === "withdraw");
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Pending Deposits ({deposits.length})
        </h2>
        <div className="space-y-2">
          {deposits.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4 rounded-xl bg-card border border-border">No pending deposits.</div>
          ) : (
            deposits.map((tx) => <TxRow key={tx.id} tx={tx} showActions onChange={() => refetch()} />)
          )}
        </div>
      </section>
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Pending Withdrawals ({withdraws.length})
        </h2>
        <div className="space-y-2">
          {withdraws.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4 rounded-xl bg-card border border-border">No pending withdrawals.</div>
          ) : (
            withdraws.map((tx) => <TxRow key={tx.id} tx={tx} showActions onChange={() => refetch()} />)
          )}
        </div>
      </section>
    </div>
  );
}

function UsersTab() {
  const [search, setSearch] = useState("");
  const { data: users, isLoading, refetch } = useGetAdminUsers({ search: search || undefined });
  const [editing, setEditing] = useState<User | null>(null);

  if (isLoading) return <div className="text-muted-foreground text-sm">Loading users...</div>;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search users by email, name or id..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="space-y-2">
        {users?.map((u) => (
          <div key={u.id} className="p-3 md:p-4 rounded-xl bg-card border border-border">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{u.name}</span>
                  {u.role === "admin" && (
                    <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">ADMIN</span>
                  )}
                  {u.status === "suspended" && (
                    <span className="text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full">SUSPENDED</span>
                  )}
                  <KycChip status={u.kycStatus} />
                </div>
                <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                <div className="text-xs text-muted-foreground">
                  ID #{u.id} · Joined {new Date(u.createdAt).toLocaleDateString()} · Experience: {u.experience}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">USD Balance</div>
                <div className="font-display font-bold text-lg">${u.usdBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              </div>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-border flex-wrap">
              <Button size="sm" variant="outline" onClick={() => setEditing(u)}>
                <Edit className="w-3.5 h-3.5 mr-1" /> Manage
              </Button>
            </div>
          </div>
        ))}
        {users?.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground rounded-xl bg-card border border-border">
            No users found.
          </div>
        )}
      </div>

      {editing && (
        <UserEditModal user={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refetch(); }} />
      )}
    </div>
  );
}

function KycChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    verified: "bg-green-500/15 text-green-400 border-green-500/30",
    pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    rejected: "bg-red-500/15 text-red-400 border-red-500/30",
    unverified: "bg-secondary text-muted-foreground border-border",
  };
  return (
    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider", map[status] ?? map.unverified)}>
      KYC: {status}
    </span>
  );
}

function UserEditModal({ user, onClose, onSaved }: { user: User; onClose: () => void; onSaved: () => void }) {
  const queryClient = useQueryClient();
  const [usdBalance, setUsdBalance] = useState(String(user.usdBalance));
  const [adjustBalance, setAdjustBalance] = useState("");
  const [kycStatus, setKycStatus] = useState(user.kycStatus);
  const [role, setRole] = useState(user.role);
  const [status, setStatus] = useState(user.status);

  const update = useUpdateAdminUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries();
        onSaved();
      },
    },
  });
  const del = useDeleteAdminUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries();
        onSaved();
      },
    },
  });

  const submit = () => {
    const data: any = {};
    const numBal = Number(usdBalance);
    if (!Number.isNaN(numBal) && numBal !== user.usdBalance) data.usdBalance = numBal;
    if (kycStatus !== user.kycStatus) data.kycStatus = kycStatus;
    if (role !== user.role) data.role = role;
    if (status !== user.status) data.status = status;
    const adj = Number(adjustBalance);
    if (adjustBalance && !Number.isNaN(adj) && adj !== 0) data.adjustBalance = adj;
    update.mutate({ id: user.id, data });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-lg">Manage User #{user.id}</h3>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><XCircle className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <Field label="USD Balance">
            <Input type="number" step="0.01" value={usdBalance} onChange={(e) => setUsdBalance(e.target.value)} />
          </Field>
          <Field label="Quick adjust (+/− USD, logs as transaction)">
            <Input type="number" step="0.01" placeholder="e.g. 500 or -200" value={adjustBalance} onChange={(e) => setAdjustBalance(e.target.value)} />
          </Field>
          <Field label="KYC Status">
            <Select value={kycStatus} onChange={(v) => setKycStatus(v as any)} options={["unverified", "pending", "verified", "rejected"]} />
          </Field>
          <Field label="Role">
            <Select value={role} onChange={(v) => setRole(v as any)} options={["user", "admin"]} />
          </Field>
          <Field label="Account Status">
            <Select value={status} onChange={(v) => setStatus(v as any)} options={["active", "suspended"]} />
          </Field>
        </div>
        <div className="p-5 border-t border-border flex gap-2 flex-wrap">
          <Button onClick={submit} disabled={update.isPending} className="flex-1">
            {update.isPending ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            variant="destructive"
            disabled={del.isPending}
            onClick={() => {
              if (confirm(`Permanently delete ${user.email}? This deletes all their holdings and transactions.`)) {
                del.mutate({ id: user.id });
              }
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-muted-foreground mb-1.5">{label}</div>
      {children}
    </label>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-12 px-4 rounded-xl bg-secondary border border-border text-foreground capitalize"
    >
      {options.map((o) => (
        <option key={o} value={o} className="capitalize">{o}</option>
      ))}
    </select>
  );
}

function TransactionsTab() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const { data: txs, isLoading, refetch } = useGetAdminTransactions({
    status: statusFilter || undefined,
    type: typeFilter || undefined,
  });

  const filtered = useMemo(() => txs ?? [], [txs]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Select value={statusFilter} onChange={setStatusFilter} options={["", "pending", "completed", "rejected"]} />
        <Select value={typeFilter} onChange={setTypeFilter} options={["", "deposit", "withdraw", "buy", "sell", "convert"]} />
      </div>
      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading transactions...</div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground rounded-xl bg-card border border-border">No transactions match these filters.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((tx) => (
            <TxRow key={tx.id} tx={tx} showActions onChange={() => refetch()} />
          ))}
        </div>
      )}
    </div>
  );
}
