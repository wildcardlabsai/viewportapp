import { useState, useRef } from "react";
import { toPng } from "html-to-image";
import { Download, Monitor, Smartphone, Tablet, Globe } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MockupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
}

type DeviceType = "macbook" | "iphone" | "ipad" | "browser";
type BgStyle = "white" | "dark" | "gradient" | "brand";

const devices: { id: DeviceType; label: string; icon: typeof Monitor }[] = [
  { id: "macbook", label: "MacBook", icon: Monitor },
  { id: "iphone", label: "iPhone", icon: Smartphone },
  { id: "ipad", label: "iPad", icon: Tablet },
  { id: "browser", label: "Browser", icon: Globe },
];

const backgrounds: { id: BgStyle; label: string; className: string }[] = [
  { id: "white", label: "White", className: "bg-white" },
  { id: "dark", label: "Dark", className: "bg-[hsl(222,47%,11%)]" },
  { id: "gradient", label: "Gradient", className: "bg-gradient-to-br from-[hsl(262,83%,58%)] to-[hsl(195,100%,50%)]" },
  { id: "brand", label: "Subtle", className: "bg-gradient-to-br from-[hsl(262,83%,58%,0.1)] to-[hsl(195,100%,50%,0.1)]" },
];

/* ── Device Frames ── */

const MacBookFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col items-center">
    {/* Screen */}
    <div className="rounded-t-xl border-[8px] border-[hsl(220,9%,46%)] bg-[hsl(220,9%,46%)] shadow-2xl">
      <div className="rounded-[4px] overflow-hidden">{children}</div>
    </div>
    {/* Notch */}
    <div className="w-[15%] h-[6px] bg-[hsl(220,9%,46%)] rounded-b-sm" />
    {/* Base */}
    <div className="w-[110%] h-[10px] bg-gradient-to-b from-[hsl(220,13%,78%)] to-[hsl(220,13%,70%)] rounded-b-lg" />
  </div>
);

const IPhoneFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="relative rounded-[2.5rem] border-[6px] border-[hsl(222,47%,11%)] bg-[hsl(222,47%,11%)] shadow-2xl p-1">
    {/* Dynamic Island */}
    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[28%] h-[18px] bg-[hsl(222,47%,11%)] rounded-full z-10" />
    {/* Screen */}
    <div className="rounded-[2rem] overflow-hidden">{children}</div>
    {/* Home indicator */}
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[35%] h-[4px] bg-white/30 rounded-full" />
  </div>
);

const IPadFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-[1.5rem] border-[8px] border-[hsl(222,47%,11%)] bg-[hsl(222,47%,11%)] shadow-2xl p-0.5">
    <div className="rounded-[1rem] overflow-hidden">{children}</div>
    {/* Home indicator */}
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[20%] h-[4px] bg-white/30 rounded-full" />
  </div>
);

const BrowserFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-xl border border-[hsl(220,13%,91%)] bg-white shadow-2xl overflow-hidden">
    {/* Title bar */}
    <div className="flex items-center gap-2 px-4 py-2.5 bg-[hsl(220,14%,96%)] border-b border-[hsl(220,13%,91%)]">
      <div className="flex gap-1.5">
        <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
        <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
        <div className="w-3 h-3 rounded-full bg-[#28c840]" />
      </div>
      <div className="flex-1 mx-8">
        <div className="h-5 rounded-md bg-white/80 border border-[hsl(220,13%,91%)]" />
      </div>
    </div>
    {/* Content */}
    <div>{children}</div>
  </div>
);

const frameComponents: Record<DeviceType, React.FC<{ children: React.ReactNode }>> = {
  macbook: MacBookFrame,
  iphone: IPhoneFrame,
  ipad: IPadFrame,
  browser: BrowserFrame,
};

const imageMaxWidths: Record<DeviceType, string> = {
  macbook: "max-w-[480px]",
  iphone: "max-w-[220px]",
  ipad: "max-w-[360px]",
  browser: "max-w-[520px]",
};

const MockupDialog = ({ open, onOpenChange, imageUrl }: MockupDialogProps) => {
  const [device, setDevice] = useState<DeviceType>("macbook");
  const [bg, setBg] = useState<BgStyle>("gradient");
  const [downloading, setDownloading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const Frame = frameComponents[device];

  const handleDownload = async () => {
    if (!containerRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(containerRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });
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

  const handleDownloadPdf = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow || !containerRef.current) return;
    const html = `<html><head><title>Mockup</title><style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;}img{max-width:100%;}</style></head><body>${containerRef.current.innerHTML}</body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => { printWindow.print(); };
  };

  const bgClass = backgrounds.find((b) => b.id === bg)?.className ?? "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Device Mockup</DialogTitle>
        </DialogHeader>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Device picker */}
          <div className="flex gap-1 p-1 rounded-lg bg-muted">
            {devices.map((d) => {
              const Icon = d.icon;
              return (
                <button
                  key={d.id}
                  onClick={() => setDevice(d.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    device === d.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {d.label}
                </button>
              );
            })}
          </div>

          {/* Background picker */}
          <div className="flex gap-2 items-center">
            <span className="text-xs text-muted-foreground">BG:</span>
            {backgrounds.map((b) => (
              <button
                key={b.id}
                onClick={() => setBg(b.id)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${b.className} ${
                  bg === b.id ? "border-primary scale-110" : "border-border"
                }`}
                title={b.label}
              />
            ))}
          </div>

          <div className="flex-1" />
          <Button size="sm" onClick={handleDownload} disabled={downloading}>
            <Download className="w-4 h-4 mr-1" />
            {downloading ? "Exporting…" : "Download"}
          </Button>
        </div>

        {/* Preview */}
        <div
          ref={containerRef}
          className={`flex items-center justify-center p-12 rounded-xl ${bgClass}`}
          style={{ minHeight: 320 }}
        >
          <div className={`${imageMaxWidths[device]} w-full`}>
            <Frame>
              <img
                src={imageUrl}
                alt="Screenshot"
                className="w-full h-auto block"
                crossOrigin="anonymous"
              />
            </Frame>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MockupDialog;
