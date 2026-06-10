import { Ionicons } from '@expo/vector-icons';
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

const passwordMinLength = 8;

export default function SignupScreen() {
  const { t } = useTranslation();
  const { selectedSeason } = useGlobalSeason();
  const theme = seasonThemes[selectedSeason];
  const { signIn } = useSession();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');

  async function signup() {
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanFirstName.length < 2) {
      setStatus(t('errors.firstName'));
      return;
    }

    if (cleanLastName.length < 2) {
      setStatus(t('errors.lastName'));
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
      setStatus(t('status.creatingAccount'));
      const result = await authApi.register({
        firstName: cleanFirstName,
        lastName: cleanLastName,
        email: cleanEmail,
        password,
      });

      signIn(result);
      router.replace({
        pathname: '/(auth)/username' as never,
        params: { firstName: cleanFirstName },
      });
    } catch (error) {
      if (error instanceof ApiError && error.code === 'email_taken') {
        setStatus(t('errors.emailTaken'));
        return;
      }

      setStatus(error instanceof ApiError ? error.message : t('errors.signupFailed'));
    }
  }

  return (
    <ScreenShell theme={theme}>
      <View style={styles.topRow}>
        <Ionicons name="arrow-back" size={22} color={theme.text} onPress={() => router.back()} />
      </View>
      <BrandHeader theme={theme} badgeText={t('auth.signupBadge')} badgeIcon="+" />
      <SectionLabel theme={theme} label={t('auth.newAccount')} />

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.avatar, { backgroundColor: theme.accentSoft }]}>
          <Text style={[styles.avatarText, { color: theme.accentStrong }]}>
            {firstName.trim()[0]?.toUpperCase() || 'M'}
          </Text>
        </View>
        <Text style={[styles.title, { color: theme.text }]}>{t('auth.createYourAccount')}</Text>

        <TextInput
          autoCapitalize="words"
          onChangeText={setFirstName}
          placeholder={t('auth.firstName')}
          placeholderTextColor={theme.muted}
          style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text }]}
          value={firstName}
        />
        <TextInput
          autoCapitalize="words"
          onChangeText={setLastName}
          placeholder={t('auth.lastName')}
          placeholderTextColor={theme.muted}
          style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text }]}
          value={lastName}
        />
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder={t('auth.emailAddress')}
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
        <TextInput
          onChangeText={setConfirmPassword}
          placeholder={t('auth.passwordConfirmation')}
          placeholderTextColor={theme.muted}
          secureTextEntry
          style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text }]}
          value={confirmPassword}
        />

        <Pressable onPress={signup} style={[styles.primary, { backgroundColor: theme.accentStrong }]}>
          <Text style={styles.primaryText}>{t('auth.createAccount')}</Text>
        </Pressable>
        {status ? <Text style={[styles.status, { color: theme.muted }]}>{status}</Text> : null}
        <Link href="/login">
          <Text style={[styles.linkText, { color: theme.accentStrong }]}>{t('auth.accountAlreadyCreated')}</Text>
        </Link>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  topRow: { alignItems: 'center', flexDirection: 'row' },
  card: { alignItems: 'stretch', borderRadius: 28, borderWidth: 1, gap: 14, padding: 20 },
  avatar: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 36,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  avatarText: { fontFamily: fonts.title, fontSize: 34, fontWeight: '700' },
  title: { fontFamily: fonts.title, fontSize: 34, fontWeight: '700', textAlign: 'center' },
  input: { borderRadius: 18, fontFamily: fonts.body, fontSize: 16, padding: 16 },
  primary: { alignItems: 'center', borderRadius: 18, paddingVertical: 16 },
  primaryText: { color: '#FFFFFF', fontFamily: fonts.body, fontSize: 15, fontWeight: '800' },
  linkText: { fontFamily: fonts.body, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  status: { fontFamily: fonts.body, fontSize: 14, fontWeight: '800', textAlign: 'center' },
});
