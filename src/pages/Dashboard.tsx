import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Monitor, Smartphone, Tablet, History, FolderOpen, Settings, LogOut } from "lucide-react";
import viewportLogo from "@/assets/viewport-logo.png";

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
  const [url, setUrl] = useState("");
  const [selectedDevices, setSelectedDevices] = useState<string[]>(["desktop-1440"]);

  const toggleDevice = (id: string) => {
    setSelectedDevices((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card hidden lg:flex flex-col">
        <div className="p-4 border-b">
          <img src={viewportLogo} alt="Viewport" className="h-7" />
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {[
            { icon: Camera, label: "New Capture", active: true },
            { icon: History, label: "History", active: false },
            { icon: FolderOpen, label: "Projects", active: false },
            { icon: Settings, label: "Settings", active: false },
          ].map((item) => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                item.active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 lg:p-10">
          <h1 className="font-display text-3xl font-bold mb-8">New Capture</h1>

          {/* URL Input */}
          <div className="mb-8">
            <Label htmlFor="url" className="text-base font-semibold mb-2 block">
              Website URL
            </Label>
            <div className="flex gap-3">
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="text-base h-12"
              />
              <Button variant="brand" size="lg" className="px-8">
                <Camera className="w-4 h-4 mr-2" />
                Capture
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
                  <button
                    key={device.id}
                    onClick={() => toggleDevice(device.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/30 hover:bg-muted/50"
                    }`}
                  >
                    <device.icon className={`w-4 h-4 mb-1.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="text-xs font-medium truncate">{device.label}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {device.width}×{device.height}
                    </div>
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
                  <Select defaultValue="viewport">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewport">Viewport only</SelectItem>
                      <SelectItem value="fullpage">Full page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block">Delay Before Capture</Label>
                  <Select defaultValue="0">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No delay</SelectItem>
                      <SelectItem value="3">3 seconds</SelectItem>
                      <SelectItem value="5">5 seconds</SelectItem>
                      <SelectItem value="10">10 seconds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block">Resolution Scale</Label>
                  <Select defaultValue="1">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1x</SelectItem>
                      <SelectItem value="2">2x</SelectItem>
                      <SelectItem value="3">3x</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block">Output Format</Label>
                  <Select defaultValue="png">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="jpg">JPG</SelectItem>
                      <SelectItem value="webp">WebP</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Background</Label>
                <Select defaultValue="white">
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transparent">Transparent</SelectItem>
                    <SelectItem value="white">White</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="hiding" className="space-y-4 mt-4">
              {[
                { id: "cookie", label: "Hide cookie banners" },
                { id: "chat", label: "Hide chat widgets" },
                { id: "sticky", label: "Hide sticky headers" },
                { id: "popups", label: "Hide popups & modals" },
              ].map((toggle) => (
                <div key={toggle.id} className="flex items-center justify-between p-4 rounded-xl border bg-card">
                  <Label htmlFor={toggle.id} className="font-medium cursor-pointer">
                    {toggle.label}
                  </Label>
                  <Switch id={toggle.id} />
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
