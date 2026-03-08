import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Plus, FolderOpen, Loader2, Trash2, Pencil, Image, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [captureCounts, setCaptureCounts] = useState<Record<string, number>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const fetchProjects = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("projects").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) {
      setProjects(data);
      // Fetch capture counts per project
      const counts: Record<string, number> = {};
      for (const p of data) {
        const { count } = await supabase.from("capture_jobs").select("id", { count: "exact", head: true }).eq("project_id", p.id);
        counts[p.id] = count || 0;
      }
      setCaptureCounts(counts);
    }
    setLoading(false);
  };

  useEffect(() => { fetchProjects(); }, [user]);

  const handleCreate = async () => {
    if (!newName.trim() || !user) return;
    setCreating(true);
    const { error } = await supabase.from("projects").insert({ name: newName.trim(), user_id: user.id });
    if (error) toast.error(error.message);
    else { toast.success("Project created"); setNewName(""); fetchProjects(); }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Project deleted"); fetchProjects(); }
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    const { error } = await supabase.from("projects").update({ name: editName.trim() }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Project renamed"); setEditingId(null); fetchProjects(); }
  };

  return (
    <DashboardLayout active="Projects">
      <div className="max-w-3xl mx-auto p-6 lg:p-10">
        <h1 className="font-display text-3xl font-bold mb-8">Projects</h1>

        <div className="flex gap-3 mb-8">
          <Input placeholder="New project name…" value={newName} onChange={(e) => setNewName(e.target.value)} className="h-11" onKeyDown={(e) => e.key === "Enter" && handleCreate()} />
          <Button variant="brand" onClick={handleCreate} disabled={creating || !newName.trim()}>
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />} Create
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">No projects yet</p>
            <p className="text-sm">Create a project to organize your captures.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((p) => (
              <div key={p.id} className="p-4 rounded-xl border bg-card flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  {editingId === p.id ? (
                    <div className="flex items-center gap-2">
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 text-sm" onKeyDown={(e) => e.key === "Enter" && handleRename(p.id)} />
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRename(p.id)}><Check className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(null)}><X className="w-3.5 h-3.5" /></Button>
                    </div>
                  ) : (
                    <>
                      <p className="font-medium">{p.name}</p>
                      {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Image className="w-3 h-3" /> {captureCounts[p.id] || 0} captures
                        </span>
                      </div>
                    </>
                  )}
                </div>
                {editingId !== p.id && (
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingId(p.id); setEditName(p.name); }} title="Rename">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete project "{p.name}"?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this project. Captures assigned to it will not be deleted but will become unassigned.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(p.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Projects;
