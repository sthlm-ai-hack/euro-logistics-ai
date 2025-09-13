import { Button } from "@/components/ui/button";
import { ChevronRight, LogOut, Menu, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import type { Project } from "@/pages/Dashboard";

interface DashboardHeaderProps {
  selectedProject: Project | null;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export const DashboardHeader = ({ selectedProject, onToggleSidebar, sidebarOpen }: DashboardHeaderProps) => {
  const { user, signOut } = useAuth();

  return (
    <header className="h-16 bg-background border-b border-border px-6 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {/* Sidebar toggle button */}
        {onToggleSidebar && !sidebarOpen && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="h-8 w-8 p-0"
          >
            <Menu className="w-4 h-4" />
          </Button>
        )}
        
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

      {/* User info and actions */}
      <div className="flex items-center space-x-4">
        <span className="text-sm text-muted-foreground">
          {user?.email}
        </span>
        <Link to="/settings">
          <Button variant="ghost" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </Link>
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