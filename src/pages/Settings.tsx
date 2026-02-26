import { useState, useEffect } from "react";
import { useAuth, PLAN_TIERS } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { User, CreditCard, Loader2, ExternalLink } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import ApiKeysSection from "@/components/ApiKeysSection";
import UsageDashboard from "@/components/UsageDashboard";
import { useSearchParams } from "react-router-dom";

interface Profile {
  full_name: string | null;
  email: string | null;
  plan: string;
  daily_captures_used: number;
  daily_captures_reset_at: string;
}

const planLimits: Record<string, number> = { free: 10, pro: 100, agency: 500 };

const Settings = () => {
  const { user, plan, subscribed, subscriptionEnd, refreshSubscription, checkingSubscription } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [portalLoading, setPortalLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  // Handle checkout return
  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      toast.success("Subscription activated! Refreshing…");
      refreshSubscription();
    } else if (checkout === "canceled") {
      toast.info("Checkout was canceled.");
    }
  }, [searchParams, refreshSubscription]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      if (data) {
        setProfile(data);
        setFullName(data.full_name || "");
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("user_id", user.id);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
    setSaving(false);
  };

  const handleUpgrade = async (priceId: string, planKey: string) => {
    setUpgradeLoading(planKey);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
    } finally {
      setUpgradeLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Failed to open subscription portal");
    } finally {
      setPortalLoading(false);
    }
  };

  const dailyLimit = planLimits[plan] || 10;
  const dailyUsed = profile?.daily_captures_used || 0;
  const usagePercent = Math.min((dailyUsed / dailyLimit) * 100, 100);

  const resetTime = profile?.daily_captures_reset_at
    ? new Date(profile.daily_captures_reset_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : "—";

  if (loading) {
    return (
      <DashboardLayout active="Settings">
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout active="Settings">
      <div className="max-w-2xl mx-auto p-6 lg:p-10 space-y-10">
        <h1 className="font-display text-3xl font-bold">Settings</h1>

        {/* Profile */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <User className="w-5 h-5 text-primary" /> Profile
          </div>
          <div className="p-5 rounded-xl border bg-card space-y-4">
            <div>
              <Label className="mb-1.5 block">Email</Label>
              <Input value={user?.email || ""} disabled className="bg-muted" />
            </div>
            <div>
              <Label className="mb-1.5 block">Full Name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
            </div>
            <Button variant="brand" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </div>
        </section>

        {/* Plan & Usage */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <CreditCard className="w-5 h-5 text-primary" /> Plan & Usage
          </div>
          <div className="p-5 rounded-xl border bg-card space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="text-xl font-bold capitalize">{plan}</p>
                {subscribed && subscriptionEnd && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Renews {new Date(subscriptionEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {subscribed && (
                  <Button variant="outline" size="sm" onClick={handleManageSubscription} disabled={portalLoading}>
                    {portalLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <ExternalLink className="w-3 h-3 mr-1" />}
                    Manage
                  </Button>
                )}
                {plan === "free" && (
                  <Button
                    variant="brand"
                    size="sm"
                    onClick={() => handleUpgrade(PLAN_TIERS.pro.price_id, "pro")}
                    disabled={!!upgradeLoading}
                  >
                    {upgradeLoading === "pro" && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                    Upgrade to Pro
                  </Button>
                )}
                {plan === "pro" && (
                  <Button
                    variant="brand"
                    size="sm"
                    onClick={() => handleUpgrade(PLAN_TIERS.agency.price_id, "agency")}
                    disabled={!!upgradeLoading}
                  >
                    {upgradeLoading === "agency" && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                    Upgrade to Agency
                  </Button>
                )}
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Daily Captures</span>
                <span className="font-medium">{dailyUsed} / {dailyLimit}</span>
              </div>
              <Progress value={usagePercent} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1.5">Resets at {resetTime}</p>
            </div>
          </div>
        </section>

        {/* Usage Analytics */}
        <UsageDashboard />

        {/* API Keys */}
        <ApiKeysSection />
      </div>
    </DashboardLayout>
  );
};

export default Settings;
