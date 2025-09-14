import React, { useState } from "react";
import { MapContainer } from "./map/MapContainer";
import { FlowVisualization } from "./map/FlowVisualization";
import { NodesVisualization } from "./map/NodesVisualization";
import { EdgesVisualization } from "./map/EdgesVisualization";
import { useMapboxToken } from "./map/useMapboxToken";
import { useRealtimeData } from "./map/useRealtimeData";
import { MapProps, MapRef } from "./map/types";

const Map = ({ project, flowVisualizationData, changedNodes, changedEdges }: MapProps) => {
  const { mapboxToken, loading } = useMapboxToken();
  const { displayNodes, displayEdges } = useRealtimeData(project, changedNodes, changedEdges);
  const [map, setMap] = useState<MapRef>({ current: null });

  console.log('Map component render', {
    project: project?.id,
    displayNodes: displayNodes?.length || 0,
    displayEdges: displayEdges?.length || 0,
    mapReady: !!map.current
  });

  const handleMapReady = (mapRef: MapRef) => {
    console.log('Map ready callback received', { mapRef: !!mapRef.current });
    setMap(mapRef);
  };

  if (loading) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="text-muted-foreground">Loading map...</div>
      </div>
    );
  }

  if (!mapboxToken) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-muted-foreground">
            Mapbox token not configured
          </div>
          <div className="text-sm text-muted-foreground">
            Go to Settings to add your Mapbox public token
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <MapContainer 
        mapboxToken={mapboxToken} 
        project={project} 
        onMapReady={handleMapReady}
      />
      {map.current && (
        <>
          <FlowVisualization map={map} data={flowVisualizationData} />
          <NodesVisualization map={map} data={displayNodes} />
          <EdgesVisualization map={map} data={displayEdges} />
        </>
      )}
    </>
  );
};

export default Map;