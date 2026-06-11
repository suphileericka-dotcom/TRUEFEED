// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Chip, ScreenShell, SectionLabel } from '@/components/truefeed/ui';
import { fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';
import { useSession } from '@/hooks/use-session';
import { usersApi, type PublicUser } from '@/services/api/users';

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedSeason } = useGlobalSeason();
  const { isAuthenticated, user } = useSession();
  const theme = seasonThemes[selectedSeason];
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!id) {
      return;
    }

    let isMounted = true;

    usersApi
      .getPublic(id, user?.id)
      .then((response) => {
        if (isMounted) {
          setProfile(response.user);
        }
      })
      .catch(() => {
        if (isMounted) {
          setProfile(null);
          setStatus('Profil introuvable.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id, user?.id]);

  async function sendFriendRequest() {
    if (!profile) {
      return;
    }

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      await usersApi.sendFriendRequest(profile.id);
      setProfile({ ...profile, relation: 'pending_sent' });
      setStatus(`Demande envoyee a @${profile.username}.`);
    } catch {
      setStatus('Impossible d envoyer la demande pour le moment.');
    }
  }

  const buttonLabel =
    profile?.relation === 'friends'
      ? 'Ajoute'
      : profile?.relation === 'pending_sent'
        ? 'En attente'
        : profile?.relation === 'pending_received'
          ? 'Demande recue'
          : 'Ajouter';
  const buttonDisabled =
    !profile ||
    profile.relation === 'self' ||
    profile.relation === 'friends' ||
    profile.relation === 'pending_sent' ||
    profile.relation === 'pending_received';
  const stats = profile
    ? [
        ['posts', profile.stats.posts],
        ['abonnes', profile.stats.followers],
        ['suivis', profile.stats.following],
      ]
    : [];

  return (
    <ScreenShell theme={theme}>
      <View style={styles.topRow}>
        <Ionicons name="arrow-back" size={22} color={theme.text} onPress={() => router.back()} />
        <SectionLabel theme={theme} label={`Profil public - ${id || ''}`} />
      </View>

      <View style={[styles.header, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.avatar, { backgroundColor: theme.accentSoft }]}>
          <Text style={[styles.avatarText, { color: theme.accentStrong }]}>
            {(profile?.displayName?.[0] || profile?.username?.[0] || '?').toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.name, { color: theme.text }]}>{profile?.displayName || 'Profil'}</Text>
        <Text style={[styles.username, { color: theme.muted }]}>
          {profile ? `@${profile.username}` : 'Chargement...'}
        </Text>
        <Text style={[styles.bio, { color: theme.muted }]}>
          {profile?.bio || 'Aucune bio pour le moment.'}
        </Text>
        {status ? <Text style={[styles.status, { color: theme.muted }]}>{status}</Text> : null}
        <Pressable
          disabled={buttonDisabled}
          onPress={sendFriendRequest}
          style={[
            styles.addFriendButton,
            { backgroundColor: buttonDisabled ? theme.surfaceAlt : theme.accentStrong },
          ]}
        >
          <Ionicons
            name={buttonDisabled ? 'checkmark' : 'add'}
            size={20}
            color={buttonDisabled ? theme.accentStrong : '#FFFFFF'}
          />
          <Text style={[styles.addFriendText, { color: buttonDisabled ? theme.accentStrong : '#FFFFFF' }]}>
            {buttonLabel}
          </Text>
        </Pressable>
      </View>

      <View style={styles.stats}>
        {stats.map(([label, value]) => (
          <View key={label} style={[styles.stat, { backgroundColor: theme.surfaceAlt }]}>
            <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
            <Text style={[styles.statLabel, { color: theme.muted }]}>{label}</Text>
          </View>
        ))}
      </View>

      <SectionLabel theme={theme} label="Activite" />
      <View style={[styles.activity, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Chip label="Reel" backgroundColor={theme.accentSoft} textColor={theme.accentStrong} />
        <Text style={[styles.activityText, { color: theme.text }]}>
          Les compteurs viennent des publications et relations acceptees.
        </Text>
      </View>
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
  status: { fontFamily: fonts.body, fontSize: 13, fontWeight: '800', textAlign: 'center' },
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
