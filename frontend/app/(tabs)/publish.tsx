import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  BrandHeader,
  Chip,
  MediaSelector,
  ScreenShell,
  SeasonalTag,
  SectionLabel,
  TruefeedModal,
} from '@/components/truefeed/ui';
import {
  attachmentOptions,
  fonts,
  postFormats,
  publishMediaOptions,
  seasonThemes,
  seasonalTags,
  visibilityOptions,
} from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';

type FormatKey = 'photo' | 'vlog' | 'debate' | 'tip';
type MediaKey = (typeof publishMediaOptions)[number]['key'];
type PublishState = 'idle' | 'draft' | 'published';

export default function PublishScreen() {
  const { selectedSeason } = useGlobalSeason();
  const [format, setFormat] = useState<FormatKey>('vlog');
  const [mediaType, setMediaType] = useState<MediaKey>('video');
  const [visibility, setVisibility] = useState('Public');
  const [title, setTitle] = useState('Matin calme a Kyoto');
  const [location, setLocation] = useState('Kyoto, Japon');
  const [caption, setCaption] = useState(
    'Spot prefere du moment, lumiere parfaite et petite astuce budget a partager avec la commu.',
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(['ville', 'food']);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [selectedMediaUri, setSelectedMediaUri] = useState<string | null>(null);
  const [publishState, setPublishState] = useState<PublishState>('idle');
  const [showPublishModal, setShowPublishModal] = useState(false);

  const theme = seasonThemes[selectedSeason];
  const tags = seasonalTags[selectedSeason];
  const activeFormat = postFormats.find((item) => item.key === format);
  const activeMedia = publishMediaOptions.find((item) => item.key === mediaType);

  function toggleTag(tag: string) {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag],
    );
  }

  function toggleModule(label: string) {
    setSelectedModules((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label],
    );
  }

  async function pickMedia(nextMediaType = mediaType) {
    if (nextMediaType === 'text') {
      setMediaType(nextMediaType);
      setSelectedMediaUri(null);
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setPublishState('idle');
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

  async function shareDraft() {
    await Share.share({
      title,
      message: `${title}\n${location}\n\n${caption}`,
    }).catch(() => undefined);
  }

  function publishPost() {
    setPublishState('published');
    setShowPublishModal(false);

    if (format === 'debate' || mediaType === 'text') {
      router.push('/debate');
      return;
    }

    router.push('/(tabs)');
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

      <View
        style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <Text style={[styles.label, { color: theme.text }]}>Titre</Text>
        <TextInput
          onChangeText={setTitle}
          placeholder="Donne un titre court au post"
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

        <Text style={[styles.label, { color: theme.text }]}>Destination</Text>
        <TextInput
          onChangeText={setLocation}
          placeholder="Ville, pays ou spot"
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

        <Text style={[styles.label, { color: theme.text }]}>Legende</Text>
        <TextInput
          multiline
          onChangeText={setCaption}
          placeholder="Raconte le moment, le bon plan ou le debat..."
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

        <Text style={[styles.label, { color: theme.text }]}>Tags saisonniers</Text>
        <View style={styles.tagRow}>
          {tags.map((tag) => {
            const isActive = selectedTags.includes(tag);
            return (
              <SeasonalTag
                key={tag}
                label={tag}
                theme={theme}
                active={isActive}
                onPress={() => toggleTag(tag)}
              />
            );
          })}
        </View>

        <Text style={[styles.label, { color: theme.text }]}>Modules</Text>
        <View style={styles.attachmentGrid}>
          {attachmentOptions.map((item) => (
            <Pressable
              key={item.label}
              onPress={() => toggleModule(item.label)}
              style={[
                styles.attachmentCard,
                {
                  backgroundColor: selectedModules.includes(item.label)
                    ? theme.accentSoft
                    : theme.surfaceAlt,
                  borderColor: selectedModules.includes(item.label)
                    ? theme.accentStrong
                    : theme.border,
                },
              ]}
            >
              <Text style={styles.attachmentIcon}>{item.icon}</Text>
              <Text style={[styles.attachmentTitle, { color: theme.text }]}>{item.label}</Text>
              <Text style={[styles.attachmentDetail, { color: theme.muted }]}>{item.detail}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, { color: theme.text }]}>Visibilite</Text>
        <View style={styles.visibilityRow}>
          {visibilityOptions.map((option) => (
            <Chip
              key={option}
              label={option}
              active={visibility === option}
              backgroundColor={visibility === option ? theme.accentSoft : theme.surfaceAlt}
              textColor={visibility === option ? theme.accentStrong : theme.muted}
              onPress={() => setVisibility(option)}
            />
          ))}
        </View>
      </View>

      <View style={[styles.previewCard, { backgroundColor: theme.accentStrong }]}>
        <View style={styles.previewHeader}>
          <Text style={styles.previewLabel}>Apercu</Text>
          <Chip label={visibility} backgroundColor="rgba(255,255,255,0.2)" textColor="#FFFFFF" />
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
          onPress={shareDraft}
          style={[
            styles.secondaryButton,
            { borderColor: theme.border, backgroundColor: theme.surface },
          ]}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Partager</Text>
        </Pressable>
        <Pressable
          onPress={() => setShowPublishModal(true)}
          style={[styles.primaryButton, { backgroundColor: theme.text }]}
        >
          <Text style={styles.primaryButtonText}>Publier</Text>
        </Pressable>
      </View>

      <View
        style={[
          styles.statusCard,
          { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.statusTitle, { color: theme.text }]}>
          {publishState === 'idle'
            ? 'Pret a publier'
            : publishState === 'draft'
              ? 'Brouillon enregistre'
              : 'Publication prete'}
        </Text>
        <Text style={[styles.statusText, { color: theme.muted }]}>
          {publishState === 'idle'
            ? 'Texte ou debat ira dans Debat. Photo et video iront dans l accueil.'
            : publishState === 'draft'
              ? 'Ton contenu est garde de cote pour etre repris plus tard.'
              : format === 'debate' || mediaType === 'text'
                ? 'Ton debat peut maintenant apparaitre dans Debat.'
                : 'Ton post peut maintenant apparaitre dans l accueil.'}
        </Text>
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
  attachmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  attachmentCard: {
    borderRadius: 22,
    borderWidth: 1,
    gap: 8,
    padding: 16,
    width: '47%',
  },
  attachmentIcon: {
    fontSize: 28,
  },
  attachmentTitle: {
    fontFamily: fonts.body,
    fontSize: 16,
    fontWeight: '800',
  },
  attachmentDetail: {
    fontFamily: fonts.body,
    fontSize: 14,
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
