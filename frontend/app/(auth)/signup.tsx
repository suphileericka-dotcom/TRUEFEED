import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BrandHeader, ScreenShell, SectionLabel } from '@/components/truefeed/ui';
import { fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';
import { useSession } from '@/hooks/use-session';
import { authApi } from '@/services/api/auth';
import { ApiError } from '@/services/api/client';

export default function SignupScreen() {
  const { selectedSeason } = useGlobalSeason();
  const theme = seasonThemes[selectedSeason];
  const { signIn } = useSession();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingAuth, setPendingAuth] = useState<Awaited<ReturnType<typeof authApi.register>> | null>(null);
  const [status, setStatus] = useState('');

  async function signup() {
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanDisplayName = displayName.trim();

    if (cleanDisplayName.length < 2) {
      setStatus('Ajoute le nom que tu veux afficher sur ton profil.');
      return;
    }

    if (!/^[a-z0-9._]{3,32}$/.test(cleanUsername)) {
      setStatus('Choisis un nom utilisateur de 3 a 32 caracteres: lettres, chiffres, point ou tiret bas.');
      return;
    }

    if (password.length < 8) {
      setStatus('Le mot de passe doit contenir au moins 8 caracteres.');
      return;
    }

    try {
      setStatus('Creation du compte...');
      const result = await authApi.register({
        username: cleanUsername,
        email: cleanEmail,
        password,
        displayName: cleanDisplayName,
      });
      setPendingAuth(result);
      setStatus('Un code a ete envoye par email. Entre-le pour finaliser ton compte.');
    } catch (error) {
      if (error instanceof ApiError && error.code === 'username_taken') {
        setStatus('Ce nom utilisateur est deja pris. Choisis un autre nom.');
        return;
      }

      if (error instanceof ApiError && error.code === 'email_taken') {
        setStatus('Cet email a deja un compte. Connecte-toi ou utilise un autre email.');
        return;
      }

      setStatus(error instanceof ApiError ? error.message : 'Impossible de creer le compte avec ces informations.');
    }
  }

  async function verifyCode() {
    if (!pendingAuth) {
      return;
    }

    try {
      setStatus('Verification du code...');
      await authApi.verifyEmail({
        email: pendingAuth.user.email,
        code: verificationCode.trim(),
      });
      signIn(pendingAuth);
      router.replace('/onboarding');
    } catch {
      setStatus('Code invalide ou expire. Verifie ton email et reessaie.');
    }
  }

  return (
    <ScreenShell theme={theme}>
      <View style={styles.topRow}>
        <Ionicons name="arrow-back" size={22} color={theme.text} onPress={() => router.back()} />
      </View>
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

        {pendingAuth ? (
          <TextInput
            keyboardType="number-pad"
            onChangeText={setVerificationCode}
            placeholder="Code email"
            placeholderTextColor={theme.muted}
            style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text }]}
            value={verificationCode}
          />
        ) : null}

        <Pressable
          onPress={pendingAuth ? verifyCode : signup}
          style={[styles.primary, { backgroundColor: theme.accentStrong }]}
        >
          <Text style={styles.primaryText}>{pendingAuth ? 'Valider le code' : 'Creer le compte'}</Text>
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
