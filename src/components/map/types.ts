import mapboxgl from "mapbox-gl";

export interface MapProps {
  project?: any;
  flowVisualizationData?: any;
  changedNodes?: any[];
  changedEdges?: any[];
}

export interface MapRef {
  current: mapboxgl.Map | null;
}

export interface VisualizationProps {
  map: MapRef;
  data?: any[] | any;
}

export interface FlowVisualizationProps extends VisualizationProps {
  data?: any;
}

export interface NodesVisualizationProps extends VisualizationProps {
  data?: any[];
}

export interface EdgesVisualizationProps extends VisualizationProps {
  data?: any[];
}