import { StyleSheet, Text, View } from 'react-native';

import {
  BrandHeader,
  Chip,
  ProgressBar,
  ScreenShell,
  SeasonSwitcher,
  SectionLabel,
} from '@/components/truefeed/ui';
import { debateTopics, fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';

export default function DebateScreen() {
  const { selectedSeason, setSelectedSeason } = useGlobalSeason();
  const theme = seasonThemes[selectedSeason];

  return (
    <ScreenShell theme={theme}>
      <BrandHeader
        theme={theme}
        badgeText={`Mode ${theme.label}`}
        badgeIcon={theme.emoji}
        actions={[{ icon: 'notifications' }, { icon: 'mail' }]}
      />

      <SeasonSwitcher selectedSeason={selectedSeason} onSelect={setSelectedSeason} />

      <SectionLabel theme={theme} label={`TrueDebate - ${theme.label}`} />

      <View style={styles.filters}>
        <Chip label="Debats" icon="💬" backgroundColor={theme.accentStrong} textColor="#FFFFFF" />
        <Chip
          label="Montagne"
          icon="🏔️"
          backgroundColor={theme.surfaceAlt}
          textColor={theme.muted}
        />
        <Chip
          label="Culture"
          icon="🌍"
          backgroundColor={theme.surfaceAlt}
          textColor={theme.muted}
        />
      </View>

      <View style={[styles.heroCard, { backgroundColor: theme.accentStrong }]}>
        <Text style={styles.heroEyebrow}>Topic {theme.label}</Text>
        <Text style={styles.heroTitle}>Le Japon en Hanami : surestime ou incontournable ?</Text>
        <View style={styles.heroButton}>
          <Text style={styles.heroButtonText}>Rejoindre le debat</Text>
        </View>
      </View>

      {debateTopics.map((topic) => (
        <View
          key={topic.title}
          style={[
            styles.topicCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.topicTags}>
            {topic.tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                backgroundColor={theme.surfaceAlt}
                textColor={theme.accentStrong}
              />
            ))}
          </View>
          <Text style={[styles.topicTitle, { color: theme.text }]}>{topic.title}</Text>
          <Text style={[styles.topicExcerpt, { color: theme.muted }]}>{topic.excerpt}</Text>
          <ProgressBar
            value={topic.percent}
            color={theme.accentStrong}
            backgroundColor={theme.border}
          />
          <Text style={[styles.voteMeta, { color: theme.muted }]}>
            {topic.percent}% pour · {100 - topic.percent}% contre
          </Text>
          <View style={styles.topicFooter}>
            <Text style={[styles.topicAuthor, { color: theme.text }]}>{topic.author}</Text>
            <Text style={[styles.topicResponses, { color: theme.accentStrong }]}>
              {topic.responses}
            </Text>
            <Text style={[styles.topicAge, { color: theme.muted }]}>{topic.age}</Text>
          </View>
        </View>
      ))}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    gap: 10,
  },
  heroCard: {
    borderRadius: 32,
    gap: 18,
    padding: 24,
  },
  heroEyebrow: {
    color: '#D7F4DD',
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontFamily: fonts.title,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 42,
  },
  heroButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#7AC38F',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  heroButtonText: {
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 15,
    fontWeight: '800',
  },
  topicCard: {
    borderRadius: 28,
    borderWidth: 1,
    gap: 16,
    padding: 20,
  },
  topicTags: {
    flexDirection: 'row',
    gap: 10,
  },
  topicTitle: {
    fontFamily: fonts.title,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
  },
  topicExcerpt: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 26,
  },
  voteMeta: {
    fontFamily: fonts.body,
    fontSize: 14,
  },
  topicFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topicAuthor: {
    fontFamily: fonts.body,
    fontSize: 15,
    fontWeight: '800',
  },
  topicResponses: {
    fontFamily: fonts.body,
    fontSize: 15,
    fontWeight: '800',
  },
  topicAge: {
    fontFamily: fonts.body,
    fontSize: 14,
  },
});
