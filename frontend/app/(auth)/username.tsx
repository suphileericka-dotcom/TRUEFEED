import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BrandHeader, ScreenShell, SectionLabel } from '@/components/truefeed/ui';
import { fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';
import { useSession } from '@/hooks/use-session';
import { authApi } from '@/services/api/auth';
import { ApiError } from '@/services/api/client';

function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/^@/, '');
}

export default function UsernameScreen() {
  const { t } = useTranslation();
  const { selectedSeason } = useGlobalSeason();
  const theme = seasonThemes[selectedSeason];
  const { firstName: firstNameParam } = useLocalSearchParams<{ firstName?: string }>();
  const { user, session, signIn } = useSession();
  const firstName = String(firstNameParam || user?.displayName?.split(' ')[0] || '').trim();
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('');

  async function continueOnboarding() {
    if (!user || !session) {
      router.replace('/signup');
      return;
    }

    const cleanUsername = normalizeUsername(username);

    if (cleanUsername && !/^[a-z0-9._]{3,32}$/.test(cleanUsername)) {
      setStatus(t('errors.invalidUsername'));
      return;
    }

    try {
      setStatus(t('status.reservingUsername'));
      const result = await authApi.completeUsername({
        username: cleanUsername || undefined,
        firstName: firstName || user.displayName,
      });

      signIn({
        user: result.user,
        session,
      });
      router.replace('/onboarding');
    } catch (error) {
      if (error instanceof ApiError && error.code === 'username_taken') {
        setStatus(t('errors.usernameTaken'));
        return;
      }

      setStatus(error instanceof ApiError ? error.message : t('errors.usernameFailed'));
    }
  }

  return (
    <ScreenShell theme={theme}>
      <BrandHeader theme={theme} badgeText={t('auth.usernameBadge')} badgeIcon="@" />
      <SectionLabel theme={theme} label={t('auth.uniqueIdentifier')} />

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.iconCircle, { backgroundColor: theme.accentSoft }]}>
          <Ionicons name="at-outline" size={34} color={theme.accentStrong} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>{t('auth.chooseUsername')}</Text>
        <Text style={[styles.copy, { color: theme.muted }]}>{t('auth.usernameHelp')}</Text>

        <View style={[styles.usernameField, { backgroundColor: theme.surfaceAlt }]}>
          <Text style={[styles.atSign, { color: theme.accentStrong }]}>@</Text>
          <TextInput
            autoCapitalize="none"
            onChangeText={(value) => setUsername(normalizeUsername(value))}
            placeholder={firstName ? firstName.toLowerCase() : 'username'}
            placeholderTextColor={theme.muted}
            style={[styles.input, { color: theme.text }]}
            value={username}
          />
        </View>

        <Pressable onPress={continueOnboarding} style={[styles.primary, { backgroundColor: theme.accentStrong }]}>
          <Text style={styles.primaryText}>{t('common.continue')}</Text>
        </Pressable>
        {status ? <Text style={[styles.status, { color: theme.muted }]}>{status}</Text> : null}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'stretch', borderRadius: 28, borderWidth: 1, gap: 16, padding: 20 },
  iconCircle: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 36,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  title: { fontFamily: fonts.title, fontSize: 34, fontWeight: '700', textAlign: 'center' },
  copy: { fontFamily: fonts.body, fontSize: 15, fontWeight: '800', lineHeight: 22, textAlign: 'center' },
  usernameField: {
    alignItems: 'center',
    borderRadius: 18,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 16,
  },
  atSign: { fontFamily: fonts.body, fontSize: 18, fontWeight: '900' },
  input: { flex: 1, fontFamily: fonts.body, fontSize: 16, paddingVertical: 16 },
  primary: { alignItems: 'center', borderRadius: 18, paddingVertical: 16 },
  primaryText: { color: '#FFFFFF', fontFamily: fonts.body, fontSize: 15, fontWeight: '800' },
  status: { fontFamily: fonts.body, fontSize: 14, fontWeight: '800', textAlign: 'center' },
});
