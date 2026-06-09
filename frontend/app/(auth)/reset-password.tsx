import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BrandHeader, ScreenShell, SectionLabel } from '@/components/truefeed/ui';
import { fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';
import { authApi } from '@/services/api/auth';
import { ApiError } from '@/services/api/client';

const passwordMinLength = 8;

export default function ResetPasswordScreen() {
  const { selectedSeason } = useGlobalSeason();
  const theme = seasonThemes[selectedSeason];
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');

  async function resetPassword() {
    if (!token) {
      setStatus('Lien de reinitialisation invalide.');
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
      setStatus('Modification du mot de passe...');
      await authApi.resetPassword({ token: String(token), password });
      router.replace('/login');
    } catch (error) {
      setStatus(error instanceof ApiError ? error.message : 'Lien expire ou invalide.');
    }
  }

  return (
    <ScreenShell theme={theme}>
      <BrandHeader theme={theme} badgeText="Securite" badgeIcon="*" />
      <SectionLabel theme={theme} label="Nouveau mot de passe" />
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Reinitialiser</Text>
        <TextInput
          onChangeText={setPassword}
          placeholder="Nouveau mot de passe"
          placeholderTextColor={theme.muted}
          secureTextEntry
          style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text }]}
          value={password}
        />
        <TextInput
          onChangeText={setConfirmPassword}
          placeholder="Confirmer le nouveau mot de passe"
          placeholderTextColor={theme.muted}
          secureTextEntry
          style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text }]}
          value={confirmPassword}
        />
        <Pressable onPress={resetPassword} style={[styles.primary, { backgroundColor: theme.accentStrong }]}>
          <Text style={styles.primaryText}>Modifier le mot de passe</Text>
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
