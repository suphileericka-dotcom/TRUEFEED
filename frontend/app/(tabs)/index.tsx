import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { memo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { BrandHeader, Chip, TruefeedModal } from '@/components/truefeed/ui';
import { feedBySeason, fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';

type FeedPost = {
  id: string;
  author: string;
  location: string;
  title: string;
  caption: string;
  mediaType: 'image' | 'video' | 'text';
  visual: string;
  tag: string;
  likes: number;
  comments: number;
  shares: number;
};

const storyProfiles = [
  { name: 'Lucas', avatar: 'L', colors: ['#F9CE34', '#EE2A7B'] },
  { name: 'Sara', avatar: 'S', colors: ['#F9CE34', '#6228D7'] },
  { name: 'Karim', avatar: 'K', colors: ['#F9CE34', '#EE2A7B'] },
  { name: 'Yuna', avatar: 'Y', colors: ['#F9CE34', '#6228D7'] },
  { name: 'Alex', avatar: 'A', colors: ['#F9CE34', '#EE2A7B'] },
];

const storyBackgrounds = ['#111827', '#EE2A7B', '#F97316', '#14B8A6', '#2563EB', '#7C3AED'];

const feedPosts: FeedPost[] = [
  {
    id: 'kyoto-morning',
    author: 'nora.nomad',
    location: 'Kyoto, Japon',
    title: 'Matin calme a Kyoto',
    caption: 'Fushimi Inari avant 7h: lumiere douce, budget zero, foule evitee.',
    mediaType: 'image',
    visual: '⛩️',
    tag: 'BonPlan',
    likes: 1922,
    comments: 31,
    shares: 12,
  },
  {
    id: 'oia-sunset',
    author: 'maya_explores',
    location: 'Santorin, Grece',
    title: 'Oia sans courir',
    caption: 'Un spot cote ruelle avec vue caldeira et snack local a moins de 8 euros.',
    mediaType: 'video',
    visual: '🏖️',
    tag: 'VlogFeed',
    likes: 2847,
    comments: 42,
    shares: 18,
  },
  {
    id: 'hanami-debate',
    author: 'sophie_bpkt',
    location: 'Tokyo, Japon',
    title: 'Hanami: magie ou surcote ?',
    caption: 'Joli, oui. Mais est-ce devenu un passage trop touristique ? Debat ouvert.',
    mediaType: 'text',
    visual: '🌸',
    tag: 'TrueDebate',
    likes: 1488,
    comments: 96,
    shares: 27,
  },
];

const FeedCard = memo(function FeedCard({
  post,
  theme,
}: {
  post: FeedPost;
  theme: (typeof seasonThemes)['summer'];
}) {
  const [liked, setLiked] = useState(false);
  const [shared, setShared] = useState(false);
  const [shareNotice, setShareNotice] = useState('');
  const likesCount = liked ? post.likes + 1 : post.likes;
  const sharesCount = shared ? post.shares + 1 : post.shares;

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id } })}
      style={[styles.postCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
    >
      <View style={styles.postHeader}>
        <View>
          <Text style={[styles.authorName, { color: theme.text }]}>{post.author}</Text>
          <Text style={[styles.metaText, { color: theme.muted }]}>{post.location}</Text>
        </View>
        <Ionicons name="ellipsis-horizontal" size={18} color={theme.muted} />
      </View>

      <View style={[styles.visual, { backgroundColor: theme.accentStrong }]}>
        <Chip label={post.tag} backgroundColor="rgba(255,255,255,0.22)" textColor="#FFFFFF" />
        <Text style={styles.visualEmoji}>{post.visual}</Text>
        <View style={styles.mediaBadge}>
          <Ionicons
            name={
              post.mediaType === 'video'
                ? 'play-circle'
                : post.mediaType === 'image'
                  ? 'image'
                  : 'document-text'
            }
            size={18}
            color="#FFFFFF"
          />
          <Text style={styles.mediaBadgeText}>{post.mediaType}</Text>
        </View>
      </View>

      <View style={styles.postActions}>
        <Pressable onPress={() => setLiked((value) => !value)}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={22}
            color={liked ? '#E94B6A' : theme.accentStrong}
          />
        </Pressable>
        <Pressable onPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id } })}>
          <Ionicons name="chatbubble-outline" size={22} color={theme.muted} />
        </Pressable>
        <Pressable
          onPress={() => {
            setShared(true);
            setShareNotice('Partage pret');
            Share.share({
              message: `${post.title} - ${post.caption}`,
              title: post.title,
            }).catch(() => setShareNotice('Lien pret a partager'));
          }}
        >
          <Ionicons
            name="airplane-outline"
            size={22}
            color={shared ? theme.accentStrong : theme.muted}
          />
        </Pressable>
        <View style={styles.postActionsSpacer} />
        <Ionicons name="bookmark-outline" size={22} color={theme.accentStrong} />
      </View>

      <Text style={[styles.likes, { color: theme.text }]}>
        {likesCount.toLocaleString('fr-FR')} likes · {post.comments} commentaires · {sharesCount}{' '}
        shares
      </Text>
      <Text style={[styles.postTitle, { color: theme.text }]}>{post.title}</Text>
      <Text style={[styles.caption, { color: theme.muted }]}>{post.caption}</Text>
      {shareNotice ? (
        <Text style={[styles.shareNotice, { color: theme.accentStrong }]}>{shareNotice}</Text>
      ) : null}
    </Pressable>
  );
});

