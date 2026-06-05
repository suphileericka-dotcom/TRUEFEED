import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  BrandHeader,
  Chip,
  MediaSelector,
  ScreenShell,
  SectionLabel,
  TruefeedModal,
} from '@/components/truefeed/ui';
import {
  fonts,
  postFormats,
  publishMediaOptions,
  seasonThemes,
} from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';
import { useSession } from '@/hooks/use-session';
import { goodTipsApi } from '@/services/api/good-tips';
import { postsApi } from '@/services/api/posts';

type FormatKey = 'photo' | 'vlog' | 'debate' | 'tip';
type MediaKey = (typeof publishMediaOptions)[number]['key'];

export default function PublishScreen() {
  const { selectedSeason } = useGlobalSeason();
  const { isAuthenticated, session } = useSession();
  const [format, setFormat] = useState<FormatKey>('vlog');
  const [mediaType, setMediaType] = useState<MediaKey>('video');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [caption, setCaption] = useState('');
  const selectedTags = ['ville', 'food'];
  const [selectedMediaUri, setSelectedMediaUri] = useState<string | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);

  const theme = seasonThemes[selectedSeason];
  const activeFormat = postFormats.find((item) => item.key === format);
  const activeMedia = publishMediaOptions.find((item) => item.key === mediaType);

  async function pickMedia(nextMediaType = mediaType) {
    if (nextMediaType === 'text') {
      setMediaType(nextMediaType);
      setSelectedMediaUri(null);
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      mediaTypes:
        nextMediaType === 'video'
          ? ImagePicker.MediaTypeOptions.Videos
          : ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      videoMaxDuration: 90,
    });

    setMediaType(nextMediaType);

    if (!result.canceled && result.assets[0]) {
      setSelectedMediaUri(result.assets[0].uri);
    }
  }

  async function publishPost() {
    if (!isAuthenticated) {
      setShowPublishModal(false);
      router.push('/login');
      return;
    }

    try {
      if (format === 'tip') {
        await goodTipsApi.create({
          place: location.trim() || title.trim() || caption.trim().slice(0, 80),
          budget: 'A preciser',
          transport: 'A preciser',
        });
        setShowPublishModal(false);
        router.push('/bonplan');
        return;
      }

      if (session?.accessToken) {
        await postsApi.create(
          {
            title: title.trim() || undefined,
            caption: caption.trim(),
            mediaType,
            format,
            location: location.trim() || undefined,
            season: selectedSeason,
            tags: selectedTags,
          },
          session.accessToken,
        );
      }

      setShowPublishModal(false);
      router.push(format === 'debate' || mediaType === 'text' ? '/debate' : '/(tabs)');
    } catch {
      setShowPublishModal(false);
    }
  }

  return (
    <ScreenShell theme={theme}>
      <BrandHeader theme={theme} badgeText="Composer un post" badgeIcon="+" />

      <SectionLabel theme={theme} label="Page publication" />

      <View
        style={[
          styles.mediaPanel,
          { backgroundColor: theme.accentStrong, borderColor: theme.border },
        ]}
      >
        <View style={styles.mediaTopRow}>
          <View>
            <Text style={styles.mediaKicker}>Media</Text>
            <Text style={styles.mediaTitle}>{activeMedia?.label ?? 'Media'} principal</Text>
          </View>
          <View style={styles.mediaIconBubble}>
            <Ionicons name={activeMedia?.icon ?? 'image-outline'} size={24} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.mediaPreview}>
          <Ionicons name={activeMedia?.icon ?? 'image-outline'} size={58} color="#FFFFFF" />
          <Text style={styles.mediaPreviewText}>
            {mediaType === 'text'
              ? 'Post texte enrichi'
              : selectedMediaUri
                ? 'Media selectionne'
                : 'Choisis une photo ou une video'}
          </Text>
        </View>

        <MediaSelector
          options={publishMediaOptions}
          selectedKey={mediaType}
          theme={theme}
          onSelect={(key) => pickMedia(key)}
        />
      </View>

      <View style={styles.formatRow}>
        {postFormats.map((item) => {
          const isActive = format === item.key;
          return (
            <Chip
              key={item.key}
              label={item.label}
              active={isActive}
              backgroundColor={isActive ? theme.accentStrong : theme.surface}
              textColor={isActive ? '#FFFFFF' : theme.muted}
              onPress={() => setFormat(item.key as FormatKey)}
            />
          );
        })}
      </View>

      <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TextInput
          onChangeText={setTitle}
          placeholder="Sujet court"
          placeholderTextColor={theme.muted}
          style={[
            styles.singleInput,
            {
              backgroundColor: theme.surfaceAlt,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          value={title}
        />

        <TextInput
          onChangeText={setLocation}
          placeholder={format === 'tip' ? 'Lieu du bon plan' : 'Lieu'}
          placeholderTextColor={theme.muted}
          style={[
            styles.singleInput,
            {
              backgroundColor: theme.surfaceAlt,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          value={location}
        />

        <TextInput
          multiline
          onChangeText={setCaption}
          placeholder="Texte"
          placeholderTextColor={theme.muted}
          style={[
            styles.captionInput,
            {
              backgroundColor: theme.surfaceAlt,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          textAlignVertical="top"
          value={caption}
        />
      </View>

      <View style={[styles.previewCard, { backgroundColor: theme.accentStrong }]}>
        <View style={styles.previewHeader}>
          <Text style={styles.previewLabel}>Apercu</Text>
          <Chip label={activeFormat?.label ?? 'Post'} backgroundColor="rgba(255,255,255,0.2)" textColor="#FFFFFF" />
        </View>
        <Text style={styles.previewTitle}>{title}</Text>
        <Text style={styles.previewMeta}>
          {activeFormat?.label ?? 'Post'} - {theme.label} - {location}
        </Text>
        <Text style={styles.previewText}>{caption}</Text>
        <View style={styles.previewTags}>
          {selectedTags.map((tag) => (
            <Text key={tag} style={styles.previewTag}>
              #{tag}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => setShowPublishModal(true)}
          style={[
            styles.primaryButton,
            { backgroundColor: selectedSeason === 'winter' ? '#FFFFFF' : theme.text },
          ]}
        >
          <Text style={[styles.primaryButtonText, { color: selectedSeason === 'winter' ? '#0F172A' : '#FFFFFF' }]}>Publier</Text>
        </Pressable>
      </View>

      <TruefeedModal
        visible={showPublishModal}
        theme={theme}
        title="Publier ce post ?"
        message={
          format === 'debate' || mediaType === 'text'
            ? 'Ce contenu sera publie dans Debat.'
            : 'Ce contenu sera publie dans l accueil.'
        }
        secondaryLabel="Annuler"
        primaryLabel="Publier"
        onClose={() => setShowPublishModal(false)}
        onPrimary={publishPost}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
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
    minHeight: 170,
    justifyContent: 'center',
  },
  mediaPreviewText: {
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 15,
    fontWeight: '800',
  },
  formatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  formCard: {
    borderRadius: 28,
    borderWidth: 1,
    gap: 16,
    padding: 20,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 15,
    fontWeight: '800',
  },
  singleInput: {
    borderRadius: 18,
    borderWidth: 1,
    fontFamily: fonts.body,
    fontSize: 16,
    padding: 15,
  },
  inlineBlock: {
    borderRadius: 20,
    gap: 6,
    padding: 16,
  },
  inlineMain: {
    fontFamily: fonts.body,
    fontSize: 18,
    fontWeight: '800',
  },
  inlineMeta: {
    fontFamily: fonts.body,
    fontSize: 14,
  },
  captionInput: {
    borderRadius: 20,
    borderWidth: 1,
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 130,
    padding: 16,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  visibilityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  previewCard: {
    borderRadius: 28,
    gap: 10,
    padding: 22,
  },
  previewHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewLabel: {
    color: '#EFD9CD',
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  previewTitle: {
    color: '#FFFFFF',
    fontFamily: fonts.title,
    fontSize: 30,
    fontWeight: '700',
  },
  previewText: {
    color: '#FFF1EA',
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 26,
  },
  previewMeta: {
    color: '#FFE8DC',
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '800',
  },
  previewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
  },
  previewTag: {
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 16,
  },
  secondaryButtonText: {
    fontFamily: fonts.body,
    fontSize: 15,
    fontWeight: '800',
  },
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
  statusCard: {
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    padding: 18,
  },
  statusTitle: {
    fontFamily: fonts.body,
    fontSize: 18,
    fontWeight: '800',
  },
  statusText: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 22,
  },
});
