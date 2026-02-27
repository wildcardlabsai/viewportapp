import { useState, useRef, useCallback, useEffect } from "react";
import { toPng } from "html-to-image";
import {
  Download,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  RotateCcw,
  Loader2,
  X,
  Copy,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/* ── Types ── */

interface MockupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  sourceUrl?: string;
  userId?: string;
}

type DeviceType = "macbook" | "iphone" | "ipad" | "browser";
type ShadowLevel = "none" | "subtle" | "medium" | "dramatic";

const devices: { id: DeviceType; label: string; icon: typeof Monitor }[] = [
  { id: "macbook", label: "MacBook", icon: Monitor },
  { id: "iphone", label: "iPhone", icon: Smartphone },
  { id: "ipad", label: "iPad", icon: Tablet },
  { id: "browser", label: "Browser", icon: Globe },
];

const deviceViewports: Record<DeviceType, { width: number; height: number }> = {
  macbook: { width: 1440, height: 900 },
  iphone: { width: 390, height: 844 },
  ipad: { width: 820, height: 1180 },
  browser: { width: 1920, height: 1080 },
};

/* ── Backgrounds ── */

interface BgPreset {
  id: string;
  label: string;
  style: React.CSSProperties;
  swatch: string; // CSS for the small swatch button
}

const backgrounds: BgPreset[] = [
  { id: "white", label: "White", style: { background: "#ffffff" }, swatch: "bg-white border" },
  { id: "light", label: "Light", style: { background: "hsl(220 20% 97%)" }, swatch: "bg-[hsl(220,20%,97%)] border" },
  { id: "dark", label: "Dark", style: { background: "hsl(222 47% 11%)" }, swatch: "bg-[hsl(222,47%,11%)]" },
  { id: "black", label: "Black", style: { background: "#000000" }, swatch: "bg-black" },
  { id: "purple-blue", label: "Purple → Blue", style: { background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(220 80% 55%), hsl(195 100% 50%))" }, swatch: "bg-gradient-to-br from-[hsl(262,83%,58%)] to-[hsl(195,100%,50%)]" },
  { id: "pink-orange", label: "Pink → Orange", style: { background: "linear-gradient(135deg, hsl(330 80% 60%), hsl(20 90% 60%))" }, swatch: "bg-gradient-to-br from-[hsl(330,80%,60%)] to-[hsl(20,90%,60%)]" },
  { id: "green-teal", label: "Green → Teal", style: { background: "linear-gradient(135deg, hsl(150 60% 45%), hsl(180 70% 45%))" }, swatch: "bg-gradient-to-br from-[hsl(150,60%,45%)] to-[hsl(180,70%,45%)]" },
  { id: "sunset", label: "Sunset", style: { background: "linear-gradient(135deg, hsl(280 60% 50%), hsl(340 80% 55%), hsl(30 90% 55%))" }, swatch: "bg-gradient-to-br from-[hsl(280,60%,50%)] via-[hsl(340,80%,55%)] to-[hsl(30,90%,55%)]" },
  { id: "ocean", label: "Ocean", style: { background: "linear-gradient(135deg, hsl(210 80% 30%), hsl(200 90% 50%), hsl(180 70% 60%))" }, swatch: "bg-gradient-to-br from-[hsl(210,80%,30%)] via-[hsl(200,90%,50%)] to-[hsl(180,70%,60%)]" },
  { id: "subtle", label: "Subtle", style: { background: "linear-gradient(135deg, hsl(262 83% 58% / 0.08), hsl(195 100% 50% / 0.08))" }, swatch: "bg-gradient-to-br from-[hsl(262,83%,58%,0.15)] to-[hsl(195,100%,50%,0.15)] border" },
];

/* ── Shadow presets ── */

const shadowStyles: Record<ShadowLevel, string> = {
  none: "none",
  subtle: "0 4px 20px -4px rgba(0,0,0,0.15)",
  medium: "0 12px 40px -8px rgba(0,0,0,0.3)",
  dramatic: "0 24px 80px -12px rgba(0,0,0,0.5)",
};

/* ── Interactive Image ── */

interface InteractiveImageProps {
  imageUrl: string;
  zoom: number;
  panOffset: { x: number; y: number };
  onPanChange: (offset: { x: number; y: number }) => void;
  loading?: boolean;
}

const InteractiveImage = ({ imageUrl, zoom, panOffset, onPanChange, loading }: InteractiveImageProps) => {
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (zoom <= 1) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = { ...panOffset };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }, [zoom, panOffset]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    onPanChange({
      x: panStart.current.x + (e.clientX - dragStart.current.x) / zoom,
      y: panStart.current.y + (e.clientY - dragStart.current.y) / zoom,
    });
  }, [zoom, onPanChange]);

  const handlePointerUp = useCallback(() => { isDragging.current = false; }, []);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black/5" style={{ minHeight: 200 }}>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Capturing…</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full overflow-hidden relative"
      style={{ cursor: zoom > 1 ? "grab" : "default" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <img
        src={imageUrl}
        alt="Screenshot"
        className="w-full h-full block select-none"
        crossOrigin="anonymous"
        draggable={false}
        style={{
          objectFit: "cover",
          objectPosition: "top center",
          transform: zoom > 1 ? `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)` : undefined,
          transformOrigin: "center center",
        }}
      />
    </div>
  );
};

