import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Download, ExternalLink, RefreshCw, Loader2, AlertCircle, CheckCircle, Clock, XCircle, Share2, Monitor, Pencil, GitCompare, FileText, FolderOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import MockupDialog from "@/components/MockupDialog";
import AnnotationEditor from "@/components/AnnotationEditor";
import CompareDialog from "@/components/CompareDialog";

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
  project_id: string | null;
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

interface Project {
  id: string;
  name: string;
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
  const [mockupData, setMockupData] = useState<{ imageUrl: string; sourceUrl: string } | null>(null);
  const [annotateUrl, setAnnotateUrl] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filterProject, setFilterProject] = useState<string>("all");
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [jobsRes, assetsRes, projectsRes] = await Promise.all([
      supabase.from("capture_jobs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("capture_assets").select("*").eq("user_id", user.id),
      supabase.from("projects").select("id, name").eq("user_id", user.id).order("name"),
    ]);
    if (jobsRes.data) setJobs(jobsRes.data);
    if (assetsRes.data) setAssets(assetsRes.data);
    if (projectsRes.data) setProjects(projectsRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const getAsset = (jobId: string) => assets.find((a) => a.job_id === jobId);

  const filteredJobs = filterProject === "all"
    ? jobs
    : filterProject === "none"
      ? jobs.filter((j) => !j.project_id)
      : jobs.filter((j) => j.project_id === filterProject);

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

  const deleteCapture = async (jobId: string) => {
    const jobAssets = assets.filter((a) => a.job_id === jobId);
    // Delete assets first
    for (const a of jobAssets) {
      await supabase.from("capture_assets").delete().eq("id", a.id);
    }
    // Delete share links for those assets
    for (const a of jobAssets) {
      await supabase.from("share_links").delete().eq("asset_id", a.id);
    }
    toast.success("Capture deleted");
    fetchData();
  };

  const toggleCompareSelection = (assetUrl: string) => {
    setSelectedForCompare((prev) =>
      prev.includes(assetUrl) ? prev.filter((u) => u !== assetUrl) : prev.length < 2 ? [...prev, assetUrl] : [prev[1], assetUrl]
    );
  };

  const getProjectName = (projectId: string | null) => {
    if (!projectId) return null;
    return projects.find((p) => p.id === projectId)?.name;
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const formatSize = (b: number | null) => b ? `${(b / 1024).toFixed(0)} KB` : "";

  const isPdf = (format: string) => format === "pdf";

  return (
    <DashboardLayout active="History">
      <div className="max-w-5xl mx-auto p-6 lg:p-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl font-bold">History</h1>
          <div className="flex items-center gap-2">
            {selectedForCompare.length === 2 && (
              <Button variant="outline" size="sm" onClick={() => setCompareOpen(true)}>
                <GitCompare className="w-4 h-4 mr-1" /> Compare
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="w-48"><SelectValue placeholder="All projects" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              <SelectItem value="none">No project</SelectItem>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {selectedForCompare.length > 0 && (
            <span className="text-xs text-muted-foreground">{selectedForCompare.length}/2 selected for comparison</span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">No captures yet</p>
            <p className="text-sm">Go to New Capture to take your first screenshot.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map((job) => {
              const asset = getAsset(job.id);
              const s = statusConfig[job.status] || statusConfig.queued;
              const StatusIcon = s.icon;
              const projectName = getProjectName(job.project_id);
              const isSelected = asset ? selectedForCompare.includes(asset.file_url) : false;
              return (
                <div key={job.id} className="flex items-center gap-4 p-4 rounded-xl border bg-card">
                  {/* Compare checkbox */}
                  {asset && !isPdf(job.output_format) && (
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleCompareSelection(asset.file_url)}
                    />
                  )}

                  {asset ? (
                    isPdf(job.output_format) ? (
                      <a href={asset.file_url} target="_blank" rel="noopener noreferrer" className="w-20 h-14 rounded-lg bg-muted flex items-center justify-center border hover:bg-muted/80">
                        <FileText className="w-6 h-6 text-muted-foreground" />
                      </a>
                    ) : (
                      <img src={asset.file_url} alt="" className="w-20 h-14 rounded-lg object-cover bg-muted border" />
                    )
                  ) : (
                    <div className="w-20 h-14 rounded-lg bg-muted flex items-center justify-center">
                      <StatusIcon className={`w-5 h-5 ${s.className}`} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{job.url}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs text-muted-foreground">
                        {job.device_preset} · {job.viewport_width}×{job.viewport_height} · {job.output_format.toUpperCase()} · {formatDate(job.created_at)}
                      </p>
                      {projectName && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          <FolderOpen className="w-3 h-3 inline mr-0.5" />{projectName}
                        </span>
                      )}
                    </div>
                    {job.error_message && <p className="text-xs text-destructive mt-1 truncate">{job.error_message}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium flex items-center gap-1 ${s.className}`}>
                      <StatusIcon className={`w-3.5 h-3.5 ${s.className}`} /> {s.label}
                    </span>
                    {asset && (
                      <>
                        {asset.file_size_bytes && <span className="text-xs text-muted-foreground">{formatSize(asset.file_size_bytes)}</span>}
                        {!isPdf(job.output_format) && (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAnnotateUrl(asset.file_url)} title="Annotate">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs font-medium" onClick={() => setMockupData({ imageUrl: asset.file_url, sourceUrl: job.url })}>
                              <Monitor className="w-3.5 h-3.5" />
                              Mockup
                            </Button>
                          </>
                        )}
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
                    {/* Delete button */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete capture?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this capture and its assets. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteCapture(job.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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

      <MockupDialog
        open={!!mockupData}
        onOpenChange={(open) => !open && setMockupData(null)}
        imageUrl={mockupData?.imageUrl ?? ""}
        sourceUrl={mockupData?.sourceUrl}
        userId={user?.id}
      />

      <AnnotationEditor
        open={!!annotateUrl}
        onOpenChange={(open) => !open && setAnnotateUrl(null)}
        imageUrl={annotateUrl ?? ""}
      />

      {selectedForCompare.length === 2 && (
        <CompareDialog
          open={compareOpen}
          onOpenChange={setCompareOpen}
          imageA={selectedForCompare[0]}
          imageB={selectedForCompare[1]}
        />
      )}
    </DashboardLayout>
  );
};

export default History;
