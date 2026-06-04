import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ScreenShell, SectionLabel } from '@/components/truefeed/ui';
import { fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';

const messages = [
  {
    author: 'Createur TRUEFEED',
    body: 'Bienvenue sur TRUEFEED. Ici tu recevras les messages officiels et les conversations privees.',
    time: 'Maintenant',
  },
  {
    author: 'maya_explores',
    body: 'Merci pour ton bon plan, je vais tester ce spot.',
    time: '18 min',
  },
];

export default function MessagesScreen() {
  const { selectedSeason } = useGlobalSeason();
  const theme = seasonThemes[selectedSeason];

  return (
    <ScreenShell theme={theme}>
      <View style={styles.topRow}>
        <Ionicons name="arrow-back" size={22} color={theme.text} onPress={() => router.back()} />
        <SectionLabel theme={theme} label="Messagerie" />
      </View>

      {messages.map((message) => (
        <View key={message.body} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.icon, { backgroundColor: theme.accentSoft }]}>
            <Ionicons name="mail" size={20} color={theme.accentStrong} />
          </View>
          <View style={styles.copy}>
            <Text style={[styles.title, { color: theme.text }]}>{message.author}</Text>
            <Text style={[styles.body, { color: theme.muted }]}>{message.body}</Text>
          </View>
          <Text style={[styles.time, { color: theme.muted }]}>{message.time}</Text>
        </View>
      ))}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  topRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  card: { alignItems: 'center', borderRadius: 24, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 16 },
  icon: { alignItems: 'center', borderRadius: 20, height: 42, justifyContent: 'center', width: 42 },
  copy: { flex: 1, gap: 4 },
  title: { fontFamily: fonts.body, fontSize: 16, fontWeight: '900' },
  body: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  time: { fontFamily: fonts.body, fontSize: 12, fontWeight: '800' },
});
