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
import { cn } from "@/lib/utils";
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

interface ProjectItemProps {
  project: Project;
  isSelected: boolean;
  isEditing: boolean;
  editTitle: string;
  onSelect: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditTitleChange: (title: string) => void;
  onDelete: () => void;
}

const ProjectItem = ({
  project,
  isSelected,
  isEditing,
  editTitle,
  onSelect,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditTitleChange,
  onDelete,
}: ProjectItemProps) => {
  const getStatusBadges = () => {
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
    <div className="group">
      <div
        onClick={onSelect}
        className={cn(
          "relative flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 border",
          isSelected
            ? "bg-slate-200 border-slate-300 text-slate-900 shadow-sm"
            : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
        )}
      >
        <div className="flex-1 min-w-0 mr-2">
          {isEditing ? (
            <Input
              value={editTitle}
              onChange={(e) => onEditTitleChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveEdit();
                if (e.key === "Escape") onCancelEdit();
              }}
              onBlur={onSaveEdit}
              className="h-7 text-sm bg-background"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-sm font-medium truncate block">
              {project.title}
            </span>
          )}
        </div>
        
        {!isEditing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onStartEdit();
              }}
              className="h-7 w-7 p-0 hover:bg-accent/60"
            >
              <Settings className="w-3 h-3" />
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
                    onClick={onDelete}
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
      
      {isSelected && getStatusBadges().length > 0 && (
        <div className="flex gap-1 mt-2 ml-3">
          {getStatusBadges()}
        </div>
      )}
    </div>
  );
};

export const ProjectSidebar = ({
  projects,
  selectedProject,
  onSelectProject,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  loading,
}: ProjectSidebarProps) => {
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

  const handleStartEdit = (project: Project) => {
    setEditingProject(project);
    setEditTitle(project.title);
  };

  const handleSaveEdit = () => {
    if (editingProject && editTitle.trim()) {
      onUpdateProject(editingProject.id, { title: editTitle.trim() });
      setEditingProject(null);
      setEditTitle("");
    }
  };

  const handleCancelEdit = () => {
    setEditingProject(null);
    setEditTitle("");
  };

  return (
    <div className="h-full flex flex-col bg-card/30 border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/50">
        <h2 className="text-lg font-semibold mb-3">Projects</h2>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" size="sm">
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
                placeholder="Enter project title"
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

      {/* Project List */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <div className="text-sm">Loading projects...</div>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Plus className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No projects yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create your first project to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map((project) => (
              <ProjectItem
                key={project.id}
                project={project}
                isSelected={selectedProject?.id === project.id}
                isEditing={editingProject?.id === project.id}
                editTitle={editTitle}
                onSelect={() => onSelectProject(project)}
                onStartEdit={() => handleStartEdit(project)}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                onEditTitleChange={setEditTitle}
                onDelete={() => onDeleteProject(project.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};