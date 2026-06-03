import { Ionicons } from '@expo/vector-icons';
import type { DimensionValue } from 'react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { mapExplorerPins, type SeasonTheme } from '@/constants/truefeed';
import type { MapPlace } from '@/services/api/map';

type MapExplorerProps = {
  places: MapPlace[];
  selectedPlace: MapPlace | null;
  theme: SeasonTheme;
  onSelectPlace: (place: MapPlace) => void;
};

function pinPosition(index: number) {
  return mapExplorerPins[index % mapExplorerPins.length];
}

export function MapExplorer({ places, selectedPlace, theme, onSelectPlace }: MapExplorerProps) {
  return (
    <View style={[styles.map, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
      <View style={[styles.mapPath, { backgroundColor: theme.border }]} />
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
});
