import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandHeader, Chip, ScreenShell, SeasonSwitcher, SectionLabel } from '@/components/truefeed/ui';
import { feedBySeason, fonts, getSeasonFromDate, seasonThemes, storyUsers, type SeasonKey } from '@/constants/truefeed';

export default function HomeScreen() {
  const [selectedSeason, setSelectedSeason] = useState<SeasonKey>(getSeasonFromDate());
  const theme = seasonThemes[selectedSeason];
  const feed = feedBySeason[selectedSeason];

  return (
    <ScreenShell theme={theme}>
      <BrandHeader
        theme={theme}
        badgeText={feed.chip}
        badgeIcon={theme.emoji}
        actions={[
          { icon: 'notifications' },
          { icon: 'mail' },
        ]}
      />

      <SeasonSwitcher selectedSeason={selectedSeason} onSelect={setSelectedSeason} />

      <SectionLabel theme={theme} label={`Feed principal - ${theme.label}`} />

      <View style={styles.storyRow}>
        {storyUsers.map((name, index) => (
          <View key={name} style={styles.storyItem}>
            <View
              style={[
                styles.storyCircle,
                {
                  borderColor: index % 2 === 0 ? theme.accentStrong : '#59C0C9',
                  backgroundColor: theme.surface,
                },
              ]}
            />
            <Text style={[styles.storyName, { color: theme.muted }]}>{name}</Text>
          </View>
        ))}
      </View>

      <View
        style={[
          styles.postCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}>
        <View style={styles.postHeader}>
          <View>
            <Text style={[styles.authorName, { color: theme.text }]}>{feed.author}</Text>
            <Text style={[styles.metaText, { color: theme.muted }]}>{feed.location}</Text>
          </View>
          <Ionicons name="ellipsis-horizontal" size={18} color={theme.muted} />
        </View>

        <View
          style={[
            styles.visual,
            {
              backgroundColor: theme.accentStrong,
            },
          ]}>
          <Chip
            label={feed.visualTag}
            backgroundColor="rgba(255,255,255,0.22)"
            textColor="#FFFFFF"
          />
          <Text style={styles.visualEmoji}>{feed.emoji}</Text>
        </View>

        <View style={styles.postActions}>
          <Ionicons name="heart-outline" size={21} color={theme.accentStrong} />
          <Ionicons name="chatbubble-outline" size={21} color={theme.muted} />
          <Ionicons name="airplane-outline" size={21} color={theme.muted} />
          <View style={styles.postActionsSpacer} />
          <Ionicons name="pricetag-outline" size={21} color={theme.accentStrong} />
        </View>

        <Text style={[styles.likes, { color: theme.text }]}>{feed.likes}</Text>
        <Text style={[styles.caption, { color: theme.muted }]}>
          <Text style={[styles.captionStrong, { color: theme.text }]}>{feed.author} </Text>
          {feed.caption}
        </Text>

        <View style={styles.postFooter}>
          <Chip
            label="VlogFeed · 2 min"
            icon={theme.emoji}
            backgroundColor={theme.accentSoft}
            textColor={theme.accentStrong}
          />
          <Pressable
            onPress={() => router.push('/publish')}
            style={[
              styles.quickPostButton,
              {
                backgroundColor: theme.text,
              },
            ]}>
            <Text style={styles.quickPostText}>Poster</Text>
          </Pressable>
        </View>
      </View>

      <View
        style={[
          styles.noteCard,
          {
            backgroundColor: theme.surfaceAlt,
            borderColor: theme.border,
          },
        ]}>
        <Text style={[styles.noteTitle, { color: theme.text }]}>SeasonMode actif</Text>
        <Text style={[styles.noteText, { color: theme.muted }]}>
          Le theme detecte la saison du telephone par defaut, puis tu peux le changer pour
          previsualiser les autres ambiances.
        </Text>
        <Text style={[styles.noteHint, { color: theme.accentStrong }]}>{feed.hint}</Text>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  storyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  storyItem: {
    alignItems: 'center',
    gap: 8,
  },
  storyCircle: {
    borderRadius: 40,
    borderWidth: 3,
    height: 72,
    width: 72,
  },
  storyName: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '700',
  },
  postCard: {
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
  },
  postHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  authorName: {
    fontFamily: fonts.body,
    fontSize: 18,
    fontWeight: '800',
  },
  metaText: {
    fontFamily: fonts.body,
    fontSize: 14,
    marginTop: 4,
  },
  visual: {
    gap: 18,
    height: 290,
    marginTop: 18,
    padding: 20,
  },
  visualEmoji: {
    alignSelf: 'center',
    fontSize: 84,
    marginTop: 32,
  },
  postActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  postActionsSpacer: {
    flex: 1,
  },
  likes: {
    fontFamily: fonts.body,
    fontSize: 17,
    fontWeight: '800',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 26,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  captionStrong: {
    fontWeight: '800',
  },
  postFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  quickPostButton: {
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  quickPostText: {
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '800',
  },
  noteCard: {
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    padding: 20,
  },
  noteTitle: {
    fontFamily: fonts.title,
    fontSize: 26,
    fontWeight: '700',
  },
  noteText: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 24,
  },
  noteHint: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '800',
  },
});