/* ── Device Frames ── */

const MacBookFrame = ({ children, shadow }: { children: React.ReactNode; shadow: string }) => (
  <div className="flex flex-col items-center" style={{ filter: shadow !== "none" ? `drop-shadow(${shadow})` : undefined }}>
    <div className="relative rounded-t-[12px] border-[10px] border-[hsl(230,5%,15%)] bg-[hsl(230,5%,15%)]">
      <div className="absolute top-[-6px] left-1/2 -translate-x-1/2 w-[6px] h-[6px] rounded-full bg-[hsl(230,5%,25%)] z-10" />
      <div className="rounded-[2px] overflow-hidden">{children}</div>
    </div>
    <div className="w-[18%] h-[8px] bg-gradient-to-b from-[hsl(230,5%,15%)] to-[hsl(230,5%,20%)]" style={{ borderRadius: "0 0 2px 2px" }} />
    <div className="w-[108%] h-[8px] bg-gradient-to-b from-[hsl(220,8%,82%)] via-[hsl(220,8%,78%)] to-[hsl(220,8%,72%)] rounded-b-md" />
    <div className="w-[110%] h-[2px] bg-gradient-to-b from-[hsl(220,8%,68%)] to-[hsl(220,8%,65%)] rounded-b-lg" />
  </div>
);

const IPhoneFrame = ({ children, shadow }: { children: React.ReactNode; shadow: string }) => (
  <div
    className="relative rounded-[3rem] bg-[hsl(230,5%,12%)] p-[10px]"
    style={{ aspectRatio: "9/19.5", boxShadow: shadow !== "none" ? shadow : undefined }}
  >
    <div className="absolute left-[-3px] top-[22%] w-[3px] h-[20px] bg-[hsl(230,5%,18%)] rounded-l-sm" />
    <div className="absolute left-[-3px] top-[30%] w-[3px] h-[30px] bg-[hsl(230,5%,18%)] rounded-l-sm" />
    <div className="absolute left-[-3px] top-[38%] w-[3px] h-[30px] bg-[hsl(230,5%,18%)] rounded-l-sm" />
    <div className="absolute right-[-3px] top-[28%] w-[3px] h-[36px] bg-[hsl(230,5%,18%)] rounded-r-sm" />
    <div className="absolute top-[14px] left-1/2 -translate-x-1/2 w-[25%] h-[14px] bg-[hsl(230,5%,5%)] rounded-full z-10" />
    <div className="rounded-[2.2rem] overflow-hidden bg-black w-full h-full">{children}</div>
    <div className="absolute bottom-[6px] left-1/2 -translate-x-1/2 w-[30%] h-[4px] bg-white/20 rounded-full" />
  </div>
);

