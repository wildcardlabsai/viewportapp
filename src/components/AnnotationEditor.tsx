import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Square, Type, Eraser, Undo2, Redo2, Save, MousePointer, Minus } from "lucide-react";
import { toast } from "sonner";

interface AnnotationEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onSave?: (dataUrl: string) => void;
}

type Tool = "select" | "freehand" | "rectangle" | "arrow" | "text";

interface DrawAction {
  type: Tool;
  color: string;
  lineWidth: number;
  points?: { x: number; y: number }[];
  rect?: { x: number; y: number; w: number; h: number };
  arrow?: { x1: number; y1: number; x2: number; y2: number };
  text?: { x: number; y: number; content: string };
}

const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#000000", "#ffffff"];

const AnnotationEditor = ({ open, onOpenChange, imageUrl, onSave }: AnnotationEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>("freehand");
  const [color, setColor] = useState("#ef4444");
  const [lineWidth, setLineWidth] = useState(3);
  const [actions, setActions] = useState<DrawAction[]>([]);
  const [undoneActions, setUndoneActions] = useState<DrawAction[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Load image
  useEffect(() => {
    if (!open || !imageUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
    img.src = imageUrl;
    return () => { setActions([]); setUndoneActions([]); setImgLoaded(false); };
  }, [open, imageUrl]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d")!;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);

    actions.forEach((a) => {
      ctx.strokeStyle = a.color;
      ctx.fillStyle = a.color;
      ctx.lineWidth = a.lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (a.type === "freehand" && a.points && a.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(a.points[0].x, a.points[0].y);
        a.points.forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.stroke();
      } else if (a.type === "rectangle" && a.rect) {
        ctx.strokeRect(a.rect.x, a.rect.y, a.rect.w, a.rect.h);
      } else if (a.type === "arrow" && a.arrow) {
        const { x1, y1, x2, y2 } = a.arrow;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        // Arrowhead
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headLen = 15;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      } else if (a.type === "text" && a.text) {
        ctx.font = `${a.lineWidth * 8}px sans-serif`;
        ctx.fillText(a.text.content, a.text.x, a.text.y);
      }
    });
  }, [actions]);

  useEffect(() => { if (imgLoaded) redraw(); }, [imgLoaded, redraw]);

  const getCanvasPos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getCanvasPos(e);
    if (tool === "text") {
      const content = prompt("Enter text:");
      if (content) {
        setActions((prev) => [...prev, { type: "text", color, lineWidth, text: { ...pos, content } }]);
        setUndoneActions([]);
      }
      return;
    }
    setDrawing(true);
    setStartPoint(pos);
    if (tool === "freehand") setCurrentPoints([pos]);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawing) return;
    const pos = getCanvasPos(e);
    if (tool === "freehand") {
      setCurrentPoints((prev) => [...prev, pos]);
      // Live preview
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;
      redraw();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.beginPath();
      const pts = [...currentPoints, pos];
      ctx.moveTo(pts[0].x, pts[0].y);
      pts.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    } else if (startPoint) {
      redraw();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      if (tool === "rectangle") {
        ctx.strokeRect(startPoint.x, startPoint.y, pos.x - startPoint.x, pos.y - startPoint.y);
      } else if (tool === "arrow") {
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        const angle = Math.atan2(pos.y - startPoint.y, pos.x - startPoint.x);
        const headLen = 15;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(pos.x - headLen * Math.cos(angle - Math.PI / 6), pos.y - headLen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(pos.x - headLen * Math.cos(angle + Math.PI / 6), pos.y - headLen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!drawing) return;
    setDrawing(false);
    const pos = getCanvasPos(e);
    if (tool === "freehand") {
      setActions((prev) => [...prev, { type: "freehand", color, lineWidth, points: [...currentPoints, pos] }]);
      setCurrentPoints([]);
    } else if (startPoint) {
      if (tool === "rectangle") {
        setActions((prev) => [...prev, { type: "rectangle", color, lineWidth, rect: { x: startPoint.x, y: startPoint.y, w: pos.x - startPoint.x, h: pos.y - startPoint.y } }]);
      } else if (tool === "arrow") {
        setActions((prev) => [...prev, { type: "arrow", color, lineWidth, arrow: { x1: startPoint.x, y1: startPoint.y, x2: pos.x, y2: pos.y } }]);
      }
    }
    setUndoneActions([]);
    setStartPoint(null);
  };

  const undo = () => {
    if (actions.length === 0) return;
    const last = actions[actions.length - 1];
    setActions((prev) => prev.slice(0, -1));
    setUndoneActions((prev) => [...prev, last]);
  };

  const redo = () => {
    if (undoneActions.length === 0) return;
    const last = undoneActions[undoneActions.length - 1];
    setUndoneActions((prev) => prev.slice(0, -1));
    setActions((prev) => [...prev, last]);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    if (onSave) onSave(dataUrl);
    else {
      const link = document.createElement("a");
      link.download = `annotated-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Annotated image downloaded!");
    }
  };

  const tools: { id: Tool; icon: typeof Pencil; label: string }[] = [
    { id: "freehand", icon: Pencil, label: "Draw" },
    { id: "rectangle", icon: Square, label: "Rectangle" },
    { id: "arrow", icon: Minus, label: "Arrow" },
    { id: "text", icon: Type, label: "Text" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Annotate Screenshot</DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 pb-2 border-b">
          <div className="flex gap-1 p-1 rounded-lg bg-muted">
            {tools.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTool(t.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    tool === t.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="flex gap-1 items-center">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-5 h-5 rounded-full border-2 transition-all ${color === c ? "border-primary scale-125" : "border-border"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <select value={lineWidth} onChange={(e) => setLineWidth(Number(e.target.value))} className="text-xs border rounded px-2 py-1 bg-background">
            <option value={2}>Thin</option>
            <option value={3}>Medium</option>
            <option value={5}>Thick</option>
            <option value={8}>Extra Thick</option>
          </select>

          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={undo} disabled={actions.length === 0}><Undo2 className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={redo} disabled={undoneActions.length === 0}><Redo2 className="w-3.5 h-3.5" /></Button>
          </div>

          <div className="flex-1" />
          <Button size="sm" onClick={handleSave}><Save className="w-4 h-4 mr-1" /> Save</Button>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto rounded-lg bg-muted/50 flex items-center justify-center p-4">
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-[60vh] cursor-crosshair rounded shadow-lg"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => { if (drawing) handleMouseUp({ clientX: 0, clientY: 0 } as any); }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AnnotationEditor;
