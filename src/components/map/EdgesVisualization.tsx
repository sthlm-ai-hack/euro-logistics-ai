import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import { EdgesVisualizationProps } from "./types";

export const EdgesVisualization = ({ map, data: displayEdges }: EdgesVisualizationProps) => {
  // Add changed edges visualization with better error handling
  useEffect(() => {
    console.log('EdgesVisualization useEffect triggered', {
      mapExists: !!map.current,
      dataLength: displayEdges?.length || 0
    });
    
    if (!map.current) {
      console.log('Map not ready for edges visualization');
      return;
    }

    const mapInstance = map.current;

    const handleChangedEdgesVisualization = () => {
      try {
        // Check if style is loaded before accessing layers/sources
        if (!mapInstance.isStyleLoaded()) {
          console.warn('Map style not loaded yet, skipping edge visualization');
          return;
        }

        // Remove existing changed edges visualization
        if (mapInstance.getLayer('changed-edges-layer')) {
          mapInstance.removeLayer('changed-edges-layer');
        }
        if (mapInstance.getSource('changed-edges')) {
          mapInstance.removeSource('changed-edges');
        }
      } catch (error) {
        console.warn('Error in edge visualization cleanup:', error);
        return;
      }

      // Only proceed if we have edges data
      if (!displayEdges?.length) {
        console.log('No edges to display');
        return;
      }

      console.log('Rendering edges:', displayEdges.length);

      // Create GeoJSON for changed edges with better coordinate handling
      const validFeatures = displayEdges
        .map((edge) => {
          try {
            let coordinates = [];
            
            // Handle different coordinate formats
            if (edge.coordinates) {
              if (Array.isArray(edge.coordinates)) {
                // Direct array of coordinates
                coordinates = edge.coordinates;
              } else if (edge.coordinates.lat && edge.coordinates.lon) {
                // Object with lat/lon arrays
                if (Array.isArray(edge.coordinates.lat) && Array.isArray(edge.coordinates.lon)) {
                  // Zip lat and lon arrays together
                  coordinates = edge.coordinates.lat.map((lat: number, i: number) => [
                    parseFloat(String(edge.coordinates.lon[i])),
                    parseFloat(String(lat))
                  ]);
                }
              }
            }

            // Validate coordinates
            if (!coordinates.length || coordinates.some((coord: any) => !Array.isArray(coord) || coord.length !== 2)) {
              console.warn('Invalid edge coordinates:', edge.coordinates);
              return null;
            }

            return {
              type: 'Feature' as const,
              properties: {
                id: edge.id,
                osm_id: edge.osm_id || 'Unknown',
                cost: edge.cost || 0,
                cap: edge.cap || 0,
                color: edge.color || '#ef4444',
              },
              geometry: {
                type: 'LineString' as const,
                coordinates
              }
            };
          } catch (error) {
            console.warn('Error processing edge:', edge, error);
            return null;
          }
        })
        .filter(Boolean);

      if (!validFeatures.length) {
        console.warn('No valid edge features found');
        return;
      }

      const edgesGeoJSON = {
        type: 'FeatureCollection' as const,
        features: validFeatures
      };

      // Add source and layer
      mapInstance.addSource('changed-edges', {
        type: 'geojson',
        data: edgesGeoJSON
      });

      mapInstance.addLayer({
        id: 'changed-edges-layer',
        type: 'line',
        source: 'changed-edges',
        paint: {
          'line-color': '#dc2626', // Nice matte red
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5, 3,
            10, 5,
            15, 7
          ],
          'line-opacity': 0.8
        }
      });

      // Add hover effects with error handling
      mapInstance.on('mouseenter', 'changed-edges-layer', () => {
        try {
          const canvas = mapInstance.getCanvas();
          if (canvas) {
            canvas.style.cursor = 'pointer';
          }
        } catch (error) {
          console.warn('Error in edge mouseenter handler:', error);
        }
      });

      mapInstance.on('mouseleave', 'changed-edges-layer', () => {
        try {
          const canvas = mapInstance.getCanvas();
          if (canvas) {
            canvas.style.cursor = '';
          }
        } catch (error) {
          console.warn('Error in edge mouseleave handler:', error);
        }
      });

      mapInstance.on('click', 'changed-edges-layer', (e) => {
        try {
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            const props = feature.properties;
            
            new mapboxgl.Popup()
              .setLngLat(e.lngLat)
              .setHTML(`
                <div class="p-2">
                  <div class="font-semibold">${props?.osm_id || 'Unknown Edge'}</div>
                  <div class="text-sm text-gray-600">Cost: ${props?.cost || 'N/A'}</div>
                  <div class="text-sm text-gray-600">Capacity: ${props?.cap || 'N/A'}</div>
                </div>
              `)
              .addTo(mapInstance);
          }
        } catch (error) {
          console.warn('Error in edge click handler:', error);
        }
      });
    };

    // Wait for map to be loaded before adding layers
    if (mapInstance.isStyleLoaded()) {
      handleChangedEdgesVisualization();
    } else {
      mapInstance.on('style.load', handleChangedEdgesVisualization);
    }

    // Cleanup function
    return () => {
      try {
        // Check if map exists and has the necessary methods before cleanup
        if (mapInstance && mapInstance.getSource && mapInstance.isStyleLoaded && mapInstance.isStyleLoaded()) {
          if (mapInstance.getSource('changed-edges')) {
            if (mapInstance.getLayer('changed-edges-layer')) {
              mapInstance.removeLayer('changed-edges-layer');
            }
            mapInstance.removeSource('changed-edges');
          }
        }
      } catch (error) {
        console.warn('Error in edges cleanup:', error);
      }
    };
  }, [displayEdges, map]);

  return null;
};