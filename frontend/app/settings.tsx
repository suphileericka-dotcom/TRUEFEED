import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenShell, SeasonSwitcher, SectionLabel, TruefeedModal } from '@/components/truefeed/ui';
import { fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';
import { useLanguage } from '@/hooks/use-language';
import { useSession } from '@/hooks/use-session';
import { authApi } from '@/services/api/auth';
import { ApiError } from '@/services/api/client';

type Dialog = 'logout' | 'delete' | null;

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { selectedSeason, setSelectedSeason } = useGlobalSeason();
  const { language, setLanguage } = useLanguage();
  const theme = seasonThemes[selectedSeason];
  const { isAuthenticated, hasKnownAccount, isAdmin, signOut, deleteAccount } = useSession();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityStatus, setSecurityStatus] = useState('');
  const socialStats = {
    followers: 128,
    following: 64,
  };

  const rows = isAuthenticated
    ? [
        ...(isAdmin
          ? [{ icon: 'shield-checkmark-outline' as const, title: t('settings.admin'), onPress: () => router.push('/admin') }]
          : []),
        { icon: 'log-out-outline' as const, title: t('settings.logout'), onPress: () => setDialog('logout') },
        { icon: 'trash-outline' as const, title: t('settings.deleteAccount'), onPress: () => setDialog('delete') },
      ]
    : [
        { icon: 'log-in-outline' as const, title: t('settings.login'), onPress: () => router.push('/login') },
        ...(!hasKnownAccount
          ? [
              {
                icon: 'person-add-outline' as const,
                title: t('auth.createAccount'),
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
      setSecurityStatus(t('errors.passwordMin', { count: 8 }));
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityStatus(t('errors.passwordMismatch'));
      return;
    }

    try {
      setSecurityStatus(t('common.loading'));
      await authApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSecurityStatus(t('status.passwordChanged'));
    } catch (error) {
      if (error instanceof ApiError && error.code === 'invalid_current_password') {
        setSecurityStatus(t('errors.currentPassword'));
        return;
      }

      setSecurityStatus(error instanceof ApiError ? error.message : 'Impossible de modifier le mot de passe.');
    }
  }

  return (
    <ScreenShell theme={theme}>
      <View style={styles.topRow}>
        <Ionicons name="arrow-back" size={22} color={theme.text} onPress={() => router.back()} />
        <SectionLabel theme={theme} label={t('settings.profileSettings')} />
      </View>

      <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.avatar, { backgroundColor: theme.accentSoft }]}>
          <Ionicons name="person" size={34} color={theme.accentStrong} />
        </View>
        <Text style={[styles.name, { color: theme.text }]}>{t('settings.account')}</Text>
        <Text style={[styles.meta, { color: theme.muted }]}>
          {isAuthenticated ? t('settings.connected') : t('settings.disconnected')}
        </Text>
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: theme.surfaceAlt }]}>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {socialStats.followers.toLocaleString('fr-FR')}
            </Text>
            <Text style={[styles.statLabel, { color: theme.muted }]}>Followers</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.surfaceAlt }]}>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {socialStats.following.toLocaleString('fr-FR')}
            </Text>
            <Text style={[styles.statLabel, { color: theme.muted }]}>Suivis</Text>
          </View>
        </View>
      </View>

      <View style={[styles.themeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.themeTitle, { color: theme.text }]}>{t('settings.theme')}</Text>
        <SeasonSwitcher selectedSeason={selectedSeason} onSelect={setSelectedSeason} />
      </View>

      <View style={[styles.themeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.themeTitle, { color: theme.text }]}>{t('settings.language')}</Text>
        <View style={styles.languageRow}>
          <Pressable
            onPress={() => setLanguage('fr')}
            style={[
              styles.languageButton,
              { backgroundColor: language === 'fr' ? theme.accentStrong : theme.surfaceAlt },
            ]}
          >
            <Text style={[styles.languageText, { color: language === 'fr' ? '#FFFFFF' : theme.text }]}>
              {t('settings.french')}
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
              {t('settings.english')}
            </Text>
          </Pressable>
        </View>
      </View>

      {isAuthenticated ? (
        <View style={[styles.themeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.themeTitle, { color: theme.text }]}>{t('settings.security')}</Text>
          <TextInput
            onChangeText={setCurrentPassword}
            placeholder={t('settings.currentPassword')}
            placeholderTextColor={theme.muted}
            secureTextEntry
            style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text }]}
            value={currentPassword}
          />
          <TextInput
            onChangeText={setNewPassword}
            placeholder={t('common.newPassword')}
            placeholderTextColor={theme.muted}
            secureTextEntry
            style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text }]}
            value={newPassword}
          />
          <TextInput
            onChangeText={setConfirmPassword}
            placeholder={t('settings.confirmNewPassword')}
            placeholderTextColor={theme.muted}
            secureTextEntry
            style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text }]}
            value={confirmPassword}
          />
          <Pressable onPress={changePassword} style={[styles.primary, { backgroundColor: theme.accentStrong }]}>
            <Text style={styles.primaryText}>{t('auth.changePassword')}</Text>
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
        title={dialog === 'delete' ? t('settings.deleteAccount') : t('settings.logout')}
        message={
          dialog === 'delete'
            ? 'Cette action supprimera le compte apres confirmation cote serveur.'
            : 'Tu pourras te reconnecter ensuite.'
        }
        secondaryLabel={t('common.cancel')}
        primaryLabel={dialog === 'delete' ? t('common.delete') : t('common.confirm')}
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
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 10, width: '100%' },
  statBox: { alignItems: 'center', borderRadius: 18, flex: 1, gap: 4, padding: 12 },
  statValue: { fontFamily: fonts.title, fontSize: 26, fontWeight: '700' },
  statLabel: { fontFamily: fonts.body, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
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
