import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { User, CreditCard, BarChart3, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

interface Profile {
  full_name: string | null;
  email: string | null;
  plan: string;
  daily_captures_used: number;
  daily_captures_reset_at: string;
}

const planLimits: Record<string, number> = { free: 10, pro: 100, agency: 500 };

const Settings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [totalCaptures, setTotalCaptures] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [profileRes, countRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("capture_jobs").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      if (profileRes.data) {
        setProfile(profileRes.data);
        setFullName(profileRes.data.full_name || "");
      }
      setTotalCaptures(countRes.count || 0);
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

  const dailyLimit = planLimits[profile?.plan || "free"] || 10;
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
                <p className="text-xl font-bold capitalize">{profile?.plan || "Free"}</p>
              </div>
              {profile?.plan === "free" && (
                <Button variant="outline" size="sm">Upgrade</Button>
              )}
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

        {/* Stats */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <BarChart3 className="w-5 h-5 text-primary" /> Usage Stats
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border bg-card text-center">
              <p className="text-3xl font-bold">{totalCaptures}</p>
              <p className="text-sm text-muted-foreground">Total Captures</p>
            </div>
            <div className="p-5 rounded-xl border bg-card text-center">
              <p className="text-3xl font-bold capitalize">{profile?.plan || "Free"}</p>
              <p className="text-sm text-muted-foreground">Current Plan</p>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
