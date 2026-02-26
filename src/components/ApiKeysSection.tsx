import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Key, Plus, Trash2, Copy, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
}

const generateKey = () => {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return "vp_" + Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
};

const hashKey = async (key: string) => {
  const encoded = new TextEncoder().encode(key);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
};

const ApiKeysSection = () => {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchKeys = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("api_keys")
      .select("id, name, key_prefix, created_at, last_used_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setKeys(data);
    setLoading(false);
  };

  useEffect(() => { fetchKeys(); }, [user]);

  const handleCreate = async () => {
    if (!user || !newKeyName.trim()) return;
    setCreating(true);
    try {
      const rawKey = generateKey();
      const keyHash = await hashKey(rawKey);
      const keyPrefix = rawKey.substring(0, 10) + "...";

      const { error } = await supabase.from("api_keys").insert({
        user_id: user.id,
        name: newKeyName.trim(),
        key_hash: keyHash,
        key_prefix: keyPrefix,
      });

      if (error) throw error;
      setRevealedKey(rawKey);
      setNewKeyName("");
      setShowForm(false);
      fetchKeys();
      toast.success("API key created! Copy it now — it won't be shown again.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("api_keys").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Key revoked"); fetchKeys(); }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("Copied to clipboard");
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <Key className="w-5 h-5 text-primary" /> API Keys
      </div>

      {revealedKey && (
        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
          <p className="text-sm font-medium text-primary">🔑 New API Key (copy now — shown only once):</p>
          <div className="flex gap-2">
            <code className="flex-1 text-xs bg-muted p-2 rounded font-mono break-all">{revealedKey}</code>
            <Button variant="outline" size="icon" className="shrink-0" onClick={() => copyKey(revealedKey)}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setRevealedKey(null)}>Dismiss</Button>
        </div>
      )}

      <div className="p-5 rounded-xl border bg-card space-y-4">
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : keys.length === 0 && !showForm ? (
          <p className="text-sm text-muted-foreground">No API keys yet. Create one to access the API programmatically.</p>
        ) : (
          <div className="space-y-2">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{k.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{k.key_prefix}</p>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(k.created_at).toLocaleDateString()}
                    {k.last_used_at && ` · Last used ${new Date(k.last_used_at).toLocaleDateString()}`}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(k.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {showForm ? (
          <div className="flex gap-2">
            <Input placeholder="Key name (e.g. CI/CD)" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreate()} />
            <Button variant="brand" onClick={handleCreate} disabled={creating || !newKeyName.trim()}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-1" /> Create API Key
          </Button>
        )}
      </div>
    </section>
  );
};

export default ApiKeysSection;
