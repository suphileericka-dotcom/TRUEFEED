// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { VideoView, useVideoPlayer } from 'expo-video';

import { BrandHeader, MediaSelector, ScreenShell, SectionLabel } from '@/components/truefeed/ui';
import { fonts, publishMediaOptions, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';
import { useSession } from '@/hooks/use-session';
import { goodTipsApi } from '@/services/api/good-tips';
import { mediaApi } from '@/services/api/media';
import { postsApi } from '@/services/api/posts';

type MediaKey = (typeof publishMediaOptions)[number]['key'];
type PublishMode = 'normal' | 'text' | 'media' | 'tip';

const maxTextLength = 2200;
const maxImageSizeBytes = 10 * 1024 * 1024;
const maxVideoSizeBytes = 50 * 1024 * 1024;
const maxVideoDurationMs = 60 * 1000;

type SelectedMediaAsset = {
  uri: string;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  duration?: number | null;
};

function MediaPreview({ asset, mediaType }: { asset: SelectedMediaAsset | null; mediaType: MediaKey }) {
  const player = useVideoPlayer(asset?.uri || '', (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
    if (asset?.uri && mediaType === 'video') {
      videoPlayer.play();
    }
  });

  if (!asset) {
    return null;
  }

  if (mediaType === 'video') {
    return <VideoView player={player} style={styles.selectedMediaPreview} nativeControls contentFit="cover" />;
  }

  return <Image source={{ uri: asset.uri }} style={styles.selectedMediaPreview} />;
}

export default function PublishScreen() {
  const { t } = useTranslation();
  const { selectedSeason } = useGlobalSeason();
  const { isAuthenticated, session } = useSession();
  const theme = seasonThemes[selectedSeason];
  const [mode, setMode] = useState<PublishMode>('normal');
  const [mediaType, setMediaType] = useState<MediaKey>('image');
  const [selectedMedia, setSelectedMedia] = useState<SelectedMediaAsset | null>(null);
  const [caption, setCaption] = useState('');
  const [place, setPlace] = useState('');
  const [address, setAddress] = useState('');
  const [tipCategory, setTipCategory] = useState('');
  const [budget, setBudget] = useState('');
  const [transport, setTransport] = useState('');
  const [status, setStatus] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const activeMedia = publishMediaOptions.find((item) => item.key === mediaType);
  const canPublishText = caption.trim().length >= 2;
  const canPublishMedia = Boolean(selectedMedia) && !isUploading;
  const canPublishTip =
    place.trim().length >= 2 &&
    address.trim().length >= 4 &&
    budget.trim().length >= 1 &&
    transport.trim().length >= 2;

  function requireAuth() {
    if (isAuthenticated) {
      return true;
    }

    router.push('/login');
    return false;
  }

  function resetDraft() {
    setMode('normal');
    setMediaType('image');
    setSelectedMedia(null);
    setCaption('');
    setPlace('');
    setAddress('');
    setTipCategory('');
    setBudget('');
    setTransport('');
    setStatus('');
    setUploadProgress(0);
    setIsUploading(false);
  }

  async function pickMedia(nextMediaType: MediaKey) {
    if (nextMediaType === 'text') {
      setMode('text');
      setMediaType('text');
      setSelectedMedia(null);
      setCaption('');
      setStatus('');
      return;
    }

    const ImagePicker = await import('expo-image-picker');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setStatus(t('errors.mediaPermission'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      mediaTypes: nextMediaType === 'video' ? ['videos'] : ['images'],
      quality: 0.85,
      videoMaxDuration: 90,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const fileSize = asset.fileSize || 0;
      const duration = asset.duration || 0;

      if (nextMediaType === 'image' && fileSize > maxImageSizeBytes) {
        setStatus(t('errors.imageTooLarge'));
        return;
      }

      if (nextMediaType === 'video' && fileSize > maxVideoSizeBytes) {
        setStatus(t('errors.videoTooLarge'));
        return;
      }

      if (nextMediaType === 'video' && duration > maxVideoDurationMs) {
        setStatus(t('errors.videoTooLong'));
        return;
      }

      setMediaType(nextMediaType);
      setSelectedMedia({
        uri: asset.uri,
        fileName: asset.fileName,
        fileSize: asset.fileSize,
        mimeType: asset.mimeType,
        duration: asset.duration,
      });
      setMode('media');
      setCaption('');
      setStatus('');
    }
  }

  async function publishText() {
    if (!canPublishText || !requireAuth()) {
      return;
    }

    try {
      await postsApi.create(
        {
          caption: caption.trim(),
          mediaType: 'text',
          format: 'debate',
          season: selectedSeason,
          tags: [],
        },
        session?.accessToken || '',
      );
      resetDraft();
      router.push('/debate');
    } catch {
      setStatus(t('errors.publishTextFailed'));
    }
  }

  async function publishMedia() {
    if (!selectedMedia || !canPublishMedia || !requireAuth()) {
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0.03);
      setStatus(t('status.uploadingMedia'));
      const uploaded = await mediaApi.upload(
        selectedMedia,
        mediaType === 'video' ? 'video' : 'image',
        setUploadProgress,
      );

      setStatus(t('status.publishingMedia'));
      await postsApi.create(
        {
          caption: caption.trim() || t('publish.mediaPostFallback'),
          mediaType: mediaType === 'video' ? 'video' : 'image',
          mediaUrl: uploaded.media.url,
          mediaSizeBytes: uploaded.media.sizeBytes,
          format: mediaType === 'video' ? 'vlog' : 'photo',
          season: selectedSeason,
          tags: [],
        },
        session?.accessToken || '',
      );
      resetDraft();
      router.push('/(tabs)');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : t('errors.publishMediaFailed'));
      setIsUploading(false);
    }
  }

  async function publishTip() {
    if (!canPublishTip || !requireAuth()) {
      return;
    }

    try {
      await goodTipsApi.create({
        place: place.trim(),
        address: address.trim(),
        category: tipCategory.trim() || undefined,
        budget: budget.trim(),
        transport: transport.trim(),
      });
      resetDraft();
      router.push('/bonplan');
    } catch {
      setStatus(t('errors.publishTipFailed'));
    }
  }

  if (mode === 'text') {
    return (
      <ScreenShell theme={theme} contentContainerStyle={styles.fullContent}>
        <View style={[styles.expandedMediaPanel, { backgroundColor: theme.accentStrong }]}>
          <View style={styles.expandedTopRow}>
            <Pressable onPress={resetDraft} style={styles.backButton}>
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </Pressable>
            <Pressable
              onPress={publishText}
              style={[styles.expandedPublishButton, { opacity: canPublishText ? 1 : 0.48 }]}
            >
              <Text style={styles.expandedPublishText}>{t('common.publish')}</Text>
            </Pressable>
          </View>
          <TextInput
            autoFocus
            multiline
            maxLength={maxTextLength}
            onChangeText={setCaption}
            placeholder={t('publish.textPlaceholder')}
            placeholderTextColor="rgba(255,255,255,0.72)"
            style={styles.expandedTextInput}
            textAlignVertical="top"
            value={caption}
          />
          <View style={styles.expandedBottomRow}>
            <Pressable onPress={resetDraft} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
              <Text style={styles.deleteText}>{t('common.delete')}</Text>
            </Pressable>
            <Text style={styles.counterText}>
              {caption.length}/{maxTextLength}
            </Text>
          </View>
          {status ? <Text style={styles.expandedStatus}>{status}</Text> : null}
        </View>
      </ScreenShell>
    );
  }

  if (mode === 'media') {
    return (
      <ScreenShell theme={theme}>
        <View style={styles.topRow}>
          <Pressable onPress={resetDraft} style={[styles.iconButton, { backgroundColor: theme.surfaceAlt }]}>
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </Pressable>
          <SectionLabel theme={theme} label={mediaType === 'video' ? t('feed.media.video') : t('feed.media.image')} />
        </View>

        <View style={[styles.mediaPanel, { backgroundColor: theme.accentStrong, borderColor: theme.border }]}>
          <View style={styles.mediaTopRow}>
            <View>
              <Text style={styles.mediaKicker}>{t('publish.media')}</Text>
              <Text style={styles.mediaTitle}>
                {activeMedia?.label ?? t('publish.media')} {t('publish.selected')}
              </Text>
            </View>
            <View style={styles.mediaIconBubble}>
              <Ionicons name={activeMedia?.icon ?? 'image-outline'} size={24} color="#FFFFFF" />
            </View>
          </View>
          <View style={styles.mediaPreview}>
            <MediaPreview asset={selectedMedia} mediaType={mediaType} />
            {!selectedMedia ? (
              <>
                <Ionicons name={activeMedia?.icon ?? 'image-outline'} size={58} color="#FFFFFF" />
                <Text style={styles.mediaPreviewText}>{t('publish.mediaReady')}</Text>
              </>
            ) : null}
          </View>
        </View>

        <TextInput
          multiline
          onChangeText={setCaption}
          placeholder={t('publish.descriptionOptional')}
          placeholderTextColor={theme.muted}
          style={[
            styles.captionInput,
            { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text },
          ]}
          textAlignVertical="top"
          value={caption}
        />

        <Pressable
          onPress={publishMedia}
          style={[
            styles.primaryButton,
            { backgroundColor: selectedSeason === 'winter' ? '#FFFFFF' : theme.text },
          ]}
        >
          <Text style={[styles.primaryButtonText, { color: selectedSeason === 'winter' ? '#0F172A' : '#FFFFFF' }]}>
            {t('common.publish')}
          </Text>
        </Pressable>
        {isUploading ? (
          <View style={[styles.progressTrack, { backgroundColor: theme.surfaceAlt }]}>
            <View style={[styles.progressFill, { width: `${Math.round(uploadProgress * 100)}%`, backgroundColor: theme.accentStrong }]} />
          </View>
        ) : null}
        {status ? <Text style={[styles.statusText, { color: theme.muted }]}>{status}</Text> : null}
      </ScreenShell>
    );
  }

  return (
    <ScreenShell theme={theme}>
      <BrandHeader theme={theme} badgeText={t('publish.compose')} badgeIcon="+" />
      <SectionLabel theme={theme} label={t('publish.publishPage')} />

      <View style={[styles.mediaPanel, { backgroundColor: theme.accentStrong, borderColor: theme.border }]}>
        <View style={styles.mediaTopRow}>
          <View>
            <Text style={styles.mediaKicker}>{t('publish.media')}</Text>
            <Text style={styles.mediaTitle}>
              {activeMedia?.label ?? t('publish.media')} {t('publish.mainMedia')}
            </Text>
          </View>
          <View style={styles.mediaIconBubble}>
            <Ionicons name={activeMedia?.icon ?? 'image-outline'} size={24} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.mediaPreview}>
          <Ionicons name={activeMedia?.icon ?? 'image-outline'} size={58} color="#FFFFFF" />
          <Text style={styles.mediaPreviewText}>{t('publish.chooseMedia')}</Text>
        </View>

        <MediaSelector
          options={publishMediaOptions}
          selectedKey={mediaType}
          theme={theme}
          onSelect={pickMedia}
        />
      </View>

      <Pressable
        onPress={() => {
          setMode('tip');
          setStatus('');
        }}
        style={[
          styles.tipShortcut,
          { backgroundColor: theme.surface, borderColor: selectedSeason === 'winter' ? theme.border : '#E7D8C3' },
        ]}
      >
        <View style={styles.tipIconBox}>
          <Ionicons name="location-outline" size={34} color="#49B761" />
        </View>
        <View style={styles.tipShortcutCopy}>
          <Text style={[styles.tipShortcutTitle, { color: theme.text }]}>{t('publish.goodTipShortcut')}</Text>
          <Text style={[styles.tipShortcutSubtitle, { color: theme.muted }]}>
            {t('publish.goodTipSubtitle')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={28} color={theme.muted} />
      </Pressable>

      {mode === 'tip' ? (
        <View style={[styles.tipForm, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TextInput
            onChangeText={setPlace}
            placeholder={t('publish.place')}
            placeholderTextColor={theme.muted}
            style={[styles.singleInput, { backgroundColor: theme.surfaceAlt, color: theme.text }]}
            value={place}
          />
          <TextInput
            onChangeText={setAddress}
            placeholder={t('publish.address')}
            placeholderTextColor={theme.muted}
            style={[styles.singleInput, { backgroundColor: theme.surfaceAlt, color: theme.text }]}
            value={address}
          />
          <TextInput
            onChangeText={setTipCategory}
            placeholder={t('publish.category')}
            placeholderTextColor={theme.muted}
            style={[styles.singleInput, { backgroundColor: theme.surfaceAlt, color: theme.text }]}
            value={tipCategory}
          />
          <TextInput
            onChangeText={setBudget}
            placeholder={t('publish.averagePrice')}
            placeholderTextColor={theme.muted}
            style={[styles.singleInput, { backgroundColor: theme.surfaceAlt, color: theme.text }]}
            value={budget}
          />
          <TextInput
            onChangeText={setTransport}
            placeholder={t('publish.transport')}
            placeholderTextColor={theme.muted}
            style={[styles.singleInput, { backgroundColor: theme.surfaceAlt, color: theme.text }]}
            value={transport}
          />
          <View style={styles.tipActions}>
            <Pressable onPress={resetDraft} style={[styles.secondaryButton, { borderColor: theme.border }]}>
              <Text style={[styles.secondaryButtonText, { color: theme.text }]}>{t('common.back')}</Text>
            </Pressable>
            <Pressable
              onPress={publishTip}
              style={[styles.primaryButton, { backgroundColor: theme.text, opacity: canPublishTip ? 1 : 0.5 }]}
            >
              <Text style={styles.primaryButtonText}>{t('common.publish')}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {status ? <Text style={[styles.statusText, { color: theme.muted }]}>{status}</Text> : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  fullContent: { flexGrow: 1 },
  topRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  iconButton: {
    alignItems: 'center',
    borderRadius: 18,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  mediaPanel: {
    borderRadius: 28,
    borderWidth: 1,
    gap: 18,
    padding: 20,
  },
  mediaTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mediaKicker: {
    color: '#FFF5EA',
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  mediaTitle: {
    color: '#FFFFFF',
    fontFamily: fonts.title,
    fontSize: 30,
    fontWeight: '700',
  },
  mediaIconBubble: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  mediaPreview: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 22,
    gap: 10,
    justifyContent: 'center',
    minHeight: 170,
    overflow: 'hidden',
  },
  mediaPreviewText: {
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 15,
    fontWeight: '800',
  },
  selectedMediaPreview: {
    borderRadius: 18,
    height: '100%',
    width: '100%',
  },
  progressTrack: {
    borderRadius: 999,
    height: 8,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 999,
    height: '100%',
  },
  tipShortcut: {
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 16,
    padding: 18,
  },
  tipIconBox: {
    alignItems: 'center',
    backgroundColor: '#E3F3E7',
    borderRadius: 20,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  tipShortcutCopy: { flex: 1, gap: 5 },
  tipShortcutTitle: { fontFamily: fonts.body, fontSize: 28, fontWeight: '900' },
  tipShortcutSubtitle: { fontFamily: fonts.body, fontSize: 24, fontWeight: '700' },
  tipForm: { borderRadius: 24, borderWidth: 1, gap: 12, padding: 16 },
  singleInput: { borderRadius: 18, fontFamily: fonts.body, fontSize: 16, padding: 15 },
  captionInput: {
    borderRadius: 20,
    borderWidth: 1,
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 130,
    padding: 16,
  },
  tipActions: { flexDirection: 'row', gap: 12 },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 16,
  },
  secondaryButtonText: { fontFamily: fonts.body, fontSize: 15, fontWeight: '800' },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 18,
    flex: 1,
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 15,
    fontWeight: '800',
  },
  statusText: { fontFamily: fonts.body, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  expandedMediaPanel: {
    borderRadius: 28,
    flex: 1,
    gap: 18,
    minHeight: 650,
    padding: 18,
  },
  expandedTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 18,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  expandedPublishButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  expandedPublishText: {
    color: '#2B241B',
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '900',
  },
  expandedTextInput: {
    color: '#FFFFFF',
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 34,
    paddingVertical: 12,
  },
  expandedBottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deleteButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  deleteText: {
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '900',
  },
  counterText: {
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '900',
  },
  expandedStatus: {
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },
});
