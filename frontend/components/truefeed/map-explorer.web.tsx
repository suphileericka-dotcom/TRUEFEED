import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { StyleSheet, View } from 'react-native';
import type * as Leaflet from 'leaflet';

import type { SeasonTheme } from '@/constants/truefeed';
import type { MapPlace } from '@/services/api/map';

import 'leaflet/dist/leaflet.css';

type MapExplorerProps = {
  places: MapPlace[];
  selectedPlace: MapPlace | null;
  theme: SeasonTheme;
  onSelectPlace: (place: MapPlace) => void;
};

const defaultCenter: [number, number] = [35.0, 135.76];
const mapElementStyle: CSSProperties = {
  height: '100%',
  width: '100%',
};

function getCenter(places: MapPlace[], selectedPlace: MapPlace | null): [number, number] {
  if (selectedPlace) {
    return [selectedPlace.lat, selectedPlace.lng];
  }

  if (places[0]) {
    return [places[0].lat, places[0].lng];
  }

  return defaultCenter;
}

export function MapExplorer({ places, selectedPlace, theme, onSelectPlace }: MapExplorerProps) {
  const [isClient, setIsClient] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const markersRef = useRef<Leaflet.Marker[]>([]);
  const center = useMemo(() => getCenter(places, selectedPlace), [places, selectedPlace]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function setupMap() {
      if (!isClient) {
        return;
      }

      if (!containerRef.current || mapRef.current) {
        return;
      }

      const L = await import('leaflet');

      if (!isMounted || !containerRef.current) {
        return;
      }

      const map = L.map(containerRef.current, {
        attributionControl: false,
        zoomControl: false,
      }).setView(center, 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      L.control.attribution({ position: 'bottomright' }).addTo(map);
      mapRef.current = map;
      window.setTimeout(() => map.invalidateSize(), 0);
    }

    setupMap();

    return () => {
      isMounted = false;
    };
  }, [center, isClient]);

  useEffect(() => {
    async function syncMarkers() {
      const map = mapRef.current;

      if (!isClient || !map) {
        return;
      }

      const L = await import('leaflet');

      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = places.map((place) => {
        const isSelected = selectedPlace?.id === place.id;
        const marker = L.marker([place.lat, place.lng], {
          icon: L.divIcon({
            className: '',
            html: `<button aria-label="${place.name.replace(/"/g, '&quot;')}" style="
              width: 34px;
              height: 34px;
              border-radius: 999px;
              border: 2px solid ${theme.accentStrong};
              background: ${isSelected ? theme.accentStrong : theme.surface};
              color: ${isSelected ? '#FFFFFF' : theme.accentStrong};
              box-shadow: 0 8px 18px rgba(0,0,0,0.18);
              font-weight: 800;
              cursor: pointer;
            ">•</button>`,
            iconAnchor: [17, 17],
          }),
        });

        marker.on('click', () => onSelectPlace(place));
        marker.addTo(map);
        return marker;
      });

      if (places.length > 0) {
        map.setView(center, selectedPlace ? 14 : 12, { animate: true });
      }
    }

    syncMarkers();
  }, [center, isClient, onSelectPlace, places, selectedPlace, theme.accentStrong, theme.surface]);

  if (!isClient) {
    return (
      <View
        style={[
          styles.mapFrame,
          { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
        ]}
      />
    );
  }

  return (
    <View style={[styles.mapFrame, { borderColor: theme.border }]}>
      <div ref={containerRef} style={mapElementStyle} />
    </View>
  );
}

const styles = StyleSheet.create({
  mapFrame: {
    borderRadius: 30,
    borderWidth: 1,
    height: 390,
    overflow: 'hidden',
  },
});
