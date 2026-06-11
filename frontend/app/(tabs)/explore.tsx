import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { MapExplorer } from '@/components/truefeed/map-explorer';
import { BrandHeader, Chip, ScreenShell } from '@/components/truefeed/ui';
import { fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';
import { mapApi, type MapPlace } from '@/services/api/map';
import { getCurrentLocation } from '@/services/location';

type LocationState = {
  lat: number;
  lng: number;
} | null;

const nearbyPeople = [
  { id: 'lucas', name: 'lucas.trips', city: 'Paris', avatar: 'L' },
  { id: 'sara', name: 'sara.city', city: 'Kyoto', avatar: 'S' },
  { id: 'maya', name: 'maya_explores', city: 'Santorin', avatar: 'M' },
];

function matchesPlace(place: MapPlace, query: string) {
  return [place.name, place.city, place.category, place.address, ...place.tags]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(query);
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<MapPlace[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [addedPeople, setAddedPeople] = useState<Set<string>>(new Set());

  const visibleCategories = useMemo(
    () => (categories.length > 0 ? categories : ['Monument', 'Musee', 'Food']),
    [categories],
  );
  const visiblePlaces = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return places;
    }

    return places.filter((place) => matchesPlace(place, query));
  }, [places, searchQuery]);
  const suggestions = useMemo(() => {
    const merged = [...visiblePlaces, ...searchSuggestions];
    const seen = new Set<string>();

    return merged.filter((place) => {
      if (seen.has(place.id)) {
        return false;
      }

      seen.add(place.id);
      return true;
    });
  }, [searchSuggestions, visiblePlaces]);

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
          setCategories(['Monument', 'Musee', 'Food']);
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

  useEffect(() => {
    setSelectedPlace(
      (current) => visiblePlaces.find((item) => item.id === current?.id) || visiblePlaces[0] || null,
    );
  }, [visiblePlaces]);

  useEffect(() => {
    const query = searchQuery.trim();

    if (query.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    let isMounted = true;
    const timeout = setTimeout(() => {
      mapApi
        .searchPlaces({
          q: query,
          lat: location?.lat,
          lng: location?.lng,
        })
        .then((result) => {
          if (isMounted) {
            setSearchSuggestions(result.items);
          }
        })
        .catch(() => {
          if (isMounted) {
            setSearchSuggestions([]);
          }
        });
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [location?.lat, location?.lng, searchQuery]);

  async function enableLocation() {
    try {
      setLocationLabel('GPS...');
      setLocation(await getCurrentLocation());
      setLocationLabel('Autour de moi');
    } catch {
      setLocationLabel('GPS indispo');
    }
  }

  function selectPlace(place: MapPlace) {
    setPlaces((current) => {
      if (current.some((item) => item.id === place.id)) {
        return current;
      }

      return [place, ...current];
    });
    setSelectedPlace(place);
    setSearchQuery(place.name);
    setIsSearchFocused(false);
  }

  function submitSearch() {
    if (suggestions[0]) {
      selectPlace(suggestions[0]);
    }
  }

  const selectedPlaceMeta = selectedPlace
    ? `${selectedPlace.category} - ${selectedPlace.city}${
        selectedPlace.distanceKm !== undefined ? ` - ${selectedPlace.distanceKm} km` : ''
      }`
    : 'Active le GPS ou change de categorie';
  const selectedPlaceCopy = selectedPlace
    ? selectedPlace.address || `Tags: ${selectedPlace.tags.join(', ') || 'aucun tag'}`
    : 'Active le GPS pour voir les lieux proches classes par distance.';

  return (
    <ScreenShell theme={theme}>
      <BrandHeader
        theme={theme}
        badgeText={`MapExplorer ${theme.label}`}
        badgeIcon={theme.emoji}
        actions={[{ icon: 'navigate' }, { icon: 'filter' }]}
      />

      <View
        style={[styles.searchBar, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
      >
        <Ionicons name="search" size={20} color={theme.muted} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setIsSearchFocused(true)}
          onSubmitEditing={submitSearch}
          placeholder="Rechercher lieu, categorie, tag..."
          placeholderTextColor={theme.muted}
          returnKeyType="search"
          style={[styles.searchInput, { color: theme.text }]}
        />
        {searchQuery.length > 0 ? (
          <Pressable onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={22} color={theme.muted} />
          </Pressable>
        ) : null}
      </View>

      {isSearchFocused && searchQuery.trim().length > 0 ? (
        <View
          style={[
            styles.suggestionPanel,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          {suggestions.length > 0 ? (
            suggestions.slice(0, 6).map((place) => (
              <Pressable
                key={place.id}
                onPress={() => selectPlace(place)}
                style={[styles.suggestionRow, { borderBottomColor: theme.border }]}
              >
                <View style={[styles.suggestionIcon, { backgroundColor: theme.surfaceAlt }]}>
                  <Ionicons name="location-outline" size={20} color={theme.accentStrong} />
                </View>
                <View style={styles.suggestionTextGroup}>
                  <Text numberOfLines={1} style={[styles.suggestionName, { color: theme.text }]}>
                    {place.name}
                  </Text>
                  <Text numberOfLines={1} style={[styles.suggestionMeta, { color: theme.muted }]}>
                    {place.address || `${place.category} - ${place.city}`}
                  </Text>
                </View>
                <Ionicons name="return-down-back" size={18} color={theme.muted} />
              </Pressable>
            ))
          ) : (
            <Text style={[styles.emptySuggestion, { color: theme.muted }]}>Aucun resultat</Text>
          )}
        </View>
      ) : null}

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
        places={visiblePlaces}
        selectedPlace={selectedPlace}
        theme={theme}
        onSelectPlace={setSelectedPlace}
        userLocation={location ?? undefined}
        onLocate={enableLocation}
        hasUserLocation={Boolean(location)}
      />

      <View
        style={[styles.placeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <View>
          <Text style={[styles.placeName, { color: theme.text }]}>
            {selectedPlace?.name || 'Aucun lieu'}
          </Text>
          <Text style={[styles.placeMeta, { color: theme.muted }]}>{selectedPlaceMeta}</Text>
        </View>
        <View style={[styles.score, { backgroundColor: theme.accentSoft }]}>
          <Text style={[styles.scoreText, { color: theme.accentStrong }]}>
            {selectedPlace?.score?.toFixed(1) || '--'}
          </Text>
        </View>
        <Text style={[styles.placeCopy, { color: theme.muted }]}>{selectedPlaceCopy}</Text>
      </View>

      <View style={[styles.peoplePanel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.peopleTitle, { color: theme.text }]}>Personnes autour</Text>
        {nearbyPeople.map((person) => {
          const added = addedPeople.has(person.id);

          return (
            <View key={person.id} style={styles.personRow}>
              <View style={[styles.personAvatar, { backgroundColor: theme.accentSoft }]}>
                <Text style={[styles.personAvatarText, { color: theme.accentStrong }]}>
                  {person.avatar}
                </Text>
              </View>
              <View style={styles.personCopy}>
                <Text style={[styles.personName, { color: theme.text }]}>{person.name}</Text>
                <Text style={[styles.personMeta, { color: theme.muted }]}>
                  {location ? `Dans la zone ${selectedPlace?.city || person.city}` : 'Active le GPS pour affiner'}
                </Text>
              </View>
              <Pressable
                onPress={() =>
                  setAddedPeople((current) => {
                    const next = new Set(current);

                    next.add(person.id);
                    return next;
                  })
                }
                style={[
                  styles.addFriendButton,
                  { backgroundColor: added ? theme.surfaceAlt : theme.accentStrong },
                ]}
              >
                <Ionicons
                  name={added ? 'checkmark' : 'add'}
                  size={20}
                  color={added ? theme.accentStrong : '#FFFFFF'}
                />
              </Pressable>
            </View>
          );
        })}
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
  clearButton: { padding: 2 },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 16 },
  suggestionPanel: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  suggestionRow: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  suggestionIcon: {
    alignItems: 'center',
    borderRadius: 24,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  suggestionTextGroup: { flex: 1 },
  suggestionName: { fontFamily: fonts.body, fontSize: 17, fontWeight: '800' },
  suggestionMeta: { fontFamily: fonts.body, fontSize: 13, fontWeight: '700', marginTop: 3 },
  emptySuggestion: { fontFamily: fonts.body, fontSize: 14, fontWeight: '700', padding: 16 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  placeCard: { borderRadius: 26, borderWidth: 1, gap: 12, padding: 18 },
  placeName: { fontFamily: fonts.title, fontSize: 30, fontWeight: '700' },
  placeMeta: { fontFamily: fonts.body, fontSize: 15, fontWeight: '800' },
  score: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  scoreText: { fontFamily: fonts.body, fontSize: 15, fontWeight: '800' },
  placeCopy: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23 },
  peoplePanel: { borderRadius: 26, borderWidth: 1, gap: 14, padding: 18 },
  peopleTitle: { fontFamily: fonts.title, fontSize: 28, fontWeight: '700' },
  personRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  personAvatar: { alignItems: 'center', borderRadius: 24, height: 48, justifyContent: 'center', width: 48 },
  personAvatarText: { fontFamily: fonts.body, fontSize: 17, fontWeight: '900' },
  personCopy: { flex: 1, gap: 3 },
  personName: { fontFamily: fonts.body, fontSize: 16, fontWeight: '900' },
  personMeta: { fontFamily: fonts.body, fontSize: 13, fontWeight: '800' },
  addFriendButton: { alignItems: 'center', borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
});
