import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import { NodesVisualizationProps } from "./types";

export const NodesVisualization = ({ map, data: displayNodes }: NodesVisualizationProps) => {
  // Handle changed nodes visualization
  useEffect(() => {
    console.log('NodesVisualization useEffect triggered', {
      mapExists: !!map.current,
      dataLength: displayNodes?.length || 0
    });
    
    if (!map.current) {
      console.log('Map not ready for nodes visualization');
      return;
    }

    const handleChangedNodesVisualization = () => {
      // Remove existing changed nodes visualization
      if (map.current?.getSource('changed-nodes')) {
        if (map.current.getLayer('changed-nodes')) {
          map.current.removeLayer('changed-nodes');
        }
        map.current.removeSource('changed-nodes');
      }

      // Add popup for hover functionality
      let popup: mapboxgl.Popup | null = null;

      // Add new changed nodes visualization if data exists
      if (displayNodes && displayNodes.length > 0) {
        const features = displayNodes
          .filter(node => node.coordinates)
          .map(node => {
            let coordinates;
            // Handle different coordinate formats
            if (node.coordinates.lat !== undefined && node.coordinates.lon !== undefined) {
              coordinates = [parseFloat(node.coordinates.lon), parseFloat(node.coordinates.lat)];
            } else if (Array.isArray(node.coordinates) && node.coordinates.length === 2) {
              coordinates = [parseFloat(node.coordinates[0]), parseFloat(node.coordinates[1])];
            } else {
              console.warn('Invalid node coordinates:', node.coordinates);
              return null;
            }

            return {
              type: "Feature" as const,
              geometry: {
                type: "Point" as const,
                coordinates
              },
              properties: {
                id: node.id,
                name: node.name || 'Unnamed Node',
                supply: node.supply || 0,
                color: node.color || '#3b82f6',
                osm_id: node.osm_id
              }
            };
          })
          .filter(Boolean);

        if (features.length > 0) {
          map.current.addSource('changed-nodes', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection' as const,
              features
            }
          });

          // Add circles for all nodes (both positive and negative supply)
          map.current.addLayer({
            id: 'changed-nodes-positive',
            type: 'circle',
            source: 'changed-nodes',
            filter: ['>=', ['get', 'supply'], 0],
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['get', 'supply'],
                0, 8,
                100, 15,
                1000, 25
              ],
              'circle-color': '#3b82f6', // Nice matte blue
              'circle-opacity': 0.8,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
              'circle-stroke-opacity': 1
            }
          });

          // Add circles for negative supply nodes
          map.current.addLayer({
            id: 'changed-nodes-negative',
            type: 'circle',
            source: 'changed-nodes',
            filter: ['<', ['get', 'supply'], 0],
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['*', ['get', 'supply'], -1], // Use absolute value
                0, 8,
                100, 15,
                1000, 25
              ],
              'circle-color': '#22c55e', // Nice matte green
              'circle-opacity': 0.8,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
              'circle-stroke-opacity': 1
            }
          });

          // Add hover functionality for both positive and negative nodes
          const handleMouseEnter = (e: mapboxgl.MapMouseEvent) => {
            if (!map.current || !e.features?.[0]) return;
            
            map.current.getCanvas().style.cursor = 'pointer';
            
            const coordinates = (e.features[0].geometry as any).coordinates.slice();
            const { name, supply, osm_id } = e.features[0].properties as any;
            
            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }
            
            popup = new mapboxgl.Popup()
              .setLngLat(coordinates)
              .setHTML(`
                <div class="p-2">
                  <div class="font-semibold text-sm">${name}</div>
                  <div class="text-xs text-gray-600 mb-1">OSM: ${osm_id}</div>
                  <div class="text-xs"><strong>Supply:</strong> ${supply.toFixed(2)}</div>
                </div>
              `)
              .addTo(map.current);
          };

          const handleMouseLeave = () => {
            try {
              if (!map.current) return;
              
              const canvas = map.current.getCanvas();
              if (canvas) {
                canvas.style.cursor = '';
              }
              
              if (popup) {
                popup.remove();
                popup = null;
              }
            } catch (error) {
              console.warn('Error in mouse leave handler:', error);
            }
          };

          map.current.on('mouseenter', 'changed-nodes-positive', handleMouseEnter);
          map.current.on('mouseleave', 'changed-nodes-positive', handleMouseLeave);
          map.current.on('mouseenter', 'changed-nodes-negative', handleMouseEnter);
          map.current.on('mouseleave', 'changed-nodes-negative', handleMouseLeave);
        }
      }
    };

    // Wait for map to be loaded before adding layers
    if (map.current.isStyleLoaded()) {
      handleChangedNodesVisualization();
    } else {
      map.current.on('style.load', handleChangedNodesVisualization);
    }

    return () => {
      try {
        if (map.current && map.current.getSource) {
          if (map.current.getSource('changed-nodes')) {
            if (map.current.getLayer('changed-nodes-positive')) {
              map.current.removeLayer('changed-nodes-positive');
            }
            if (map.current.getLayer('changed-nodes-negative')) {
              map.current.removeLayer('changed-nodes-negative');
            }
            map.current.removeSource('changed-nodes');
          }
        }
      } catch (error) {
        console.warn('Error removing changed nodes visualization:', error);
      }
    };
  }, [displayNodes, map]);

  return null;
};