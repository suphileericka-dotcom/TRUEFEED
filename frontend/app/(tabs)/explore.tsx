import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { BrandHeader, Chip, ScreenShell, SectionLabel } from '@/components/truefeed/ui';
import { exploreCategories, fonts, seasonThemes, winterSpots } from '@/constants/truefeed';

export default function ExploreScreen() {
  const theme = seasonThemes.winter;

  return (
    <ScreenShell theme={theme}>
      <BrandHeader
        theme={theme}
        badgeText="Mode Hiver"
        badgeIcon={theme.emoji}
        actions={[
          { icon: 'notifications', tint: '#FFD36B' },
          { icon: 'mail', tint: '#D6DEFF' },
        ]}
      />

      <SectionLabel theme={theme} label="Explore - Hiver" />

      <View style={[styles.searchBar, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
        <Ionicons name="search" size={20} color={theme.muted} />
        <Text style={[styles.searchText, { color: theme.muted }]}>Explorer une destination...</Text>
      </View>

      <View style={styles.categoryRow}>
        {exploreCategories.map((category, index) => (
          <Chip
            key={category}
            label={category}
            icon={index === 0 ? '🧭' : index === 1 ? '🏙️' : '🛍️'}
            backgroundColor={index === 0 ? theme.accentStrong : theme.surface}
            textColor={index === 0 ? '#FFFFFF' : theme.muted}
          />
        ))}
      </View>

      <View style={styles.grid}>
        {winterSpots.map((spot, index) => (
          <View
            key={spot.name}
            style={[
              styles.spotCard,
              {
                backgroundColor: spot.tone,
                height: index === 0 || index === 3 ? 250 : 190,
              },
            ]}>
            <Text style={styles.spotIcon}>{spot.icon}</Text>
            <Text style={styles.spotName}>{spot.name}</Text>
            <Text style={styles.spotPosts}>{spot.posts}</Text>
          </View>
        ))}
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
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  searchText: {
    fontFamily: fonts.body,
    fontSize: 17,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'space-between',
  },
  spotCard: {
    borderRadius: 28,
    justifyContent: 'flex-end',
    padding: 18,
    width: '47.8%',
  },
  spotIcon: {
    alignSelf: 'center',
    fontSize: 54,
    marginBottom: 26,
    marginTop: 10,
  },
  spotName: {
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 17,
    fontWeight: '800',
  },
  spotPosts: {
    color: '#B8C8EA',
    fontFamily: fonts.body,
    fontSize: 14,
    marginTop: 6,
  },
});
