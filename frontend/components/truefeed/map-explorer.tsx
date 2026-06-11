// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
import { Ionicons } from '@expo/vector-icons';
import type { DimensionValue } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts, mapExplorerPins, type SeasonTheme } from '@/constants/truefeed';
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
  onLocate?: () => void;
  hasUserLocation?: boolean;
};

function pinPosition(index: number) {
  return mapExplorerPins[index % mapExplorerPins.length];
}

export function MapExplorer({
  places,
  selectedPlace,
  theme,
  onSelectPlace,
  onLocate,
  hasUserLocation,
}: MapExplorerProps) {
  return (
    <View style={[styles.map, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
      <View style={[styles.mapPath, { backgroundColor: theme.border }]} />
      {selectedPlace ? (
        <View style={[styles.selectedPanel, { backgroundColor: theme.surface }]}>
          <Ionicons name="location" size={16} color={theme.accentStrong} />
          <View style={styles.selectedTextGroup}>
            <Text numberOfLines={1} style={[styles.selectedName, { color: theme.text }]}>
              {selectedPlace.name}
            </Text>
            <Text numberOfLines={1} style={[styles.selectedMeta, { color: theme.muted }]}>
              {selectedPlace.address || `${selectedPlace.category} - ${selectedPlace.city}`}
            </Text>
          </View>
        </View>
      ) : null}
      {onLocate ? (
        <Pressable
          onPress={onLocate}
          style={[
            styles.locateButton,
            { backgroundColor: hasUserLocation ? theme.accentStrong : theme.surface },
          ]}
        >
          <Ionicons name="navigate" size={20} color={hasUserLocation ? '#FFFFFF' : theme.accentStrong} />
        </Pressable>
      ) : null}
      {places.map((place, index) => {
        const position = pinPosition(index);

        return (
          <Pressable
            key={place.id}
            onPress={() => onSelectPlace(place)}
            style={[
              styles.pin,
              {
                left: position.x as DimensionValue,
                top: position.y as DimensionValue,
                backgroundColor: selectedPlace?.id === place.id ? theme.accentStrong : theme.surface,
                borderColor: theme.accentStrong,
              },
            ]}
          >
            <Ionicons
              name="location"
              size={18}
              color={selectedPlace?.id === place.id ? '#FFFFFF' : theme.accentStrong}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  map: { borderRadius: 30, borderWidth: 1, height: 390, overflow: 'hidden' },
  mapPath: {
    borderRadius: 80,
    height: 280,
    left: '30%',
    opacity: 0.55,
    position: 'absolute',
    top: 50,
    transform: [{ rotate: '28deg' }],
    width: 70,
  },
  locateButton: {
    alignItems: 'center',
    borderRadius: 24,
    height: 46,
    justifyContent: 'center',
    position: 'absolute',
    right: 12,
    top: 12,
    width: 46,
  },
  pin: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 2,
    height: 38,
    justifyContent: 'center',
    marginLeft: -19,
    marginTop: -19,
    position: 'absolute',
    width: 38,
  },
  selectedPanel: {
    alignItems: 'center',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    left: 12,
    maxWidth: '72%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    position: 'absolute',
    top: 12,
  },
  selectedTextGroup: { flex: 1 },
  selectedName: { fontFamily: fonts.body, fontSize: 14, fontWeight: '900' },
  selectedMeta: { fontFamily: fonts.body, fontSize: 12, fontWeight: '700', marginTop: 2 },
});
