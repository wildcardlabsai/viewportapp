import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Loader2, TrendingUp, CheckCircle, XCircle, Globe } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface CaptureJob {
  id: string;
  device_preset: string;
  status: string;
  created_at: string;
  url: string;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--muted-foreground))"];

const UsageDashboard = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<CaptureJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data } = await supabase
        .from("capture_jobs")
        .select("id, device_preset, status, created_at, url")
        .eq("user_id", user.id)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true });
      if (data) setJobs(data);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const dailyData = useMemo(() => {
    const map = new Map<string, number>();
    jobs.forEach((j) => {
      const day = new Date(j.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      map.set(day, (map.get(day) || 0) + 1);
    });
    return Array.from(map, ([date, count]) => ({ date, count }));
  }, [jobs]);

  const deviceData = useMemo(() => {
    const map = new Map<string, number>();
    jobs.forEach((j) => {
      const label = j.device_preset.split("-")[0] || j.device_preset;
      map.set(label, (map.get(label) || 0) + 1);
    });
    return Array.from(map, ([device, count]) => ({ device, count }));
  }, [jobs]);

  const statusData = useMemo(() => {
    const map = new Map<string, number>();
    jobs.forEach((j) => map.set(j.status, (map.get(j.status) || 0) + 1));
    return Array.from(map, ([status, count]) => ({ status, count }));
  }, [jobs]);

  const successRate = useMemo(() => {
    if (jobs.length === 0) return 0;
    const completed = jobs.filter((j) => j.status === "completed").length;
    return Math.round((completed / jobs.length) * 100);
  }, [jobs]);

  const topDomain = useMemo(() => {
    const map = new Map<string, number>();
    jobs.forEach((j) => {
      try {
        const domain = new URL(j.url).hostname;
        map.set(domain, (map.get(domain) || 0) + 1);
      } catch {}
    });
    let top = "—";
    let max = 0;
    map.forEach((count, domain) => { if (count > max) { max = count; top = domain; } });
    return top;
  }, [jobs]);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <BarChart3 className="w-5 h-5 text-primary" /> Usage Analytics (Last 30 Days)
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border bg-card text-center">
          <TrendingUp className="w-5 h-5 mx-auto mb-1 text-primary" />
          <p className="text-2xl font-bold">{jobs.length}</p>
          <p className="text-xs text-muted-foreground">Total Captures</p>
        </div>
        <div className="p-4 rounded-xl border bg-card text-center">
          <CheckCircle className="w-5 h-5 mx-auto mb-1 text-green-600" />
          <p className="text-2xl font-bold">{successRate}%</p>
          <p className="text-xs text-muted-foreground">Success Rate</p>
        </div>
        <div className="p-4 rounded-xl border bg-card text-center">
          <XCircle className="w-5 h-5 mx-auto mb-1 text-destructive" />
          <p className="text-2xl font-bold">{jobs.filter((j) => j.status === "failed").length}</p>
          <p className="text-xs text-muted-foreground">Failed</p>
        </div>
        <div className="p-4 rounded-xl border bg-card text-center">
          <Globe className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
          <p className="text-sm font-bold truncate">{topDomain}</p>
          <p className="text-xs text-muted-foreground">Top Domain</p>
        </div>
      </div>

      {/* Charts */}
      {jobs.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Daily captures line chart */}
          <div className="p-4 rounded-xl border bg-card">
            <p className="text-sm font-medium mb-3">Captures Per Day</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Device bar chart */}
          <div className="p-4 rounded-xl border bg-card">
            <p className="text-sm font-medium mb-3">By Device</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={deviceData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="device" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status pie chart */}
          <div className="p-4 rounded-xl border bg-card md:col-span-2">
            <p className="text-sm font-medium mb-3">By Status</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={70} label>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
};

export default UsageDashboard;
