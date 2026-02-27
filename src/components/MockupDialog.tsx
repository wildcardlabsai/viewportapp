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
    {/* Screen bezel */}
    <div className="relative rounded-t-[12px] border-[10px] border-[hsl(230,5%,15%)] bg-[hsl(230,5%,15%)] shadow-[0_0_0_1px_hsl(230,5%,25%),0_20px_60px_-10px_rgba(0,0,0,0.5)]">
      {/* Camera dot */}
      <div className="absolute top-[-6px] left-1/2 -translate-x-1/2 w-[6px] h-[6px] rounded-full bg-[hsl(230,5%,25%)] z-10" />
      <div className="rounded-[2px] overflow-hidden">{children}</div>
    </div>
    {/* Hinge */}
    <div className="w-[18%] h-[8px] bg-gradient-to-b from-[hsl(230,5%,15%)] to-[hsl(230,5%,20%)]" style={{ borderRadius: "0 0 2px 2px" }} />
    {/* Base */}
    <div className="w-[108%] h-[8px] bg-gradient-to-b from-[hsl(220,8%,82%)] via-[hsl(220,8%,78%)] to-[hsl(220,8%,72%)] rounded-b-md shadow-[0_2px_8px_rgba(0,0,0,0.15)]" />
    <div className="w-[110%] h-[2px] bg-gradient-to-b from-[hsl(220,8%,68%)] to-[hsl(220,8%,65%)] rounded-b-lg" />
  </div>
);

const IPhoneFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="relative rounded-[3rem] bg-[hsl(230,5%,12%)] shadow-[0_0_0_2px_hsl(230,5%,22%),0_0_0_3px_hsl(230,5%,8%),0_20px_60px_-10px_rgba(0,0,0,0.5)] p-[10px]">
    {/* Side buttons - volume */}
    <div className="absolute left-[-3px] top-[22%] w-[3px] h-[20px] bg-[hsl(230,5%,18%)] rounded-l-sm" />
    <div className="absolute left-[-3px] top-[30%] w-[3px] h-[30px] bg-[hsl(230,5%,18%)] rounded-l-sm" />
    <div className="absolute left-[-3px] top-[38%] w-[3px] h-[30px] bg-[hsl(230,5%,18%)] rounded-l-sm" />
    {/* Power button */}
    <div className="absolute right-[-3px] top-[28%] w-[3px] h-[36px] bg-[hsl(230,5%,18%)] rounded-r-sm" />
    {/* Dynamic Island */}
    <div className="absolute top-[14px] left-1/2 -translate-x-1/2 w-[25%] h-[14px] bg-[hsl(230,5%,5%)] rounded-full z-10" />
    {/* Screen */}
    <div className="rounded-[2.2rem] overflow-hidden bg-black">{children}</div>
    {/* Home indicator */}
    <div className="absolute bottom-[6px] left-1/2 -translate-x-1/2 w-[30%] h-[4px] bg-white/20 rounded-full" />
  </div>
);

const IPadFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="relative rounded-[1.2rem] bg-[hsl(230,5%,12%)] shadow-[0_0_0_2px_hsl(230,5%,22%),0_0_0_3px_hsl(230,5%,8%),0_20px_60px_-10px_rgba(0,0,0,0.5)] p-[10px]">
    {/* Camera */}
    <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[5px] h-[5px] rounded-full bg-[hsl(230,5%,25%)] z-10" />
    <div className="rounded-[6px] overflow-hidden">{children}</div>
    {/* Home indicator */}
    <div className="absolute bottom-[6px] left-1/2 -translate-x-1/2 w-[18%] h-[4px] bg-white/15 rounded-full" />
  </div>
);

const BrowserFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-xl bg-[hsl(220,14%,96%)] shadow-[0_0_0_1px_hsl(220,13%,88%),0_20px_60px_-10px_rgba(0,0,0,0.3)] overflow-hidden">
    {/* Title bar */}
    <div className="flex items-center gap-2 px-4 py-2 bg-[hsl(220,14%,96%)] border-b border-[hsl(220,13%,88%)]">
      <div className="flex gap-[6px]">
        <div className="w-[12px] h-[12px] rounded-full bg-[#ff5f57] shadow-[inset_0_-1px_1px_rgba(0,0,0,0.1)]" />
        <div className="w-[12px] h-[12px] rounded-full bg-[#febc2e] shadow-[inset_0_-1px_1px_rgba(0,0,0,0.1)]" />
        <div className="w-[12px] h-[12px] rounded-full bg-[#28c840] shadow-[inset_0_-1px_1px_rgba(0,0,0,0.1)]" />
      </div>
      <div className="flex-1 mx-12">
        <div className="h-[26px] rounded-md bg-white border border-[hsl(220,13%,88%)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] flex items-center justify-center">
          <div className="w-[8px] h-[8px] rounded-full border border-[hsl(220,13%,75%)] mr-1.5 opacity-60" />
          <div className="w-[40%] h-[8px] rounded bg-[hsl(220,13%,90%)]" />
        </div>
      </div>
    </div>
    {/* Content */}
    <div className="bg-white">{children}</div>
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
          <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
            PDF
          </Button>
          <Button size="sm" onClick={handleDownload} disabled={downloading}>
            <Download className="w-4 h-4 mr-1" />
            {downloading ? "Exporting…" : "Download PNG"}
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
