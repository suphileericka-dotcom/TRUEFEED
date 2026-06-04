import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenShell, TruefeedModal } from '@/components/truefeed/ui';
import { fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';
import { useSession } from '@/hooks/use-session';
import { goodTipsApi } from '@/services/api/good-tips';

const badgeMilestones = [5, 10, 15, 20, 25, 30, 33, 35, 50, 75];
const badgeColors = ['#F59E0B', '#06B6D4', '#8B5CF6', '#EF4444', '#10B981', '#F97316', '#3B82F6', '#EC4899', '#14B8A6', '#111827'];
const badgeIcons = ['ribbon', 'star', 'trophy', 'sparkles', 'shield-checkmark', 'heart', 'flame', 'rocket', 'planet', 'diamond'] as const;

const gifts = [
  { unlockAt: 2, name: 'Confettis', stock: 3, icon: 'sparkles' as const, color: '#F59E0B', detail: "Confettis sur l'ecran d'une personne." },
  { unlockAt: 4, name: 'Emoji Geant', stock: 5, icon: 'happy-outline' as const, color: '#8B5CF6', detail: "Emoji plein ecran chez le destinataire." },
  { unlockAt: 6, name: 'Applaudissements', stock: 3, icon: 'heart-outline' as const, color: '#EF4444', detail: "Animation d'applaudissements sur un post." },
  { unlockAt: 8, name: 'Meteo Mood', stock: 2, icon: 'cloud-outline' as const, color: '#0EA5E9', detail: 'Meteo animee selon ton humeur.' },
  { unlockAt: 11, name: 'Surnom Secret', stock: 2, icon: 'pricetag-outline' as const, color: '#EC4899', detail: 'Surnom visible entre deux personnes.' },
  { unlockAt: 13, name: 'Fausse Alerte', stock: 1, icon: 'notifications-outline' as const, color: '#F97316', detail: 'Notification rigolote a un ami.' },
  { unlockAt: 16, name: 'Relance Fantome', stock: 2, icon: 'chatbubble-ellipses-outline' as const, color: '#6366F1', detail: "Renvoie un message discretement." },
  { unlockAt: 18, name: 'Grimace Party', stock: 1, icon: 'people-outline' as const, color: '#84CC16', detail: 'Emoji souriant pendant 3 secondes.' },
  { unlockAt: 22, name: 'Boost Visibilite', stock: 2, icon: 'trending-up-outline' as const, color: '#22C55E', detail: 'Post en tete du feed pendant 24h.' },
  { unlockAt: 24, name: 'Archiviste', stock: 3, icon: 'bookmark-outline' as const, color: '#64748B', detail: 'Sauvegarde un post dans ta collection.' },
  { unlockAt: 25, name: 'Mystique Charme', stock: 2, icon: 'mail-outline' as const, color: '#D946EF', detail: "Message a quelqu'un qui ne te suit pas." },
  { unlockAt: 27, name: 'Time Capsule', stock: 1, icon: 'time-outline' as const, color: '#06B6D4', detail: 'Message programme dans 7 jours.' },
  { unlockAt: 29, name: 'Mode Fantome', stock: 1, icon: 'eye-off-outline' as const, color: '#111827', detail: 'Invisible dans vu recemment pendant 1h.' },
  { unlockAt: 31, name: 'Traducteur Universel', stock: 1, icon: 'language-outline' as const, color: '#14B8A6', detail: 'Traduit une conversation en 1 clic.' },
  { unlockAt: 34, name: 'Recap Magique', stock: 1, icon: 'reader-outline' as const, color: '#A855F7', detail: 'Resume rigolo de ton activite.' },
];

const initialPlans = [
  { place: 'Fushimi Inari', budget: '0 EUR', transport: 'Train', rating: 9.8, author: 'nora.nomad' },
  { place: 'Nishiki Market', budget: '15 EUR', transport: 'Metro', rating: 9.5, author: 'maya_explores' },
  { place: 'Montmartre', budget: '8 EUR', transport: 'Metro', rating: 9.4, author: 'lucas.trips' },
];

export default function BonPlanScreen() {
  const { selectedSeason } = useGlobalSeason();
  const { isAuthenticated } = useSession();
  const theme = seasonThemes[selectedSeason];
  const [plans, setPlans] = useState(initialPlans);
  const [place, setPlace] = useState('');
  const [budget, setBudget] = useState('');
  const [transport, setTransport] = useState('');
  const [selectedGift, setSelectedGift] = useState<(typeof gifts)[number] | null>(null);
  const sharedCount = plans.length;
  const canSubmit = place.trim().length >= 2 && budget.trim().length >= 1 && transport.trim().length >= 2;
  const nextBadge = badgeMilestones.find((milestone) => milestone > sharedCount);
  const sortedPlans = useMemo(() => [...plans].sort((a, b) => b.rating - a.rating), [plans]);

  useEffect(() => {
    goodTipsApi
      .list()
      .then((response) => {
        if (response.items.length > 0) {
          setPlans(
            response.items.map((tip) => ({
              place: tip.place,
              budget: tip.budget,
              transport: tip.transport,
              rating: tip.rating,
              author: tip.author,
            })),
          );
        }
      })
      .catch(() => undefined);
  }, []);

  async function addPlan() {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!canSubmit) {
      return;
    }

    try {
      const result = await goodTipsApi.create({ place, budget, transport });

      setPlans((current) => [
        {
          place: result.tip.place,
          budget: result.tip.budget,
          transport: result.tip.transport,
          rating: result.tip.rating,
          author: result.tip.author,
        },
        ...current,
      ]);
      setPlace('');
      setBudget('');
      setTransport('');
    } catch {
      setPlans((current) => [
        { place, budget, transport, rating: 8.9, author: 'toi' },
        ...current,
      ]);
      setPlace('');
      setBudget('');
      setTransport('');
    }
  }

  return (
    <ScreenShell theme={theme}>
      <View style={[styles.headerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Bon Plan</Text>
        <Text style={[styles.copy, { color: theme.muted }]}>
          Lieux partages autour de toi, classes par note et proposes selon ta localisation.
        </Text>
        <View style={styles.statsRow}>
          <Stat label="Partages" value={String(sharedCount)} color={theme.accentStrong} />
          <Stat label="Badge suivant" value={nextBadge ? `${nextBadge}` : '75+'} color={theme.accentStrong} />
          <Stat label="Cadeaux" value={String(gifts.filter((gift) => sharedCount >= gift.unlockAt).length)} color={theme.accentStrong} />
        </View>
      </View>

      <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Ajouter un bon plan</Text>
        <TextInput
          value={place}
          onChangeText={setPlace}
          placeholder="Lieu"
          placeholderTextColor={theme.muted}
          style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text }]}
        />
        <TextInput
          value={budget}
          onChangeText={setBudget}
          placeholder="Budget, ex: 12 EUR"
          placeholderTextColor={theme.muted}
          style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text }]}
        />
        <TextInput
          value={transport}
          onChangeText={setTransport}
          placeholder="Transport utilise"
          placeholderTextColor={theme.muted}
          style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text }]}
        />
        <Pressable
          onPress={addPlan}
          style={[styles.submitButton, { backgroundColor: canSubmit ? theme.accentStrong : theme.border }]}
        >
          <Text style={styles.submitText}>Partager le bon plan</Text>
        </Pressable>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Lieux proches</Text>
      {sortedPlans.map((plan) => (
        <View key={`${plan.place}-${plan.author}`} style={[styles.planCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.planCopy}>
            <Text style={[styles.planTitle, { color: theme.text }]}>{plan.place}</Text>
            <Text style={[styles.planMeta, { color: theme.muted }]}>
              {plan.budget} - {plan.transport} - par {plan.author}
            </Text>
          </View>
          <View style={[styles.ratingPill, { backgroundColor: theme.accentSoft }]}>
            <Text style={[styles.ratingText, { color: theme.accentStrong }]}>{plan.rating}</Text>
          </View>
        </View>
      ))}

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Badges</Text>
      <View style={styles.badgeGrid}>
        {badgeMilestones.map((milestone, index) => {
          const unlocked = sharedCount >= milestone;
          const badgeColor = badgeColors[index];
          return (
            <View
              key={milestone}
              style={[
                styles.badgeCard,
                {
                  backgroundColor: unlocked ? badgeColor : theme.surfaceAlt,
                  borderColor: unlocked ? badgeColor : theme.border,
                },
              ]}
            >
              <View style={[styles.badgeIcon, { backgroundColor: unlocked ? 'rgba(255,255,255,0.22)' : theme.border }]}>
                <Ionicons name={badgeIcons[index]} size={20} color={unlocked ? '#FFFFFF' : theme.muted} />
              </View>
              <Text style={[styles.badgeText, { color: unlocked ? '#FFFFFF' : theme.muted }]}>
                Badge {index + 1}
              </Text>
              <Text style={[styles.badgeMeta, { color: unlocked ? '#FFFFFF' : theme.muted }]}>{milestone} plans</Text>
            </View>
          );
        })}
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Cadeaux</Text>
      <View style={styles.giftGrid}>
        {gifts.map((gift) => {
          const unlocked = sharedCount >= gift.unlockAt;
          return (
            <Pressable
              key={gift.name}
              onPress={() => unlocked && setSelectedGift(gift)}
              style={[
                styles.giftCard,
                {
                  backgroundColor: unlocked ? theme.surface : theme.surfaceAlt,
                  borderColor: unlocked ? theme.accentStrong : theme.border,
                  opacity: unlocked ? 1 : 0.52,
                },
              ]}
            >
              <View
                style={[
                  styles.giftIcon,
                  { backgroundColor: unlocked ? gift.color : theme.border },
                ]}
              >
                <Ionicons name={gift.icon} size={21} color={unlocked ? '#FFFFFF' : theme.muted} />
              </View>
              <Text style={[styles.giftName, { color: unlocked ? theme.text : theme.muted }]}>{gift.name}</Text>
              <Text style={[styles.giftStock, { color: theme.accentStrong }]}>
                {unlocked ? `${gift.stock}x` : `${gift.unlockAt} plans`}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <TruefeedModal
        visible={Boolean(selectedGift)}
        theme={theme}
        title={selectedGift?.name ?? ''}
        message={selectedGift?.detail}
        secondaryLabel="Annuler"
        primaryLabel="Utiliser"
        onClose={() => setSelectedGift(null)}
        onPrimary={() => setSelectedGift(null)}
      />
    </ScreenShell>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerCard: { borderRadius: 28, borderWidth: 1, gap: 12, padding: 20 },
  title: { fontFamily: fonts.title, fontSize: 44, fontWeight: '700' },
  copy: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23 },
  statsRow: { flexDirection: 'row', gap: 10 },
  stat: { alignItems: 'center', flex: 1, gap: 4 },
  statValue: { fontFamily: fonts.title, fontSize: 30, fontWeight: '700' },
  statLabel: { color: '#8A7A66', fontFamily: fonts.body, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  formCard: { borderRadius: 28, borderWidth: 1, gap: 12, padding: 18 },
  sectionTitle: { fontFamily: fonts.title, fontSize: 32, fontWeight: '700' },
  input: { borderRadius: 18, fontFamily: fonts.body, fontSize: 16, padding: 15 },
  submitButton: { alignItems: 'center', borderRadius: 18, paddingVertical: 15 },
  submitText: { color: '#FFFFFF', fontFamily: fonts.body, fontSize: 15, fontWeight: '900' },
  planCard: { alignItems: 'center', borderRadius: 24, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 16 },
  planCopy: { flex: 1, gap: 4 },
  planTitle: { fontFamily: fonts.body, fontSize: 19, fontWeight: '900' },
  planMeta: { fontFamily: fonts.body, fontSize: 13, fontWeight: '800' },
  ratingPill: { borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8 },
  ratingText: { fontFamily: fonts.body, fontSize: 15, fontWeight: '900' },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeCard: { borderRadius: 18, borderWidth: 1, gap: 6, padding: 12, width: '30.5%' },
  badgeIcon: { alignItems: 'center', borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  badgeText: { fontFamily: fonts.body, fontSize: 13, fontWeight: '900' },
  badgeMeta: { fontFamily: fonts.body, fontSize: 11, fontWeight: '800' },
  giftGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  giftCard: { borderRadius: 18, borderWidth: 1, gap: 6, padding: 12, width: '47%' },
  giftIcon: { alignItems: 'center', borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  giftName: { fontFamily: fonts.body, fontSize: 14, fontWeight: '900' },
  giftStock: { fontFamily: fonts.body, fontSize: 13, fontWeight: '900' },
});
