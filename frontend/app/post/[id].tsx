// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Chip, ScreenShell, SectionLabel } from '@/components/truefeed/ui';
import { fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';
import { useSession } from '@/hooks/use-session';
import { postsApi } from '@/services/api/posts';

const comments = [
  { id: 'c1', author: 'lucas.trips', content: 'Le conseil horaire est parfait, teste ce matin.' },
  {
    id: 'c2',
    author: 'yuna.moves',
    content: 'Tu ajouterais ce spot dans un premier voyage au Japon ?',
  },
  { id: 'c3', author: 'karim.city', content: 'Budget zero et calme, c’est exactement le combo.' },
];

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedSeason } = useGlobalSeason();
  const { isAuthenticated } = useSession();
  const theme = seasonThemes[selectedSeason];
  const [liked, setLiked] = useState(false);
  const [comment, setComment] = useState('');
  const [visibleComments, setVisibleComments] = useState(
    comments.map((item, index) => ({ ...item, likesCount: index + 1 })),
  );
  const [replyTo, setReplyTo] = useState<(typeof visibleComments)[number] | null>(null);
  const [shared, setShared] = useState(false);
  const [addedAuthors, setAddedAuthors] = useState<Record<string, boolean>>({});

  async function sendComment() {
    const content = comment.trim();

    if (!content) {
      return;
    }

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      const result = await postsApi.comment(String(id), {
        content,
        parentId: replyTo?.id,
      });

      setVisibleComments((current) => [
        ...current,
        {
          id: result.comment.id,
          author: result.comment.author,
          content: result.comment.content,
          likesCount: result.comment.likesCount,
        },
      ]);
    } catch {
      setVisibleComments((current) => [
        ...current,
        {
          id: String(Date.now()),
          author: 'toi',
          content: replyTo ? `@${replyTo.author} ${content}` : content,
          likesCount: 0,
        },
      ]);
    }

    setComment('');
    setReplyTo(null);
  }

  async function likeComment(commentId: string) {
    setVisibleComments((current) =>
      current.map((item) =>
        item.id === commentId ? { ...item, likesCount: item.likesCount + 1 } : item,
      ),
    );

    if (isAuthenticated) {
      await postsApi.likeComment(commentId).catch(() => undefined);
    }
  }

  async function sharePost() {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const result = await postsApi.share(String(id)).catch(() => null);
    setShared(Boolean(result?.shared));
  }

  return (
    <ScreenShell theme={theme}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: theme.surfaceAlt }]}
        >
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </Pressable>
        <SectionLabel theme={theme} label="Detail publication" />
      </View>

      <View style={[styles.hero, { backgroundColor: theme.accentStrong }]}>
        <Chip
          label={String(id || 'post')}
          backgroundColor="rgba(255,255,255,0.2)"
          textColor="#FFFFFF"
        />
        <Text style={styles.heroIcon}>⛩️</Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.author, { color: theme.text }]}>nora.nomad</Text>
        <Text style={[styles.title, { color: theme.text }]}>Matin calme a Kyoto</Text>
        <Text style={[styles.caption, { color: theme.muted }]}>
          Fushimi Inari avant 7h: lumiere douce, budget zero, foule evitee. Ajoute aux favoris si tu
          prepares Kyoto.
        </Text>

        <View style={styles.actions}>
          <Pressable onPress={() => setLiked((value) => !value)} style={styles.action}>
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={22}
              color={liked ? '#E94B6A' : theme.accentStrong}
            />
            <Text style={[styles.actionText, { color: theme.text }]}>
              {liked ? '1923' : '1922'}
            </Text>
          </Pressable>
          <View style={styles.action}>
            <Ionicons name="chatbubble-outline" size={22} color={theme.accentStrong} />
            <Text style={[styles.actionText, { color: theme.text }]}>31</Text>
          </View>
          <Pressable onPress={sharePost} style={styles.action}>
            <Ionicons name="share-social-outline" size={22} color={theme.accentStrong} />
            <Text style={[styles.actionText, { color: theme.text }]}>{shared ? 'Repartage' : 'Partager'}</Text>
          </Pressable>
        </View>
      </View>

      <Text style={[styles.blockTitle, { color: theme.text }]}>Commentaires</Text>
      {visibleComments.map((item) => (
        <View
          key={item.id}
          style={[styles.comment, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <View style={styles.commentHeader}>
            <Text style={[styles.commentAuthor, { color: theme.text }]}>{item.author}</Text>
            <Pressable
              onPress={() => setAddedAuthors((current) => ({ ...current, [item.author]: true }))}
              style={[
                styles.addFriendButton,
                { backgroundColor: addedAuthors[item.author] ? theme.surfaceAlt : theme.accentStrong },
              ]}
            >
              <Ionicons
                name={addedAuthors[item.author] ? 'checkmark' : 'add'}
                size={15}
                color={addedAuthors[item.author] ? theme.accentStrong : '#FFFFFF'}
              />
            </Pressable>
          </View>
          <Text style={[styles.commentText, { color: theme.muted }]}>{item.content}</Text>
          <View style={styles.commentActions}>
            <Pressable onPress={() => likeComment(item.id)} style={styles.action}>
              <Ionicons name="heart-outline" size={18} color={theme.accentStrong} />
              <Text style={[styles.actionText, { color: theme.text }]}>{item.likesCount}</Text>
            </Pressable>
            <Pressable onPress={() => setReplyTo(item)} style={styles.action}>
              <Ionicons name="return-down-forward-outline" size={18} color={theme.accentStrong} />
              <Text style={[styles.actionText, { color: theme.text }]}>Repondre</Text>
            </Pressable>
          </View>
        </View>
      ))}

      {replyTo ? (
        <Text style={[styles.replyHint, { color: theme.accentStrong }]}>Reponse a {replyTo.author}</Text>
      ) : null}

      <View
        style={[
          styles.commentComposer,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <TextInput
          onChangeText={setComment}
          placeholder="Ajouter un commentaire..."
          placeholderTextColor={theme.muted}
          style={[styles.commentInput, { color: theme.text }]}
          value={comment}
        />
        <Pressable onPress={sendComment} style={[styles.sendButton, { backgroundColor: theme.accentStrong }]}>
          <Ionicons name="send" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  topBar: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  iconButton: {
    alignItems: 'center',
    borderRadius: 18,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  hero: { borderRadius: 30, gap: 20, minHeight: 320, padding: 20 },
  heroIcon: { alignSelf: 'center', color: '#FFFFFF', fontSize: 98, marginTop: 58 },
  card: { borderRadius: 28, borderWidth: 1, gap: 12, padding: 20 },
  author: { fontFamily: fonts.body, fontSize: 16, fontWeight: '800' },
  title: { fontFamily: fonts.title, fontSize: 34, fontWeight: '700' },
  caption: { fontFamily: fonts.body, fontSize: 16, lineHeight: 26 },
  actions: { flexDirection: 'row', gap: 18, paddingTop: 6 },
  action: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  actionText: { fontFamily: fonts.body, fontSize: 14, fontWeight: '800' },
  blockTitle: { fontFamily: fonts.title, fontSize: 30, fontWeight: '700' },
  comment: { borderRadius: 22, borderWidth: 1, gap: 6, padding: 16 },
  commentHeader: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  commentAuthor: { fontFamily: fonts.body, fontSize: 15, fontWeight: '800' },
  addFriendButton: { alignItems: 'center', borderRadius: 13, height: 26, justifyContent: 'center', width: 26 },
  commentText: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23 },
  commentActions: { flexDirection: 'row', gap: 16, paddingTop: 4 },
  replyHint: { fontFamily: fonts.body, fontSize: 13, fontWeight: '900' },
  commentComposer: {
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 10,
  },
  commentInput: { flex: 1, fontFamily: fonts.body, fontSize: 15, paddingHorizontal: 8 },
  sendButton: {
    alignItems: 'center',
    borderRadius: 16,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
});
