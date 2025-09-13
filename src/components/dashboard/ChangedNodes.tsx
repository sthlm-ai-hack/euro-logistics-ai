import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Hash, Target } from "lucide-react";

interface ChangedNode {
  id: string;
  name: string;
  osm_id: string;
  coordinates: any;
  supply: number;
  color: string;
  created_at: string;
  updated_at: string;
}

interface ChangedNodesProps {
  projectId: string;
}

export const ChangedNodes = ({ projectId }: ChangedNodesProps) => {
  const [changedNodes, setChangedNodes] = useState<ChangedNode[]>([]);

  const { data: nodes, isLoading } = useQuery({
    queryKey: ["changed-nodes", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("changed_nodes")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ChangedNode[];
    },
  });

  useEffect(() => {
    if (nodes) {
      setChangedNodes(nodes);
    }
  }, [nodes]);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('changed-nodes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'changed_nodes',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setChangedNodes(prev => [payload.new as ChangedNode, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setChangedNodes(prev => prev.map(node => 
              node.id === payload.new.id ? payload.new as ChangedNode : node
            ));
          } else if (payload.eventType === 'DELETE') {
            setChangedNodes(prev => prev.filter(node => node.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const formatCoordinates = (coords: any) => {
    if (coords && typeof coords === 'object') {
      if (coords.lat !== undefined && coords.lon !== undefined) {
        // Handle { lat: x, lon: y } format
        return `${parseFloat(coords.lat).toFixed(6)}, ${parseFloat(coords.lon).toFixed(6)}`;
      } else if (Array.isArray(coords) && coords.length === 2) {
        // Handle [longitude, latitude] format
        return `${coords[1].toFixed(6)}, ${coords[0].toFixed(6)}`;
      }
    }
    return "Invalid coordinates";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-sm text-muted-foreground">Loading changed nodes...</div>
      </div>
    );
  }

  if (changedNodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center space-y-2">
          <div className="text-sm font-medium text-muted-foreground">
            No Changed Nodes
          </div>
          <div className="text-xs text-muted-foreground">
            Modified nodes will appear here
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {changedNodes.map((node) => (
        <Card key={node.id} className="border-0 shadow-none bg-muted/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{node.name}</CardTitle>
              <div 
                className="w-3 h-3 rounded-full border border-border" 
                style={{ backgroundColor: node.color }}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <Hash className="w-3 h-3 text-muted-foreground" />
              <span className="font-mono text-muted-foreground">OSM:</span>
              <span>{node.osm_id}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">Location:</span>
              <span className="font-mono">{formatCoordinates(node.coordinates)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Target className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">Supply:</span>
              <Badge variant="outline" className="text-xs">
                {node.supply.toFixed(2)}
              </Badge>
            </div>
            
            <Separator />
            
            <div className="flex justify-between text-muted-foreground">
              <span>Added: {formatDate(node.created_at)}</span>
              {node.updated_at !== node.created_at && (
                <span>Updated: {formatDate(node.updated_at)}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};