import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BrandHeader, Chip, ProgressBar, ScreenShell, SectionLabel } from '@/components/truefeed/ui';
import { debateTopics, fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';
import { router } from 'expo-router';

type DebateFilter = 'trending' | 'recent' | 'mine';
type VoteValue = 'for' | 'against';

export default function DebateScreen() {
  const { selectedSeason } = useGlobalSeason();
  const theme = seasonThemes[selectedSeason];
  const [selectedTopic, setSelectedTopic] = useState(debateTopics[0]);
  const [reply, setReply] = useState('');
  const [filter, setFilter] = useState<DebateFilter>('trending');
  const [votes, setVotes] = useState<Record<string, VoteValue>>({});
  const [replies, setReplies] = useState<Record<string, string[]>>({});

  const visibleTopics = useMemo(() => {
    if (filter === 'mine') {
      return debateTopics.filter((topic) => votes[topic.title]);
    }

    if (filter === 'recent') {
      return [...debateTopics].reverse();
    }

    return [...debateTopics].sort((a, b) => b.percent - a.percent);
  }, [filter, votes]);

  function vote(value: VoteValue) {
    setVotes((current) => ({ ...current, [selectedTopic.title]: value }));
  }

  function sendReply() {
    const cleanReply = reply.trim();

    if (!cleanReply) {
      return;
    }

    setReplies((current) => ({
      ...current,
      [selectedTopic.title]: [cleanReply, ...(current[selectedTopic.title] ?? [])],
    }));
    setReply('');
  }

  const currentVote = votes[selectedTopic.title];
  const displayedPercent =
    currentVote === 'for'
      ? Math.min(95, selectedTopic.percent + 4)
      : currentVote === 'against'
        ? Math.max(5, selectedTopic.percent - 4)
        : selectedTopic.percent;

  return (
    <ScreenShell theme={theme}>
      <BrandHeader
        theme={theme}
        badgeText={`Mode ${theme.label}`}
        badgeIcon={theme.emoji}
        actions={[
          { icon: 'notifications', onPress: () => router.push('/notifications') },
          { icon: 'mail', onPress: () => router.push('/messages') },
        ]}
      />

      <SectionLabel theme={theme} label={`TrueDebate - ${theme.label}`} />

      <View style={styles.filters}>
        <Chip
          label="Tendances"
          active={filter === 'trending'}
          backgroundColor={filter === 'trending' ? theme.accentStrong : theme.surfaceAlt}
          textColor={filter === 'trending' ? '#FFFFFF' : theme.muted}
          onPress={() => setFilter('trending')}
        />
        <Chip
          label="Recents"
          active={filter === 'recent'}
          backgroundColor={filter === 'recent' ? theme.accentStrong : theme.surfaceAlt}
          textColor={filter === 'recent' ? '#FFFFFF' : theme.muted}
          onPress={() => setFilter('recent')}
        />
        <Chip
          label="Mes votes"
          active={filter === 'mine'}
          backgroundColor={filter === 'mine' ? theme.accentStrong : theme.surfaceAlt}
          textColor={filter === 'mine' ? '#FFFFFF' : theme.muted}
          onPress={() => setFilter('mine')}
        />
      </View>

      {visibleTopics.length > 0 ? (
        visibleTopics.map((topic) => {
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
        })
      ) : (
        <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.emptyText, { color: theme.muted }]}>
            Aucun vote pour le moment. Vote sur un debat pour le retrouver ici.
          </Text>
        </View>
      )}

      <View style={[styles.threadCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.threadTitle, { color: theme.text }]}>{selectedTopic.title}</Text>
        <Text style={[styles.threadBody, { color: theme.muted }]}>{selectedTopic.excerpt}</Text>
        <ProgressBar value={displayedPercent} color={theme.accentStrong} backgroundColor={theme.border} />
        <Text style={[styles.voteMeta, { color: theme.muted }]}>
          {displayedPercent}% pour - {100 - displayedPercent}% contre
        </Text>
        <View style={styles.voteRow}>
          <Pressable
            onPress={() => vote('for')}
            style={[
              styles.voteButton,
              { backgroundColor: currentVote === 'for' ? theme.accentStrong : theme.surfaceAlt },
            ]}
          >
            <Text style={[styles.voteText, { color: currentVote === 'for' ? '#FFFFFF' : theme.text }]}>
              Pour
            </Text>
          </Pressable>
          <Pressable
            onPress={() => vote('against')}
            style={[
              styles.voteButton,
              { backgroundColor: currentVote === 'against' ? theme.text : theme.surfaceAlt },
            ]}
          >
            <Text
              style={[styles.voteText, { color: currentVote === 'against' ? '#FFFFFF' : theme.text }]}
            >
              Contre
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.composer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TextInput
          multiline
          onChangeText={setReply}
          placeholder="Repondre au thread..."
          placeholderTextColor={theme.muted}
          style={[styles.replyInput, { color: theme.text }]}
          value={reply}
        />
        <Pressable onPress={sendReply} style={[styles.sendButton, { backgroundColor: theme.accentStrong }]}>
          <Text style={styles.sendText}>Envoyer</Text>
        </Pressable>
      </View>

      {(replies[selectedTopic.title] ?? []).map((item, index) => (
        <View key={`${item}-${index}`} style={[styles.replyCard, { backgroundColor: theme.surfaceAlt }]}>
          <Text style={[styles.replyText, { color: theme.text }]}>{item}</Text>
        </View>
      ))}
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
  voteText: { fontFamily: fonts.body, fontSize: 14, fontWeight: '800' },
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
  replyCard: { borderRadius: 18, padding: 14 },
  replyText: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21 },
  emptyCard: { borderRadius: 22, borderWidth: 1, padding: 16 },
  emptyText: { fontFamily: fonts.body, fontSize: 14, fontWeight: '800' },
});
