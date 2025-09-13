import { Bot, Clock, Calendar, MessageSquare, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Map from "@/components/Map";
import { ProjectChat } from "./ProjectChat";
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
    <div className="flex h-full">
      {/* Main map area */}
      <div className="flex-1 relative">
        <Map />
      </div>

      {/* Right sidebar with tabs */}
      <div className="w-80 border-l bg-background flex flex-col">
        <div className="p-4 border-b">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">{project.title}</h2>
            <div className="flex flex-col gap-2">
              {isAiResponding && (
                <Badge variant="secondary" className="text-xs w-fit">
                  <Bot className="w-3 h-3 mr-1" />
                  AI Responding
                </Badge>
              )}
              {isAwaitingAi && (
                <Badge variant="outline" className="text-xs w-fit">
                  <Clock className="w-3 h-3 mr-1" />
                  Awaiting AI
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="details" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-4 mt-4 mb-0 justify-self-center max-w-md">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              AI Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="flex-1 p-4 pt-2 space-y-4 overflow-y-auto m-0">
            <Card className="border-0 shadow-none bg-muted/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Project Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div>
                  <div className="font-medium text-muted-foreground">Created</div>
                  <div>{formatDate(project.created_at)}</div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Updated</div>
                  <div>{formatDate(project.updated_at)}</div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">ID</div>
                  <div className="font-mono break-all">{project.id}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-none bg-muted/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  AI Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div>
                  <div className="font-medium text-muted-foreground">AI Responding</div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isAiResponding ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                    <span>{isAiResponding ? 'Active' : 'Inactive'}</span>
                  </div>
                  {isAiResponding && project.is_ai_responding && (
                    <div className="text-muted-foreground">
                      Since {formatDate(project.is_ai_responding)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Awaiting AI</div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isAwaitingAi ? 'bg-yellow-500' : 'bg-muted-foreground/30'}`} />
                    <span>{isAwaitingAi ? 'Waiting' : 'Not waiting'}</span>
                  </div>
                  {isAwaitingAi && project.is_awaiting_ai && (
                    <div className="text-muted-foreground">
                      Since {formatDate(project.is_awaiting_ai)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="flex-1 m-0">
            <ProjectChat project={project} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};