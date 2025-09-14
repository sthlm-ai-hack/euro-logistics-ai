import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

interface MapProps {
  project?: any;
  flowVisualizationData?: any;
  changedNodes?: any[];
  changedEdges?: any[];
}

const Map = ({ project, flowVisualizationData, changedNodes, changedEdges }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { user } = useAuth();
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

          // Add circles for positive supply
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
                0, 5,
                100, 12,
                1000, 25
              ],
              'circle-color': ['get', 'color'],
              'circle-opacity': 0.8,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
              'circle-stroke-opacity': 1
            }
          });

          // Create and add square marker image for negative supply nodes using canvas
          const canvas = document.createElement('canvas');
          canvas.width = 20;
          canvas.height = 20;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Use a default color if no features exist yet
            const defaultColor = features.find(f => f?.properties?.color)?.properties?.color || '#ef4444';
            ctx.fillStyle = defaultColor;
            ctx.fillRect(2, 2, 16, 16);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(2, 2, 16, 16);
            
            const imageData = ctx.getImageData(0, 0, 20, 20);
            if (!map.current?.hasImage('square-marker')) {
              map.current?.addImage('square-marker', imageData);
            }
          }

          // Add squares for negative supply (only after image is created)
          map.current.addLayer({
            id: 'changed-nodes-negative',
            type: 'symbol',
            source: 'changed-nodes',
            filter: ['<', ['get', 'supply'], 0],
            layout: {
              'icon-image': 'square-marker',
              'icon-size': [
                'interpolate',
                ['linear'],
                ['*', ['get', 'supply'], -1], // Use absolute value
                0, 0.6,
                100, 1.0,
                1000, 1.8
              ],
              'icon-allow-overlap': true
            },
            paint: {
              'icon-opacity': 0.8
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
      if (map.current?.getSource('changed-nodes')) {
        try {
          if (map.current.getLayer('changed-nodes-positive')) {
            map.current.removeLayer('changed-nodes-positive');
          }
          if (map.current.getLayer('changed-nodes-negative')) {
            map.current.removeLayer('changed-nodes-negative');
          }
          map.current.removeSource('changed-nodes');
        } catch (error) {
          console.warn('Error removing changed nodes visualization:', error);
        }
      }
    };
  }, [displayNodes]);

  // Add changed edges visualization with better error handling
  useEffect(() => {
    if (!map.current) return;

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
          'line-color': ['get', 'color'],
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5, 4,
            10, 6,
            15, 8
          ],
          'line-opacity': 0.9
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
        // Check if style is loaded and map exists before cleanup
        if (mapInstance && mapInstance.isStyleLoaded()) {
          if (mapInstance.getLayer('changed-edges-layer')) {
            mapInstance.removeLayer('changed-edges-layer');
          }
          if (mapInstance.getSource('changed-edges')) {
            mapInstance.removeSource('changed-edges');
          }
        }
      } catch (error) {
        console.warn('Error in edges cleanup:', error);
      }
    };
  }, [displayEdges]);

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
