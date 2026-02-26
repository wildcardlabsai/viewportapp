import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Users, Plus, Trash2, Loader2, Crown, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

interface Team {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  created_at: string;
}

const roleIcons: Record<string, typeof Crown> = { owner: Crown, admin: Shield, member: User };

const Team = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTeamName, setNewTeamName] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");

  const fetchData = async () => {
    if (!user) return;
    const { data: teamsData } = await supabase
      .from("teams")
      .select("*")
      .order("created_at", { ascending: false });
    if (teamsData) {
      setTeams(teamsData);
      if (teamsData.length > 0 && !selectedTeam) setSelectedTeam(teamsData[0].id);
    }
    setLoading(false);
  };

  const fetchMembers = async (teamId: string) => {
    const { data } = await supabase.from("team_members").select("*").eq("team_id", teamId);
    if (data) setMembers(data);
  };

  useEffect(() => { fetchData(); }, [user]);
  useEffect(() => { if (selectedTeam) fetchMembers(selectedTeam); }, [selectedTeam]);

  const handleCreateTeam = async () => {
    if (!user || !newTeamName.trim()) return;
    setCreating(true);
    const { data, error } = await supabase
      .from("teams")
      .insert({ name: newTeamName.trim(), owner_id: user.id })
      .select()
      .single();
    if (error) { toast.error(error.message); setCreating(false); return; }
    // Add self as owner member
    await supabase.from("team_members").insert({ team_id: data.id, user_id: user.id, role: "owner" });
    toast.success("Team created!");
    setNewTeamName("");
    setSelectedTeam(data.id);
    fetchData();
    setCreating(false);
  };

  const handleDeleteTeam = async (id: string) => {
    const { error } = await supabase.from("teams").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Team deleted"); setSelectedTeam(null); fetchData(); }
  };

  const handleRemoveMember = async (memberId: string) => {
    const { error } = await supabase.from("team_members").delete().eq("id", memberId);
    if (error) toast.error(error.message);
    else { toast.success("Member removed"); if (selectedTeam) fetchMembers(selectedTeam); }
  };

  const currentTeam = teams.find((t) => t.id === selectedTeam);
  const isOwner = currentTeam?.owner_id === user?.id;

  return (
    <DashboardLayout active="Team">
      <div className="max-w-3xl mx-auto p-6 lg:p-10">
        <h1 className="font-display text-3xl font-bold mb-8">Team</h1>

        {/* Create team */}
        <div className="flex gap-3 mb-8">
          <Input placeholder="New team name…" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} className="h-11" onKeyDown={(e) => e.key === "Enter" && handleCreateTeam()} />
          <Button variant="brand" onClick={handleCreateTeam} disabled={creating || !newTeamName.trim()}>
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />} Create
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : teams.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">No teams yet</p>
            <p className="text-sm">Create a team to collaborate on projects.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Team selector */}
            <div className="flex gap-2 flex-wrap">
              {teams.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTeam(t.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedTeam === t.id
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>

            {currentTeam && (
              <div className="p-5 rounded-xl border bg-card space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{currentTeam.name}</h2>
                  {isOwner && (
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteTeam(currentTeam.id)}>
                      <Trash2 className="w-4 h-4 mr-1" /> Delete Team
                    </Button>
                  )}
                </div>

                {/* Members */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Members ({members.length})</p>
                  {members.map((m) => {
                    const RoleIcon = roleIcons[m.role] || User;
                    return (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                        <div className="flex items-center gap-2">
                          <RoleIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-mono">{m.user_id.substring(0, 8)}…</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted capitalize">{m.role}</span>
                        </div>
                        {isOwner && m.role !== "owner" && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveMember(m.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <p className="text-xs text-muted-foreground">
                  Team member invitations require knowing the user's ID. Full email-based invites coming soon.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Team;
