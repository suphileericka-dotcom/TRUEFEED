import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Chip, ScreenShell, SectionLabel } from '@/components/truefeed/ui';
import { fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';

type MessageTab = 'friends' | 'requests';

const friendMessages = [
  {
    author: 'maya_explores',
    relation: 'Amie',
    body: 'Merci pour ton bon plan, je vais tester ce spot.',
    time: '18 min',
  },
  {
    author: 'nora.nomad',
    relation: 'Suivie',
    body: 'Tu pars quand a Kyoto ?',
    time: '1 h',
  },
  {
    author: 'Createur TRUEFEED',
    relation: 'Officiel',
    body: 'Bienvenue sur TRUEFEED.',
    time: 'Maintenant',
  },
];

const messageRequests = [
  {
    author: 'lucas.trips',
    relation: 'Demande',
    body: 'Souhaite t envoyer un message.',
    time: '2 h',
  },
  {
    author: 'sara.city',
    relation: 'Demande',
    body: 'A reagi a ta story et demande a discuter.',
    time: 'Hier',
  },
];

export default function MessagesScreen() {
  const { selectedSeason } = useGlobalSeason();
  const theme = seasonThemes[selectedSeason];
  const [tab, setTab] = useState<MessageTab>('friends');
  const messages = tab === 'friends' ? friendMessages : messageRequests;

  return (
    <ScreenShell theme={theme}>
      <View style={styles.topRow}>
        <Ionicons name="arrow-back" size={22} color={theme.text} onPress={() => router.back()} />
        <SectionLabel theme={theme} label="Messagerie" />
      </View>

      <View style={styles.tabs}>
        <Chip
          label="Amis et suivis"
          active={tab === 'friends'}
          backgroundColor={tab === 'friends' ? theme.accentStrong : theme.surface}
          textColor={tab === 'friends' ? '#FFFFFF' : theme.muted}
          onPress={() => setTab('friends')}
        />
        <Chip
          label={`Demandes (${messageRequests.length})`}
          active={tab === 'requests'}
          backgroundColor={tab === 'requests' ? theme.accentStrong : theme.surface}
          textColor={tab === 'requests' ? '#FFFFFF' : theme.muted}
          onPress={() => setTab('requests')}
        />
      </View>

      {messages.map((message) => (
        <Pressable
          key={`${message.author}-${message.body}`}
          style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <View style={[styles.avatar, { backgroundColor: theme.accentSoft }]}>
            <Text style={[styles.avatarText, { color: theme.accentStrong }]}>
              {message.author.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.copy}>
            <View style={styles.messageTitleRow}>
              <Text style={[styles.title, { color: theme.text }]}>{message.author}</Text>
              <Text style={[styles.relation, { color: theme.accentStrong }]}>{message.relation}</Text>
            </View>
            <Text style={[styles.body, { color: theme.muted }]}>{message.body}</Text>
          </View>
          <Text style={[styles.time, { color: theme.muted }]}>{message.time}</Text>
        </Pressable>
      ))}

      {tab === 'requests' ? (
        <Text style={[styles.notice, { color: theme.muted }]}>
          Les demandes restent separees tant que tu n acceptes pas la personne.
        </Text>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  topRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  avatar: { alignItems: 'center', borderRadius: 22, height: 46, justifyContent: 'center', width: 46 },
  avatarText: { fontFamily: fonts.body, fontSize: 18, fontWeight: '900' },
  copy: { flex: 1, gap: 4 },
  messageTitleRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  title: { fontFamily: fonts.body, fontSize: 16, fontWeight: '900' },
  relation: { fontFamily: fonts.body, fontSize: 12, fontWeight: '900' },
  body: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  time: { fontFamily: fonts.body, fontSize: 12, fontWeight: '800' },
  notice: { fontFamily: fonts.body, fontSize: 13, fontWeight: '800', lineHeight: 20 },
});
