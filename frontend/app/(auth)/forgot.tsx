import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BrandHeader, ScreenShell, SectionLabel } from '@/components/truefeed/ui';
import { fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';
import { authApi } from '@/services/api/auth';

export default function ForgotScreen() {
  const { selectedSeason } = useGlobalSeason();
  const theme = seasonThemes[selectedSeason];
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  async function sendResetLink() {
    try {
      setStatus('Envoi du lien...');
      await authApi.forgotPassword({ email: email.trim().toLowerCase() });
      setStatus('Si un compte existe avec cet email, un lien vient d etre envoye.');
    } catch {
      setStatus('Impossible d envoyer le lien pour le moment.');
    }
  }

  return (
    <ScreenShell theme={theme}>
      <BrandHeader theme={theme} badgeText="Recuperation" badgeIcon="?" />
      <SectionLabel theme={theme} label="Securite compte" />
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Retrouver acces</Text>
        <Text style={[styles.copy, { color: theme.muted }]}>
          Entre ton email et TRUEFEED preparera le parcours de reinitialisation.
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
        <Pressable onPress={sendResetLink} style={[styles.primary, { backgroundColor: theme.accentStrong }]}>
          <Text style={styles.primaryText}>Envoyer le lien</Text>
        </Pressable>
        {status ? <Text style={[styles.status, { color: theme.muted }]}>{status}</Text> : null}
        <Link href="/login">
          <Text style={[styles.linkText, { color: theme.accentStrong }]}>Retour connexion</Text>
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
