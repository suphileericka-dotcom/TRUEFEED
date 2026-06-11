// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { VideoView, useVideoPlayer } from 'expo-video';
import type { Socket } from 'socket.io-client';

import { BrandHeader, Chip, TruefeedModal } from '@/components/truefeed/ui';
import { env } from '@/constants/env';
import { feedBySeason, fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';
import { useSession } from '@/hooks/use-session';
import { useTranslatedText } from '@/hooks/use-translated-text';
import { type FeedPost as ApiFeedPost, postsApi } from '@/services/api/posts';
import { storiesApi, type Story, type StoryViewer } from '@/services/api/stories';

type FeedPost = {
  id: string;
  author: string;
  location: string;
  title: string;
  caption: string;
  mediaUrl?: string | null;
  mediaType: 'image' | 'video' | 'text';
  format: 'vlog' | 'photo' | 'tip' | 'debate';
  visual: string;
  tag: string;
  likes: number;
  comments: number;
  shares: number;
  publishedAt: string;
};

type FeedItem = FeedPost & {
  instanceId: string;
};

const FEED_BATCH_SIZE = 10;
const PREFETCH_DISTANCE = 3;
const REFRESH_INTERVAL_MS = 30 * 1000;
const DEFAULT_STORY_DURATION_MS = 5000;

const storyBackgrounds = ['#111827', '#EE2A7B', '#F97316', '#14B8A6', '#2563EB', '#7C3AED'];

const fallbackPosts: FeedPost[] = [
  {
    id: 'kyoto-morning',
    author: 'nora.nomad',
    location: 'Kyoto, Japon',
    title: 'Matin calme a Kyoto',
    caption: 'Fushimi Inari avant 7h: lumiere douce, budget zero, foule evitee.',
    mediaType: 'image',
    format: 'photo',
    visual: 'KYOTO',
    tag: 'BonPlan',
    likes: 1922,
    comments: 31,
    shares: 12,
    publishedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: 'oia-sunset',
    author: 'maya_explores',
    location: 'Santorin, Grece',
    title: 'Oia sans courir',
    caption: 'Un spot cote ruelle avec vue caldeira et snack local a moins de 8 euros.',
    mediaType: 'video',
    format: 'vlog',
    visual: 'OIA',
    tag: 'VlogFeed',
    likes: 2847,
    comments: 42,
    shares: 18,
    publishedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  },
  {
    id: 'hanami-debate',
    author: 'sophie_bpkt',
    location: 'Tokyo, Japon',
    title: 'Hanami: magie ou surcote ?',
    caption: 'Joli, oui. Mais est-ce devenu un passage trop touristique ? Debat ouvert.',
    mediaType: 'text',
    format: 'debate',
    visual: 'DEBAT',
    tag: 'TrueDebate',
    likes: 1488,
    comments: 96,
    shares: 27,
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
];

function scorePost(post: FeedPost) {
  const ageHours = Math.max((Date.now() - new Date(post.publishedAt).getTime()) / 36e5, 1);
  const freshBoost = ageHours <= 6 ? 80 : ageHours <= 24 ? 45 : ageHours <= 72 ? 20 : 0;

  return (post.likes * 2 + post.comments * 3 + post.shares * 4 + freshBoost) / ageHours;
}

function makeFallbackBatch(startIndex: number, count: number): FeedItem[] {
  const ranked = [...fallbackPosts].sort((a, b) => scorePost(b) - scorePost(a));

  return Array.from({ length: count }, (_, index) => {
    const absoluteIndex = startIndex + index;
    const post = ranked[absoluteIndex % ranked.length];

    return {
      ...post,
      likes: post.likes + Math.floor(absoluteIndex / ranked.length) * 17,
      comments: post.comments + Math.floor(absoluteIndex / ranked.length) * 3,
      shares: post.shares + Math.floor(absoluteIndex / ranked.length),
      instanceId: `${post.id}-local-${absoluteIndex}`,
    };
  });
}

function mapApiPost(post: ApiFeedPost): FeedPost {
  const tag = post.tags[0] || (post.format === 'debate' ? 'TrueDebate' : post.format === 'tip' ? 'BonPlan' : 'VlogFeed');

  return {
    id: post.id,
    author: post.author,
    location: post.location || 'TRUEFEED',
    title: post.title || tag,
    caption: post.caption,
    mediaUrl: post.mediaUrl,
    mediaType: post.mediaType,
    format: post.format,
    visual: post.location?.slice(0, 10).toUpperCase() || tag.toUpperCase(),
    tag,
    likes: post.likesCount,
    comments: post.commentsCount,
    shares: post.sharesCount,
    publishedAt: post.publishedAt,
  };
}

function uniqueIncomingPosts(incoming: FeedPost[], current: FeedItem[]) {
  const currentIds = new Set(current.map((post) => post.id));

  return incoming.filter((post) => !currentIds.has(post.id));
}

type StoryGroup = {
  authorId: string;
  author: string;
  authorName: string;
  stories: Story[];
};

function groupStoriesByAuthor(stories: Story[]) {
  const groups = new Map<string, StoryGroup>();

  stories.forEach((story) => {
    const existing = groups.get(story.authorId);

    if (existing) {
      existing.stories.push(story);
      return;
    }

    groups.set(story.authorId, {
      authorId: story.authorId,
      author: story.author,
      authorName: story.authorName,
      stories: [story],
    });
  });

  return Array.from(groups.values()).map((group) => ({
    ...group,
    stories: group.stories.sort(
      (firstStory, secondStory) =>
        new Date(firstStory.createdAt).getTime() - new Date(secondStory.createdAt).getTime(),
    ),
  }));
}

function formatStoryAge(value: string) {
  const diffMinutes = Math.max(Math.floor((Date.now() - new Date(value).getTime()) / 60000), 0);

  if (diffMinutes < 1) {
    return 'maintenant';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min`;
  }

  return `${Math.floor(diffMinutes / 60)} h`;
}

function StoryMedia({ story, fallbackText }: { story: Story; fallbackText: string }) {
  const videoPlayer = useVideoPlayer(story.mediaUrl && story.mediaType === 'video' ? story.mediaUrl : '', (player) => {
    player.loop = true;
    player.muted = false;
    if (story.mediaUrl && story.mediaType === 'video') {
      player.play();
    }
  });

  if (story.mediaUrl && story.mediaType === 'video') {
    return <VideoView player={videoPlayer} style={styles.fullscreenStoryMedia} contentFit="cover" nativeControls={false} />;
  }

  if (story.mediaUrl) {
    return <Image source={{ uri: story.mediaUrl }} style={styles.fullscreenStoryMedia} />;
  }

  return (
    <View style={[styles.fullscreenStoryTextPanel, { backgroundColor: story.backgroundColor }]}>
      <Text style={styles.fullscreenStoryText}>
        {story.text || fallbackText}
      </Text>
    </View>
  );
}

const FeedCard = memo(function FeedCard({
  post,
  theme,
}: {
  post: FeedItem;
  theme: (typeof seasonThemes)['summer'];
}) {
  const { t } = useTranslation();
  const translatedLocation = useTranslatedText(post.location);
  const translatedTitle = useTranslatedText(post.title);
  const translatedCaption = useTranslatedText(post.caption);
  const [liked, setLiked] = useState(false);
  const [shared, setShared] = useState(false);
  const [followingAuthor, setFollowingAuthor] = useState(false);
  const [shareNotice, setShareNotice] = useState('');
  const likesCount = liked ? post.likes + 1 : post.likes;
  const sharesCount = shared ? post.shares + 1 : post.shares;
  const videoPlayer = useVideoPlayer(post.mediaUrl && post.mediaType === 'video' ? post.mediaUrl : '', (player) => {
    player.loop = true;
    player.muted = true;
    if (post.mediaUrl && post.mediaType === 'video') {
      player.play();
    }
  });
  const [videoMuted, setVideoMuted] = useState(true);

  useEffect(() => {
    videoPlayer.muted = videoMuted;
  }, [videoMuted, videoPlayer]);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id } })}
      style={[styles.postCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
    >
      <View style={styles.postHeader}>
        <View>
          <Text style={[styles.authorName, { color: theme.text }]}>{post.author}</Text>
          <Text style={[styles.metaText, { color: theme.muted }]}>{translatedLocation}</Text>
        </View>
        <View style={styles.postHeaderActions}>
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              setFollowingAuthor(true);
            }}
            style={[
              styles.followButton,
              { backgroundColor: followingAuthor ? theme.surfaceAlt : theme.accentStrong },
            ]}
          >
            <Ionicons
              name={followingAuthor ? 'checkmark' : 'add'}
              size={18}
              color={followingAuthor ? theme.accentStrong : '#FFFFFF'}
            />
          </Pressable>
          <Ionicons name="ellipsis-horizontal" size={18} color={theme.muted} />
        </View>
      </View>

      <View style={[styles.visual, { backgroundColor: theme.accentStrong }]}>
        {post.mediaUrl && post.mediaType === 'image' ? (
          <Image source={{ uri: post.mediaUrl }} style={styles.feedMedia} />
        ) : null}
        {post.mediaUrl && post.mediaType === 'video' ? (
          <Pressable onPress={() => setVideoMuted((value) => !value)} style={styles.feedMediaWrap}>
            <VideoView player={videoPlayer} style={styles.feedMedia} contentFit="cover" nativeControls={false} />
            <View style={styles.soundBadge}>
              <Ionicons name={videoMuted ? 'volume-mute' : 'volume-high'} size={16} color="#FFFFFF" />
            </View>
          </Pressable>
        ) : null}
        <Chip label={post.tag} backgroundColor="rgba(255,255,255,0.22)" textColor="#FFFFFF" />
        {!post.mediaUrl ? <Text style={styles.visualText}>{post.visual}</Text> : null}
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
          <Text style={styles.mediaBadgeText}>{t(`feed.media.${post.mediaType}`)}</Text>
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
            setShareNotice(t('status.shareReady'));
            Share.share({
              message: `${translatedTitle} - ${translatedCaption}`,
              title: translatedTitle,
            }).catch(() => setShareNotice(t('status.linkReadyToShare')));
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
        {likesCount.toLocaleString('fr-FR')} {t('feed.likes')} - {post.comments} {t('feed.comments')} -{' '}
        {sharesCount} {t('feed.shares')}
      </Text>
      <Text style={[styles.postTitle, { color: theme.text }]}>{translatedTitle}</Text>
      <Text style={[styles.caption, { color: theme.muted }]}>{translatedCaption}</Text>
      {shareNotice ? (
        <Text style={[styles.shareNotice, { color: theme.accentStrong }]}>{shareNotice}</Text>
      ) : null}
    </Pressable>
  );
});

export default function HomeScreen() {
  const { t } = useTranslation();
  const { selectedSeason } = useGlobalSeason();
  const { isAuthenticated, user } = useSession();
  const listRef = useRef<FlatList<FeedItem>>(null);
  const loadingRef = useRef(false);
  const cursorRef = useRef<string | null>(null);
  const postsRef = useRef<FeedItem[]>(makeFallbackBatch(0, FEED_BATCH_SIZE));
  const fallbackIndexRef = useRef(FEED_BATCH_SIZE);
  const [posts, setPosts] = useState<FeedItem[]>(postsRef.current);
  const [pendingNewPosts, setPendingNewPosts] = useState<FeedPost[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [activeStoryGroup, setActiveStoryGroup] = useState<StoryGroup | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const [storyPaused, setStoryPaused] = useState(false);
  const [viewedStoryIds, setViewedStoryIds] = useState<Set<string>>(new Set());
  const [storyViewers, setStoryViewers] = useState<StoryViewer[]>([]);
  const [showStoryComposer, setShowStoryComposer] = useState(false);
  const [storyStatus, setStoryStatus] = useState('');
  const [storyText, setStoryText] = useState('');
  const [storyMediaType, setStoryMediaType] = useState<'image' | 'video' | null>(null);
  const [storyMediaDurationMs, setStoryMediaDurationMs] = useState<number | null>(null);
  const [storyBackground, setStoryBackground] = useState(storyBackgrounds[0]);
  const socketRef = useRef<Socket | null>(null);
  const storyTouchStartYRef = useRef(0);
  const theme = seasonThemes[selectedSeason];
  const feed = feedBySeason[selectedSeason];
  const storyGroups = useMemo(() => groupStoriesByAuthor(stories), [stories]);
  const ownStoryGroup = storyGroups.find((group) => group.authorId === user?.id) || null;
  const activeStory = activeStoryGroup?.stories[activeStoryIndex] || null;
  const activeStoryDuration =
    activeStory?.mediaType === 'video' && activeStory.durationMs
      ? activeStory.durationMs
      : DEFAULT_STORY_DURATION_MS;

  const notificationLabel = useMemo(() => {
    if (pendingNewPosts.length === 0) {
      return '';
    }

    return t('feed.newPosts', { count: pendingNewPosts.length });
  }, [pendingNewPosts.length, t]);

  const setFeedPosts = useCallback((nextPosts: FeedItem[]) => {
    postsRef.current = nextPosts;
    setPosts(nextPosts);
  }, []);

  const appendFallbackPosts = useCallback(() => {
    const nextBatch = makeFallbackBatch(fallbackIndexRef.current, FEED_BATCH_SIZE);

    fallbackIndexRef.current += FEED_BATCH_SIZE;
    setFeedPosts([...postsRef.current, ...nextBatch]);
  }, [setFeedPosts]);

  const loadNextPage = useCallback(async () => {
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;

    try {
      const response = await postsApi.listFeed({
        cursor: cursorRef.current,
        limit: FEED_BATCH_SIZE,
        sort: 'algorithm',
      });
      const incoming = response.items.map(mapApiPost);

      cursorRef.current = response.nextCursor;

      if (incoming.length === 0) {
        appendFallbackPosts();
        return;
      }

      const nextBatch = incoming.map((post) => ({
        ...post,
        instanceId: `${post.id}-api-${postsRef.current.length}`,
      }));
      const shouldReplaceFallback =
        postsRef.current.length === FEED_BATCH_SIZE &&
        postsRef.current.every((post) => post.instanceId.includes('-local-'));

      setFeedPosts(shouldReplaceFallback ? nextBatch : [...postsRef.current, ...nextBatch]);

      if (!response.nextCursor) {
        appendFallbackPosts();
      }
    } catch {
      appendFallbackPosts();
    } finally {
      loadingRef.current = false;
    }
  }, [appendFallbackPosts, setFeedPosts]);

  const refreshNewPosts = useCallback(async () => {
    try {
      const response = await postsApi.listFeed({ limit: FEED_BATCH_SIZE, sort: 'algorithm' });
      const incoming = uniqueIncomingPosts(response.items.map(mapApiPost), postsRef.current);

      if (incoming.length > 0) {
        setPendingNewPosts(incoming);
      }
    } catch {
      // Le rafraichissement en arriere-plan reste silencieux pendant le defilement.
    }
  }, []);

  const showNewPosts = useCallback(() => {
    const newItems = pendingNewPosts.map((post, index) => ({
      ...post,
      instanceId: `${post.id}-new-${Date.now()}-${index}`,
    }));

    setFeedPosts([...newItems, ...postsRef.current]);
    setPendingNewPosts([]);
    listRef.current?.scrollToOffset({ animated: true, offset: 0 });
  }, [pendingNewPosts, setFeedPosts]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
      const maxVisibleIndex = viewableItems.reduce(
        (maxIndex, item) => Math.max(maxIndex, item.index ?? -1),
        -1,
      );

      if (postsRef.current.length - maxVisibleIndex <= PREFETCH_DISTANCE + 1) {
        loadNextPage();
      }
    },
  ).current;

  useEffect(() => {
    loadNextPage();
  }, [loadNextPage]);

  useEffect(() => {
    storiesApi
      .list()
      .then((response) => setStories(response.items))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const rawValue = localStorage.getItem('truefeed:viewed-stories');

    if (rawValue) {
      try {
        setViewedStoryIds(new Set(JSON.parse(rawValue) as string[]));
      } catch {
        setViewedStoryIds(new Set());
      }
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(refreshNewPosts, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [refreshNewPosts]);

  useEffect(() => {
    let mounted = true;

    import('socket.io-client')
      .then(({ io }) => {
        if (!mounted) {
          return;
        }

        socketRef.current = io(env.apiUrl, {
          transports: ['websocket'],
          withCredentials: true,
        });
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  const closeStories = useCallback(() => {
    setActiveStoryGroup(null);
    setActiveStoryIndex(0);
    setStoryProgress(0);
    setStoryViewers([]);
    setStoryPaused(false);
  }, []);

  const showNextStory = useCallback(() => {
    if (!activeStoryGroup) {
      return;
    }

    if (activeStoryIndex < activeStoryGroup.stories.length - 1) {
      setActiveStoryIndex((index) => index + 1);
      return;
    }

    closeStories();
  }, [activeStoryGroup, activeStoryIndex, closeStories]);

  useEffect(() => {
    if (!activeStory) {
      return undefined;
    }

    const storyId = activeStory.id;
    const socket = socketRef.current;

    setStoryProgress(0);
    socket?.emit('stories:join', storyId);
    storiesApi
      .detail(storyId)
      .then((response) => {
        setStoryViewers(response.viewers);
        setStories((currentStories) =>
          currentStories.map((story) => (story.id === response.story.id ? response.story : story)),
        );
      })
      .catch(() => undefined);

    if (isAuthenticated) {
      storiesApi.markViewed(storyId).catch(() => undefined);
    }

    setViewedStoryIds((currentIds) => {
      const nextIds = new Set(currentIds);

      nextIds.add(storyId);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('truefeed:viewed-stories', JSON.stringify(Array.from(nextIds)));
      }

      return nextIds;
    });

    function handleViewed(payload: { storyId: string; story: Story; viewers: StoryViewer[] }) {
      if (payload.storyId !== storyId) {
        return;
      }

      setStoryViewers(payload.viewers);
      setStories((currentStories) =>
        currentStories.map((story) => (story.id === payload.story.id ? payload.story : story)),
      );
    }

    socket?.on('stories:viewed', handleViewed);

    return () => {
      socket?.emit('stories:leave', storyId);
      socket?.off('stories:viewed', handleViewed);
    };
  }, [activeStory, isAuthenticated]);

  useEffect(() => {
    if (!activeStory || storyPaused) {
      return undefined;
    }

    const interval = setInterval(() => {
      setStoryProgress((currentProgress) => {
        const nextProgress = currentProgress + 100 / activeStoryDuration;

        if (nextProgress >= 1) {
          setTimeout(() => showNextStory(), 0);
          return 1;
        }

        return nextProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeStory, activeStoryDuration, showNextStory, storyPaused]);

  async function pickStoryMedia() {
    const ImagePicker = await import('expo-image-picker');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.85,
      videoMaxDuration: 30,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];

      setStoryMediaType(asset.type === 'video' ? 'video' : 'image');
      setStoryMediaDurationMs(asset.type === 'video' && asset.duration ? asset.duration : null);
    }
  }

  async function publishStory() {
    if (!storyText.trim() && !storyMediaType) {
      return;
    }

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      setStoryStatus(t('common.loading'));
      const response = await storiesApi.create({
        text: storyText.trim() || undefined,
        mediaType: storyMediaType || undefined,
        durationMs: storyMediaDurationMs || undefined,
        backgroundColor: storyBackground,
      });

      setStories((currentStories) => [
        response.story,
        ...currentStories.filter((story) => story.id !== response.story.id),
      ]);
      setActiveStoryGroup({
        authorId: response.story.authorId,
        author: response.story.author,
        authorName: response.story.authorName,
        stories: [response.story],
      });
      setActiveStoryIndex(0);
      setStoryViewers([]);
      setStoryText('');
      setStoryMediaType(null);
      setStoryMediaDurationMs(null);
      setStoryStatus('');
      setShowStoryComposer(false);
    } catch {
      setStoryStatus(t('errors.publishStoryFailed'));
    }
  }

  const showPreviousStory = useCallback(() => {
    if (!activeStoryGroup) {
      return;
    }

    if (storyProgress > 0.25) {
      setStoryProgress(0);
      return;
    }

    if (activeStoryIndex > 0) {
      setActiveStoryIndex((index) => index - 1);
    }
  }, [activeStoryGroup, activeStoryIndex, storyProgress]);

  const openStoryGroup = useCallback((group: StoryGroup, index = 0) => {
    setActiveStoryGroup(group);
    setActiveStoryIndex(index);
    setStoryProgress(0);
    setStoryViewers([]);
    setStoryPaused(false);
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <FlatList
        ref={listRef}
        data={posts}
        keyExtractor={(item) => item.instanceId}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        onEndReached={loadNextPage}
        onEndReachedThreshold={0.55}
        onViewableItemsChanged={onViewableItemsChanged}
        removeClippedSubviews
        showsVerticalScrollIndicator={false}
        viewabilityConfig={{ itemVisiblePercentThreshold: 35 }}
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
            {pendingNewPosts.length > 0 ? (
              <Pressable
                onPress={showNewPosts}
                style={[styles.newPostsNotice, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <Ionicons name="arrow-up" size={16} color={theme.accentStrong} />
                <Text style={[styles.newPostsNoticeText, { color: theme.text }]}>
                  {notificationLabel}
                </Text>
              </Pressable>
            ) : null}
            <View style={styles.skeletonRow}>
              <View style={[styles.skeletonBlock, { backgroundColor: theme.surfaceAlt }]} />
              <View style={[styles.skeletonLine, { backgroundColor: theme.surfaceAlt }]} />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storyRow}
            >
              <Pressable
                onPress={() => (ownStoryGroup ? openStoryGroup(ownStoryGroup) : setShowStoryComposer(true))}
                style={styles.storyItem}
              >
                <View
                  style={[
                    styles.storyCircle,
                    {
                      borderColor: ownStoryGroup ? theme.accentStrong : theme.border,
                      backgroundColor: ownStoryGroup?.stories[0]?.backgroundColor || theme.surface,
                    },
                  ]}
                >
                  <Pressable
                    onPress={(event) => {
                      event.stopPropagation();
                      setShowStoryComposer(true);
                    }}
                    style={[styles.storyPlus, { backgroundColor: theme.accentStrong }]}
                  >
                    <Ionicons name="add" size={17} color="#FFFFFF" />
                  </Pressable>
                </View>
                <Text style={[styles.storyName, { color: theme.muted }]}>{t('feed.yourStory')}</Text>
              </Pressable>
              {storyGroups
                .filter((group) => group.authorId !== user?.id)
                .map((group) => {
                  const hasUnseenStories = group.stories.some((story) => !viewedStoryIds.has(story.id));

                  return (
                  <Pressable key={group.authorId} onPress={() => openStoryGroup(group)} style={styles.storyItem}>
                    <View
                      style={[
                        styles.storyRing,
                        hasUnseenStories ? styles.storyRingUnseen : styles.storyRingSeen,
                      ]}
                    >
                      <View style={[styles.storyAvatar, { backgroundColor: group.stories[0].backgroundColor }]}>
                        <Text style={styles.storyAvatarText}>
                          {(group.author || group.authorName || 'T').slice(0, 1).toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.storyName, { color: theme.text }]} numberOfLines={1}>
                      {group.author}
                    </Text>
                  </Pressable>
                  );
                })}
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => <FeedCard post={item} theme={theme} />}
      />

      <TruefeedModal
        visible={showStoryComposer}
        theme={theme}
        title={t('feed.newStory')}
        message={t('feed.storyMessage')}
        secondaryLabel={t('common.cancel')}
        primaryLabel={t('common.publish')}
        onClose={() => setShowStoryComposer(false)}
        onPrimary={publishStory}
      >
        <View style={[styles.storyComposerPreview, { backgroundColor: storyBackground }]}>
          <Text style={styles.storyComposerKicker}>
            {storyMediaType ? t(`feed.media.${storyMediaType}`) : t('feed.media.text')}
          </Text>
          <Text style={styles.storyComposerText}>
            {storyText.trim() || t('feed.storyEmptyPreview')}
          </Text>
        </View>
        <TextInput
          multiline
          value={storyText}
          onChangeText={setStoryText}
          placeholder={t('feed.storyPlaceholder')}
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
            {t('feed.chooseMedia')}
          </Text>
        </Pressable>
        {storyStatus ? <Text style={[styles.shareNotice, { color: theme.muted }]}>{storyStatus}</Text> : null}
      </TruefeedModal>

      <Modal animationType="fade" transparent={false} visible={Boolean(activeStory)} onRequestClose={closeStories}>
        {activeStory && activeStoryGroup ? (
          <View
            style={styles.fullscreenStory}
            onTouchStart={(event) => {
              storyTouchStartYRef.current = event.nativeEvent.pageY;
            }}
            onTouchEnd={(event) => {
              if (event.nativeEvent.pageY - storyTouchStartYRef.current > 80) {
                closeStories();
              }
            }}
          >
            <StoryMedia story={activeStory} fallbackText={t('feed.mediaStory')} />

            <View style={styles.storyOverlayTop}>
              <View style={styles.storyProgressRow}>
                {activeStoryGroup.stories.map((story, index) => (
                  <View key={story.id} style={styles.storyProgressTrack}>
                    <View
                      style={[
                        styles.storyProgressFill,
                        {
                          width:
                            index < activeStoryIndex
                              ? '100%'
                              : index === activeStoryIndex
                                ? `${Math.round(storyProgress * 100)}%`
                                : '0%',
                        },
                      ]}
                    />
                  </View>
                ))}
              </View>
              <View style={styles.storyHeaderRow}>
                <View style={styles.storyHeaderAvatar}>
                  <Text style={styles.storyHeaderAvatarText}>
                    {(activeStory.author || activeStory.authorName || 'T').slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.onlineDot} />
                <Text style={styles.storyHeaderName}>{activeStory.author}</Text>
                <Text style={styles.storyHeaderAge}>{formatStoryAge(activeStory.createdAt)}</Text>
                <Pressable onPress={closeStories} style={styles.storyCloseButton}>
                  <Ionicons name="close" size={22} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>

            <View style={styles.storyTouchLayer}>
              <Pressable
                onPress={showPreviousStory}
                onPressIn={() => setStoryPaused(true)}
                onPressOut={() => setStoryPaused(false)}
                style={styles.storyTouchZone}
              />
              <Pressable
                onPress={showNextStory}
                onPressIn={() => setStoryPaused(true)}
                onPressOut={() => setStoryPaused(false)}
                style={styles.storyTouchZone}
              />
            </View>

            <View style={styles.storyBottomOverlay}>
              <Text style={styles.storyViewsText}>
                {activeStory.viewsCount} {t('feed.views')}
              </Text>
              {activeStory.authorId === user?.id ? (
                <ScrollView style={styles.storyViewersPanel} contentContainerStyle={styles.storyViewersContent}>
                  {storyViewers.filter((viewer) => viewer.id !== user?.id).map((viewer) => (
                    <View key={viewer.id} style={styles.fullscreenViewerRow}>
                      <View
                        style={[
                          styles.viewerDot,
                          { backgroundColor: viewer.online ? '#22C55E' : '#8E8E93' },
                        ]}
                      />
                      <Text style={styles.fullscreenViewerText}>
                        {viewer.username || viewer.displayName}
                      </Text>
                      <Text style={styles.fullscreenViewerState}>
                        {viewer.online
                          ? t('feed.online')
                          : `${t('feed.offline')} · ${viewer.lastSeenAt ? formatStoryAge(viewer.lastSeenAt) : '-'}`}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              ) : null}
            </View>
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { gap: 18, paddingBottom: 140, paddingHorizontal: 20, paddingTop: 58 },
  headerContent: { gap: 18 },
  newPostsNotice: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  newPostsNoticeText: { fontFamily: fonts.body, fontSize: 13, fontWeight: '900' },
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
  storyRingUnseen: { borderColor: '#EE2A7B' },
  storyRingSeen: { borderColor: '#9CA3AF' },
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
  storyViewerPanel: {
    borderRadius: 22,
    gap: 12,
    minHeight: 360,
    justifyContent: 'flex-end',
    padding: 18,
  },
  viewerList: { gap: 10 },
  viewerRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  viewerDot: { borderRadius: 5, height: 10, width: 10 },
  viewerText: { flex: 1, fontFamily: fonts.body, fontSize: 14, fontWeight: '900' },
  viewerState: { fontFamily: fonts.body, fontSize: 12, fontWeight: '800' },
  fullscreenStory: {
    backgroundColor: '#000000',
    flex: 1,
  },
  fullscreenStoryMedia: {
    height: '100%',
    resizeMode: 'cover',
    width: '100%',
  },
  fullscreenStoryTextPanel: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 28,
  },
  fullscreenStoryText: {
    color: '#FFFFFF',
    fontFamily: fonts.title,
    fontSize: 44,
    fontWeight: '800',
    textAlign: 'center',
  },
  storyOverlayTop: {
    left: 0,
    paddingHorizontal: 14,
    paddingTop: 48,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  storyProgressRow: {
    flexDirection: 'row',
    gap: 4,
  },
  storyProgressTrack: {
    backgroundColor: 'rgba(255,255,255,0.32)',
    borderRadius: 999,
    flex: 1,
    height: 3,
    overflow: 'hidden',
  },
  storyProgressFill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    height: '100%',
  },
  storyHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
  },
  storyHeaderAvatar: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.24)',
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  storyHeaderAvatarText: { color: '#FFFFFF', fontFamily: fonts.body, fontSize: 14, fontWeight: '900' },
  onlineDot: { backgroundColor: '#22C55E', borderRadius: 5, height: 10, width: 10 },
  storyHeaderName: { color: '#FFFFFF', fontFamily: fonts.body, fontSize: 14, fontWeight: '900' },
  storyHeaderAge: { color: 'rgba(255,255,255,0.78)', flex: 1, fontFamily: fonts.body, fontSize: 12, fontWeight: '800' },
  storyCloseButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  storyTouchLayer: {
    bottom: 0,
    flexDirection: 'row',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  storyTouchZone: { flex: 1 },
  storyBottomOverlay: {
    bottom: 28,
    left: 14,
    position: 'absolute',
    right: 14,
  },
  storyViewsText: { color: '#FFFFFF', fontFamily: fonts.body, fontSize: 14, fontWeight: '900' },
  storyViewersPanel: {
    marginTop: 10,
    maxHeight: 170,
  },
  storyViewersContent: {
    gap: 8,
  },
  fullscreenViewerRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  fullscreenViewerText: { color: '#FFFFFF', flex: 1, fontFamily: fonts.body, fontSize: 13, fontWeight: '900' },
  fullscreenViewerState: { color: 'rgba(255,255,255,0.74)', fontFamily: fonts.body, fontSize: 12, fontWeight: '800' },
  postCard: { borderRadius: 28, borderWidth: 1, overflow: 'hidden' },
  postHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 18,
  },
  postHeaderActions: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  followButton: { alignItems: 'center', borderRadius: 17, height: 34, justifyContent: 'center', width: 34 },
  authorName: { fontFamily: fonts.body, fontSize: 18, fontWeight: '800' },
  metaText: { fontFamily: fonts.body, fontSize: 14, marginTop: 4 },
  visual: { gap: 16, height: 330, padding: 18 },
  feedMediaWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  feedMedia: {
    ...StyleSheet.absoluteFillObject,
    height: '100%',
    width: '100%',
  },
  soundBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderRadius: 16,
    bottom: 14,
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    right: 14,
    width: 32,
  },
  visualText: {
    alignSelf: 'center',
    color: '#FFFFFF',
    fontFamily: fonts.title,
    fontSize: 48,
    fontWeight: '900',
    marginTop: 76,
  },
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
