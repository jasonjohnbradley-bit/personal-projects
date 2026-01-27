'use client';

import { useEffect, useRef } from 'react';
import type { Location } from '@/lib/types/itinerary';

// Only import Leaflet types for TypeScript
import type { Map as LeafletMap } from 'leaflet';

interface ItineraryMapProps {
  locations: Location[];
  center?: [number, number];
}

export function ItineraryMap({ locations, center }: ItineraryMapProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    // Dynamic import of Leaflet
    import('leaflet').then((L) => {
      // Fix default marker icon issue
      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (mapRef.current) {
        mapRef.current.remove();
      }

      // Calculate center from locations if not provided
      const mapCenter = center || calculateCenter(locations);

      const map = L.map(containerRef.current!).setView(mapCenter, 12);
      mapRef.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map);

      // Add markers for each location
      locations.forEach((loc) => {
        const icon = createCustomIcon(L, loc.emoji, loc.color);
        const marker = L.marker([loc.lat, loc.lng], { icon }).addTo(map);

        const popupContent = `
          <div style="min-width: 180px; font-family: 'Segoe UI', sans-serif;">
            <h3 style="margin: 0 0 8px 0; font-size: 1rem;">${loc.name}</h3>
            <span style="
              background: ${loc.color};
              color: white;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 0.75rem;
              display: inline-block;
              margin-bottom: 8px;
            ">${loc.category}</span>
            ${loc.rating ? `<div style="margin-bottom: 8px;">⭐ ${loc.rating}</div>` : ''}
            <a href="https://www.google.com/maps/search/${encodeURIComponent(loc.name)}"
               target="_blank"
               style="color: #2d5016; text-decoration: none;">
              📍 Open in Google Maps
            </a>
          </div>
        `;

        marker.bindPopup(popupContent);
      });

      // Fit bounds to show all markers
      if (locations.length > 0) {
        const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]));
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [locations, center]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <div ref={containerRef} id="map" style={{ height: '500px', borderRadius: '15px' }} />
    </>
  );
}

function calculateCenter(locations: Location[]): [number, number] {
  if (locations.length === 0) return [35.6762, 139.6503]; // Default to Tokyo

  const sumLat = locations.reduce((sum, loc) => sum + loc.lat, 0);
  const sumLng = locations.reduce((sum, loc) => sum + loc.lng, 0);

  return [sumLat / locations.length, sumLng / locations.length];
}

function createCustomIcon(L: typeof import('leaflet'), emoji: string, color: string) {
  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        border: 3px solid white;
        box-shadow: 0 3px 8px rgba(0,0,0,0.3);
      ">${emoji}</div>
    `,
    className: '',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17],
  });
}
