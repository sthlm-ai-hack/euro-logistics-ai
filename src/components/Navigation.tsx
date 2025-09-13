import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";

const Navigation = () => {
  const { user, signOut } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authView, setAuthView] = useState<"signin" | "signup">("signin");

  const handleSignInClick = () => {
    setAuthView("signin");
    setAuthDialogOpen(true);
  };

  const handleSignUpClick = () => {
    setAuthView("signup");
    setAuthDialogOpen(true);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-hero-gradient rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">R</span>
            </div>
            <span className="text-xl font-semibold text-foreground">RouteAI</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors duration-300">
              Features
            </a>
            <a href="#demo" className="text-muted-foreground hover:text-foreground transition-colors duration-300">
              Demo
            </a>
            <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors duration-300">
              Contact
            </a>
          </div>
          
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {user.email}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={signOut}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={handleSignInClick}>
                  Sign In
                </Button>
                <Button variant="hero" size="sm" onClick={handleSignUpClick}>
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      
      <AuthDialog 
        open={authDialogOpen} 
        onOpenChange={setAuthDialogOpen}
        defaultView={authView}
      />
    </nav>
  );
};

export default Navigation;