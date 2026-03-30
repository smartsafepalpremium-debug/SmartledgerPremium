import { DashboardLayout } from "@/components/layout";
import { Card, Button, Input } from "@/components/ui/shared";
import { useAuth } from "@/hooks/use-auth";
import { Shield, User as UserIcon, Mail, Activity } from "lucide-react";
import { format } from "date-fns";

export default function SettingsPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Account Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your profile and preferences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-4">
            <Card className="p-6 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-primary-foreground font-display font-bold text-4xl mb-4 shadow-lg shadow-primary/20">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-muted-foreground text-sm">{user.email}</p>
              
              <div className="mt-6 w-full inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-sm font-medium border border-border">
                <Shield className="w-4 h-4 text-success" /> Account Verified
              </div>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-6">
            <Card className="overflow-hidden">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-display font-bold">Profile Details</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><UserIcon className="w-4 h-4"/> Full Name</label>
                    <Input readOnly value={user.name} className="bg-secondary/30" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><Mail className="w-4 h-4"/> Email Address</label>
                    <Input readOnly value={user.email} className="bg-secondary/30" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><Activity className="w-4 h-4"/> Experience Level</label>
                    <Input readOnly value={user.experience.charAt(0).toUpperCase() + user.experience.slice(1)} className="bg-secondary/30" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">Member Since</label>
                    <Input readOnly value={format(new Date(user.createdAt), "MMMM d, yyyy")} className="bg-secondary/30 font-mono" />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden border-destructive/20">
              <div className="p-6 border-b border-destructive/10 bg-destructive/5">
                <h3 className="text-lg font-display font-bold text-destructive">Danger Zone</h3>
              </div>
              <div className="p-6">
                <p className="text-sm text-muted-foreground mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                <Button variant="destructive" disabled>Delete Account</Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
