import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import viewportLogo from "@/assets/viewport-logo.png";

type AuthMode = "login" | "register" | "magic" | "sent";

const Auth = () => {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleDemoSignIn = async () => {
    setDemoLoading(true);
    const demoEmail = "demo@viewport-app.com";
    const demoPassword = "demo123456";

    // Try sign in first, if fails create the account then sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: demoPassword,
    });

    if (signInError) {
      await supabase.auth.signUp({ email: demoEmail, password: demoPassword });
      const { error } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });
      if (error) toast.error("Demo sign-in failed: " + error.message);
    }
    setDemoLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleEmailPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setSubmitting(true);
    if (mode === "register") {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      setSubmitting(false);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Check your email to confirm your account!");
        setMode("login");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setSubmitting(false);
      if (error) {
        toast.error(error.message);
      }
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
    } else {
      setMode("sent");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={viewportLogo} alt="Viewport" className="h-8 mx-auto mb-6" />
          {mode === "sent" ? (
            <>
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold mb-2">Check your email</h1>
              <p className="text-muted-foreground text-sm">
                We sent a magic link to <strong className="text-foreground">{email}</strong>
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold mb-2">
                {mode === "register" ? "Create your account" : "Sign in to Viewport"}
              </h1>
              <p className="text-muted-foreground text-sm">
                {mode === "register"
                  ? "Enter your details to get started."
                  : mode === "magic"
                  ? "Enter your email to receive a magic sign-in link."
                  : "Enter your credentials to continue."}
              </p>
            </>
          )}
        </div>

        {mode === "sent" ? (
          <Button
            variant="outline"
            className="w-full h-11"
            onClick={() => {
              setMode("login");
              setEmail("");
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to sign in
          </Button>
        ) : mode === "magic" ? (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div>
              <Label htmlFor="email" className="mb-2 block">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
                required
                autoFocus
              />
            </div>
            <Button type="submit" variant="brand" className="w-full h-11" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
              Send magic link
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setMode("login")}>
              Back to sign in with password
            </Button>
          </form>
        ) : (
          <form onSubmit={handleEmailPassword} className="space-y-4">
            <div>
              <Label htmlFor="email" className="mb-2 block">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
                required
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="password" className="mb-2 block">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" variant="brand" className="w-full h-11" disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {mode === "register" ? "Create account" : "Sign in"}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <Button type="button" variant="outline" className="w-full h-11" onClick={() => setMode("magic")}>
              <Mail className="w-4 h-4 mr-2" />
              Sign in with magic link
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {mode === "register" ? (
                <>Already have an account?{" "}<button type="button" className="text-primary hover:underline font-medium" onClick={() => setMode("login")}>Sign in</button></>
              ) : (
                <>Don't have an account?{" "}<button type="button" className="text-primary hover:underline font-medium" onClick={() => setMode("register")}>Sign up</button></>
              )}
            </p>
          </form>
        )}

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">or</span></div>
        </div>

        <Button
          variant="outline"
          className="w-full h-11"
          onClick={handleDemoSignIn}
          disabled={demoLoading}
        >
          {demoLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          🚀 Sign in as Demo User
        </Button>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Auth;
