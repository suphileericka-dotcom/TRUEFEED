import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useMemo, useState } from 'react';
import type { DimensionValue } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandHeader, Chip, ScreenShell, SectionLabel } from '@/components/truefeed/ui';
import { fonts, mapExplorerPins, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';
import { mapApi, type MapPlace } from '@/services/api/map';

type LocationState = {
  lat: number;
  lng: number;
} | null;

function pinPosition(index: number) {
  return mapExplorerPins[index % mapExplorerPins.length];
}

export default function ExploreScreen() {
  const { selectedSeason } = useGlobalSeason();
  const theme = seasonThemes[selectedSeason];
  const [categories, setCategories] = useState<string[]>([]);
  const [places, setPlaces] = useState<MapPlace[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedPlace, setSelectedPlace] = useState<MapPlace | null>(null);
  const [location, setLocation] = useState<LocationState>(null);
  const [locationLabel, setLocationLabel] = useState('Activer GPS');

  const visibleCategories = useMemo(
    () => (categories.length > 0 ? categories : ['Temple', 'Food', 'Montagne']),
    [categories],
  );

  useEffect(() => {
    let isMounted = true;

    mapApi
      .listCategories()
      .then((result) => {
        if (isMounted) {
          setCategories(result.items);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCategories(['Temple', 'Food', 'Montagne']);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    mapApi
      .listPlaces({
        category: selectedCategory,
        lat: location?.lat,
        lng: location?.lng,
        radiusKm: 250,
      })
      .then((result) => {
        if (!isMounted) return;

        setPlaces(result.items);
        setSelectedPlace(
          (current) => result.items.find((item) => item.id === current?.id) || result.items[0] || null,
        );
      })
      .catch(() => {
        if (!isMounted) return;

        setPlaces([]);
        setSelectedPlace(null);
      });

    return () => {
      isMounted = false;
    };
  }, [location?.lat, location?.lng, selectedCategory]);

  async function enableLocation() {
    setLocationLabel('GPS...');
    const permission = await Location.requestForegroundPermissionsAsync();

    if (permission.status !== 'granted') {
      setLocationLabel('GPS refuse');
      return;
    }

    const current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    setLocation({
      lat: current.coords.latitude,
      lng: current.coords.longitude,
    });
    setLocationLabel('Autour de moi');
  }

  return (
    <ScreenShell theme={theme}>
      <BrandHeader
        theme={theme}
        badgeText={`MapExplorer ${theme.label}`}
        badgeIcon={theme.emoji}
        actions={[{ icon: 'navigate' }, { icon: 'filter' }]}
      />

      <SectionLabel theme={theme} label="Carte + pins + fiche lieu" />

      <View
        style={[styles.searchBar, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
      >
        <Ionicons name="search" size={20} color={theme.muted} />
        <Text style={[styles.searchText, { color: theme.muted }]}>
          Rechercher lieu, categorie, tag...
        </Text>
      </View>

      <View style={styles.categoryRow}>
        <Chip
          label={locationLabel}
          backgroundColor={location ? theme.accentStrong : theme.surface}
          textColor={location ? '#FFFFFF' : theme.muted}
          onPress={enableLocation}
        />
        {visibleCategories.map((category) => (
          <Chip
            key={category}
            label={category}
            backgroundColor={selectedCategory === category ? theme.accentStrong : theme.surface}
            textColor={selectedCategory === category ? '#FFFFFF' : theme.muted}
            onPress={() =>
              setSelectedCategory((current) => (current === category ? undefined : category))
            }
          />
        ))}
      </View>

      <View style={[styles.map, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
        <View style={[styles.mapPath, { backgroundColor: theme.border }]} />
        {places.map((place, index) => {
          const position = pinPosition(index);

          return (
            <Pressable
              key={place.id}
              onPress={() => setSelectedPlace(place)}
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

      <View
        style={[styles.placeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <View>
          <Text style={[styles.placeName, { color: theme.text }]}>
            {selectedPlace?.name || 'Aucun lieu'}
          </Text>
          <Text style={[styles.placeMeta, { color: theme.muted }]}>
            {selectedPlace
              ? `${selectedPlace.category} · ${selectedPlace.city}${
                  selectedPlace.distanceKm !== undefined ? ` · ${selectedPlace.distanceKm} km` : ''
                }`
              : 'Active le GPS ou change de categorie'}
          </Text>
        </View>
        <View style={[styles.score, { backgroundColor: theme.accentSoft }]}>
          <Text style={[styles.scoreText, { color: theme.accentStrong }]}>
            {selectedPlace?.score?.toFixed(1) || '--'}
          </Text>
        </View>
        <Text style={[styles.placeCopy, { color: theme.muted }]}>
          {selectedPlace
            ? `Tags: ${selectedPlace.tags.join(', ') || 'aucun tag'}`
            : 'Les lieux viennent de l API MapExplorer et sont tries par distance quand le GPS est actif.'}
        </Text>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  searchText: { fontFamily: fonts.body, fontSize: 16 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
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
  placeCard: { borderRadius: 26, borderWidth: 1, gap: 12, padding: 18 },
  placeName: { fontFamily: fonts.title, fontSize: 30, fontWeight: '700' },
  placeMeta: { fontFamily: fonts.body, fontSize: 15, fontWeight: '800' },
  score: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  scoreText: { fontFamily: fonts.body, fontSize: 15, fontWeight: '800' },
  placeCopy: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23 },
});
