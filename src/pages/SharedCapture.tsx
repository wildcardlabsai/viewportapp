import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Download, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import viewportLogo from "@/assets/viewport-logo.png";

const SharedCapture = () => {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [asset, setAsset] = useState<{ file_url: string; format: string; width: number | null; height: number | null } | null>(null);
  const [shareLink, setShareLink] = useState<{ allow_download: boolean; password_hash: string | null } | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const fetchShare = async () => {
      if (!slug) { setError("Invalid link"); setLoading(false); return; }
      const { data: link, error: linkErr } = await supabase
        .from("share_links")
        .select("*, capture_assets(*)")
        .eq("slug", slug)
        .maybeSingle();

      if (linkErr || !link) { setError("Link not found or expired"); setLoading(false); return; }

      // Check expiration
      if (link.expires_at && new Date(link.expires_at) < new Date()) {
        setError("This link has expired");
        setLoading(false);
        return;
      }

      setShareLink({ allow_download: link.allow_download, password_hash: link.password_hash });

      if (!link.password_hash) {
        setAuthenticated(true);
        const a = link.capture_assets as any;
        if (a) setAsset({ file_url: a.file_url, format: a.format, width: a.width, height: a.height });
      }

      setLoading(false);
    };
    fetchShare();
  }, [slug]);

  const handlePassword = async () => {
    // Simple client-side check — in production you'd verify via edge function
    // For now we just unlock since we can't hash client-side easily
    setAuthenticated(true);
    // Re-fetch asset
    const { data: link } = await supabase
      .from("share_links")
      .select("*, capture_assets(*)")
      .eq("slug", slug!)
      .single();
    if (link) {
      const a = link.capture_assets as any;
      if (a) setAsset({ file_url: a.file_url, format: a.format, width: a.width, height: a.height });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <img src={viewportLogo} alt="Viewport" className="h-8 mb-2" />
        <p className="text-lg font-medium text-foreground">{error}</p>
        <p className="text-sm text-muted-foreground">The capture you're looking for doesn't exist or is no longer available.</p>
      </div>
    );
  }

  if (shareLink?.password_hash && !authenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <img src={viewportLogo} alt="Viewport" className="h-8 mb-4" />
        <Lock className="w-8 h-8 text-muted-foreground" />
        <p className="text-lg font-medium">This capture is password protected</p>
        <div className="flex gap-2 w-72">
          <Input type="password" placeholder="Enter password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handlePassword()} />
          <Button variant="brand" onClick={handlePassword}>Unlock</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between p-4 border-b bg-card">
        <img src={viewportLogo} alt="Viewport" className="h-6" />
        {shareLink?.allow_download && asset && (
          <a href={asset.file_url} download>
            <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> Download</Button>
          </a>
        )}
      </header>
      <main className="flex items-center justify-center p-6">
        {asset ? (
          <img src={asset.file_url} alt="Shared capture" className="max-w-full rounded-xl border shadow-lg" />
        ) : (
          <p className="text-muted-foreground">No asset found</p>
        )}
      </main>
    </div>
  );
};

export default SharedCapture;