const IPadFrame = ({ children, shadow }: { children: React.ReactNode; shadow: string }) => (
  <div
    className="relative rounded-[1.2rem] bg-[hsl(230,5%,12%)] p-[10px]"
    style={{ aspectRatio: "3/4", boxShadow: shadow !== "none" ? shadow : undefined }}
  >
    <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[5px] h-[5px] rounded-full bg-[hsl(230,5%,25%)] z-10" />
    <div className="rounded-[6px] overflow-hidden w-full h-full">{children}</div>
    <div className="absolute bottom-[6px] left-1/2 -translate-x-1/2 w-[18%] h-[4px] bg-white/15 rounded-full" />
  </div>
);

const BrowserFrame = ({ children, shadow }: { children: React.ReactNode; shadow: string }) => (
  <div
    className="rounded-xl bg-[hsl(220,14%,96%)] overflow-hidden"
    style={{ boxShadow: shadow !== "none" ? shadow : undefined }}
  >
    <div className="flex items-center gap-2 px-4 py-2 bg-[hsl(220,14%,96%)] border-b border-[hsl(220,13%,88%)]">
      <div className="flex gap-[6px]">
        <div className="w-[12px] h-[12px] rounded-full bg-[#ff5f57]" />
        <div className="w-[12px] h-[12px] rounded-full bg-[#febc2e]" />
        <div className="w-[12px] h-[12px] rounded-full bg-[#28c840]" />
      </div>
      <div className="flex-1 mx-12">
        <div className="h-[26px] rounded-md bg-white border border-[hsl(220,13%,88%)] flex items-center justify-center">
          <div className="w-[8px] h-[8px] rounded-full border border-[hsl(220,13%,75%)] mr-1.5 opacity-60" />
          <div className="w-[40%] h-[8px] rounded bg-[hsl(220,13%,90%)]" />
        </div>
      </div>
    </div>
    <div className="bg-white">{children}</div>
  </div>
);

/* ── Frame map ── */

const frameComponents: Record<DeviceType, React.FC<{ children: React.ReactNode; shadow: string }>> = {
  macbook: MacBookFrame,
  iphone: IPhoneFrame,
  ipad: IPadFrame,
  browser: BrowserFrame,
};

const deviceMaxWidths: Record<DeviceType, number> = {
  macbook: 520,
  iphone: 240,
  ipad: 360,
  browser: 560,
};

/* ── Sidebar Section ── */

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</Label>
    {children}
  </div>
);

/* ── Main Component ── */

