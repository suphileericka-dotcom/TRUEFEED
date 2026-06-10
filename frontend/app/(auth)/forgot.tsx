import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BrandHeader, ScreenShell, SectionLabel } from '@/components/truefeed/ui';
import { fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';
import { authApi } from '@/services/api/auth';

export default function ForgotScreen() {
  const { t } = useTranslation();
  const { selectedSeason } = useGlobalSeason();
  const theme = seasonThemes[selectedSeason];
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  async function sendResetLink() {
    try {
      setStatus(t('status.sendingLink'));
      await authApi.forgotPassword({ email: email.trim().toLowerCase() });
      setStatus(t('status.resetSent'));
    } catch {
      setStatus(t('common.error'));
    }
  }

  return (
    <ScreenShell theme={theme}>
      <BrandHeader theme={theme} badgeText={t('auth.forgotBadge')} badgeIcon="?" />
      <SectionLabel theme={theme} label={t('auth.securityAccount')} />
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>{t('auth.recoverAccess')}</Text>
        <Text style={[styles.copy, { color: theme.muted }]}>
          {t('auth.forgotCopy')}
        </Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder={t('common.email')}
          placeholderTextColor={theme.muted}
          style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text }]}
          value={email}
        />
        <Pressable onPress={sendResetLink} style={[styles.primary, { backgroundColor: theme.accentStrong }]}>
          <Text style={styles.primaryText}>{t('common.sendLink')}</Text>
        </Pressable>
        {status ? <Text style={[styles.status, { color: theme.muted }]}>{status}</Text> : null}
        <Link href="/login">
          <Text style={[styles.linkText, { color: theme.accentStrong }]}>{t('auth.backToLogin')}</Text>
        </Link>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 28, borderWidth: 1, gap: 14, padding: 20 },
  title: { fontFamily: fonts.title, fontSize: 34, fontWeight: '700' },
  copy: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23 },
  input: { borderRadius: 18, fontFamily: fonts.body, fontSize: 16, padding: 16 },
  primary: { alignItems: 'center', borderRadius: 18, paddingVertical: 16 },
  primaryText: { color: '#FFFFFF', fontFamily: fonts.body, fontSize: 15, fontWeight: '800' },
  linkText: { fontFamily: fonts.body, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  status: { fontFamily: fonts.body, fontSize: 14, fontWeight: '800', textAlign: 'center' },
});
