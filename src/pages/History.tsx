import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Download, ExternalLink, RefreshCw, Loader2, AlertCircle, CheckCircle, Clock, XCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

interface CaptureJob {
  id: string;
  url: string;
  device_preset: string;
  viewport_width: number;
  viewport_height: number;
  status: string;
  output_format: string;
  created_at: string;
  error_message: string | null;
}

interface CaptureAsset {
  id: string;
  job_id: string;
  file_url: string;
  format: string;
  width: number | null;
  height: number | null;
  file_size_bytes: number | null;
}

const statusConfig: Record<string, { icon: typeof CheckCircle; label: string; className: string }> = {
  completed: { icon: CheckCircle, label: "Completed", className: "text-green-600" },
  processing: { icon: Loader2, label: "Processing", className: "text-yellow-600 animate-spin" },
  queued: { icon: Clock, label: "Queued", className: "text-muted-foreground" },
  failed: { icon: XCircle, label: "Failed", className: "text-destructive" },
};

const History = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<CaptureJob[]>([]);
  const [assets, setAssets] = useState<CaptureAsset[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [jobsRes, assetsRes] = await Promise.all([
      supabase.from("capture_jobs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("capture_assets").select("*").eq("user_id", user.id),
    ]);
    if (jobsRes.data) setJobs(jobsRes.data);
    if (assetsRes.data) setAssets(assetsRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const getAsset = (jobId: string) => assets.find((a) => a.job_id === jobId);

  const shareCapture = async (assetId: string) => {
    if (!user) return;
    const slug = Math.random().toString(36).substring(2, 10);
    const { error } = await supabase.from("share_links").insert({
      asset_id: assetId,
      user_id: user.id,
      slug,
      allow_download: true,
    });
    if (error) { toast.error("Failed to create share link"); return; }
    const url = `${window.location.origin}/s/${slug}`;
    await navigator.clipboard.writeText(url);
    toast.success("Share link copied to clipboard!");
  };

  const retryJob = async (jobId: string) => {
    await supabase.from("capture_jobs").update({ status: "queued", error_message: null }).eq("id", jobId);
    const { error } = await supabase.functions.invoke("process-captures", { body: { job_ids: [jobId] } });
    if (error) toast.error("Retry failed");
    else { toast.success("Retrying…"); fetchData(); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const formatSize = (b: number | null) => b ? `${(b / 1024).toFixed(0)} KB` : "";

  return (
    <DashboardLayout active="History">
      <div className="max-w-5xl mx-auto p-6 lg:p-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-bold">History</h1>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">No captures yet</p>
            <p className="text-sm">Go to New Capture to take your first screenshot.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const asset = getAsset(job.id);
              const s = statusConfig[job.status] || statusConfig.queued;
              const StatusIcon = s.icon;
              return (
                <div key={job.id} className="flex items-center gap-4 p-4 rounded-xl border bg-card">
                  {asset ? (
                    <img src={asset.file_url} alt="" className="w-20 h-14 rounded-lg object-cover bg-muted border" />
                  ) : (
                    <div className="w-20 h-14 rounded-lg bg-muted flex items-center justify-center">
                      <StatusIcon className={`w-5 h-5 ${s.className}`} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{job.url}</p>
                    <p className="text-xs text-muted-foreground">
                      {job.device_preset} · {job.viewport_width}×{job.viewport_height} · {job.output_format.toUpperCase()} · {formatDate(job.created_at)}
                    </p>
                    {job.error_message && <p className="text-xs text-destructive mt-1 truncate">{job.error_message}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium flex items-center gap-1 ${s.className}`}>
                      <StatusIcon className={`w-3.5 h-3.5 ${s.className}`} /> {s.label}
                    </span>
                    {asset && (
                      <>
                        {asset.file_size_bytes && <span className="text-xs text-muted-foreground">{formatSize(asset.file_size_bytes)}</span>}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shareCapture(asset.id)} title="Share">
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <a href={asset.file_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="w-4 h-4" /></Button>
                        </a>
                        <a href={asset.file_url} download>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="w-4 h-4" /></Button>
                        </a>
                      </>
                    )}
                    {job.status === "failed" && (
                      <Button variant="outline" size="sm" onClick={() => retryJob(job.id)}>Retry</Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default History;
