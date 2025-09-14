import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useRealtimeData = (project?: any, changedNodes?: any[], changedEdges?: any[]) => {
  // Fetch real-time nodes data for this project
  const { data: realtimeNodes, refetch: refetchNodes } = useQuery({
    queryKey: ["realtime-changed-nodes", project?.id],
    queryFn: async () => {
      if (!project?.id) return [];
      const { data, error } = await supabase
        .from("changed_nodes")
        .select("*")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching nodes:", error);
        throw error;
      }
      console.log("Fetched nodes:", data?.length || 0);
      return data || [];
    },
    enabled: !!project?.id,
  });

  // Fetch real-time edges data for this project
  const { data: realtimeEdges, refetch: refetchEdges } = useQuery({
    queryKey: ["realtime-changed-edges", project?.id],
    queryFn: async () => {
      if (!project?.id) return [];
      const { data, error } = await supabase
        .from("changed_edges")
        .select("*")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching edges:", error);
        throw error;
      }
      console.log("Fetched edges:", data?.length || 0);
      return data || [];
    },
    enabled: !!project?.id,
  });

  // Use realtime data if available, fall back to props
  const displayNodes = realtimeNodes || changedNodes;
  const displayEdges = realtimeEdges || changedEdges;

  // Set up real-time subscription for both nodes and edges
  useEffect(() => {
    if (!project?.id) return;

    const channel = supabase
      .channel('map-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'changed_nodes',
          filter: `project_id=eq.${project.id}`
        },
        (payload) => {
          console.log('Node change detected:', payload);
          refetchNodes();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'changed_edges',
          filter: `project_id=eq.${project.id}`
        },
        (payload) => {
          console.log('Edge change detected:', payload);
          refetchEdges();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [project?.id, refetchNodes, refetchEdges]);

  return { displayNodes, displayEdges };
};