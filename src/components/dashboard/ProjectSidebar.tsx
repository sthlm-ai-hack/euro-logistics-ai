import { useState } from "react";
import { Plus, Settings, Trash2, Bot, Clock } from "lucide-react";
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
    <div className="h-full flex flex-col bg-card">
      <div className="p-4 border-b bg-card">
        <h2 className="text-lg font-semibold">Projects</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full mt-3">
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
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Your Projects</h3>
          {loading ? (
            <div className="text-center text-muted-foreground py-8">
              Loading projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No projects yet. Create your first project!
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <div key={project.id} className="space-y-2">
                  <div
                    onClick={() => onSelectProject(project)}
                    className={`w-full p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedProject?.id === project.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card hover:bg-secondary border border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
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
                            className="h-8 text-sm"
                            autoFocus
                          />
                        ) : (
                          <span className="truncate font-medium">{project.title}</span>
                        )}
                      </div>
                      {editingProject?.id !== project.id && (
                        <div className="flex gap-1 ml-2">
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
                    </div>
                  </div>
                  
                  {selectedProject?.id === project.id && getStatusBadges(project).length > 0 && (
                    <div className="flex gap-1 px-3 pb-2">
                      {getStatusBadges(project)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};