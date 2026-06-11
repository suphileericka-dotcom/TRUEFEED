// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BrandHeader, Chip, ScreenShell, TruefeedModal } from '@/components/truefeed/ui';
import { debateTopics, fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';
import { useSession } from '@/hooks/use-session';

type DebateFilter = 'popular' | 'recent' | 'mine';
type VoteValue = 'for' | 'against';
type ReplyItem = {
  id: string;
  author: string;
  age: string;
  text: string;
  up: number;
  down: number;
  comments: number;
};

const seedReplies: ReplyItem[] = [
  {
    id: 'reply-vaadhum',
    author: 'vaadhum',
    age: '12 h',
    text: "Je comprends l'idee, mais tout depend du contexte et de la facon de voyager.",
    up: 7,
    down: 1,
    comments: 1,
  },
  {
    id: 'reply-christine',
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
  const { isAuthenticated, user } = useSession();
  const theme = seasonThemes[selectedSeason];
  const [selectedTopic, setSelectedTopic] = useState<(typeof debateTopics)[number] | null>(null);
  const [reply, setReply] = useState('');
  const [filter, setFilter] = useState<DebateFilter>('popular');
  const [votes, setVotes] = useState<Record<string, VoteValue>>({});
  const [reposts, setReposts] = useState<Record<string, boolean>>({});
  const [replies, setReplies] = useState<Record<string, ReplyItem[]>>({});
  const [replyVotes, setReplyVotes] = useState<Record<string, VoteValue>>({});
  const [replyReposts, setReplyReposts] = useState<Record<string, boolean>>({});
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [addedAuthors, setAddedAuthors] = useState<Record<string, boolean>>({});
  const [showAuthNotice, setShowAuthNotice] = useState(false);

  const visibleTopics = useMemo(() => {
    if (filter === 'mine') {
      return debateTopics.filter((topic) => votes[topic.id]);
    }

    if (filter === 'recent') {
      return [...debateTopics].reverse();
    }

    return [...debateTopics].sort((a, b) => b.percent - a.percent);
  }, [filter, votes]);

  function requireAccount() {
    if (isAuthenticated) {
      return true;
    }

    setShowAuthNotice(true);
    return false;
  }

  function vote(topicId: string, value: VoteValue) {
    if (!requireAccount()) {
      return;
    }

    setVotes((current) => ({ ...current, [topicId]: value }));
  }

  function repost(topicId: string) {
    if (!requireAccount()) {
      return;
    }

    setReposts((current) => ({ ...current, [topicId]: !current[topicId] }));
  }

  function sendReply() {
    const cleanReply = reply.trim();

    if (!cleanReply || !selectedTopic) {
      return;
    }

    if (!requireAccount()) {
      return;
    }

    setReplies((current) => ({
      ...current,
      [selectedTopic.id]: [
        {
          id: `local-${Date.now()}`,
          author: user?.username || 'toi',
          age: 'maintenant',
          text: cleanReply,
          up: 0,
          down: 0,
          comments: 0,
        },
        ...(current[selectedTopic.id] ?? []),
      ],
    }));
    setReply('');
  }

  function voteReply(replyId: string, value: VoteValue) {
    if (!requireAccount()) {
      return;
    }

    setReplyVotes((current) => ({ ...current, [replyId]: value }));
  }

  function repostReply(replyId: string) {
    if (!requireAccount()) {
      return;
    }

    setReplyReposts((current) => ({ ...current, [replyId]: !current[replyId] }));
  }

  function toggleReplyThread(replyId: string) {
    setExpandedReplies((current) => ({ ...current, [replyId]: !current[replyId] }));
  }

  function addAuthor(author: string) {
    if (!requireAccount()) {
      return;
    }

    setAddedAuthors((current) => ({ ...current, [author]: true }));
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
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                addAuthor(topic.author);
              }}
              style={[
                styles.addFriendButton,
                { backgroundColor: addedAuthors[topic.author] ? theme.surfaceAlt : theme.accentStrong },
              ]}
            >
              <Ionicons
                name={addedAuthors[topic.author] ? 'checkmark' : 'add'}
                size={16}
                color={addedAuthors[topic.author] ? theme.accentStrong : '#FFFFFF'}
              />
            </Pressable>
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
              <Ionicons
                name={reposts[topic.id] ? 'repeat' : 'repeat-outline'}
                size={24}
                color={reposts[topic.id] ? theme.accentStrong : theme.muted}
              />
              <Text style={[styles.actionText, { color: theme.muted }]}>{reposts[topic.id] ? 1 : 0}</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  }

  function renderReply(item: ReplyItem) {
    const currentVote = replyVotes[item.id];
    const isExpanded = Boolean(expandedReplies[item.id]);
    const upCount = item.up + (currentVote === 'for' ? 1 : 0);
    const downCount = item.down + (currentVote === 'against' ? 1 : 0);

    return (
      <View key={item.id} style={styles.replyPost}>
        <View style={[styles.replyAvatar, { backgroundColor: theme.surfaceAlt }]}>
          <Text style={[styles.replyAvatarText, { color: theme.muted }]}>
            {item.author.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.threadContent}>
          <View style={styles.threadHeader}>
            <Text style={[styles.author, { color: theme.text }]}>{item.author}</Text>
            <Pressable
              onPress={() => addAuthor(item.author)}
              style={[
                styles.addFriendButton,
                { backgroundColor: addedAuthors[item.author] ? theme.surfaceAlt : theme.accentStrong },
              ]}
            >
              <Ionicons
                name={addedAuthors[item.author] ? 'checkmark' : 'add'}
                size={16}
                color={addedAuthors[item.author] ? theme.accentStrong : '#FFFFFF'}
              />
            </Pressable>
            <Text style={[styles.age, { color: theme.muted }]}>{item.age}</Text>
          </View>
          <Text style={[styles.threadBody, { color: theme.text }]}>{item.text}</Text>
          <View style={styles.actions}>
            <Pressable onPress={() => voteReply(item.id, 'for')} style={styles.actionButton}>
              <Ionicons
                name={currentVote === 'for' ? 'thumbs-up' : 'thumbs-up-outline'}
                size={22}
                color={currentVote === 'for' ? theme.accentStrong : theme.muted}
              />
              <Text style={[styles.actionText, { color: theme.muted }]}>{upCount}</Text>
            </Pressable>
            <Pressable onPress={() => voteReply(item.id, 'against')} style={styles.actionButton}>
              <Ionicons
                name={currentVote === 'against' ? 'thumbs-down' : 'thumbs-down-outline'}
                size={22}
                color={currentVote === 'against' ? theme.accentStrong : theme.muted}
              />
              <Text style={[styles.actionText, { color: theme.muted }]}>{downCount}</Text>
            </Pressable>
            <Pressable onPress={() => toggleReplyThread(item.id)} style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={22} color={theme.muted} />
              <Text style={[styles.actionText, { color: theme.muted }]}>{item.comments}</Text>
            </Pressable>
            <Pressable onPress={() => repostReply(item.id)} style={styles.actionButton}>
              <Ionicons
                name={replyReposts[item.id] ? 'repeat' : 'repeat-outline'}
                size={22}
                color={replyReposts[item.id] ? theme.accentStrong : theme.muted}
              />
            </Pressable>
          </View>

          {isExpanded ? (
            <View style={[styles.replyThreadBox, { borderColor: theme.border }]}>
              {item.comments > 0 ? (
                <Text style={[styles.replyThreadText, { color: theme.muted }]}>
                  {item.comments} reponse{item.comments > 1 ? 's' : ''} sur ce commentaire.
                </Text>
              ) : (
                <Text style={[styles.replyThreadText, { color: theme.muted }]}>
                  Aucune reponse pour le moment.
                </Text>
              )}
              <Pressable onPress={() => toggleReplyThread(item.id)}>
                <Text style={[styles.showLessText, { color: theme.accentStrong }]}>Voir moins</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
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

        {localReplies.map((item) => renderReply(item))}
        {seedReplies.map((item) => renderReply(item))}

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

        <TruefeedModal
          visible={showAuthNotice}
          theme={theme}
          title="Compte requis"
          message="Cree un compte ou connecte-toi pour commenter, liker, republier et publier."
          primaryLabel="Creer un compte"
          secondaryLabel="Se connecter"
          onClose={() => setShowAuthNotice(false)}
          onPrimary={() => {
            setShowAuthNotice(false);
            router.push('/signup');
          }}
          onSecondary={() => {
            setShowAuthNotice(false);
            router.push('/login');
          }}
        />
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

      <TruefeedModal
        visible={showAuthNotice}
        theme={theme}
        title="Compte requis"
        message="Cree un compte ou connecte-toi pour commenter, liker, republier et publier."
        primaryLabel="Creer un compte"
        secondaryLabel="Se connecter"
        onClose={() => setShowAuthNotice(false)}
        onPrimary={() => {
          setShowAuthNotice(false);
          router.push('/signup');
        }}
        onSecondary={() => {
          setShowAuthNotice(false);
          router.push('/login');
        }}
      />
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
  addFriendButton: { alignItems: 'center', borderRadius: 14, height: 28, justifyContent: 'center', width: 28 },
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
  replyThreadBox: { borderLeftWidth: 2, gap: 6, marginTop: 8, paddingLeft: 12 },
  replyThreadText: { fontFamily: fonts.body, fontSize: 14, fontWeight: '800' },
  showLessText: { fontFamily: fonts.body, fontSize: 14, fontWeight: '900' },
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
