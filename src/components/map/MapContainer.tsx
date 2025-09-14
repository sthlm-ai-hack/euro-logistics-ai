import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapRef } from "./types";

interface MapContainerProps {
  mapboxToken: string;
  project?: any;
  onMapReady: (map: MapRef) => void;
}

export const MapContainer = ({ mapboxToken, project, onMapReady }: MapContainerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

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

      // Notify parent component that map is ready
      console.log('Map initialized, notifying parent');
      onMapReady(map);

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
  }, [mapboxToken, project, onMapReady]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background/5 to-transparent" />
    </div>
  );
};