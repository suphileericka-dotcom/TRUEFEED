import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BrandHeader, ScreenShell, SectionLabel } from '@/components/truefeed/ui';
import { fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';
import { useSession } from '@/hooks/use-session';
import { authApi } from '@/services/api/auth';

export default function SignupScreen() {
  const { selectedSeason } = useGlobalSeason();
  const theme = seasonThemes[selectedSeason];
  const { signIn } = useSession();
  const [displayName, setDisplayName] = useState('Suphile NTSIMBA');
  const [username, setUsername] = useState('suphile');
  const [email, setEmail] = useState('nsuphile@gmail.com');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  async function signup() {
    if (password.length < 8) {
      setStatus('Le mot de passe doit contenir au moins 8 caracteres.');
      return;
    }

    try {
      setStatus('Creation du compte...');
      const result = await authApi.register({
        username,
        email,
        password,
        displayName,
      });
      signIn(result);
      router.replace('/onboarding');
    } catch {
      setStatus('Impossible de creer le compte avec ces informations.');
    }
  }

  return (
    <ScreenShell theme={theme}>
      <BrandHeader theme={theme} badgeText="Inscription" badgeIcon="+" />
      <SectionLabel theme={theme} label="Nouveau profil" />

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.avatar, { backgroundColor: theme.accentSoft }]}>
          <Text style={[styles.avatarText, { color: theme.accentStrong }]}>M</Text>
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Creer ton profil</Text>

        <TextInput
          onChangeText={setDisplayName}
          placeholder="Nom affiche"
          placeholderTextColor={theme.muted}
          style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text }]}
          value={displayName}
        />
        <TextInput
          autoCapitalize="none"
          onChangeText={setUsername}
          placeholder="Nom utilisateur"
          placeholderTextColor={theme.muted}
          style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text }]}
          value={username}
        />
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

        <Pressable
          onPress={signup}
          style={[styles.primary, { backgroundColor: theme.accentStrong }]}
        >
          <Text style={styles.primaryText}>Creer le compte</Text>
        </Pressable>
        {status ? <Text style={[styles.status, { color: theme.muted }]}>{status}</Text> : null}
        <Link href="/login">
          <Text style={[styles.linkText, { color: theme.accentStrong }]}>Compte deja cree</Text>
        </Link>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
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
