import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix: Leaflet's default icon paths often break in React/Vite.
// We explicitly set the marker icon to a reliable CDN.
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationMapProps {
  latitude: number;
  longitude: number;
}

const LocationMap: React.FC<LocationMapProps> = ({ latitude, longitude }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // 1. Initialize Map (if not already done)
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainer.current, {
        center: [latitude, longitude],
        zoom: 13,
        zoomControl: false, // Hide zoom buttons for a cleaner preview
        dragging: true, // Disable panning (optional, keeps it static)
        scrollWheelZoom: false, // Disable scroll zoom
        doubleClickZoom: false,
        attributionControl: false, // Hide footer text for small size
      });

      // 2. Add OpenStreetMap Tile Layer (Free, no key needed)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(mapRef.current);

      // 3. Add Marker
      L.marker([latitude, longitude], { icon: icon }).addTo(mapRef.current);
    }

    // 4. Update view if props change (e.g. reused component)
    else {
      mapRef.current.setView([latitude, longitude], 13);
      // Clear old markers and add new one if needed,
      // but for a chat message, coordinates usually don't change.
    }

    // Cleanup on unmount
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude]);

  return (
    <div
      className="rounded-lg overflow-hidden border border-gray-300 mt-2 relative z-0"
      style={{ height: "250px", width: "100%", minWidth: "300px" }}
    >
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

export default LocationMap;
