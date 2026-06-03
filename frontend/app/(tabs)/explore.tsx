import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { BrandHeader, Chip, ScreenShell, SectionLabel } from '@/components/truefeed/ui';
import { MapExplorer } from '@/components/truefeed/map-explorer';
import { fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';
import { mapApi, type MapPlace } from '@/services/api/map';

type LocationState = {
  lat: number;
  lng: number;
} | null;

function getWebLocation() {
  return new Promise<LocationState>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation unavailable.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      reject,
      {
        enableHighAccuracy: false,
        maximumAge: 60_000,
        timeout: 10_000,
      },
    );
  });
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
    try {
      setLocationLabel('GPS...');

      if (Platform.OS === 'web') {
        setLocation(await getWebLocation());
        setLocationLabel('Autour de moi');
        return;
      }

      const Location = await import('expo-location');
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
    } catch {
      setLocationLabel('GPS indispo');
    }
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

      <MapExplorer
        places={places}
        selectedPlace={selectedPlace}
        theme={theme}
        onSelectPlace={setSelectedPlace}
      />

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
            : 'Active le GPS pour voir les lieux proches classes par distance.'}
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
  placeCard: { borderRadius: 26, borderWidth: 1, gap: 12, padding: 18 },
  placeName: { fontFamily: fonts.title, fontSize: 30, fontWeight: '700' },
  placeMeta: { fontFamily: fonts.body, fontSize: 15, fontWeight: '800' },
  score: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  scoreText: { fontFamily: fonts.body, fontSize: 15, fontWeight: '800' },
  placeCopy: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23 },
});
