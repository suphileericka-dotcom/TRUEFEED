import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';

import { BrandHeader, Chip, ScreenShell } from '@/components/truefeed/ui';
import { debateTopics, fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';

type DebateFilter = 'popular' | 'recent' | 'mine';
type VoteValue = 'for' | 'against';

const seedReplies = [
  {
    author: 'vaadhum',
    age: '12 h',
    text: "Je comprends l'idee, mais tout depend du contexte et de la facon de voyager.",
    up: 7,
    down: 1,
    comments: 1,
  },
  {
    author: 'christinecamarchepas',
    age: '15 h',
    text: "C'est justement le debat: liberte, confort, budget, chacun ne met pas le curseur au meme endroit.",
    up: 12,
    down: 3,
    comments: 4,
  },
];

export default function DebateScreen() {
  const { selectedSeason } = useGlobalSeason();
  const theme = seasonThemes[selectedSeason];
  const [selectedTopic, setSelectedTopic] = useState<(typeof debateTopics)[number] | null>(null);
  const [reply, setReply] = useState('');
  const [filter, setFilter] = useState<DebateFilter>('popular');
  const [votes, setVotes] = useState<Record<string, VoteValue>>({});
  const [reposts, setReposts] = useState<Record<string, number>>({});
  const [replies, setReplies] = useState<Record<string, string[]>>({});

  const visibleTopics = useMemo(() => {
    if (filter === 'mine') {
      return debateTopics.filter((topic) => votes[topic.id]);
    }

    if (filter === 'recent') {
      return [...debateTopics].reverse();
    }

    return [...debateTopics].sort((a, b) => b.percent - a.percent);
  }, [filter, votes]);

  function vote(topicId: string, value: VoteValue) {
    setVotes((current) => ({ ...current, [topicId]: value }));
  }

  function repost(topicId: string) {
    setReposts((current) => ({ ...current, [topicId]: (current[topicId] ?? 0) + 1 }));
  }

  function shareTopic(topic: (typeof debateTopics)[number]) {
    Share.share({
      title: topic.title,
      message: `${topic.title}\n\n${topic.excerpt}`,
    }).catch(() => undefined);
  }

  function sendReply() {
    const cleanReply = reply.trim();

    if (!cleanReply || !selectedTopic) {
      return;
    }

    setReplies((current) => ({
      ...current,
      [selectedTopic.id]: [cleanReply, ...(current[selectedTopic.id] ?? [])],
    }));
    setReply('');
  }

  function getUpCount(topic: (typeof debateTopics)[number]) {
    return topic.percent + (votes[topic.id] === 'for' ? 1 : 0);
  }

  function getDownCount(topic: (typeof debateTopics)[number]) {
    return 100 - topic.percent + (votes[topic.id] === 'against' ? 1 : 0);
  }

  function renderThread(topic: (typeof debateTopics)[number], compact = false) {
    const currentVote = votes[topic.id];
    const commentCount = Number(topic.responses.split(' ')[0]) || 0;

    return (
      <Pressable
        key={topic.id}
        onPress={() => setSelectedTopic(topic)}
        style={[styles.threadPost, compact ? styles.threadPostCompact : null]}
      >
        <View style={[styles.avatar, { backgroundColor: theme.accentSoft }]}>
          <Text style={[styles.avatarText, { color: theme.accentStrong }]}>
            {topic.author.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.threadContent}>
          <View style={styles.threadHeader}>
            <Text style={[styles.author, { color: theme.text }]}>{topic.author}</Text>
            <Text style={[styles.age, { color: theme.muted }]}>{topic.age}</Text>
          </View>

          <Text style={[styles.threadTitle, { color: theme.text }]}>{topic.title}</Text>
          <Text style={[styles.threadBody, { color: theme.text }]}>{topic.excerpt}</Text>

          <View style={styles.actions}>
            <Pressable onPress={() => vote(topic.id, 'for')} style={styles.actionButton}>
              <Ionicons
                name={currentVote === 'for' ? 'thumbs-up' : 'thumbs-up-outline'}
                size={24}
                color={currentVote === 'for' ? theme.accentStrong : theme.muted}
              />
              <Text style={[styles.actionText, { color: theme.muted }]}>{getUpCount(topic)}</Text>
            </Pressable>
            <Pressable onPress={() => vote(topic.id, 'against')} style={styles.actionButton}>
              <Ionicons
                name={currentVote === 'against' ? 'thumbs-down' : 'thumbs-down-outline'}
                size={24}
                color={currentVote === 'against' ? theme.accentStrong : theme.muted}
              />
              <Text style={[styles.actionText, { color: theme.muted }]}>{getDownCount(topic)}</Text>
            </Pressable>
            <Pressable onPress={() => setSelectedTopic(topic)} style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={24} color={theme.muted} />
              <Text style={[styles.actionText, { color: theme.muted }]}>{commentCount}</Text>
            </Pressable>
            <Pressable onPress={() => repost(topic.id)} style={styles.actionButton}>
              <Ionicons name="repeat-outline" size={24} color={theme.muted} />
              <Text style={[styles.actionText, { color: theme.muted }]}>{reposts[topic.id] ?? 0}</Text>
            </Pressable>
            <Pressable onPress={() => shareTopic(topic)} style={styles.actionButton}>
              <Ionicons name="paper-plane-outline" size={24} color={theme.muted} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  }

  if (selectedTopic) {
    const localReplies = replies[selectedTopic.id] ?? [];

    return (
      <ScreenShell theme={theme}>
        <View style={styles.detailTopBar}>
          <Ionicons name="arrow-back" size={28} color={theme.text} onPress={() => setSelectedTopic(null)} />
          <View style={styles.detailTitleGroup}>
            <Text style={[styles.detailTitle, { color: theme.text }]}>Thread</Text>
            <Text style={[styles.detailViews, { color: theme.muted }]}>6,9 K vues</Text>
          </View>
          <Pressable onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications-outline" size={25} color={theme.text} />
          </Pressable>
        </View>

        {renderThread(selectedTopic, true)}

        <View style={styles.detailFilterRow}>
          <Text style={[styles.detailFilter, { color: theme.text }]}>Populaire</Text>
        </View>

        {localReplies.map((item, index) => (
          <View key={`${item}-${index}`} style={styles.replyPost}>
            <View style={[styles.replyAvatar, { backgroundColor: theme.surfaceAlt }]}>
              <Text style={[styles.replyAvatarText, { color: theme.muted }]}>S</Text>
            </View>
            <View style={styles.threadContent}>
              <Text style={[styles.author, { color: theme.text }]}>suphile</Text>
              <Text style={[styles.threadBody, { color: theme.text }]}>{item}</Text>
            </View>
          </View>
        ))}

        {seedReplies.map((item) => (
          <View key={item.author} style={styles.replyPost}>
            <View style={[styles.replyAvatar, { backgroundColor: theme.surfaceAlt }]}>
              <Text style={[styles.replyAvatarText, { color: theme.muted }]}>
                {item.author.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.threadContent}>
              <View style={styles.threadHeader}>
                <Text style={[styles.author, { color: theme.text }]}>{item.author}</Text>
                <Text style={[styles.age, { color: theme.muted }]}>{item.age}</Text>
              </View>
              <Text style={[styles.threadBody, { color: theme.text }]}>{item.text}</Text>
              <View style={styles.actions}>
                <View style={styles.actionButton}>
                  <Ionicons name="thumbs-up-outline" size={22} color={theme.muted} />
                  <Text style={[styles.actionText, { color: theme.muted }]}>{item.up}</Text>
                </View>
                <View style={styles.actionButton}>
                  <Ionicons name="thumbs-down-outline" size={22} color={theme.muted} />
                  <Text style={[styles.actionText, { color: theme.muted }]}>{item.down}</Text>
                </View>
                <View style={styles.actionButton}>
                  <Ionicons name="chatbubble-outline" size={22} color={theme.muted} />
                  <Text style={[styles.actionText, { color: theme.muted }]}>{item.comments}</Text>
                </View>
                <Ionicons name="repeat-outline" size={22} color={theme.muted} />
                <Ionicons name="paper-plane-outline" size={22} color={theme.muted} />
              </View>
            </View>
          </View>
        ))}

        <View style={[styles.composer, { backgroundColor: theme.surfaceAlt }]}>
          <TextInput
            onChangeText={setReply}
            placeholder="Ajoutez votre reponse..."
            placeholderTextColor={theme.muted}
            style={[styles.replyInput, { color: theme.text }]}
            value={reply}
          />
          <Pressable onPress={sendReply}>
            <Ionicons name="send" size={23} color={theme.text} />
          </Pressable>
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell theme={theme}>
      <BrandHeader
        theme={theme}
        badgeText="Debats"
        badgeIcon={theme.emoji}
        actions={[
          { icon: 'notifications', onPress: () => router.push('/notifications') },
          { icon: 'mail', onPress: () => router.push('/messages') },
        ]}
      />

      <View style={styles.filters}>
        <Chip
          label="Populaire"
          active={filter === 'popular'}
          backgroundColor={filter === 'popular' ? theme.accentStrong : theme.surfaceAlt}
          textColor={filter === 'popular' ? '#FFFFFF' : theme.muted}
          onPress={() => setFilter('popular')}
        />
        <Chip
          label="Recent"
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
        visibleTopics.map((topic) => renderThread(topic))
      ) : (
        <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.emptyText, { color: theme.muted }]}>
            Aucun vote pour le moment. Vote sur un debat pour le retrouver ici.
          </Text>
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  threadPost: {
    alignItems: 'flex-start',
    borderBottomColor: 'rgba(120,120,120,0.18)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 22,
  },
  threadPostCompact: { paddingTop: 4 },
  avatar: {
    alignItems: 'center',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  avatarText: { fontFamily: fonts.body, fontSize: 22, fontWeight: '900' },
  threadContent: { flex: 1, gap: 8 },
  threadHeader: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  author: { fontFamily: fonts.body, fontSize: 18, fontWeight: '900' },
  age: { fontFamily: fonts.body, fontSize: 16, fontWeight: '800' },
  threadTitle: { fontFamily: fonts.body, fontSize: 24, fontWeight: '900', lineHeight: 31 },
  threadBody: { fontFamily: fonts.body, fontSize: 20, fontWeight: '800', lineHeight: 30 },
  actions: { alignItems: 'center', flexDirection: 'row', gap: 18, paddingTop: 8 },
  actionButton: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  actionText: { fontFamily: fonts.body, fontSize: 16, fontWeight: '800' },
  detailTopBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  detailTitleGroup: { alignItems: 'center' },
  detailTitle: { fontFamily: fonts.body, fontSize: 28, fontWeight: '900' },
  detailViews: { fontFamily: fonts.body, fontSize: 15, fontWeight: '800' },
  detailFilterRow: {
    alignItems: 'center',
    borderBottomColor: 'rgba(120,120,120,0.18)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 14,
  },
  detailFilter: { fontFamily: fonts.body, fontSize: 20, fontWeight: '900' },
  replyPost: { alignItems: 'flex-start', flexDirection: 'row', gap: 12 },
  replyAvatar: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  replyAvatarText: { fontFamily: fonts.body, fontSize: 18, fontWeight: '900' },
  composer: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  replyInput: { flex: 1, fontFamily: fonts.body, fontSize: 16 },
  emptyCard: { borderRadius: 22, borderWidth: 1, padding: 16 },
  emptyText: { fontFamily: fonts.body, fontSize: 14, fontWeight: '800' },
});
