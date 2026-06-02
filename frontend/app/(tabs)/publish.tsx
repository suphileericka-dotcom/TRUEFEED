import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  BrandHeader,
  Chip,
  ScreenShell,
  SeasonSwitcher,
  SectionLabel,
} from '@/components/truefeed/ui';
import {
  attachmentOptions,
  fonts,
  getSeasonFromDate,
  postFormats,
  seasonThemes,
  visibilityOptions,
  type SeasonKey,
} from '@/constants/truefeed';

type FormatKey = 'photo' | 'vlog' | 'debate' | 'tip';
type PublishState = 'idle' | 'draft' | 'published';

export default function PublishScreen() {
  const [selectedSeason, setSelectedSeason] = useState<SeasonKey>(getSeasonFromDate());
  const [format, setFormat] = useState<FormatKey>('vlog');
  const [visibility, setVisibility] = useState('Public');
  const [caption, setCaption] = useState(
    'Spot prefere du moment, lumiere parfaite et petite astuce budget a partager avec la commu.',
  );
  const [publishState, setPublishState] = useState<PublishState>('idle');

  const theme = seasonThemes[selectedSeason];

  return (
    <ScreenShell theme={theme}>
      <BrandHeader theme={theme} badgeText="Composer un post" badgeIcon="+" />

      <SectionLabel theme={theme} label="Page publication" />

      <View
        style={[styles.introCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
      >
        <Text style={[styles.introTitle, { color: theme.text }]}>Page prete pour poster</Text>
        <Text style={[styles.introText, { color: theme.muted }]}>
          Cette interface est deja construite pour brancher ensuite le backend sur `POST
          /api/posts`.
        </Text>
      </View>

      <SeasonSwitcher selectedSeason={selectedSeason} onSelect={setSelectedSeason} />

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
        <Text style={[styles.label, { color: theme.text }]}>Destination</Text>
        <View style={[styles.inlineBlock, { backgroundColor: theme.surfaceAlt }]}>
          <Text style={[styles.inlineMain, { color: theme.text }]}>Kyoto, Japon</Text>
          <Text style={[styles.inlineMeta, { color: theme.muted }]}>
            Temple, marche ou carnet de voyage
          </Text>
        </View>

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
        <Text style={styles.previewLabel}>Apercu</Text>
        <Text style={styles.previewTitle}>
          {format === 'debate' ? 'TrueDebate' : format === 'tip' ? 'BonPlan' : 'VlogFeed'} -{' '}
          {theme.label}
        </Text>
        <Text style={styles.previewText}>{caption}</Text>
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
  introCard: {
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    padding: 20,
  },
  introTitle: {
    fontFamily: fonts.title,
    fontSize: 28,
    fontWeight: '700',
  },
  introText: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 24,
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
