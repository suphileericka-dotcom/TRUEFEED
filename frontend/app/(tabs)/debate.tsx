import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  BrandHeader,
  Chip,
  ProgressBar,
  ScreenShell,
  SectionLabel,
} from '@/components/truefeed/ui';
import { debateTopics, fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';

export default function DebateScreen() {
  const { selectedSeason } = useGlobalSeason();
  const theme = seasonThemes[selectedSeason];
  const [selectedTopic, setSelectedTopic] = useState(debateTopics[0]);
  const [reply, setReply] = useState('');

  return (
    <ScreenShell theme={theme}>
      <BrandHeader
        theme={theme}
        badgeText={`Mode ${theme.label}`}
        badgeIcon={theme.emoji}
        actions={[{ icon: 'notifications' }, { icon: 'mail' }]}
      />

      <SectionLabel theme={theme} label={`TrueDebate - ${theme.label}`} />

      <View style={styles.filters}>
        <Chip label="Tendances" backgroundColor={theme.accentStrong} textColor="#FFFFFF" />
        <Chip label="Recents" backgroundColor={theme.surfaceAlt} textColor={theme.muted} />
        <Chip label="Mes votes" backgroundColor={theme.surfaceAlt} textColor={theme.muted} />
      </View>

      {debateTopics.map((topic) => {
        const active = selectedTopic.title === topic.title;
        return (
          <Pressable
            key={topic.title}
            onPress={() => setSelectedTopic(topic)}
            style={[
              styles.topicCard,
              {
                backgroundColor: active ? theme.accentSoft : theme.surface,
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
          </Pressable>
        );
      })}

      <View
        style={[styles.threadCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <Text style={[styles.threadTitle, { color: theme.text }]}>{selectedTopic.title}</Text>
        <Text style={[styles.threadBody, { color: theme.muted }]}>{selectedTopic.excerpt}</Text>
        <ProgressBar
          value={selectedTopic.percent}
          color={theme.accentStrong}
          backgroundColor={theme.border}
        />
        <Text style={[styles.voteMeta, { color: theme.muted }]}>
          {selectedTopic.percent}% pour · {100 - selectedTopic.percent}% contre
        </Text>
        <View style={styles.voteRow}>
          <Pressable style={[styles.voteButton, { backgroundColor: theme.accentStrong }]}>
            <Text style={styles.voteText}>Pour</Text>
          </Pressable>
          <Pressable style={[styles.voteButton, { backgroundColor: theme.text }]}>
            <Text style={styles.voteText}>Contre</Text>
          </Pressable>
        </View>
      </View>

      <View
        style={[styles.composer, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <TextInput
          multiline
          onChangeText={setReply}
          placeholder="Repondre au thread..."
          placeholderTextColor={theme.muted}
          style={[styles.replyInput, { color: theme.text }]}
          value={reply}
        />
        <Pressable style={[styles.sendButton, { backgroundColor: theme.accentStrong }]}>
          <Text style={styles.sendText}>Envoyer</Text>
        </Pressable>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  topicCard: { borderRadius: 24, borderWidth: 1, gap: 12, padding: 16 },
  topicTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topicTitle: { fontFamily: fonts.title, fontSize: 24, fontWeight: '700', lineHeight: 31 },
  topicExcerpt: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23 },
  threadCard: { borderRadius: 28, borderWidth: 1, gap: 14, padding: 20 },
  threadTitle: { fontFamily: fonts.title, fontSize: 30, fontWeight: '700', lineHeight: 38 },
  threadBody: { fontFamily: fonts.body, fontSize: 16, lineHeight: 25 },
  voteMeta: { fontFamily: fonts.body, fontSize: 14, fontWeight: '800' },
  voteRow: { flexDirection: 'row', gap: 10 },
  voteButton: { alignItems: 'center', borderRadius: 16, flex: 1, paddingVertical: 13 },
  voteText: { color: '#FFFFFF', fontFamily: fonts.body, fontSize: 14, fontWeight: '800' },
  composer: { borderRadius: 24, borderWidth: 1, gap: 12, padding: 16 },
  replyInput: { fontFamily: fonts.body, fontSize: 15, minHeight: 82, textAlignVertical: 'top' },
  sendButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  sendText: { color: '#FFFFFF', fontFamily: fonts.body, fontSize: 14, fontWeight: '800' },
});
