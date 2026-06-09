import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BrandHeader, ScreenShell, SectionLabel } from '@/components/truefeed/ui';
import { fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';
import { useSession } from '@/hooks/use-session';
import { authApi } from '@/services/api/auth';
import { ApiError } from '@/services/api/client';

const passwordMinLength = 8;

export default function SignupScreen() {
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
      setStatus('Ajoute ton prenom.');
      return;
    }

    if (cleanLastName.length < 2) {
      setStatus('Ajoute ton nom.');
      return;
    }

    if (password.length < passwordMinLength) {
      setStatus(`Le mot de passe doit contenir au moins ${passwordMinLength} caracteres.`);
      return;
    }

    if (password !== confirmPassword) {
      setStatus('Les deux mots de passe ne correspondent pas.');
      return;
    }

    try {
      setStatus('Creation du compte...');
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
        setStatus('Cet email a deja un compte. Connecte-toi ou utilise un autre email.');
        return;
      }

      setStatus(error instanceof ApiError ? error.message : 'Impossible de creer le compte avec ces informations.');
    }
  }

  return (
    <ScreenShell theme={theme}>
      <View style={styles.topRow}>
        <Ionicons name="arrow-back" size={22} color={theme.text} onPress={() => router.back()} />
      </View>
      <BrandHeader theme={theme} badgeText="Inscription" badgeIcon="+" />
      <SectionLabel theme={theme} label="Nouveau compte" />

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.avatar, { backgroundColor: theme.accentSoft }]}>
          <Text style={[styles.avatarText, { color: theme.accentStrong }]}>
            {firstName.trim()[0]?.toUpperCase() || 'M'}
          </Text>
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Creer ton compte</Text>

        <TextInput
          autoCapitalize="words"
          onChangeText={setFirstName}
          placeholder="Prenom"
          placeholderTextColor={theme.muted}
          style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text }]}
          value={firstName}
        />
        <TextInput
          autoCapitalize="words"
          onChangeText={setLastName}
          placeholder="Nom"
          placeholderTextColor={theme.muted}
          style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text }]}
          value={lastName}
        />
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="Adresse email"
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
        <TextInput
          onChangeText={setConfirmPassword}
          placeholder="Confirmation du mot de passe"
          placeholderTextColor={theme.muted}
          secureTextEntry
          style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text }]}
          value={confirmPassword}
        />

        <Pressable onPress={signup} style={[styles.primary, { backgroundColor: theme.accentStrong }]}>
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