const MockupDialog = ({ open, onOpenChange, imageUrl, sourceUrl, userId }: MockupDialogProps) => {
  const [device, setDevice] = useState<DeviceType>("macbook");
  const [bgId, setBgId] = useState("purple-blue");
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [padding, setPadding] = useState(64);
  const [shadowLevel, setShadowLevel] = useState<ShadowLevel>("medium");
  const [downloading, setDownloading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [deviceImages, setDeviceImages] = useState<Partial<Record<DeviceType, string>>>({});
  const canvasRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const Frame = frameComponents[device];
  const activeImage = deviceImages[device] ?? imageUrl;
  const activeBg = backgrounds.find((b) => b.id === bgId) ?? backgrounds[4];
  const shadow = shadowStyles[shadowLevel];
  const isCapturing = capturing && !deviceImages[device];

  const resetView = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const resetTilt = useCallback(() => {
    setRotateX(0);
    setRotateY(0);
  }, []);

  /* ── Live capture ── */

  const captureForDevice = useCallback(async (d: DeviceType) => {
    if (!sourceUrl || !userId) return;
    if (deviceImages[d]) return;

    setCapturing(true);
    try {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const vp = deviceViewports[d];

      const { data: job, error: insertErr } = await supabase
        .from("capture_jobs")
        .insert({
          url: sourceUrl, user_id: userId,
          viewport_width: vp.width, viewport_height: vp.height,
          device_preset: d, device_scale_factor: 2,
          output_format: "png", full_page: false, status: "queued",
          delay_seconds: 1, hide_cookie_banners: true, hide_chat_widgets: true,
          hide_popups: true, hide_sticky_headers: false, background: "light",
        })
        .select().single();

      if (insertErr || !job) throw insertErr ?? new Error("Failed to create job");

      const { error: fnErr } = await supabase.functions.invoke("process-captures", { body: { job_ids: [job.id] } });
      if (fnErr) throw fnErr;

      const deadline = Date.now() + 30000;
      let resultUrl: string | null = null;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 1500));
        if (abortRef.current?.signal.aborted) return;
        const { data: updated } = await supabase.from("capture_jobs").select("status, error_message").eq("id", job.id).single();
        if (updated?.status === "completed") {
          const { data: asset } = await supabase.from("capture_assets").select("file_url").eq("job_id", job.id).single();
          resultUrl = asset?.file_url ?? null;
          break;
        }
        if (updated?.status === "failed") throw new Error(updated.error_message ?? "Capture failed");
      }

      if (resultUrl) setDeviceImages((prev) => ({ ...prev, [d]: resultUrl }));
      else toast.error("Capture timed out");
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        console.error("Mockup capture error:", err);
        toast.error("Failed to capture for this device");
      }
    } finally {
      setCapturing(false);
    }
  }, [sourceUrl, userId, deviceImages]);

  const handleDeviceChange = useCallback((d: DeviceType) => {
    setDevice(d);
    resetView();
    captureForDevice(d);
  }, [resetView, captureForDevice]);

  useEffect(() => {
    if (open && sourceUrl && userId) {
      setDeviceImages({});
      captureForDevice("macbook");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sourceUrl]);

  useEffect(() => {
    if (!open) {
      abortRef.current?.abort();
      setDevice("macbook");
      resetView();
      resetTilt();
      setPadding(64);
      setShadowLevel("medium");
      setBgId("purple-blue");
    }
  }, [open, resetView, resetTilt]);

  /* ── Export ── */

  const handleDownloadPng = async () => {
    if (!canvasRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(canvasRef.current, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement("a");
      link.download = `mockup-${device}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Mockup downloaded!");
    } catch {
      toast.error("Failed to export mockup");
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = await toPng(canvasRef.current, { pixelRatio: 2, cacheBust: true });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleDownloadPdf = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow || !canvasRef.current) return;
    const html = `<html><head><title>Mockup</title><style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;}img{max-width:100%;}</style></head><body>${canvasRef.current.innerHTML}</body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-background/95 backdrop-blur-sm">
      {/* ── Sidebar ── */}
      <aside className="w-72 border-r border-border bg-card flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display text-lg font-bold">Mockup Editor</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 p-4 space-y-6">
          {/* Device */}
          <Section title="Device">
            <div className="grid grid-cols-2 gap-1.5">
              {devices.map((d) => {
                const Icon = d.icon;
                const hasCached = !!deviceImages[d.id];
                return (
                  <button
                    key={d.id}
                    onClick={() => handleDeviceChange(d.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      device === d.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {d.label}
                    {hasCached && <span className="w-1.5 h-1.5 rounded-full bg-green-400 ml-auto" />}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Background */}
          <Section title="Background">
            <div className="grid grid-cols-5 gap-2">
              {backgrounds.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBgId(b.id)}
                  className={`w-full aspect-square rounded-lg transition-all ${b.swatch} ${
                    bgId === b.id ? "ring-2 ring-primary ring-offset-2 ring-offset-card scale-110" : "hover:scale-105"
                  }`}
                  title={b.label}
                />
              ))}
            </div>
          </Section>

          {/* Padding */}
          <Section title={`Padding — ${padding}px`}>
            <Slider min={16} max={120} step={4} value={[padding]} onValueChange={([v]) => setPadding(v)} />
          </Section>

          {/* 3D Tilt */}
          <Section title="3D Tilt">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Rotate X</span>
                  <span className="text-xs font-mono text-muted-foreground">{rotateX}°</span>
                </div>
                <Slider min={-30} max={30} step={1} value={[rotateX]} onValueChange={([v]) => setRotateX(v)} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Rotate Y</span>
                  <span className="text-xs font-mono text-muted-foreground">{rotateY}°</span>
                </div>
                <Slider min={-30} max={30} step={1} value={[rotateY]} onValueChange={([v]) => setRotateY(v)} />
              </div>
              {(rotateX !== 0 || rotateY !== 0) && (
                <Button variant="ghost" size="sm" onClick={resetTilt} className="w-full text-xs h-7">
                  <RotateCcw className="w-3 h-3 mr-1" /> Reset Tilt
                </Button>
              )}
            </div>
          </Section>

          {/* Zoom */}
          <Section title={`Zoom — ${zoom.toFixed(1)}x`}>
            <Slider min={1} max={3} step={0.1} value={[zoom]} onValueChange={([v]) => setZoom(v)} />
            {zoom > 1 && (
              <p className="text-[10px] text-muted-foreground">Drag image to reposition</p>
            )}
            {zoom > 1 && (
              <Button variant="ghost" size="sm" onClick={resetView} className="w-full text-xs h-7">
                <RotateCcw className="w-3 h-3 mr-1" /> Reset Zoom
              </Button>
            )}
          </Section>

          {/* Shadow */}
          <Section title="Shadow">
            <div className="grid grid-cols-2 gap-1.5">
              {(["none", "subtle", "medium", "dramatic"] as ShadowLevel[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setShadowLevel(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                    shadowLevel === s
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </Section>
        </div>

        {/* Export buttons */}
        <div className="p-4 border-t border-border space-y-2">
          <Button className="w-full" size="sm" onClick={handleDownloadPng} disabled={downloading || isCapturing}>
            <Download className="w-4 h-4 mr-1" />
            {downloading ? "Exporting…" : "Download PNG"}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={handleCopyToClipboard} disabled={isCapturing}>
              <Copy className="w-3.5 h-3.5 mr-1" /> Copy
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={handleDownloadPdf} disabled={isCapturing}>
              <FileText className="w-3.5 h-3.5 mr-1" /> PDF
            </Button>
          </div>
        </div>
      </aside>

      {/* ── Canvas ── */}
      <main className="flex-1 flex items-center justify-center overflow-auto p-8">
        <div
          ref={canvasRef}
          className="flex items-center justify-center rounded-2xl transition-all duration-200"
          style={{
            ...activeBg.style,
            padding: `${padding}px`,
            minWidth: 320,
            minHeight: 320,
          }}
        >
          <div
            style={{
              perspective: "1200px",
              perspectiveOrigin: "center center",
            }}
          >
            <div
              style={{
                transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                transformStyle: "preserve-3d",
                transition: "transform 0.2s ease",
                maxWidth: deviceMaxWidths[device],
                width: "100%",
              }}
            >
              <Frame shadow={shadow}>
                <InteractiveImage
                  imageUrl={activeImage}
                  zoom={zoom}
                  panOffset={panOffset}
                  onPanChange={setPanOffset}
                  loading={isCapturing}
                />
              </Frame>
            </div>
          </div>
        </div>

        {sourceUrl && (
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground truncate max-w-md">
            {isCapturing ? "Generating device-specific screenshot…" : sourceUrl}
          </p>
        )}
      </main>
    </div>
  );
};

export default MockupDialog;
