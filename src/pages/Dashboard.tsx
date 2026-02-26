import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Monitor, Smartphone, Tablet, Loader2, List } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

const devicePresets = [
  { id: "desktop-1440", label: "Desktop 1440×900", width: 1440, height: 900, icon: Monitor },
  { id: "desktop-1920", label: "Desktop 1920×1080", width: 1920, height: 1080, icon: Monitor },
  { id: "iphone15-portrait", label: "iPhone 15 Pro", width: 393, height: 852, icon: Smartphone },
  { id: "iphone15-landscape", label: "iPhone 15 Pro (landscape)", width: 852, height: 393, icon: Smartphone },
  { id: "pixel8-portrait", label: "Pixel 8", width: 412, height: 924, icon: Smartphone },
  { id: "pixel8-landscape", label: "Pixel 8 (landscape)", width: 924, height: 412, icon: Smartphone },
  { id: "ipad-portrait", label: "iPad Pro", width: 1024, height: 1366, icon: Tablet },
  { id: "ipad-landscape", label: "iPad Pro (landscape)", width: 1366, height: 1024, icon: Tablet },
];

interface Project {
  id: string;
  name: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [bulkUrls, setBulkUrls] = useState("");
  const [inputMode, setInputMode] = useState<"single" | "bulk">("single");
  const [selectedDevices, setSelectedDevices] = useState<string[]>(["desktop-1440"]);
  const [capturing, setCapturing] = useState(false);
  const [captureMode, setCaptureMode] = useState("viewport");
  const [delay, setDelay] = useState("0");
  const [scale, setScale] = useState("1");
  const [format, setFormat] = useState("png");
  const [background, setBackground] = useState("white");
  const [hideCookies, setHideCookies] = useState(false);
  const [hideChat, setHideChat] = useState(false);
  const [hideStickyHeaders, setHideStickyHeaders] = useState(false);
  const [hidePopups, setHidePopups] = useState(false);
  const [customCss, setCustomCss] = useState("");
  const [projectId, setProjectId] = useState<string>("none");
  const [projects, setProjects] = useState<Project[]>([]);
  const [captureProgress, setCaptureProgress] = useState<{ current: number; total: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("projects").select("id, name").eq("user_id", user.id).order("name").then(({ data }) => {
      if (data) setProjects(data);
    });
  }, [user]);

  const toggleDevice = (id: string) => {
    setSelectedDevices((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const getUrls = (): string[] => {
    if (inputMode === "single") return url.trim() ? [url.trim()] : [];
    return bulkUrls
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u.length > 0);
  };

  const handleCapture = async () => {
    const urls = getUrls();
    if (urls.length === 0) { toast.error("Please enter a URL"); return; }
    if (selectedDevices.length === 0) { toast.error("Please select at least one device"); return; }

    setCapturing(true);
    const total = urls.length * selectedDevices.length;
    setCaptureProgress({ current: 0, total });

    try {
      const jobIds: string[] = [];
      let current = 0;

      for (const captureUrl of urls) {
        for (const deviceId of selectedDevices) {
          const device = devicePresets.find((d) => d.id === deviceId)!;
          const insertData: any = {
            user_id: user!.id,
            url: captureUrl,
            device_preset: deviceId,
            viewport_width: device.width,
            viewport_height: device.height,
            device_scale_factor: parseFloat(scale),
            full_page: captureMode === "fullpage",
            delay_seconds: parseInt(delay),
            output_format: format,
            background,
            hide_cookie_banners: hideCookies,
            hide_chat_widgets: hideChat,
            hide_sticky_headers: hideStickyHeaders,
            hide_popups: hidePopups,
          };
          if (projectId !== "none") insertData.project_id = projectId;
          if (customCss.trim()) insertData.custom_css = customCss.trim();

          const { data, error } = await supabase.from("capture_jobs").insert(insertData).select("id");
          if (error) throw error;
          if (data) jobIds.push(data[0].id);
          current++;
          setCaptureProgress({ current, total });
        }
      }

      toast.success(`${total} capture(s) queued — processing…`);

      const { error: fnError } = await supabase.functions.invoke("process-captures", {
        body: { job_ids: jobIds },
      });
      if (fnError) {
        toast.error("Processing failed. Check History for details.");
      } else {
        toast.success("Captures completed!");
      }
      navigate("/history");
    } catch (err: any) {
      toast.error(err.message || "Failed to create capture job");
    } finally {
      setCapturing(false);
      setCaptureProgress(null);
    }
  };

  const urlCount = getUrls().length;

  return (
    <DashboardLayout active="New Capture">
      <div className="max-w-4xl mx-auto p-6 lg:p-10">
        <h1 className="font-display text-3xl font-bold mb-8">New Capture</h1>

        {/* URL Input */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-base font-semibold">Website URL</Label>
            <div className="flex gap-1 p-0.5 rounded-lg bg-muted">
              <button onClick={() => setInputMode("single")} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${inputMode === "single" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
                Single
              </button>
              <button onClick={() => setInputMode("bulk")} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${inputMode === "bulk" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
                <List className="w-3 h-3" /> Bulk
              </button>
            </div>
          </div>

          {inputMode === "single" ? (
            <div className="flex gap-3">
              <Input type="url" placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)} className="text-base h-12" />
              <Button variant="brand" size="lg" className="px-8" onClick={handleCapture} disabled={capturing}>
                {capturing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}
                {capturing ? "Capturing…" : "Capture"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Textarea
                placeholder={"Paste URLs, one per line:\nhttps://example.com\nhttps://another-site.com\nhttps://third-site.com"}
                value={bulkUrls}
                onChange={(e) => setBulkUrls(e.target.value)}
                className="min-h-[120px] text-sm font-mono"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {urlCount} URL{urlCount !== 1 ? "s" : ""} × {selectedDevices.length} device{selectedDevices.length !== 1 ? "s" : ""} = {urlCount * selectedDevices.length} capture{urlCount * selectedDevices.length !== 1 ? "s" : ""}
                </span>
                <Button variant="brand" size="lg" className="px-8" onClick={handleCapture} disabled={capturing}>
                  {capturing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}
                  {capturing && captureProgress ? `${captureProgress.current}/${captureProgress.total}` : "Capture All"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Project Selector */}
        <div className="mb-6">
          <Label className="text-sm font-medium mb-2 block">Assign to Project (optional)</Label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className="w-64"><SelectValue placeholder="No project" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No project</SelectItem>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Device Presets */}
        <div className="mb-8">
          <Label className="text-base font-semibold mb-3 block">Device Presets</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {devicePresets.map((device) => {
              const isSelected = selectedDevices.includes(device.id);
              return (
                <button key={device.id} onClick={() => toggleDevice(device.id)} className={`p-3 rounded-xl border text-left transition-all ${isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30 hover:bg-muted/50"}`}>
                  <device.icon className={`w-4 h-4 mb-1.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="text-xs font-medium truncate">{device.label}</div>
                  <div className="text-[10px] text-muted-foreground">{device.width}×{device.height}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Capture Options */}
        <Tabs defaultValue="capture" className="mb-8">
          <TabsList>
            <TabsTrigger value="capture">Capture Options</TabsTrigger>
            <TabsTrigger value="hiding">Element Hiding</TabsTrigger>
            <TabsTrigger value="css">Custom CSS</TabsTrigger>
          </TabsList>
          <TabsContent value="capture" className="space-y-5 mt-4">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <Label className="mb-2 block">Capture Mode</Label>
                <Select value={captureMode} onValueChange={setCaptureMode}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="viewport">Viewport only</SelectItem><SelectItem value="fullpage">Full page</SelectItem></SelectContent></Select>
              </div>
              <div>
                <Label className="mb-2 block">Delay Before Capture</Label>
                <Select value={delay} onValueChange={setDelay}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="0">No delay</SelectItem><SelectItem value="3">3 seconds</SelectItem><SelectItem value="5">5 seconds</SelectItem><SelectItem value="10">10 seconds</SelectItem></SelectContent></Select>
              </div>
              <div>
                <Label className="mb-2 block">Resolution Scale</Label>
                <Select value={scale} onValueChange={setScale}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">1x</SelectItem><SelectItem value="2">2x</SelectItem><SelectItem value="3">3x</SelectItem></SelectContent></Select>
              </div>
              <div>
                <Label className="mb-2 block">Output Format</Label>
                <Select value={format} onValueChange={setFormat}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="png">PNG</SelectItem><SelectItem value="jpg">JPG</SelectItem><SelectItem value="webp">WebP</SelectItem><SelectItem value="pdf">PDF</SelectItem></SelectContent></Select>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Background</Label>
              <Select value={background} onValueChange={setBackground}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="transparent">Transparent</SelectItem><SelectItem value="white">White</SelectItem><SelectItem value="dark">Dark</SelectItem></SelectContent></Select>
            </div>
          </TabsContent>
          <TabsContent value="hiding" className="space-y-4 mt-4">
            {[
              { id: "cookie", label: "Hide cookie banners", checked: hideCookies, onChange: setHideCookies },
              { id: "chat", label: "Hide chat widgets", checked: hideChat, onChange: setHideChat },
              { id: "sticky", label: "Hide sticky headers", checked: hideStickyHeaders, onChange: setHideStickyHeaders },
              { id: "popups", label: "Hide popups & modals", checked: hidePopups, onChange: setHidePopups },
            ].map((toggle) => (
              <div key={toggle.id} className="flex items-center justify-between p-4 rounded-xl border bg-card">
                <Label htmlFor={toggle.id} className="font-medium cursor-pointer">{toggle.label}</Label>
                <Switch id={toggle.id} checked={toggle.checked} onCheckedChange={toggle.onChange} />
              </div>
            ))}
          </TabsContent>
          <TabsContent value="css" className="mt-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Inject custom CSS into the page before capturing. Use this to hide specific elements or adjust styles.</p>
              <Textarea
                placeholder={".annoying-banner { display: none !important; }\n.hero { background: #000; }"}
                value={customCss}
                onChange={(e) => setCustomCss(e.target.value)}
                className="min-h-[120px] font-mono text-sm"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
