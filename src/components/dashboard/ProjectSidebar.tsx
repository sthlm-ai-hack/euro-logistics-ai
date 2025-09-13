import { useState } from "react";
import { Plus, Settings, Trash2, Bot, Clock, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import type { Project } from "@/pages/Dashboard";

interface ProjectSidebarProps {
  projects: Project[];
  selectedProject: Project | null;
  onSelectProject: (project: Project) => void;
  onCreateProject: (title: string) => void;
  onUpdateProject: (projectId: string, updates: Partial<Project>) => void;
  onDeleteProject: (projectId: string) => void;
  loading: boolean;
}

export const ProjectSidebar = ({
  projects,
  selectedProject,
  onSelectProject,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  loading,
}: ProjectSidebarProps) => {
  const { signOut, user } = useAuth();
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleCreateProject = () => {
    if (newProjectTitle.trim()) {
      onCreateProject(newProjectTitle.trim());
      setNewProjectTitle("");
      setIsCreateDialogOpen(false);
    }
  };

  const handleRenameProject = (project: Project) => {
    setEditingProject(project);
    setEditTitle(project.title);
  };

  const saveRename = () => {
    if (editingProject && editTitle.trim()) {
      onUpdateProject(editingProject.id, { title: editTitle.trim() });
      setEditingProject(null);
      setEditTitle("");
    }
  };

  const cancelRename = () => {
    setEditingProject(null);
    setEditTitle("");
  };

  const getStatusBadges = (project: Project) => {
    const badges = [];
    
    if (project.is_ai_responding) {
      badges.push(
        <Badge key="responding" variant="secondary" className="text-xs">
          <Bot className="w-3 h-3 mr-1" />
          AI Active
        </Badge>
      );
    }
    
    if (project.is_awaiting_ai) {
      badges.push(
        <Badge key="awaiting" variant="outline" className="text-xs">
          <Clock className="w-3 h-3 mr-1" />
          Waiting
        </Badge>
      );
    }
    
    return badges;
  };

  return (
    <Sidebar className="w-80">
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Projects</h2>
          <SidebarTrigger />
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full mt-2">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Project title"
                value={newProjectTitle}
                onChange={(e) => setNewProjectTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
              />
              <div className="flex gap-2">
                <Button onClick={handleCreateProject} disabled={!newProjectTitle.trim()}>
                  Create
                </Button>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Your Projects</SidebarGroupLabel>
          <SidebarGroupContent>
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading projects...
              </div>
            ) : projects.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No projects yet. Create your first project!
              </div>
            ) : (
              <SidebarMenu>
                {projects.map((project) => (
                  <SidebarMenuItem key={project.id}>
                    <div className="space-y-2">
                      <SidebarMenuButton
                        onClick={() => onSelectProject(project)}
                        isActive={selectedProject?.id === project.id}
                        className="w-full justify-start"
                      >
                        <div className="flex-1 min-w-0">
                          {editingProject?.id === project.id ? (
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveRename();
                                if (e.key === "Escape") cancelRename();
                              }}
                              onBlur={saveRename}
                              className="h-6 text-sm"
                              autoFocus
                            />
                          ) : (
                            <span className="truncate">{project.title}</span>
                          )}
                        </div>
                        {editingProject?.id !== project.id && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRenameProject(project);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Settings className="w-3 h-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Project</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{project.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => onDeleteProject(project.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </SidebarMenuButton>
                      
                      {selectedProject?.id === project.id && getStatusBadges(project).length > 0 && (
                        <div className="flex gap-1 px-2 pb-2">
                          {getStatusBadges(project)}
                        </div>
                      )}
                    </div>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            {user?.email}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={signOut}
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};