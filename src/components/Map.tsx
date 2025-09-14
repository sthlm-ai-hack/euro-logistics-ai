import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface MapProps {
  project?: any;
  flowVisualizationData?: any;
  changedNodes?: any[];
}

const Map = ({ project, flowVisualizationData, changedNodes }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { user } = useAuth();
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMapboxToken();
    }
  }, [user]);

  const fetchMapboxToken = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("mapbox_token")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.mapbox_token) {
        setMapboxToken(data.mapbox_token);
      }
    } catch (error) {
      console.error("Error fetching mapbox token:", error);
      toast.error("Failed to load map configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    // Function to handle map resize
    const handleResize = () => {
      if (map.current) {
        map.current.resize();
      }
    };

    // Initialize map
    mapboxgl.accessToken = mapboxToken;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        // style: 'mapbox://styles/mapbox/themap',
        style: "mapbox://styles/willthbill/cmfibt067003y01s4891xcmbg",
        projection: "globe" as any,
        zoom: 1.5,
        center: [0, 20],
        pitch: 0,
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        "top-right",
      );

      // Add atmosphere and minimal styling
      map.current.on("style.load", () => {
        if (map.current) {
          // Set minimal fog for clean appearance
          map.current.setFog({
            color: "rgb(250, 250, 250)",
            "high-color": "rgb(240, 240, 240)",
            "horizon-blend": 0.1,
          });

          // Safely try to customize map colors for black/white theme
          try {
            // Check if layers exist before trying to modify them
            const style = map.current.getStyle();
            const landLayer = style.layers?.find(layer => layer.id === 'land');
            const waterLayer = style.layers?.find(layer => layer.id === 'water');
            
            if (landLayer) {
              map.current.setPaintProperty("land", "background-color", "#ffffff");
            }
            if (waterLayer) {
              map.current.setPaintProperty("water", "fill-color", "#f8f9fa");
            }
          } catch (error) {
            console.warn("Could not customize map layer colors:", error);
          }
        }
      });

      // Rotation animation settings
      const secondsPerRevolution = 300;
      const maxSpinZoom = 4;
      const slowSpinZoom = 2;
      let userInteracting = false;
      let spinEnabled = true;

      // Spin globe function
      function spinGlobe() {
        if (!map.current) return;

        const zoom = map.current.getZoom();
        if (spinEnabled && !userInteracting && zoom < maxSpinZoom) {
          let distancePerSecond = 360 / secondsPerRevolution;
          if (zoom > slowSpinZoom) {
            const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
            distancePerSecond *= zoomDif;
          }
          const center = map.current.getCenter();
          center.lng -= distancePerSecond;
          map.current.easeTo({ center, duration: 1000, easing: (n) => n });
        }
      }

      // Event listeners for interaction
      map.current.on("mousedown", () => {
        userInteracting = true;
      });

      map.current.on("dragstart", () => {
        userInteracting = true;
      });

      map.current.on("mouseup", () => {
        userInteracting = false;
        spinGlobe();
      });

      map.current.on("touchend", () => {
        userInteracting = false;
        spinGlobe();
      });

      map.current.on("moveend", () => {
        spinGlobe();
      });

      // Start the globe spinning
      spinGlobe();

      // Zoom to specific bounding box after 2 seconds if project is loaded
      if (project) {
        setTimeout(() => {
          if (map.current && !userInteracting) {
            // Bounding box: (12.1, 55.4, 13.3, 56.0) as (left, bottom, right, top)
            map.current.fitBounds([
              [12.1, 55.4], // Southwest coordinates
              [13.3, 56.0]  // Northeast coordinates
            ], {
              duration: 3000,
              essential: true,
              padding: 50
            });
            spinEnabled = false; // Stop spinning after zoom
          }
        }, 2000);
      }
    } catch (error) {
      console.error("Map initialization failed:", error);
      // Show fallback message
      if (mapContainer.current) {
        mapContainer.current.innerHTML = `
          <div class="flex items-center justify-center h-full bg-gray-50 text-gray-600">
            <div class="text-center">
              <p class="text-lg font-medium mb-2">Map Unavailable</p>
              <p class="text-sm">Please add your Mapbox token to view the map</p>
            </div>
          </div>
        `;
      }
    }

    // Add resize observer to handle layout changes
    const resizeObserver = new ResizeObserver(handleResize);
    if (mapContainer.current) {
      resizeObserver.observe(mapContainer.current);
    }

    // Cleanup
    return () => {
      map.current?.remove();
      resizeObserver.disconnect();
    };
  }, [mapboxToken]);

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
  }, [flowVisualizationData]);

  // Handle changed nodes visualization
  useEffect(() => {
    if (!map.current) return;

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
      if (changedNodes && changedNodes.length > 0) {
        const features = changedNodes
          .filter(node => node.coordinates)
          .map(node => {
            let coordinates;
            if (node.coordinates.lat !== undefined && node.coordinates.lon !== undefined) {
              coordinates = [node.coordinates.lon, node.coordinates.lat];
            } else if (Array.isArray(node.coordinates) && node.coordinates.length === 2) {
              coordinates = [node.coordinates[0], node.coordinates[1]];
            } else {
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
                name: node.name,
                supply: node.supply,
                color: node.color,
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

          map.current.addLayer({
            id: 'changed-nodes',
            type: 'circle',
            source: 'changed-nodes',
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['get', 'supply'],
                0, 8,
                100, 20,
                1000, 40
              ],
              'circle-color': ['get', 'color'],
              'circle-opacity': 0.8,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
              'circle-stroke-opacity': 1
            }
          });

          // Add hover functionality
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
            if (!map.current) return;
            
            map.current.getCanvas().style.cursor = '';
            
            if (popup) {
              popup.remove();
              popup = null;
            }
          };

          map.current.on('mouseenter', 'changed-nodes', handleMouseEnter);
          map.current.on('mouseleave', 'changed-nodes', handleMouseLeave);
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
      if (map.current?.getSource('changed-nodes')) {
        try {
          if (map.current.getLayer('changed-nodes')) {
            map.current.removeLayer('changed-nodes');
          }
          map.current.removeSource('changed-nodes');
        } catch (error) {
          console.warn('Error removing changed nodes visualization:', error);
        }
      }
    };
  }, [changedNodes]);

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
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background/5 to-transparent" />
    </div>
  );
};

export default Map;
