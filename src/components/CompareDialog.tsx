import { useState, useRef, useCallback } from "react";
import { toPng } from "html-to-image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Columns, Layers, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

interface CompareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageA: string;
  imageB: string;
}

type Mode = "slider" | "side-by-side" | "overlay";

const CompareDialog = ({ open, onOpenChange, imageA, imageB }: CompareDialogProps) => {
  const [mode, setMode] = useState<Mode>("slider");
  const [sliderPos, setSliderPos] = useState(50);
  const [overlayOpacity, setOverlayOpacity] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const handleSliderMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  }, []);

  const handleDownload = async () => {
    if (!containerRef.current) return;
    try {
      const dataUrl = await toPng(containerRef.current, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement("a");
      link.download = `comparison-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Comparison downloaded!");
    } catch {
      toast.error("Failed to export");
    }
  };

  const modes: { id: Mode; icon: typeof Columns; label: string }[] = [
    { id: "slider", icon: SlidersHorizontal, label: "Slider" },
    { id: "side-by-side", icon: Columns, label: "Side by Side" },
    { id: "overlay", icon: Layers, label: "Overlay" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Visual Comparison</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-3 pb-2 border-b">
          <div className="flex gap-1 p-1 rounded-lg bg-muted">
            {modes.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    mode === m.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {m.label}
                </button>
              );
            })}
          </div>

          {mode === "overlay" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Opacity:</span>
              <input type="range" min={0} max={100} value={overlayOpacity} onChange={(e) => setOverlayOpacity(Number(e.target.value))} className="w-24" />
              <span className="text-xs">{overlayOpacity}%</span>
            </div>
          )}

          <div className="flex-1" />
          <Button size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-1" /> Download
          </Button>
        </div>

        <div ref={containerRef} className="rounded-xl bg-muted/50 overflow-hidden">
          {mode === "slider" && (
            <div
              ref={sliderRef}
              className="relative w-full cursor-col-resize select-none"
              style={{ minHeight: 300 }}
              onMouseDown={() => { dragging.current = true; }}
              onMouseUp={() => { dragging.current = false; }}
              onMouseLeave={() => { dragging.current = false; }}
              onMouseMove={handleSliderMove}
            >
              <img src={imageB} alt="After" className="w-full h-auto block" crossOrigin="anonymous" />
              <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
                <img src={imageA} alt="Before" className="w-full h-auto block" crossOrigin="anonymous" />
              </div>
              <div className="absolute top-0 bottom-0 w-0.5 bg-primary" style={{ left: `${sliderPos}%` }}>
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
              </div>
            </div>
          )}

          {mode === "side-by-side" && (
            <div className="flex gap-2 p-2">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground text-center mb-1">Before</p>
                <img src={imageA} alt="Before" className="w-full rounded-lg" crossOrigin="anonymous" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground text-center mb-1">After</p>
                <img src={imageB} alt="After" className="w-full rounded-lg" crossOrigin="anonymous" />
              </div>
            </div>
          )}

          {mode === "overlay" && (
            <div className="relative" style={{ minHeight: 300 }}>
              <img src={imageA} alt="Before" className="w-full h-auto block" crossOrigin="anonymous" />
              <img
                src={imageB}
                alt="After"
                className="absolute inset-0 w-full h-auto"
                style={{ opacity: overlayOpacity / 100 }}
                crossOrigin="anonymous"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompareDialog;
