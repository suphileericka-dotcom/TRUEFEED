import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ScreenShell, SectionLabel } from '@/components/truefeed/ui';
import { fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';

const notifications = [
  { title: 'Nouveau like', body: 'nora.nomad a aime ton post.' },
  { title: 'Nouveau commentaire', body: 'maya_explores a commente ton post Kyoto.' },
  { title: 'Nouveau vote', body: 'Ton debat a recu un vote Pour.' },
  { title: 'Partage', body: 'Un utilisateur a partage ton bon plan.' },
];

export default function NotificationsScreen() {
  const { selectedSeason } = useGlobalSeason();
  const theme = seasonThemes[selectedSeason];

  return (
    <ScreenShell theme={theme}>
      <View style={styles.topRow}>
        <Ionicons name="arrow-back" size={22} color={theme.text} onPress={() => router.back()} />
        <SectionLabel theme={theme} label="Notifications" />
      </View>

      {notifications.map((notification) => (
        <View
          key={notification.title}
          style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <View style={[styles.dot, { backgroundColor: theme.accentStrong }]} />
          <View style={styles.copy}>
            <Text style={[styles.title, { color: theme.text }]}>{notification.title}</Text>
            <Text style={[styles.body, { color: theme.muted }]}>{notification.body}</Text>
          </View>
        </View>
      ))}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  topRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  card: { alignItems: 'center', borderRadius: 24, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 16 },
  dot: { borderRadius: 999, height: 12, width: 12 },
  copy: { flex: 1, gap: 4 },
  title: { fontFamily: fonts.body, fontSize: 16, fontWeight: '900' },
  body: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
});
