import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import pageframeLogo from "@/assets/pageframe-logo.png";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <img src={pageframeLogo} alt="PageFrame" className="h-8 mx-auto mb-8 cursor-pointer" onClick={() => navigate(user ? "/dashboard" : "/")} />
        <h1 className="font-display text-7xl font-bold text-primary mb-4">404</h1>
        <p className="text-xl font-medium mb-2">Page not found</p>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button variant="brand" onClick={() => navigate(user ? "/dashboard" : "/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {user ? "Back to Dashboard" : "Back to Home"}
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
