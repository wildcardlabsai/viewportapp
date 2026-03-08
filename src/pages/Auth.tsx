import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import pageframeLogo from "@/assets/pageframe-logo.png";

type AuthMode = "login" | "register" | "magic" | "sent" | "forgot" | "forgot-sent";

const Auth = () => {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) toast.error("Google sign-in failed: " + (error as Error).message);
    setGoogleLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  const handleEmailPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setSubmitting(true);
    if (mode === "register") {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      setSubmitting(false);
      if (error) toast.error(error.message);
      else { toast.success("Check your email to confirm your account!"); setMode("login"); }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setSubmitting(false);
      if (error) toast.error(error.message);
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
    if (error) toast.error(error.message);
    else setMode("sent");
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) toast.error(error.message);
    else setMode("forgot-sent");
  };

  const showDemoOrDivider = mode !== "sent" && mode !== "forgot-sent";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={pageframeLogo} alt="PageFrame" className="h-8 mx-auto mb-6" />
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
          ) : mode === "forgot-sent" ? (
            <>
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold mb-2">Check your email</h1>
              <p className="text-muted-foreground text-sm">
                We sent a password reset link to <strong className="text-foreground">{email}</strong>
              </p>
            </>
          ) : mode === "forgot" ? (
            <>
              <h1 className="font-display text-2xl font-bold mb-2">Reset your password</h1>
              <p className="text-muted-foreground text-sm">Enter your email and we'll send you a reset link.</p>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold mb-2">
                {mode === "register" ? "Create your account" : mode === "magic" ? "Sign in to PageFrame" : "Sign in to PageFrame"}
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

        {mode === "sent" || mode === "forgot-sent" ? (
          <Button variant="outline" className="w-full h-11" onClick={() => { setMode("login"); setEmail(""); }}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to sign in
          </Button>
        ) : mode === "forgot" ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <Label htmlFor="email" className="mb-2 block">Email address</Label>
              <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" required autoFocus />
            </div>
            <Button type="submit" variant="brand" className="w-full h-11" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
              Send reset link
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setMode("login")}>
              Back to sign in
            </Button>
          </form>
        ) : mode === "magic" ? (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div>
              <Label htmlFor="email" className="mb-2 block">Email address</Label>
              <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" required autoFocus />
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
            {/* Google Sign In */}
            <Button type="button" variant="outline" className="w-full h-11" onClick={handleGoogleSignIn} disabled={googleLoading}>
              {googleLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              Continue with Google
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">or</span></div>
            </div>

            <div>
              <Label htmlFor="email" className="mb-2 block">Email address</Label>
              <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" required autoFocus />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="password">Password</Label>
                {mode === "login" && (
                  <button type="button" className="text-xs text-primary hover:underline" onClick={() => setMode("forgot")}>
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 pr-10" required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" variant="brand" className="w-full h-11" disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {mode === "register" ? "Create account" : "Sign in"}
            </Button>

            <Button type="button" variant="outline" className="w-full h-11" onClick={() => setMode("magic")}>
              <Mail className="w-4 h-4 mr-2" /> Sign in with magic link
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

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Auth;
