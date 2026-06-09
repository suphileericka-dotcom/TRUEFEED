import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenShell, SeasonSwitcher, SectionLabel, TruefeedModal } from '@/components/truefeed/ui';
import { fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';
import { useLanguage } from '@/hooks/use-language';
import { useSession } from '@/hooks/use-session';
import { authApi } from '@/services/api/auth';
import { ApiError } from '@/services/api/client';

type Dialog = 'logout' | 'delete' | null;

export default function SettingsScreen() {
  const { selectedSeason, setSelectedSeason } = useGlobalSeason();
  const { language, setLanguage } = useLanguage();
  const theme = seasonThemes[selectedSeason];
  const { isAuthenticated, hasKnownAccount, isAdmin, signOut, deleteAccount } = useSession();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityStatus, setSecurityStatus] = useState('');

  const rows = isAuthenticated
    ? [
        ...(isAdmin
          ? [{ icon: 'shield-checkmark-outline' as const, title: 'Admin', onPress: () => router.push('/admin') }]
          : []),
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

  async function changePassword() {
    if (newPassword.length < 8) {
      setSecurityStatus('Le nouveau mot de passe doit contenir au moins 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityStatus('Les deux nouveaux mots de passe ne correspondent pas.');
      return;
    }

    try {
      setSecurityStatus('Modification...');
      await authApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSecurityStatus('Mot de passe modifie. Un email de confirmation a ete envoye.');
    } catch (error) {
      if (error instanceof ApiError && error.code === 'invalid_current_password') {
        setSecurityStatus('Mot de passe actuel incorrect.');
        return;
      }

      setSecurityStatus(error instanceof ApiError ? error.message : 'Impossible de modifier le mot de passe.');
    }
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

      <View style={[styles.themeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.themeTitle, { color: theme.text }]}>Langue</Text>
        <View style={styles.languageRow}>
          <Pressable
            onPress={() => setLanguage('fr')}
            style={[
              styles.languageButton,
              { backgroundColor: language === 'fr' ? theme.accentStrong : theme.surfaceAlt },
            ]}
          >
            <Text style={[styles.languageText, { color: language === 'fr' ? '#FFFFFF' : theme.text }]}>
              Francais
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setLanguage('en')}
            style={[
              styles.languageButton,
              { backgroundColor: language === 'en' ? theme.accentStrong : theme.surfaceAlt },
            ]}
          >
            <Text style={[styles.languageText, { color: language === 'en' ? '#FFFFFF' : theme.text }]}>
              English
            </Text>
          </Pressable>
        </View>
      </View>

      {isAuthenticated ? (
        <View style={[styles.themeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.themeTitle, { color: theme.text }]}>Securite</Text>
          <TextInput
            onChangeText={setCurrentPassword}
            placeholder="Mot de passe actuel"
            placeholderTextColor={theme.muted}
            secureTextEntry
            style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text }]}
            value={currentPassword}
          />
          <TextInput
            onChangeText={setNewPassword}
            placeholder="Nouveau mot de passe"
            placeholderTextColor={theme.muted}
            secureTextEntry
            style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text }]}
            value={newPassword}
          />
          <TextInput
            onChangeText={setConfirmPassword}
            placeholder="Confirmer le nouveau mot de passe"
            placeholderTextColor={theme.muted}
            secureTextEntry
            style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text }]}
            value={confirmPassword}
          />
          <Pressable onPress={changePassword} style={[styles.primary, { backgroundColor: theme.accentStrong }]}>
            <Text style={styles.primaryText}>Modifier le mot de passe</Text>
          </Pressable>
          {securityStatus ? (
            <Text style={[styles.statusText, { color: theme.muted }]}>{securityStatus}</Text>
          ) : null}
        </View>
      ) : null}

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
  languageRow: { flexDirection: 'row', gap: 10 },
  languageButton: { alignItems: 'center', borderRadius: 16, flex: 1, paddingVertical: 13 },
  languageText: { fontFamily: fonts.body, fontSize: 14, fontWeight: '900' },
  input: { borderRadius: 16, fontFamily: fonts.body, fontSize: 15, padding: 14 },
  primary: { alignItems: 'center', borderRadius: 16, paddingVertical: 14 },
  primaryText: { color: '#FFFFFF', fontFamily: fonts.body, fontSize: 14, fontWeight: '900' },
  statusText: { fontFamily: fonts.body, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  row: { alignItems: 'center', borderRadius: 20, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 16 },
  rowText: { flex: 1, fontFamily: fonts.body, fontSize: 16, fontWeight: '800' },
});
