import React, {useEffect, useRef} from "react";
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface LocationMapProps {
    latitude: number,
    longitude: number
}

const LocationMap: React.FC<LocationMapProps> = ({ latitude, longitude }) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);

    useEffect(() => {
        if (map.current) return; // initialize map only once
        if (!mapContainer.current) return;
        
        map.current = new maplibregl.Map({
            container: mapContainer.current,
            // Use a free style
            style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style.json',
            center: [longitude, latitude],
            zoom: 14,
            interactive: false, // set true if want to   clickable
            attributionControl: false
        })
        

        // Add a marker
        new maplibregl.Marker({ color: "#FF0000" })
        .setLngLat([longitude, latitude])
        .addTo(map.current)
        
        return () => {
            map.current?.remove(); // cleanup on unmount
        }
    }, [latitude, longitude])
    return (
        
        <div className="rounded-lg overflow-hidden border border-gray-300 mt-2"
        style={{height: '150px', width: '250px'}}
        >
            <div ref={mapContainer} className="w-full h-full"/>
        </div>
    )
}

export default LocationMap;