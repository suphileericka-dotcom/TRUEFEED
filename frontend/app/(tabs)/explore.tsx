import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import type { DimensionValue } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandHeader, Chip, ScreenShell, SectionLabel } from '@/components/truefeed/ui';
import { exploreCategories, fonts, mapExplorerPins, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';

export default function ExploreScreen() {
  const { selectedSeason } = useGlobalSeason();
  const theme = seasonThemes[selectedSeason];
  const [selectedPin, setSelectedPin] = useState(mapExplorerPins[0]);

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
        {exploreCategories.map((category, index) => (
          <Chip
            key={category}
            label={category}
            backgroundColor={index === 0 ? theme.accentStrong : theme.surface}
            textColor={index === 0 ? '#FFFFFF' : theme.muted}
          />
        ))}
      </View>

      <View style={[styles.map, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
        <View style={[styles.mapPath, { backgroundColor: theme.border }]} />
        {mapExplorerPins.map((pin) => (
          <Pressable
            key={pin.id}
            onPress={() => setSelectedPin(pin)}
            style={[
              styles.pin,
              {
                left: pin.x as DimensionValue,
                top: pin.y as DimensionValue,
                backgroundColor: selectedPin.id === pin.id ? theme.accentStrong : theme.surface,
                borderColor: theme.accentStrong,
              },
            ]}
          >
            <Ionicons
              name="location"
              size={18}
              color={selectedPin.id === pin.id ? '#FFFFFF' : theme.accentStrong}
            />
          </Pressable>
        ))}
      </View>

      <View
        style={[styles.placeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <View>
          <Text style={[styles.placeName, { color: theme.text }]}>{selectedPin.name}</Text>
          <Text style={[styles.placeMeta, { color: theme.muted }]}>
            {selectedPin.category} · Kyoto
          </Text>
        </View>
        <View style={[styles.score, { backgroundColor: theme.accentSoft }]}>
          <Text style={[styles.scoreText, { color: theme.accentStrong }]}>{selectedPin.score}</Text>
        </View>
        <Text style={[styles.placeCopy, { color: theme.muted }]}>
          Fiche lieu optimisee pour geoloc: categorie, score, tags et distance seront branches sur
          API MapExplorer.
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
