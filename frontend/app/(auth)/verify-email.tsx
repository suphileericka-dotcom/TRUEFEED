import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandHeader, ScreenShell, SectionLabel } from '@/components/truefeed/ui';
import { fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';
import { useSession } from '@/hooks/use-session';
import { authApi } from '@/services/api/auth';

export default function VerifyEmailScreen() {
  const { selectedSeason } = useGlobalSeason();
  const theme = seasonThemes[selectedSeason];
  const { token } = useLocalSearchParams<{ token?: string }>();
  const { updateUser } = useSession();
  const [status, setStatus] = useState('Verification en cours...');
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('Lien de confirmation invalide.');
      return;
    }

    authApi
      .verifyEmail({ token: String(token) })
      .then((response) => {
        if (response.user) {
          updateUser(response.user);
        }

        setVerified(true);
        setStatus('Adresse email confirmee.');
      })
      .catch(() => setStatus('Lien expire ou deja utilise.'));
  }, [token, updateUser]);

  return (
    <ScreenShell theme={theme}>
      <BrandHeader theme={theme} badgeText="Email" badgeIcon="✓" />
      <SectionLabel theme={theme} label="Confirmation" />
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.iconCircle, { backgroundColor: theme.accentSoft }]}>
          <Ionicons
            name={verified ? 'checkmark-circle-outline' : 'mail-outline'}
            size={36}
            color={theme.accentStrong}
          />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Confirmation email</Text>
        <Text style={[styles.copy, { color: theme.muted }]}>{status}</Text>
        <Pressable onPress={() => router.replace('/(tabs)')} style={[styles.primary, { backgroundColor: theme.accentStrong }]}>
          <Text style={styles.primaryText}>Retour a l application</Text>
        </Pressable>
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
  primary: { alignItems: 'center', borderRadius: 18, paddingVertical: 16 },
  primaryText: { color: '#FFFFFF', fontFamily: fonts.body, fontSize: 15, fontWeight: '800' },
});
