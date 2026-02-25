import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Plus, FolderOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const fetchProjects = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("projects").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setProjects(data);
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
                <div>
                  <p className="font-medium">{p.name}</p>
                  {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{new Date(p.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Projects;
