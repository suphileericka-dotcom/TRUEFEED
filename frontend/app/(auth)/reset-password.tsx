// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BrandHeader, ScreenShell, SectionLabel } from '@/components/truefeed/ui';
import { fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';
import { authApi } from '@/services/api/auth';
import { ApiError } from '@/services/api/client';

const passwordMinLength = 8;

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const { selectedSeason } = useGlobalSeason();
  const theme = seasonThemes[selectedSeason];
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');

  async function resetPassword() {
    if (!token) {
      setStatus(t('errors.invalidResetLink'));
      return;
    }

    if (password.length < passwordMinLength) {
      setStatus(t('errors.passwordMin', { count: passwordMinLength }));
      return;
    }

    if (password !== confirmPassword) {
      setStatus(t('errors.passwordMismatch'));
      return;
    }

    try {
      setStatus(t('status.changingPassword'));
      await authApi.resetPassword({ token: String(token), password });
      router.replace('/login');
    } catch (error) {
      setStatus(error instanceof ApiError ? error.message : t('errors.expiredResetLink'));
    }
  }

  return (
    <ScreenShell theme={theme}>
      <BrandHeader theme={theme} badgeText={t('auth.resetBadge')} badgeIcon="*" />
      <SectionLabel theme={theme} label={t('auth.resetLabel')} />
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>{t('auth.resetTitle')}</Text>
        <TextInput
          onChangeText={setPassword}
          placeholder={t('common.newPassword')}
          placeholderTextColor={theme.muted}
          secureTextEntry
          style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text }]}
          value={password}
        />
        <TextInput
          onChangeText={setConfirmPassword}
          placeholder={t('settings.confirmNewPassword')}
          placeholderTextColor={theme.muted}
          secureTextEntry
          style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text }]}
          value={confirmPassword}
        />
        <Pressable onPress={resetPassword} style={[styles.primary, { backgroundColor: theme.accentStrong }]}>
          <Text style={styles.primaryText}>{t('auth.changePassword')}</Text>
        </Pressable>
        {status ? <Text style={[styles.status, { color: theme.muted }]}>{status}</Text> : null}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 28, borderWidth: 1, gap: 14, padding: 20 },
  title: { fontFamily: fonts.title, fontSize: 34, fontWeight: '700' },
  input: { borderRadius: 18, fontFamily: fonts.body, fontSize: 16, padding: 16 },
  primary: { alignItems: 'center', borderRadius: 18, paddingVertical: 16 },
  primaryText: { color: '#FFFFFF', fontFamily: fonts.body, fontSize: 15, fontWeight: '800' },
  status: { fontFamily: fonts.body, fontSize: 14, fontWeight: '800', textAlign: 'center' },
});
