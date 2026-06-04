import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenShell, SeasonSwitcher, SectionLabel, TruefeedModal } from '@/components/truefeed/ui';
import { fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';
import { useSession } from '@/hooks/use-session';

type Dialog = 'logout' | 'delete' | null;

export default function SettingsScreen() {
  const { selectedSeason, setSelectedSeason } = useGlobalSeason();
  const theme = seasonThemes[selectedSeason];
  const { isAuthenticated, hasKnownAccount, signOut, deleteAccount } = useSession();
  const [dialog, setDialog] = useState<Dialog>(null);

  const rows = isAuthenticated
    ? [
        { icon: 'log-out-outline' as const, title: 'Se deconnecter', onPress: () => setDialog('logout') },
        { icon: 'trash-outline' as const, title: 'Supprimer le compte', onPress: () => setDialog('delete') },
      ]
    : [
        { icon: 'log-in-outline' as const, title: 'Se connecter', onPress: () => router.push('/login') },
        ...(!hasKnownAccount
          ? [
              {
                icon: 'person-add-outline' as const,
                title: 'Creer un compte',
                onPress: () => router.push('/signup'),
              },
            ]
          : []),
      ];

  function confirmDialog() {
    if (dialog === 'logout') {
      signOut();
    }

    if (dialog === 'delete') {
      deleteAccount();
      router.replace('/signup');
    }

    setDialog(null);
  }

  return (
    <ScreenShell theme={theme}>
      <View style={styles.topRow}>
        <Ionicons name="arrow-back" size={22} color={theme.text} onPress={() => router.back()} />
        <SectionLabel theme={theme} label="Profil et parametres" />
      </View>

      <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.avatar, { backgroundColor: theme.accentSoft }]}>
          <Ionicons name="person" size={34} color={theme.accentStrong} />
        </View>
        <Text style={[styles.name, { color: theme.text }]}>Compte TRUEFEED</Text>
        <Text style={[styles.meta, { color: theme.muted }]}>
          {isAuthenticated ? 'Connecte' : 'Non connecte'}
        </Text>
      </View>

      <View style={[styles.themeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.themeTitle, { color: theme.text }]}>Theme</Text>
        <SeasonSwitcher selectedSeason={selectedSeason} onSelect={setSelectedSeason} />
      </View>

      {rows.map((row) => (
        <Pressable
          key={row.title}
          onPress={row.onPress}
          style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Ionicons name={row.icon} size={22} color={theme.accentStrong} />
          <Text style={[styles.rowText, { color: theme.text }]}>{row.title}</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.muted} />
        </Pressable>
      ))}

      <TruefeedModal
        visible={dialog !== null}
        theme={theme}
        title={dialog === 'delete' ? 'Supprimer le compte ?' : 'Se deconnecter ?'}
        message={
          dialog === 'delete'
            ? 'Cette action supprimera le compte apres confirmation cote serveur.'
            : 'Tu pourras te reconnecter ensuite.'
        }
        secondaryLabel="Annuler"
        primaryLabel={dialog === 'delete' ? 'Supprimer' : 'Confirmer'}
        onClose={() => setDialog(null)}
        onPrimary={confirmDialog}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  topRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  profileCard: { alignItems: 'center', borderRadius: 28, borderWidth: 1, gap: 8, padding: 22 },
  avatar: { alignItems: 'center', borderRadius: 42, height: 84, justifyContent: 'center', width: 84 },
  name: { fontFamily: fonts.title, fontSize: 34, fontWeight: '700' },
  meta: { fontFamily: fonts.body, fontSize: 14, fontWeight: '800', lineHeight: 21, textAlign: 'center' },
  themeCard: { borderRadius: 24, borderWidth: 1, gap: 12, padding: 16 },
  themeTitle: { fontFamily: fonts.body, fontSize: 16, fontWeight: '900' },
  row: { alignItems: 'center', borderRadius: 20, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 16 },
  rowText: { flex: 1, fontFamily: fonts.body, fontSize: 16, fontWeight: '800' },
});
