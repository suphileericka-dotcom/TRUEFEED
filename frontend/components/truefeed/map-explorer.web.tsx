import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts, type SeasonTheme } from '@/constants/truefeed';
import type { MapPlace } from '@/services/api/map';

type MapExplorerProps = {
  places: MapPlace[];
  selectedPlace: MapPlace | null;
  theme: SeasonTheme;
  onSelectPlace: (place: MapPlace) => void;
  userLocation?: {
    lat: number;
    lng: number;
  };
};

const defaultCenter = { lat: 48.8584, lng: 2.2945 };

function getCenter(
  places: MapPlace[],
  selectedPlace: MapPlace | null,
  userLocation?: { lat: number; lng: number },
) {
  if (selectedPlace) {
    return { lat: selectedPlace.lat, lng: selectedPlace.lng };
  }

  if (places[0]) {
    return { lat: places[0].lat, lng: places[0].lng };
  }

  if (userLocation) {
    return userLocation;
  }

  return defaultCenter;
}

function getOpenStreetMapUrl(lat: number, lng: number) {
  const delta = 0.04;
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join(',');

  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}

const iframeStyle: CSSProperties = {
  border: 0,
  height: '100%',
  width: '100%',
};

export function MapExplorer({
  places,
  selectedPlace,
  theme,
  onSelectPlace,
  userLocation,
}: MapExplorerProps) {
  const [isClient, setIsClient] = useState(false);
  const center = useMemo(
    () => getCenter(places, selectedPlace, userLocation),
    [places, selectedPlace, userLocation],
  );
  const mapUrl = useMemo(() => getOpenStreetMapUrl(center.lat, center.lng), [center.lat, center.lng]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <View style={[styles.mapFrame, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
      {isClient ? (
        <iframe
          src={mapUrl}
          style={iframeStyle}
          title={selectedPlace ? `Carte ${selectedPlace.name}` : 'Carte MapExplorer'}
        />
      ) : null}

      <View style={styles.placeRail}>
        {places.slice(0, 4).map((place) => {
          const isSelected = selectedPlace?.id === place.id;

          return (
            <Pressable
              key={place.id}
              onPress={() => onSelectPlace(place)}
              style={[
                styles.placeChip,
                {
                  backgroundColor: isSelected ? theme.accentStrong : theme.surface,
                  borderColor: theme.accentStrong,
                },
              ]}
            >
              <Text style={[styles.placeChipText, { color: isSelected ? '#FFFFFF' : theme.text }]}>
                {place.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
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
  placeRail: {
    bottom: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    left: 12,
    position: 'absolute',
    right: 12,
  },
  placeChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  placeChipText: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '800',
  },
});
