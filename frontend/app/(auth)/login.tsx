import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BrandHeader, ScreenShell, SectionLabel } from '@/components/truefeed/ui';
import { fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';
import { useSession } from '@/hooks/use-session';
import { authApi } from '@/services/api/auth';
import { ApiError } from '@/services/api/client';

export default function LoginScreen() {
  const { selectedSeason } = useGlobalSeason();
  const theme = seasonThemes[selectedSeason];
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  async function login() {
    try {
      setStatus('Connexion...');
      const result = await authApi.login({ email: email.trim().toLowerCase(), password });
      signIn(result);
      router.replace('/(tabs)');
    } catch (error) {
      setStatus(error instanceof ApiError ? error.message : 'Email ou mot de passe incorrect.');
    }
  }

  return (
    <ScreenShell theme={theme}>
      <BrandHeader theme={theme} badgeText="Connexion" badgeIcon={theme.emoji} />
      <SectionLabel theme={theme} label="Compte TRUEFEED" />

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Bon retour</Text>
        <Text style={[styles.copy, { color: theme.muted }]}>
          Connecte-toi pour publier, commenter et retrouver tes espaces.
        </Text>

        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={theme.muted}
          style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text }]}
          value={email}
        />
        <TextInput
          onChangeText={setPassword}
          placeholder="Mot de passe"
          placeholderTextColor={theme.muted}
          secureTextEntry
          style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text }]}
          value={password}
        />
        <Link href="/forgot">
          <Text style={[styles.forgotLink, { color: theme.accentStrong }]}>
            Mot de passe oublie ?
          </Text>
        </Link>

        <Pressable
          onPress={login}
          style={[styles.primary, { backgroundColor: theme.accentStrong }]}
        >
          <Text style={styles.primaryText}>Se connecter</Text>
        </Pressable>

        {status ? <Text style={[styles.status, { color: theme.muted }]}>{status}</Text> : null}

        <View style={styles.links}>
          <Link href="/signup">
            <Text style={[styles.linkText, { color: theme.accentStrong }]}>Creer un compte</Text>
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
