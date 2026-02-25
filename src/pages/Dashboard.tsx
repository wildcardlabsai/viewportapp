import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Monitor, Smartphone, Tablet, Loader2 } from "lucide-react";
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

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
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

  const toggleDevice = (id: string) => {
    setSelectedDevices((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleCapture = async () => {
    if (!url.trim()) { toast.error("Please enter a URL"); return; }
    if (selectedDevices.length === 0) { toast.error("Please select at least one device"); return; }

    setCapturing(true);
    try {
      const jobIds: string[] = [];
      for (const deviceId of selectedDevices) {
        const device = devicePresets.find((d) => d.id === deviceId)!;
        const { data, error } = await supabase.from("capture_jobs").insert({
          user_id: user!.id,
          url: url.trim(),
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
        }).select("id");
        if (error) throw error;
        if (data) jobIds.push(data[0].id);
      }
      toast.success(`${selectedDevices.length} capture(s) queued — processing…`);

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
    }
  };

  return (
    <DashboardLayout active="New Capture">
      <div className="max-w-4xl mx-auto p-6 lg:p-10">
        <h1 className="font-display text-3xl font-bold mb-8">New Capture</h1>

        {/* URL Input */}
        <div className="mb-8">
          <Label htmlFor="url" className="text-base font-semibold mb-2 block">Website URL</Label>
          <div className="flex gap-3">
            <Input id="url" type="url" placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)} className="text-base h-12" />
            <Button variant="brand" size="lg" className="px-8" onClick={handleCapture} disabled={capturing}>
              {capturing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}
              {capturing ? "Capturing…" : "Capture"}
            </Button>
          </div>
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
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
