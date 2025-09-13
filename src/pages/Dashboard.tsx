import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProjectSidebar } from "@/components/dashboard/ProjectSidebar";
import { ProjectView } from "@/components/dashboard/ProjectView";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Navigate } from "react-router-dom";

export interface Project {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_ai_responding: string | null;
  is_awaiting_ai: string | null;
}

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectsLoading, setProjectsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
      
      // Select first project if none selected
      if (!selectedProject && data && data.length > 0) {
        setSelectedProject(data[0]);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setProjectsLoading(false);
    }
  };

  const createProject = async (title: string) => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .insert([{ title, user_id: user!.id }])
        .select()
        .single();

      if (error) throw error;
      
      const newProject = data as Project;
      setProjects([newProject, ...projects]);
      setSelectedProject(newProject);
      toast.success("Project created successfully");
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project");
    }
  };

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", projectId)
        .select()
        .single();

      if (error) throw error;

      const updatedProject = data as Project;
      setProjects(projects.map(p => p.id === projectId ? updatedProject : p));
      
      if (selectedProject?.id === projectId) {
        setSelectedProject(updatedProject);
      }
      
      toast.success("Project updated successfully");
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project");
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      setProjects(projects.filter(p => p.id !== projectId));
      
      if (selectedProject?.id === projectId) {
        const remainingProjects = projects.filter(p => p.id !== projectId);
        setSelectedProject(remainingProjects.length > 0 ? remainingProjects[0] : null);
      }
      
      toast.success("Project deleted successfully");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <ProjectSidebar
          projects={projects}
          selectedProject={selectedProject}
          onSelectProject={setSelectedProject}
          onCreateProject={createProject}
          onUpdateProject={updateProject}
          onDeleteProject={deleteProject}
          loading={projectsLoading}
        />
        <main className="flex-1">
          <ProjectView project={selectedProject} />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;