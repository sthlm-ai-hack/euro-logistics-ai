import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MapProps {
  project?: any;
  flowVisualizationData?: any;
  changedNodes?: any[];
  changedEdges?: any[];
}

const Map = ({
  project,
  flowVisualizationData,
  changedNodes,
  changedEdges,
}: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { user } = useAuth();
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nodesData, setNodesData] = useState<any[]>([]);
  const [edgesData, setEdgesData] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch mapbox token
  useEffect(() => {
    if (user) {
      fetchMapboxToken();
    }
  }, [user]);

  // Fetch nodes and edges data once
  useEffect(() => {
    if (project?.id) {
      fetchNodesAndEdges();
    }
  }, [project?.id]);

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

  const fetchNodesAndEdges = async () => {
    try {
      console.log("Fetching nodes and edges for project:", project?.id);
      setRefreshing(true);

      // Fetch nodes
      const { data: nodes, error: nodesError } = await supabase
        .from("changed_nodes")
        .select("*")
        .eq("project_id", project.id);

      if (nodesError) throw nodesError;

      // Fetch edges
      const { data: edges, error: edgesError } = await supabase
        .from("changed_edges")
        .select("*")
        .eq("project_id", project.id);

      if (edgesError) throw edgesError;

      console.log("Fetched data:", {
        nodes: nodes?.length || 0,
        edges: edges?.length || 0,
        sampleEdge: edges?.[0],
        sampleEdgeCoordinates: edges?.[0]?.coordinates,
        allEdges: edges,
      });
      setNodesData(nodes || []);
      setEdgesData(edges || []);
      toast.success("Map data refreshed");
    } catch (error) {
      console.error("Error fetching nodes and edges:", error);
      toast.error("Failed to load map data");
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    if (project?.id) {
      // Clear existing edges before fetching new data
      if (map.current && map.current.getSource("edges")) {
        if (map.current.getLayer("edges")) {
          map.current.removeLayer("edges");
        }
        map.current.removeSource("edges");
      }

      // Clear existing nodes before fetching new data
      if (map.current && map.current.getSource("nodes")) {
        if (map.current.getLayer("nodes-positive")) {
          map.current.removeLayer("nodes-positive");
        }
        if (map.current.getLayer("nodes-negative")) {
          map.current.removeLayer("nodes-negative");
        }
        map.current.removeSource("nodes");
      }

      // Clear state to force useEffect re-trigger
      setEdgesData([]);
      setNodesData([]);

      await fetchNodesAndEdges();

      // Force re-render of flows by triggering the effect
      if (map.current && flowVisualizationData?.edges) {
        // Clear and re-add flows
        if (map.current.getSource("flow-lines")) {
          if (map.current.getLayer("flow-lines-glow")) {
            map.current.removeLayer("flow-lines-glow");
          }
          if (map.current.getLayer("flow-lines")) {
            map.current.removeLayer("flow-lines");
          }
          map.current.removeSource("flow-lines");
        }
        // The useEffect for flows will re-trigger and re-add them
      }
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
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
          map.current.setFog({
            color: "rgb(250, 250, 250)",
            "high-color": "rgb(240, 240, 240)",
            "horizon-blend": 0.1,
          });

          // Zoom to specific bounding box after 2 seconds if project is loaded
          if (project) {
            setTimeout(() => {
              if (map.current) {
                map.current.fitBounds(
                  [
                    [12.1, 55.4], // Southwest coordinates
                    [13.3, 56.0], // Northeast coordinates
                  ],
                  {
                    duration: 3000,
                    essential: true,
                    padding: 50,
                  },
                );
              }
            }, 2000);
          }
        }
      });
    } catch (error) {
      console.error("Map initialization failed:", error);
    }

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, project]);

  // Add nodes to map
  useEffect(() => {
    if (!map.current || !nodesData.length) return;

    const addNodes = () => {
      console.log("Adding nodes to map:", nodesData.length);

      // Remove existing nodes if any
      if (map.current?.getSource("nodes")) {
        if (map.current.getLayer("nodes-positive")) {
          map.current.removeLayer("nodes-positive");
        }
        if (map.current.getLayer("nodes-negative")) {
          map.current.removeLayer("nodes-negative");
        }
        map.current.removeSource("nodes");
      }

      // Process nodes
      const features = nodesData
        .filter((node) => node.coordinates)
        .map((node) => {
          let coordinates;
          // Handle different coordinate formats
          if (
            node.coordinates.lat !== undefined &&
            node.coordinates.lon !== undefined
          ) {
            coordinates = [
              parseFloat(node.coordinates.lon),
              parseFloat(node.coordinates.lat),
            ];
          } else if (
            Array.isArray(node.coordinates) &&
            node.coordinates.length === 2
          ) {
            coordinates = [
              parseFloat(node.coordinates[0]),
              parseFloat(node.coordinates[1]),
            ];
          } else {
            console.warn("Invalid node coordinates:", node.coordinates);
            return null;
          }

          return {
            type: "Feature" as const,
            geometry: {
              type: "Point" as const,
              coordinates,
            },
            properties: {
              id: node.id,
              name: node.name || "Unnamed Node",
              supply: node.supply || 0,
              osm_id: node.osm_id,
            },
          };
        })
        .filter(Boolean);

      if (features.length > 0) {
        map.current.addSource("nodes", {
          type: "geojson",
          data: {
            type: "FeatureCollection" as const,
            features,
          },
        });

        // Add positive supply nodes (blue)
        map.current.addLayer({
          id: "nodes-positive",
          type: "circle",
          source: "nodes",
          filter: [">=", ["get", "supply"], 0],
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["get", "supply"],
              0,
              8,
              100,
              15,
              1000,
              25,
            ],
            "circle-color": "#3b82f6", // Nice matte blue
            "circle-opacity": 0.8,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
            "circle-stroke-opacity": 1,
          },
        });

        // Add negative supply nodes (green)
        map.current.addLayer({
          id: "nodes-negative",
          type: "circle",
          source: "nodes",
          filter: ["<", ["get", "supply"], 0],
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["*", ["get", "supply"], -1], // Use absolute value
              0,
              8,
              100,
              15,
              1000,
              25,
            ],
            "circle-color": "#22c55e", // Nice matte green
            "circle-opacity": 0.8,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
            "circle-stroke-opacity": 1,
          },
        });

        // Add hover functionality
        ["nodes-positive", "nodes-negative"].forEach((layerId) => {
          map.current?.on("mouseenter", layerId, (e) => {
            if (!map.current || !e.features?.[0]) return;

            map.current.getCanvas().style.cursor = "pointer";

            const coordinates = (
              e.features[0].geometry as any
            ).coordinates.slice();
            const { name, supply, osm_id } = e.features[0].properties as any;

            new mapboxgl.Popup()
              .setLngLat(coordinates)
              .setHTML(
                `
                <div class="p-2">
                  <div class="font-semibold text-sm">${name}</div>
                  <div class="text-xs text-gray-600 mb-1">OSM: ${osm_id}</div>
                  <div class="text-xs"><strong>Supply:</strong> ${supply.toFixed(2)}</div>
                </div>
              `,
              )
              .addTo(map.current);
          });

          map.current?.on("mouseleave", layerId, () => {
            if (!map.current) return;
            map.current.getCanvas().style.cursor = "";
          });
        });
      }
    };

    // Wait for map to be loaded before adding layers
    const ensureStyleLoadedThenAddNodes = () => {
      if (map.current.isStyleLoaded()) {
        addNodes();
      } else {
        map.current.once("style.load", addNodes);
      }
    };
    ensureStyleLoadedThenAddNodes();
  }, [nodesData]);

  // Add edges to map
  useEffect(() => {
    console.log("Edges useEffect triggered", {
      mapExists: !!map.current,
      edgesDataLength: edgesData.length,
      firstEdge: edgesData[0],
      edgesData: edgesData,
    });

    if (!map.current || !edgesData.length) {
      console.log("Early return from edges useEffect:", {
        mapExists: !!map.current,
        edgesDataLength: edgesData.length,
      });
      return;
    }

    const addEdges = () => {
      console.log("Adding edges to map:", edgesData.length);

      // Remove existing edges if any
      if (map.current?.getSource("edges")) {
        if (map.current.getLayer("edges")) {
          map.current.removeLayer("edges");
        }
        map.current.removeSource("edges");
      }

      // Process edges
      console.log("Processing edges, total:", edgesData.length);
      const validFeatures = edgesData
        .map((edge, index) => {
          console.log(`Processing edge ${index}:`, {
            id: edge.id,
            coordinates: edge.coordinates,
            coordinatesType: typeof edge.coordinates,
            coordinatesKeys: edge.coordinates
              ? Object.keys(edge.coordinates)
              : "null",
          });

          try {
            let coordinates = [];

            // Handle different coordinate formats
            if (edge.coordinates) {
              if (Array.isArray(edge.coordinates)) {
                coordinates = edge.coordinates;
              } else if (edge.coordinates.lat && edge.coordinates.lon) {
                if (
                  Array.isArray(edge.coordinates.lat) &&
                  Array.isArray(edge.coordinates.lon)
                ) {
                  coordinates = edge.coordinates.lat.map(
                    (lat: number, i: number) => [
                      parseFloat(String(edge.coordinates.lon[i])),
                      parseFloat(String(lat)),
                    ],
                  );
                }
              }
            }

            // Validate coordinates
            if (
              !coordinates.length ||
              coordinates.some(
                (coord: any) => !Array.isArray(coord) || coord.length !== 2,
              )
            ) {
              console.warn(
                `Invalid edge coordinates for edge ${index}:`,
                edge.coordinates,
              );
              return null;
            }

            console.log(
              `Valid edge ${index} processed with ${coordinates.length} coordinate pairs`,
            );
            return {
              type: "Feature" as const,
              properties: {
                id: edge.id,
                osm_id: edge.osm_id || "Unknown",
                cost: edge.cost || 0,
                cap: edge.cap || 0,
              },
              geometry: {
                type: "LineString" as const,
                coordinates,
              },
            };
          } catch (error) {
            console.warn(`Error processing edge ${index}:`, edge, error);
            return null;
          }
        })
        .filter(Boolean);

      console.log("Valid features after processing:", validFeatures.length);
      console.log("Sample valid feature:", validFeatures[0]);

      if (validFeatures.length > 0) {
        console.log("Adding edges source and layer to map");
        map.current.addSource("edges", {
          type: "geojson",
          data: {
            type: "FeatureCollection" as const,
            features: validFeatures,
          },
        });

        console.log("Added edges source, now adding layer");
        map.current.addLayer({
          id: "edges",
          type: "line",
          source: "edges",
          paint: {
            "line-color": "#dc2626", // Nice matte red
            "line-width": [
              "interpolate",
              ["linear"],
              ["zoom"],
              5,
              3,
              10,
              5,
              15,
              7,
            ],
            "line-opacity": 0.8,
          },
        });

        console.log("Edges layer added successfully");

        // Add click functionality for edges
        map.current.on("click", "edges", (e) => {
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            const props = feature.properties;

            new mapboxgl.Popup()
              .setLngLat(e.lngLat)
              .setHTML(
                `
                <div class="p-2">
                  <div class="font-semibold">${props?.osm_id || "Unknown Edge"}</div>
                  <div class="text-sm text-gray-600">Cost: ${props?.cost || "N/A"}</div>
                  <div class="text-sm text-gray-600">Capacity: ${props?.cap || "N/A"}</div>
                </div>
              `,
              )
              .addTo(map.current!);
          }
        });
      } else {
        console.warn("No valid edge features to add to map");
      }
    };

    // Wait for map to be loaded before adding layers
    const ensureStyleLoadedThenAddEdges = () => {
      console.log("ensureStyleLoadedThenAddEdges called", {
        isStyleLoaded: map.current.isStyleLoaded(),
      });
      if (map.current.isStyleLoaded()) {
        console.log("Style is loaded, calling addEdges immediately");
        addEdges();
      } else {
        console.log("Style not loaded, waiting for style.load event with timeout fallback");

        // Set up the event listener
        const handleStyleLoad = () => {
          console.log("Style load event fired, calling addEdges");
          addEdges();
        };
        map.current.once("style.load", handleStyleLoad);

        // Add timeout fallback in case style.load never fires
        const timeoutId = setTimeout(() => {
          console.log("Style load timeout reached, checking if style is now loaded");
          if (map.current.isStyleLoaded()) {
            console.log("Style is now loaded via timeout, calling addEdges");
            map.current.off("style.load", handleStyleLoad); // Remove the event listener
            addEdges();
          } else {
            console.log("Style still not loaded after timeout, forcing addEdges anyway");
            map.current.off("style.load", handleStyleLoad); // Remove the event listener
            addEdges();
          }
        }, 1000); // 1 second timeout

        // Clear timeout if style loads via event
        map.current.once("style.load", () => {
          clearTimeout(timeoutId);
          handleStyleLoad();
        });
      }
    };
    ensureStyleLoadedThenAddEdges();
  }, [edgesData]);

  // Add flow visualization
  useEffect(() => {
    if (!map.current || !flowVisualizationData?.edges) return;

    const addFlows = () => {
      console.log("Adding flows to map:", flowVisualizationData.edges.length);

      // Remove existing flow visualization if any
      if (map.current?.getSource("flow-lines")) {
        if (map.current.getLayer("flow-lines-glow")) {
          map.current.removeLayer("flow-lines-glow");
        }
        if (map.current.getLayer("flow-lines")) {
          map.current.removeLayer("flow-lines");
        }
        map.current.removeSource("flow-lines");
      }

      // Add new flow visualization if data exists
      const features = flowVisualizationData.edges
        .filter(
          (edge: any) =>
            edge.geometry &&
            Array.isArray(edge.geometry) &&
            edge.geometry.length > 0,
        )
        .map((edge: any, index: number) => ({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: edge.geometry,
          },
          properties: {
            id: index,
            name: edge.name,
            flow: edge.flow,
          },
        }));

      if (features.length > 0) {
        // Sort features by left-most coordinate for animation
        const sortedFeatures = features.sort((a, b) => {
          const aLeftMost = Math.min(
            ...a.geometry.coordinates.map((coord: number[]) => coord[0]),
          );
          const bLeftMost = Math.min(
            ...b.geometry.coordinates.map((coord: number[]) => coord[0]),
          );
          return aLeftMost - bLeftMost;
        });

        map.current.addSource("flow-lines", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        });

        map.current.addLayer({
          id: "flow-lines",
          type: "line",
          source: "flow-lines",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#10b981", // Emerald green
            "line-width": ["interpolate", ["linear"], ["zoom"], 8, 15, 16, 40],
            "line-opacity": 0.4,
            "line-blur": 1,
          },
        });

        // Add a glow effect layer
        map.current.addLayer(
          {
            id: "flow-lines-glow",
            type: "line",
            source: "flow-lines",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#10b981",
              "line-width": [
                "interpolate",
                ["linear"],
                ["zoom"],
                8,
                30,
                16,
                60,
              ],
              "line-opacity": 0.15,
              "line-blur": 3,
            },
          },
          "flow-lines",
        ); // Add glow layer below the main line layer

        // Animate lines appearing one by one over 7 seconds
        const animationDuration = 7000; // 7 seconds
        const delayPerLine = animationDuration / sortedFeatures.length;

        sortedFeatures.forEach((feature, index) => {
          setTimeout(() => {
            if (map.current?.getSource("flow-lines")) {
              const source = map.current.getSource(
                "flow-lines",
              ) as mapboxgl.GeoJSONSource;
              const currentData = source._data as any;
              const newData = {
                type: "FeatureCollection" as const,
                features: [...(currentData?.features || []), feature],
              };
              source.setData(newData);
            }
          }, index * delayPerLine);
        });
      }
    };

    // Wait for map to be loaded before adding layers
    const ensureStyleLoadedThenAddFlows = () => {
      if (map.current.isStyleLoaded()) {
        addFlows();
      } else {
        map.current.once("style.load", addFlows);
      }
    };
    ensureStyleLoadedThenAddFlows();
  }, [flowVisualizationData]);

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

      {/* Refresh button */}
      <div className="absolute top-4 left-4 z-10 pointer-events-auto">
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          size="sm"
          variant="outline"
          className="bg-background/90 backdrop-blur-sm hover:bg-background/95"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
        </Button>
      </div>
    </div>
  );
};

export default Map;
