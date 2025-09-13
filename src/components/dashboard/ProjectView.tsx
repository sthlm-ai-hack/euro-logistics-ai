import { Bot, Clock, Calendar, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/pages/Dashboard";

interface ProjectViewProps {
  project: Project | null;
}

export const ProjectView = ({ project }: ProjectViewProps) => {
  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="text-2xl font-medium text-muted-foreground">
            No Project Selected
          </div>
          <div className="text-muted-foreground">
            Select a project from the sidebar to view its details
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isAiResponding = !!project.is_ai_responding;
  const isAwaitingAi = !!project.is_awaiting_ai;

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{project.title}</h1>
        <div className="flex gap-2">
          {isAiResponding && (
            <Badge variant="secondary" className="text-sm">
              <Bot className="w-4 h-4 mr-2" />
              AI Responding
            </Badge>
          )}
          {isAwaitingAi && (
            <Badge variant="outline" className="text-sm">
              <Clock className="w-4 h-4 mr-2" />
              Awaiting AI Response
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Project Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Created</div>
              <div className="text-sm">{formatDate(project.created_at)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Last Updated</div>
              <div className="text-sm">{formatDate(project.updated_at)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Project ID</div>
              <div className="text-sm font-mono text-xs">{project.id}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              AI Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">AI Responding</div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isAiResponding ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-sm">
                  {isAiResponding ? 'Active' : 'Inactive'}
                </span>
                {isAiResponding && project.is_ai_responding && (
                  <span className="text-xs text-muted-foreground">
                    (since {formatDate(project.is_ai_responding)})
                  </span>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Awaiting AI</div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isAwaitingAi ? 'bg-yellow-500' : 'bg-gray-300'}`} />
                <span className="text-sm">
                  {isAwaitingAi ? 'Waiting' : 'Not waiting'}
                </span>
                {isAwaitingAi && project.is_awaiting_ai && (
                  <span className="text-xs text-muted-foreground">
                    (since {formatDate(project.is_awaiting_ai)})
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">
            This is where you can add more project-specific content, such as tasks, 
            files, or other project-related information. The project management system 
            is ready for your custom features.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};