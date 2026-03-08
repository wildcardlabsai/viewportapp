import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Monitor, Smartphone, Tablet, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import pageframeLogo from "@/assets/pageframe-logo.png";

const Navbar = () => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-2">
          <img src={pageframeLogo} alt="PageFrame" className="h-8" />
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>Log in</Button>
          <Button variant="brand" size="sm" onClick={() => navigate("/auth")}>Start free</Button>
        </div>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden border-t bg-card/95 backdrop-blur-lg"
        >
          <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
            <a href="#features" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2">Features</a>
            <a href="#pricing" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2">Pricing</a>
            <a href="#faq" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2">FAQ</a>
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="ghost" size="sm" className="flex-1" onClick={() => { navigate("/auth"); setMobileOpen(false); }}>Log in</Button>
              <Button variant="brand" size="sm" className="flex-1" onClick={() => { navigate("/auth"); setMobileOpen(false); }}>Start free</Button>
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
};

const Hero = () => {
  const navigate = useNavigate();
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      <div className="absolute inset-0 bg-brand-gradient-subtle" />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
      
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Capture pixel-perfect{" "}
            <span className="text-gradient">screenshots</span>{" "}
            on any device
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            PageFrame renders your site, waits for animations, and exports clean, sharp screenshots — ready for marketing, docs, and audits.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="brand" size="xl" onClick={() => navigate("/auth")}>
              Start free <ArrowRight className="ml-1 h-5 w-5" />
            </Button>
            <Button variant="brand-outline" size="xl" onClick={() => {
              document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
            }}>
              View pricing
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-20 max-w-5xl mx-auto"
        >
          <div className="relative">
            <div className="absolute -inset-4 bg-brand-gradient rounded-3xl opacity-10 blur-2xl" />
            <div className="relative bg-card rounded-2xl border shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-accent/60" />
                  <div className="w-3 h-3 rounded-full bg-primary/30" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 bg-background rounded-md text-xs text-muted-foreground w-64 text-center">
                    pageframe.app
                  </div>
                </div>
              </div>
              <div className="p-8 bg-muted/30 min-h-[300px] flex items-center justify-center">
                <div className="flex items-end gap-6">
                  <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 0 }} className="bg-card rounded-lg border shadow-lg p-3 w-48">
                    <Monitor className="w-5 h-5 text-primary mb-2" />
                    <div className="h-2 bg-primary/20 rounded mb-1.5 w-full" />
                    <div className="h-2 bg-primary/10 rounded w-3/4" />
                    <div className="mt-3 h-20 bg-brand-gradient-subtle rounded" />
                  </motion.div>
                  <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }} className="bg-card rounded-lg border shadow-lg p-2 w-20">
                    <Smartphone className="w-4 h-4 text-accent mb-1.5 mx-auto" />
                    <div className="h-1.5 bg-accent/20 rounded mb-1 w-full" />
                    <div className="h-1.5 bg-accent/10 rounded w-2/3" />
                    <div className="mt-2 h-24 bg-brand-gradient-subtle rounded" />
                  </motion.div>
                  <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} className="bg-card rounded-lg border shadow-lg p-2.5 w-32">
                    <Tablet className="w-4 h-4 text-primary mb-1.5" />
                    <div className="h-1.5 bg-primary/20 rounded mb-1 w-full" />
                    <div className="h-1.5 bg-primary/10 rounded w-1/2" />
                    <div className="mt-2 h-28 bg-brand-gradient-subtle rounded" />
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export { Navbar, Hero };
