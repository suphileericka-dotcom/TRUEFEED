// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Chip, ScreenShell, SectionLabel } from '@/components/truefeed/ui';
import { fonts, publicProfile, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedSeason } = useGlobalSeason();
  const theme = seasonThemes[selectedSeason];
  const [added, setAdded] = useState(false);

  return (
    <ScreenShell theme={theme}>
      <View style={styles.topRow}>
        <Ionicons name="arrow-back" size={22} color={theme.text} onPress={() => router.back()} />
        <SectionLabel theme={theme} label={`Profil public - ${id || publicProfile.id}`} />
      </View>

      <View style={[styles.header, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.avatar, { backgroundColor: theme.accentSoft }]}>
          <Text style={[styles.avatarText, { color: theme.accentStrong }]}>N</Text>
        </View>
        <Text style={[styles.name, { color: theme.text }]}>{publicProfile.displayName}</Text>
        <Text style={[styles.username, { color: theme.muted }]}>@{publicProfile.username}</Text>
        <Text style={[styles.bio, { color: theme.muted }]}>{publicProfile.bio}</Text>
        <Pressable
          onPress={() => setAdded(true)}
          style={[
            styles.addFriendButton,
            { backgroundColor: added ? theme.surfaceAlt : theme.accentStrong },
          ]}
        >
          <Ionicons name={added ? 'checkmark' : 'add'} size={20} color={added ? theme.accentStrong : '#FFFFFF'} />
          <Text style={[styles.addFriendText, { color: added ? theme.accentStrong : '#FFFFFF' }]}>
            {added ? 'Ajoute' : 'Ajouter'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.stats}>
        {Object.entries(publicProfile.stats).map(([label, value]) => (
          <View key={label} style={[styles.stat, { backgroundColor: theme.surfaceAlt }]}>
            <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
            <Text style={[styles.statLabel, { color: theme.muted }]}>{label}</Text>
          </View>
        ))}
      </View>

      <SectionLabel theme={theme} label="Activite v1" />
      {publicProfile.activity.map((item) => (
        <View
          key={item}
          style={[styles.activity, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Chip
            label="Activite"
            backgroundColor={theme.accentSoft}
            textColor={theme.accentStrong}
          />
          <Text style={[styles.activityText, { color: theme.text }]}>{item}</Text>
        </View>
      ))}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  topRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  header: { alignItems: 'center', borderRadius: 30, borderWidth: 1, gap: 8, padding: 24 },
  avatar: {
    alignItems: 'center',
    borderRadius: 44,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  avatarText: { fontFamily: fonts.title, fontSize: 42, fontWeight: '700' },
  name: { fontFamily: fonts.title, fontSize: 36, fontWeight: '700' },
  username: { fontFamily: fonts.body, fontSize: 15, fontWeight: '800' },
  bio: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23, textAlign: 'center' },
  addFriendButton: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addFriendText: { fontFamily: fonts.body, fontSize: 14, fontWeight: '900' },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { alignItems: 'center', borderRadius: 20, flex: 1, gap: 4, padding: 14 },
  statValue: { fontFamily: fonts.title, fontSize: 26, fontWeight: '700' },
  statLabel: { fontFamily: fonts.body, fontSize: 13, fontWeight: '800' },
  activity: { borderRadius: 24, borderWidth: 1, gap: 10, padding: 16 },
  activityText: { fontFamily: fonts.body, fontSize: 15, fontWeight: '800' },
});
