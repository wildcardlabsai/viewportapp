import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Plus, Trash2, Loader2, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

interface ScheduledCapture {
  id: string;
  url: string;
  device_preset: string;
  viewport_width: number;
  viewport_height: number;
  cron_expression: string;
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string;
  created_at: string;
}

const frequencies = [
  { label: "Every hour", cron: "0 * * * *" },
  { label: "Every 6 hours", cron: "0 */6 * * *" },
  { label: "Daily (midnight)", cron: "0 0 * * *" },
  { label: "Weekly (Monday)", cron: "0 0 * * 1" },
];

const devicePresets = [
  { id: "desktop-1440", label: "Desktop 1440×900", width: 1440, height: 900 },
  { id: "desktop-1920", label: "Desktop 1920×1080", width: 1920, height: 1080 },
  { id: "iphone15-portrait", label: "iPhone 15 Pro", width: 393, height: 852 },
  { id: "ipad-portrait", label: "iPad Pro", width: 1024, height: 1366 },
];

const Schedules = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<ScheduledCapture[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [url, setUrl] = useState("");
  const [device, setDevice] = useState("desktop-1440");
  const [frequency, setFrequency] = useState("0 0 * * *");

  const fetchSchedules = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("scheduled_captures")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setSchedules(data as ScheduledCapture[]);
    setLoading(false);
  };

  useEffect(() => { fetchSchedules(); }, [user]);

  const handleCreate = async () => {
    if (!user || !url.trim()) return;
    setCreating(true);
    const preset = devicePresets.find((d) => d.id === device)!;
    const nextRun = new Date();
    nextRun.setHours(nextRun.getHours() + 1);

    const { error } = await supabase.from("scheduled_captures").insert({
      user_id: user.id,
      url: url.trim(),
      device_preset: device,
      viewport_width: preset.width,
      viewport_height: preset.height,
      cron_expression: frequency,
      next_run_at: nextRun.toISOString(),
    } as any);

    if (error) toast.error(error.message);
    else { toast.success("Schedule created!"); setUrl(""); setShowForm(false); fetchSchedules(); }
    setCreating(false);
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from("scheduled_captures").update({ is_active: !isActive } as any).eq("id", id);
    if (error) toast.error(error.message);
    else fetchSchedules();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("scheduled_captures").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Schedule deleted"); fetchSchedules(); }
  };

  const getFreqLabel = (cron: string) => frequencies.find((f) => f.cron === cron)?.label || cron;

  return (
    <DashboardLayout active="Schedules">
      <div className="max-w-3xl mx-auto p-6 lg:p-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-bold">Scheduled Captures</h1>
          <Button variant="brand" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-1" /> New Schedule
          </Button>
        </div>

        {showForm && (
          <div className="p-5 rounded-xl border bg-card space-y-4 mb-6">
            <div>
              <Label className="mb-1.5 block">URL</Label>
              <Input type="url" placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">Device</Label>
                <Select value={device} onValueChange={setDevice}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {devicePresets.map((d) => <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">Frequency</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {frequencies.map((f) => <SelectItem key={f.cron} value={f.cron}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="brand" onClick={handleCreate} disabled={creating || !url.trim()}>
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Schedule"}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">No scheduled captures</p>
            <p className="text-sm">Set up automated recurring captures for your sites.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map((s) => (
              <div key={s.id} className="p-4 rounded-xl border bg-card flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${s.is_active ? "bg-green-500" : "bg-muted-foreground"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.url}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.device_preset} · {getFreqLabel(s.cron_expression)}
                    {s.last_run_at && ` · Last run ${new Date(s.last_run_at).toLocaleDateString()}`}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(s.id, s.is_active)} title={s.is_active ? "Pause" : "Resume"}>
                  {s.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(s.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Schedules;
