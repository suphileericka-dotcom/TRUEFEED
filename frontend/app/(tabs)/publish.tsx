import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BrandHeader, Chip, ScreenShell, SectionLabel } from '@/components/truefeed/ui';
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
  const [publishState, setPublishState] = useState<PublishState>('idle');

  const theme = seasonThemes[selectedSeason];
  const tags = seasonalTags[selectedSeason];
  const activeFormat = postFormats.find((item) => item.key === format);
  const activeMedia = publishMediaOptions.find((item) => item.key === mediaType);

  function toggleTag(tag: string) {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag],
    );
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
            {mediaType === 'text' ? 'Post texte enrichi' : 'Apercu pret pour upload'}
          </Text>
        </View>

        <View style={styles.mediaOptions}>
          {publishMediaOptions.map((item) => {
            const isActive = mediaType === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setMediaType(item.key)}
                style={[
                  styles.mediaOption,
                  { backgroundColor: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.18)' },
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={isActive ? theme.accentStrong : '#FFFFFF'}
                />
                <Text
                  style={[
                    styles.mediaOptionText,
                    { color: isActive ? theme.accentStrong : '#FFFFFF' },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
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
              <Chip
                key={tag}
                label={`#${tag}`}
                active={isActive}
                backgroundColor={isActive ? theme.accentSoft : theme.surfaceAlt}
                textColor={isActive ? theme.accentStrong : theme.muted}
                onPress={() => toggleTag(tag)}
              />
            );
          })}
        </View>

        <Text style={[styles.label, { color: theme.text }]}>Modules</Text>
        <View style={styles.attachmentGrid}>
          {attachmentOptions.map((item) => (
            <View
              key={item.label}
              style={[
                styles.attachmentCard,
                {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text style={styles.attachmentIcon}>{item.icon}</Text>
              <Text style={[styles.attachmentTitle, { color: theme.text }]}>{item.label}</Text>
              <Text style={[styles.attachmentDetail, { color: theme.muted }]}>{item.detail}</Text>
            </View>
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
          onPress={() => setPublishState('draft')}
          style={[
            styles.secondaryButton,
            { borderColor: theme.border, backgroundColor: theme.surface },
          ]}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
            Enregistrer brouillon
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setPublishState('published')}
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
            ? 'Pret a composer'
            : publishState === 'draft'
              ? 'Brouillon enregistre'
              : 'Pret a etre envoye a l API'}
        </Text>
        <Text style={[styles.statusText, { color: theme.muted }]}>
          {publishState === 'idle'
            ? 'Choisis ton format, complete la legende puis connecte le bouton a la route backend.'
            : publishState === 'draft'
              ? 'Le prochain branchement logique est un vrai stockage local ou base de donnees.'
              : 'La route `POST /api/posts` cote backend est deja presente pour la suite.'}
        </Text>
      </View>
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
  mediaOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  mediaOption: {
    alignItems: 'center',
    borderRadius: 999,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 11,
  },
  mediaOptionText: {
    fontFamily: fonts.body,
    fontSize: 13,
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
