import { Button } from "@/components/ui/button";
import { ChevronRight, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Project } from "@/pages/Dashboard";

interface DashboardHeaderProps {
  selectedProject: Project | null;
}

export const DashboardHeader = ({ selectedProject }: DashboardHeaderProps) => {
  const { user, signOut } = useAuth();

  return (
    <header className="h-16 bg-background border-b border-border px-6 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {/* Logo */}
        <div 
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => window.location.href = '/'}
        >
          <div className="w-8 h-8 bg-hero-gradient rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">R</span>
          </div>
          <span className="text-xl font-semibold text-foreground">RouteAI</span>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">Dashboard</span>
          {selectedProject && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground font-medium">{selectedProject.title}</span>
            </>
          )}
        </div>
      </div>

      {/* User info and sign out */}
      <div className="flex items-center space-x-4">
        <span className="text-sm text-muted-foreground">
          {user?.email}
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
      </div>
    </header>
  );
};