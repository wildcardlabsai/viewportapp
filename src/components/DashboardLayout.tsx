import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Camera, History, FolderOpen, Settings, LogOut, Menu, X, Moon, Sun, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import viewportLogo from "@/assets/viewport-logo.png";

const navItems = [
  { icon: Camera, label: "New Capture", path: "/dashboard" },
  { icon: History, label: "History", path: "/history" },
  { icon: FolderOpen, label: "Projects", path: "/projects" },
  { icon: Clock, label: "Schedules", path: "/schedules" },
  { icon: Users, label: "Team", path: "/team" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const DashboardLayout = ({ children, active }: { children: ReactNode; active: string }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");
    setDark(!dark);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navContent = (
    <>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => { navigate(item.path); setMobileOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              item.label === active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t space-y-1">
        <button onClick={toggleDark} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {dark ? "Light mode" : "Dark mode"}
        </button>
        <div className="px-3 py-1.5 text-xs text-muted-foreground truncate">{user?.email}</div>
        <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="w-64 border-r bg-card hidden lg:flex flex-col">
        <div className="p-4 border-b">
          <img src={viewportLogo} alt="Viewport" className="h-7" />
        </div>
        {navContent}
      </aside>

      {/* Mobile header + sheet */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center justify-between p-3 border-b bg-card">
          <img src={viewportLogo} alt="Viewport" className="h-6" />
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </header>

        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
            <aside className="relative w-64 bg-card border-r flex flex-col z-10">
              <div className="p-4 border-b flex items-center justify-between">
                <img src={viewportLogo} alt="Viewport" className="h-7" />
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {navContent}
            </aside>
          </div>
        )}

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
