import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenShell } from '@/components/truefeed/ui';
import { fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';

const steps = [
  {
    icon: 'home-outline' as const,
    title: 'Feed',
    body: 'Decouvre les posts, like, commente et partage les contenus utiles.',
  },
  {
    icon: 'add-circle-outline' as const,
    title: 'Publier',
    body: 'Cree un post avec texte, tags, lieu, media et modules selon ton besoin.',
  },
  {
    icon: 'map-outline' as const,
    title: 'Explore',
    body: 'Recherche un lieu, active le GPS et ouvre les suggestions sur la carte.',
  },
  {
    icon: 'chatbubbles-outline' as const,
    title: 'TrueDebate',
    body: 'Vote Pour ou Contre, suis tes votes et reponds aux threads.',
  },
];

export default function OnboardingScreen() {
  const { selectedSeason } = useGlobalSeason();
  const theme = seasonThemes[selectedSeason];
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const isLast = index === steps.length - 1;

  function next() {
    if (isLast) {
      router.replace('/(tabs)');
      return;
    }

    setIndex((current) => current + 1);
  }

  return (
    <ScreenShell theme={theme} contentContainerStyle={styles.content}>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.icon, { backgroundColor: theme.accentSoft }]}>
          <Ionicons name={step.icon} size={42} color={theme.accentStrong} />
        </View>
        <Text style={[styles.kicker, { color: theme.muted }]}>
          Etape {index + 1} / {steps.length}
        </Text>
        <Text style={[styles.title, { color: theme.text }]}>{step.title}</Text>
        <Text style={[styles.body, { color: theme.muted }]}>{step.body}</Text>
        <Pressable onPress={next} style={[styles.button, { backgroundColor: theme.accentStrong }]}>
          <Text style={styles.buttonText}>{isLast ? 'Terminer' : 'Suivant'}</Text>
        </Pressable>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center' },
  card: { alignItems: 'center', borderRadius: 30, borderWidth: 1, gap: 14, padding: 24 },
  icon: { alignItems: 'center', borderRadius: 42, height: 84, justifyContent: 'center', width: 84 },
  kicker: { fontFamily: fonts.body, fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
  title: { fontFamily: fonts.title, fontSize: 42, fontWeight: '700', textAlign: 'center' },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 25, textAlign: 'center' },
  button: { alignItems: 'center', borderRadius: 18, marginTop: 8, paddingVertical: 16, width: '100%' },
  buttonText: { color: '#FFFFFF', fontFamily: fonts.body, fontSize: 15, fontWeight: '900' },
});
