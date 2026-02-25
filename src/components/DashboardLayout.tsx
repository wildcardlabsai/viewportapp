import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Camera, History, FolderOpen, Settings, LogOut } from "lucide-react";
import viewportLogo from "@/assets/viewport-logo.png";

const navItems = [
  { icon: Camera, label: "New Capture", path: "/dashboard" },
  { icon: History, label: "History", path: "/history" },
  { icon: FolderOpen, label: "Projects", path: "/projects" },
  { icon: Settings, label: "Settings", path: "/dashboard" },
];

const DashboardLayout = ({ children, active }: { children: ReactNode; active: string }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 border-r bg-card hidden lg:flex flex-col">
        <div className="p-4 border-b">
          <img src={viewportLogo} alt="Viewport" className="h-7" />
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
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
        <div className="p-3 border-t">
          <div className="px-3 py-1.5 mb-2 text-xs text-muted-foreground truncate">{user?.email}</div>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
};

export default DashboardLayout;
