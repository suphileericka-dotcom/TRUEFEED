// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Chip, ScreenShell, SectionLabel } from '@/components/truefeed/ui';
import { fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';
import { useSession } from '@/hooks/use-session';

const adminSections = [
  { title: 'Utilisateurs', detail: 'Voir, suspendre ou supprimer des comptes.' },
  { title: 'Posts', detail: 'Moderation, masquage et suppression de contenu.' },
  { title: 'Signalements', detail: 'Traiter les contenus reportes par la communaute.' },
  { title: 'Stats', detail: 'Suivre inscrits, posts, likes, recherches et debats.' },
];

export default function AdminScreen() {
  const { selectedSeason } = useGlobalSeason();
  const theme = seasonThemes[selectedSeason];
  const { isAdmin, user } = useSession();

  return (
    <ScreenShell theme={theme}>
      <View style={styles.topRow}>
        <Ionicons name="arrow-back" size={22} color={theme.text} onPress={() => router.back()} />
        <SectionLabel theme={theme} label="Administration" />
      </View>

      {!isAdmin ? (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>Acces reserve</Text>
          <Text style={[styles.copy, { color: theme.muted }]}>
            Connecte-toi avec un compte administrateur pour ouvrir cette page.
          </Text>
        </View>
      ) : (
        <>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Chip label="Admin" backgroundColor={theme.accentStrong} textColor="#FFFFFF" />
            <Text style={[styles.title, { color: theme.text }]}>{user?.displayName || 'Admin'}</Text>
            <Text style={[styles.copy, { color: theme.muted }]}>{user?.email}</Text>
          </View>

          {adminSections.map((section) => (
            <View key={section.title} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
              <Text style={[styles.copy, { color: theme.muted }]}>{section.detail}</Text>
            </View>
          ))}
        </>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  topRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  card: { borderRadius: 24, borderWidth: 1, gap: 10, padding: 18 },
  title: { fontFamily: fonts.title, fontSize: 34, fontWeight: '700' },
  sectionTitle: { fontFamily: fonts.body, fontSize: 18, fontWeight: '900' },
  copy: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23 },
});
