import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Users, BarChart3, Plus, Trash2, ArrowUpDown, Shield, LogOut } from "lucide-react";
import pageframeLogo from "@/assets/pageframe-logo.png";

interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  plan: string;
  daily_captures_used: number;
  created_at: string;
}

interface Analytics {
  totalUsers: number;
  totalCaptures: number;
  planDistribution: Record<string, number>;
  recentSignups: number;
  recentCaptures: number;
}

const Admin = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"users" | "analytics">("users");
  const [createOpen, setCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newPlan, setNewPlan] = useState("free");
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const checkAdmin = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();
    setIsAdmin(!!data);
  }, [user]);

  const fetchUsers = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("admin", {
      body: null,
      headers: { "Content-Type": "application/json" },
    });
    // Use query params approach
    const resp = await supabase.functions.invoke("admin?action=list-users");
    if (resp.error) {
      toast.error("Failed to load users");
      return;
    }
    setProfiles(resp.data.profiles || []);
  }, []);

  const fetchAnalytics = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("admin?action=analytics");
    if (error) {
      toast.error("Failed to load analytics");
      return;
    }
    setAnalytics(data);
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      checkAdmin();
    }
  }, [user, authLoading, checkAdmin]);

  useEffect(() => {
    if (isAdmin) {
      setLoading(true);
      Promise.all([fetchUsers(), fetchAnalytics()]).finally(() => setLoading(false));
    }
  }, [isAdmin, fetchUsers, fetchAnalytics]);

  const handleUpdatePlan = async (userId: string, plan: string) => {
    const { error } = await supabase.functions.invoke("admin?action=update-plan", {
      body: { userId, plan },
    });
    if (error) {
      toast.error("Failed to update plan");
      return;
    }
    toast.success("Plan updated");
    fetchUsers();
  };

  const handleDeleteUser = async (userId: string, email: string | null) => {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
    const { error } = await supabase.functions.invoke("admin?action=delete-user", {
      body: { userId },
    });
    if (error) {
      toast.error("Failed to delete user");
      return;
    }
    toast.success("User deleted");
    fetchUsers();
    fetchAnalytics();
  };

  const handleCreateUser = async () => {
    if (!newEmail || !newPassword) {
      toast.error("Email and password required");
      return;
    }
    setCreating(true);
    const { error } = await supabase.functions.invoke("admin?action=create-user", {
      body: { email: newEmail, password: newPassword, fullName: newName, plan: newPlan },
    });
    if (error) {
      toast.error("Failed to create user");
    } else {
      toast.success("User created");
      setCreateOpen(false);
      setNewEmail("");
      setNewPassword("");
      setNewName("");
      setNewPlan("free");
      fetchUsers();
      fetchAnalytics();
    }
    setCreating(false);
  };

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const filteredProfiles = profiles.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      p.email?.toLowerCase().includes(q) ||
      p.full_name?.toLowerCase().includes(q) ||
      p.plan.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b bg-card px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={pageframeLogo} alt="PageFrame" className="h-6" />
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Shield className="w-3 h-3" /> Admin
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => window.location.href = "/"}>
            Back to App
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-1" /> Sign Out
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 lg:p-10">
        <h1 className="font-display text-3xl font-bold mb-8">Admin Panel</h1>

        {/* Tab toggle */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={tab === "users" ? "brand" : "outline"}
            size="sm"
            onClick={() => setTab("users")}
          >
            <Users className="w-4 h-4 mr-1.5" /> Users
          </Button>
          <Button
            variant={tab === "analytics" ? "brand" : "outline"}
            size="sm"
            onClick={() => setTab("analytics")}
          >
            <BarChart3 className="w-4 h-4 mr-1.5" /> Analytics
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : tab === "analytics" ? (
          <div className="space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Users", value: analytics?.totalUsers || 0 },
                { label: "Total Captures", value: analytics?.totalCaptures || 0 },
                { label: "Signups (30d)", value: analytics?.recentSignups || 0 },
                { label: "Captures (7d)", value: analytics?.recentCaptures || 0 },
              ].map((stat) => (
                <div key={stat.label} className="p-5 rounded-xl border bg-card">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold font-display mt-1">{stat.value.toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* Plan distribution */}
            <div className="p-5 rounded-xl border bg-card">
              <h3 className="font-semibold mb-4">Plan Distribution</h3>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(analytics?.planDistribution || {}).map(([plan, count]) => (
                  <div key={plan} className="text-center p-4 rounded-lg bg-muted">
                    <p className="text-2xl font-bold font-display">{count}</p>
                    <p className="text-sm text-muted-foreground capitalize">{plan}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <Input
                placeholder="Search by email, name, or plan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button variant="brand" size="sm">
                    <Plus className="w-4 h-4 mr-1.5" /> Create User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div>
                      <Label>Email</Label>
                      <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} type="email" />
                    </div>
                    <div>
                      <Label>Password</Label>
                      <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" />
                    </div>
                    <div>
                      <Label>Full Name</Label>
                      <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
                    </div>
                    <div>
                      <Label>Plan</Label>
                      <Select value={newPlan} onValueChange={setNewPlan}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                          <SelectItem value="agency">Agency</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="brand" className="w-full" onClick={handleCreateUser} disabled={creating}>
                      {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Create User
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="rounded-xl border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Daily Used</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProfiles.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.email || "—"}</TableCell>
                        <TableCell>{p.full_name || "—"}</TableCell>
                        <TableCell>
                          <Select
                            value={p.plan}
                            onValueChange={(val) => handleUpdatePlan(p.user_id, val)}
                          >
                            <SelectTrigger className="w-28 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="pro">Pro</SelectItem>
                              <SelectItem value="agency">Agency</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{p.daily_captures_used}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(p.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteUser(p.user_id, p.email)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
