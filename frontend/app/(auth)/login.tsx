// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BrandHeader, ScreenShell, SectionLabel } from '@/components/truefeed/ui';
import { fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';
import { useSession } from '@/hooks/use-session';
import { authApi } from '@/services/api/auth';
import { ApiError } from '@/services/api/client';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { selectedSeason } = useGlobalSeason();
  const theme = seasonThemes[selectedSeason];
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  async function login() {
    try {
      setStatus(t('common.loading'));
      const result = await authApi.login({ email: email.trim().toLowerCase(), password });
      signIn(result);
      router.replace('/(tabs)');
    } catch (error) {
      setStatus(error instanceof ApiError ? error.message : t('common.error'));
    }
  }

  return (
    <ScreenShell theme={theme}>
      <BrandHeader theme={theme} badgeText={t('auth.loginBadge')} badgeIcon={theme.emoji} />
      <SectionLabel theme={theme} label={t('auth.accountLabel')} />

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>{t('auth.welcomeBack')}</Text>
        <Text style={[styles.copy, { color: theme.muted }]}>
          {t('auth.loginCopy')}
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
        <TextInput
          onChangeText={setPassword}
          placeholder={t('common.password')}
          placeholderTextColor={theme.muted}
          secureTextEntry
          style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text }]}
          value={password}
        />
        <Link href="/forgot">
          <Text style={[styles.forgotLink, { color: theme.accentStrong }]}>
            {t('auth.forgotPassword')}
          </Text>
        </Link>

        <Pressable
          onPress={login}
          style={[styles.primary, { backgroundColor: theme.accentStrong }]}
        >
          <Text style={styles.primaryText}>{t('auth.login')}</Text>
        </Pressable>

        {status ? <Text style={[styles.status, { color: theme.muted }]}>{status}</Text> : null}

        <View style={styles.links}>
          <Link href="/signup">
            <Text style={[styles.linkText, { color: theme.accentStrong }]}>{t('auth.createAccount')}</Text>
          </Link>
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 28, borderWidth: 1, gap: 14, padding: 20 },
  title: { fontFamily: fonts.title, fontSize: 36, fontWeight: '700' },
  copy: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23 },
  input: { borderRadius: 18, fontFamily: fonts.body, fontSize: 16, padding: 16 },
  primary: { alignItems: 'center', borderRadius: 18, paddingVertical: 16 },
  primaryText: { color: '#FFFFFF', fontFamily: fonts.body, fontSize: 15, fontWeight: '800' },
  links: { alignItems: 'center' },
  forgotLink: { fontFamily: fonts.body, fontSize: 14, fontWeight: '800', textAlign: 'right' },
  linkText: { fontFamily: fonts.body, fontSize: 14, fontWeight: '800' },
  status: { fontFamily: fonts.body, fontSize: 14, fontWeight: '800', textAlign: 'center' },
});