export default function HomeScreen() {
  const { selectedSeason } = useGlobalSeason();
  const [sort, setSort] = useState<'recent' | 'popular'>('recent');
  const [activeTag, setActiveTag] = useState('Tous');
  const [hasOwnStory, setHasOwnStory] = useState(false);
  const [showStoryComposer, setShowStoryComposer] = useState(false);
  const [storyText, setStoryText] = useState('');
  const [storyMediaType, setStoryMediaType] = useState<'image' | 'video' | null>(null);
  const [storyBackground, setStoryBackground] = useState(storyBackgrounds[0]);
  const theme = seasonThemes[selectedSeason];
  const feed = feedBySeason[selectedSeason];
  const tagOptions = ['Tous', 'BonPlan', 'VlogFeed', 'TrueDebate'];
  const filteredPosts = feedPosts
    .filter((post) => activeTag === 'Tous' || post.tag === activeTag)
    .sort((a, b) => (sort === 'popular' ? b.likes - a.likes : 0));

  async function pickStoryMedia() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.85,
      videoMaxDuration: 30,
    });

    if (!result.canceled && result.assets[0]) {
      setStoryMediaType(result.assets[0].type === 'video' ? 'video' : 'image');
    }
  }

  function publishStory() {
    if (!storyText.trim() && !storyMediaType) {
      return;
    }

    setHasOwnStory(true);
    setShowStoryComposer(false);
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        initialNumToRender={2}
        maxToRenderPerBatch={3}
        removeClippedSubviews
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <BrandHeader
              theme={theme}
              badgeText={feed.chip}
              badgeIcon={theme.emoji}
              actions={[
                { icon: 'person-circle', onPress: () => router.push('/settings') },
                { icon: 'mail', onPress: () => router.push('/messages') },
              ]}
            />
            <View style={styles.skeletonRow}>
              <View style={[styles.skeletonBlock, { backgroundColor: theme.surfaceAlt }]} />
              <View style={[styles.skeletonLine, { backgroundColor: theme.surfaceAlt }]} />
            </View>
            <View style={styles.filterRow}>
              <Chip
                label="Recent"
                active={sort === 'recent'}
                backgroundColor={sort === 'recent' ? theme.accentStrong : theme.surface}
                textColor={sort === 'recent' ? '#FFFFFF' : theme.muted}
                onPress={() => setSort('recent')}
              />
              <Chip
                label="Populaire"
                active={sort === 'popular'}
                backgroundColor={sort === 'popular' ? theme.accentStrong : theme.surface}
                textColor={sort === 'popular' ? '#FFFFFF' : theme.muted}
                onPress={() => setSort('popular')}
              />
            </View>
            <View style={styles.filterRow}>
              {tagOptions.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  active={activeTag === tag}
                  backgroundColor={activeTag === tag ? theme.accentSoft : theme.surface}
                  textColor={activeTag === tag ? theme.accentStrong : theme.muted}
                  onPress={() => setActiveTag(tag)}
                />
              ))}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storyRow}
            >
              <Pressable onPress={() => setShowStoryComposer(true)} style={styles.storyItem}>
                <View
                  style={[
                    styles.storyCircle,
                    {
                      borderColor: hasOwnStory ? theme.accentStrong : theme.border,
                      backgroundColor: theme.surface,
                    },
                  ]}
                >
                  <View style={[styles.storyPlus, { backgroundColor: theme.accentStrong }]}>
                    <Ionicons name="add" size={17} color="#FFFFFF" />
                  </View>
                </View>
                <Text style={[styles.storyName, { color: theme.muted }]}>Ta story</Text>
              </Pressable>
              {storyProfiles.map((story) => (
                <View key={story.name} style={styles.storyItem}>
                  <View style={[styles.storyRing, { borderColor: story.colors[1] }]}>
                    <View style={[styles.storyAvatar, { backgroundColor: story.colors[0] }]}>
                      <Text style={styles.storyAvatarText}>{story.avatar}</Text>
                    </View>
                  </View>
                  <Text style={[styles.storyName, { color: theme.text }]}>{story.name}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => <FeedCard post={item} theme={theme} />}
      />

      <TruefeedModal
        visible={showStoryComposer}
        theme={theme}
        title="Nouvelle story"
        message="Ajoute un media, un texte, ou les deux."
        secondaryLabel="Annuler"
        primaryLabel="Publier"
        onClose={() => setShowStoryComposer(false)}
        onPrimary={publishStory}
      >
        <View style={[styles.storyComposerPreview, { backgroundColor: storyBackground }]}>
          <Text style={styles.storyComposerKicker}>
            {storyMediaType ? (storyMediaType === 'video' ? 'Video' : 'Photo') : 'Texte'}
          </Text>
          <Text style={styles.storyComposerText}>
            {storyText.trim() || 'Ecris quelque chose sur ta story'}
          </Text>
        </View>
        <TextInput
          multiline
          value={storyText}
          onChangeText={setStoryText}
          placeholder="Texte de ta story..."
          placeholderTextColor={theme.muted}
          style={[
            styles.storyTextInput,
            { backgroundColor: theme.surfaceAlt, color: theme.text, borderColor: theme.border },
          ]}
        />
        <View style={styles.storyPalette}>
          {storyBackgrounds.map((color) => (
            <Pressable
              key={color}
              onPress={() => setStoryBackground(color)}
              style={[
                styles.storySwatch,
                {
                  backgroundColor: color,
                  borderColor: storyBackground === color ? theme.text : 'transparent',
                },
              ]}
            />
          ))}
        </View>
        <Pressable
          onPress={pickStoryMedia}
          style={[styles.storyMediaButton, { backgroundColor: theme.surfaceAlt }]}
        >
          <Ionicons name="image-outline" size={20} color={theme.accentStrong} />
          <Text style={[styles.storyMediaButtonText, { color: theme.text }]}>
            Choisir photo/video
          </Text>
        </Pressable>
      </TruefeedModal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { gap: 18, paddingBottom: 140, paddingHorizontal: 20, paddingTop: 58 },
  headerContent: { gap: 18 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  skeletonRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  skeletonBlock: { borderRadius: 18, height: 42, width: 42 },
  skeletonLine: { borderRadius: 999, flex: 1, height: 14 },
  storyRow: { gap: 16, paddingRight: 20 },
  storyItem: { alignItems: 'center', gap: 8, width: 86 },
  storyCircle: { borderRadius: 46, borderWidth: 3, height: 82, width: 82 },
  storyRing: {
    alignItems: 'center',
    borderRadius: 46,
    borderWidth: 4,
    height: 82,
    justifyContent: 'center',
    width: 82,
  },
  storyAvatar: {
    alignItems: 'center',
    borderColor: '#FFFFFF',
    borderRadius: 38,
    borderWidth: 3,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  storyAvatarText: {
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 24,
    fontWeight: '900',
  },
  storyPlus: {
    alignItems: 'center',
    borderColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 3,
    bottom: -4,
    height: 36,
    justifyContent: 'center',
    position: 'absolute',
    right: -6,
    width: 36,
  },
  storyName: { fontFamily: fonts.body, fontSize: 14, fontWeight: '900' },
  storyComposerPreview: {
    borderRadius: 22,
    minHeight: 220,
    justifyContent: 'flex-end',
    gap: 10,
    padding: 18,
  },
  storyComposerKicker: {
    color: 'rgba(255,255,255,0.75)',
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  storyComposerText: {
    color: '#FFFFFF',
    fontFamily: fonts.title,
    fontSize: 32,
    fontWeight: '700',
  },
  storyTextInput: {
    borderRadius: 18,
    borderWidth: 1,
    fontFamily: fonts.body,
    fontSize: 16,
    minHeight: 92,
    padding: 14,
    textAlignVertical: 'top',
  },
  storyPalette: {
    flexDirection: 'row',
    gap: 10,
  },
  storySwatch: {
    borderRadius: 18,
    borderWidth: 3,
    height: 36,
    width: 36,
  },
  storyMediaButton: {
    alignItems: 'center',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  storyMediaButtonText: { fontFamily: fonts.body, fontSize: 14, fontWeight: '900' },
  postCard: { borderRadius: 28, borderWidth: 1, overflow: 'hidden' },
  postHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 18,
  },
  authorName: { fontFamily: fonts.body, fontSize: 18, fontWeight: '800' },
  metaText: { fontFamily: fonts.body, fontSize: 14, marginTop: 4 },
  visual: { gap: 16, height: 330, padding: 18 },
  visualEmoji: { alignSelf: 'center', fontSize: 92, marginTop: 58 },
  mediaBadge: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mediaBadgeText: { color: '#FFFFFF', fontFamily: fonts.body, fontSize: 13, fontWeight: '800' },
  postActions: { alignItems: 'center', flexDirection: 'row', gap: 16, padding: 18 },
  postActionsSpacer: { flex: 1 },
  likes: { fontFamily: fonts.body, fontSize: 14, fontWeight: '800', paddingHorizontal: 18 },
  postTitle: {
    fontFamily: fonts.title,
    fontSize: 26,
    fontWeight: '700',
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  caption: { fontFamily: fonts.body, fontSize: 15, lineHeight: 24, padding: 18, paddingTop: 8 },
  shareNotice: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '900',
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
});
