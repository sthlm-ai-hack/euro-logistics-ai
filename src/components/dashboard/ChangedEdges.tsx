import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface ChangedEdge {
  id: string;
  osm_id: string;
  cost: number;
  cap: number;
  color: string;
  coordinates: any;
  project_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface ChangedEdgesProps {
  projectId: string;
}

export const ChangedEdges = ({ projectId }: ChangedEdgesProps) => {
  const { data: changedEdges, isLoading } = useQuery({
    queryKey: ["changed-edges", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("changed_edges")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ChangedEdge[];
    },
  });

  const formatCoordinates = (coords: any) => {
    if (coords && Array.isArray(coords) && coords.length >= 2) {
      return coords.map((point: any) => 
        Array.isArray(point) && point.length >= 2 
          ? `[${point[0].toFixed(6)}, ${point[1].toFixed(6)}]`
          : 'Invalid point'
      ).join(' → ');
    }
    return 'No coordinates';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-sm text-muted-foreground">Loading edges...</div>
      </div>
    );
  }

  if (!changedEdges || changedEdges.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center space-y-2">
          <div className="text-sm text-muted-foreground">No changed edges</div>
          <div className="text-xs text-muted-foreground">
            Edges modified by AI will appear here
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {changedEdges.map((edge) => (
        <Card key={edge.id} className="border-l-4" style={{ borderLeftColor: edge.color }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Edge {edge.osm_id}</span>
              <Badge 
                variant="secondary" 
                className="text-xs"
                style={{ backgroundColor: `${edge.color}20`, color: edge.color }}
              >
                Cost: {edge.cost}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div>
              <div className="font-medium text-muted-foreground">Capacity</div>
              <div>{edge.cap}</div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">Coordinates</div>
              <div className="font-mono text-xs break-all">
                {formatCoordinates(edge.coordinates)}
              </div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">OSM ID</div>
              <div className="font-mono">{edge.osm_id}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};