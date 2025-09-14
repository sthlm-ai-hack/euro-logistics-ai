import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import { FlowVisualizationProps } from "./types";

export const FlowVisualization = ({ map, data: flowVisualizationData }: FlowVisualizationProps) => {
  // Handle flow visualization
  useEffect(() => {
    if (!map.current) return;

    const handleFlowVisualization = () => {
      // Remove existing flow visualization
      if (map.current?.getSource('flow-lines')) {
        map.current.removeLayer('flow-lines');
        map.current.removeSource('flow-lines');
      }

      // Add new flow visualization if data exists
      if (flowVisualizationData?.edges) {
        const features = flowVisualizationData.edges
          .filter((edge: any) => edge.geometry && Array.isArray(edge.geometry) && edge.geometry.length > 0)
          .map((edge: any, index: number) => ({
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: edge.geometry
            },
            properties: {
              id: index,
              name: edge.name,
              flow: edge.flow
            }
          }));

        if (features.length > 0) {
          // Sort features by left-most coordinate for animation
          const sortedFeatures = features.sort((a, b) => {
            const aLeftMost = Math.min(...a.geometry.coordinates.map((coord: number[]) => coord[0]));
            const bLeftMost = Math.min(...b.geometry.coordinates.map((coord: number[]) => coord[0]));
            return aLeftMost - bLeftMost;
          });

          map.current.addSource('flow-lines', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: []
            }
          });

          map.current.addLayer({
            id: 'flow-lines',
            type: 'line',
            source: 'flow-lines',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#10b981', // Emerald green
              'line-width': [
                'interpolate',
                ['linear'],
                ['zoom'],
                8, 15,  // 5x wider
                16, 40  // 5x wider
              ],
              'line-opacity': 0.4, // More transparent
              'line-blur': 1
            }
          });

          // Add a glow effect layer
          map.current.addLayer({
            id: 'flow-lines-glow',
            type: 'line',
            source: 'flow-lines',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#10b981',
              'line-width': [
                'interpolate',
                ['linear'],
                ['zoom'],
                8, 30,  // 5x wider
                16, 60  // 5x wider
              ],
              'line-opacity': 0.15, // More transparent
              'line-blur': 3
            }
          }, 'flow-lines'); // Add glow layer below the main line layer

          // Animate lines appearing one by one over 7 seconds
          const animationDuration = 7000; // 7 seconds
          const delayPerLine = animationDuration / sortedFeatures.length;
          
          sortedFeatures.forEach((feature, index) => {
            setTimeout(() => {
              if (map.current?.getSource('flow-lines')) {
                const source = map.current.getSource('flow-lines') as mapboxgl.GeoJSONSource;
                const currentData = source._data as any;
                const newData = {
                  type: 'FeatureCollection' as const,
                  features: [...(currentData?.features || []), feature]
                };
                source.setData(newData);
              }
            }, index * delayPerLine);
          });
        }
      }
    };

    // Wait for map to be loaded before adding layers
    if (map.current.isStyleLoaded()) {
      handleFlowVisualization();
    } else {
      map.current.on('style.load', handleFlowVisualization);
    }

    return () => {
      if (map.current?.getSource('flow-lines')) {
        try {
          map.current.removeLayer('flow-lines-glow');
          map.current.removeLayer('flow-lines');
          map.current.removeSource('flow-lines');
        } catch (error) {
          console.warn('Error removing flow visualization layers:', error);
        }
      }
    };
  }, [flowVisualizationData, map]);

  return null;
};