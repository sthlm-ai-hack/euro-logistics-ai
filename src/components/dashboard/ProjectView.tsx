import { useState, useEffect } from "react";
import { Bot, Clock, Calendar, MessageSquare, Info, Calculator, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Map from "@/components/Map";
import { ProjectChat } from "./ProjectChat";
import { ComputeResults } from "./ComputeResults";
import { ChangedNodes } from "./ChangedNodes";
import type { Project } from "@/pages/Dashboard";

interface ProjectViewProps {
  project: Project | null;
}

export const ProjectView = ({ project }: ProjectViewProps) => {
  const [activeFlowVisualization, setActiveFlowVisualization] = useState<string | null>(null);
  const [flowVisualizationData, setFlowVisualizationData] = useState<any | null>(null);
  const [hasSetDefault, setHasSetDefault] = useState(false);

  // Load default visualization on project change
  useEffect(() => {
    const loadDefaultVisualization = async () => {
      if (!project?.id || hasSetDefault) return;
      
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data, error } = await supabase
          .from('compute_results')
          .select('*')
          .eq('project_id', project.id)
          .eq('function', 'min cost flow')
          .eq('is_pending', false)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const validResult = data?.find(result => {
          const edges = result.result?.edges || [];
          return edges.some((edge: any) => edge.geometry && Array.isArray(edge.geometry) && edge.geometry.length > 0);
        });

        if (validResult) {
          setActiveFlowVisualization(validResult.id);
          setFlowVisualizationData(validResult.result);
          setHasSetDefault(true);
        }
      } catch (error) {
        console.error('Error loading default visualization:', error);
      }
    };

    loadDefaultVisualization();
  }, [project?.id, hasSetDefault]);

  const handleFlowVisualizationToggle = (flowData: any | null, resultId: string) => {
    if (flowData) {
      setActiveFlowVisualization(resultId);
      setFlowVisualizationData(flowData);
    } else {
      setActiveFlowVisualization(null);
      setFlowVisualizationData(null);
    }
  };

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
    <div className="flex h-full w-full overflow-hidden">
      {/* Main map area */}
      <div className="flex-1 min-w-0 relative">
        <Map project={project} flowVisualizationData={flowVisualizationData} />
      </div>

      {/* Right sidebar with tabs */}
      <div className="w-96 flex-shrink-0 border-l bg-background flex flex-col h-full">
        <div className="p-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">{project.title}</h2>
            <div className="flex items-center gap-2">
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

        <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-4 mx-auto mt-2 mb-0 max-w-lg flex-shrink-0">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              AI Chat
            </TabsTrigger>
            <TabsTrigger value="compute" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Compute
            </TabsTrigger>
            <TabsTrigger value="nodes" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Nodes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="flex-1 p-4 pt-2 space-y-4 overflow-y-auto m-0 min-h-0">
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

          <TabsContent value="chat" className="flex-1 m-0 min-h-0">
            <ProjectChat project={project} />
          </TabsContent>

          <TabsContent value="compute" className="flex-1 overflow-y-auto mt-4 px-4">
            <ComputeResults 
              projectId={project.id} 
              onFlowVisualizationToggle={handleFlowVisualizationToggle}
              activeFlowVisualization={activeFlowVisualization}
            />
          </TabsContent>

          <TabsContent value="nodes" className="flex-1 overflow-y-auto mt-4 px-4">
            <ChangedNodes projectId={project.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};