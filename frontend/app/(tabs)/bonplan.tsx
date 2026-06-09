import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ScreenShell } from '@/components/truefeed/ui';
import { getGoodTipVisual } from '@/constants/good-tip-visuals';
import { fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';
import { goodTipsApi } from '@/services/api/good-tips';

type Plan = {
  place: string;
  address: string;
  category: string;
  visualKey: string;
  budget: string;
  transport: string;
  rating: number;
  author: string;
};

const initialPlans: Plan[] = [
  {
    place: 'Fushimi Inari',
    address: '68 Fukakusa Yabunouchicho, Fushimi Ward, Kyoto, Japon',
    category: 'Monument',
    visualKey: 'monument',
    budget: '0 EUR',
    transport: 'Train',
    rating: 9.8,
    author: 'nora.nomad',
  },
  {
    place: 'Nishiki Market',
    address: 'Nishikikoji-dori, Nakagyo Ward, Kyoto, Japon',
    category: 'Marche',
    visualKey: 'market',
    budget: '15 EUR',
    transport: 'Metro',
    rating: 9.5,
    author: 'maya_explores',
  },
  {
    place: 'Montmartre',
    address: 'Place du Tertre, 75018 Paris, France',
    category: 'Vue',
    visualKey: 'viewpoint',
    budget: '8 EUR',
    transport: 'Metro',
    rating: 9.4,
    author: 'lucas.trips',
  },
];

function TipVisual({ visualKey }: { visualKey: string }) {
  const visual = getGoodTipVisual(visualKey);

  return (
    <View style={[styles.visualPanel, { backgroundColor: visual.backgroundColor }]}>
      <View style={[styles.visualHalo, { backgroundColor: visual.accentColor }]} />
      <View style={[styles.visualBase, { backgroundColor: visual.shapeColor }]} />
      <View style={[styles.visualIconCircle, { backgroundColor: visual.accentColor }]}>
        <Ionicons name={visual.icon} size={54} color={visual.shapeColor} />
      </View>
      <Text style={styles.visualLabel}>{visual.label}</Text>
    </View>
  );
}

export default function BonPlanScreen() {
  const { selectedSeason } = useGlobalSeason();
  const theme = seasonThemes[selectedSeason];
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const sharedCount = plans.length;
  const sortedPlans = useMemo(() => [...plans].sort((a, b) => b.rating - a.rating), [plans]);

  useEffect(() => {
    goodTipsApi
      .list()
      .then((response) => {
        if (response.items.length > 0) {
          setPlans(
            response.items.map((tip) => ({
              place: tip.place,
              address: tip.address || 'Adresse non renseignee',
              category: tip.category || 'Bon plan',
              visualKey: tip.visualKey || 'generic',
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

  return (
    <ScreenShell theme={theme}>
      <View style={[styles.headerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Bon Plan</Text>
        <View style={[styles.heroPanel, { backgroundColor: theme.accentStrong }]}>
          <Text style={styles.heroNumber}>{sharedCount}</Text>
          <Text style={styles.heroText}>spots recommandes par la communaute</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Lieux proches</Text>
      {sortedPlans.map((plan) => (
        <View
          key={`${plan.place}-${plan.author}-${plan.address}`}
          style={[styles.planCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <TipVisual visualKey={plan.visualKey} />
          <View style={styles.planBody}>
            <View style={styles.planTitleRow}>
              <View style={styles.planTitleBlock}>
                <Text style={[styles.planTitle, { color: theme.text }]}>{plan.place}</Text>
                <Text style={[styles.planCategory, { color: theme.accentStrong }]}>
                  {plan.category}
                </Text>
              </View>
              <View style={[styles.ratingPill, { backgroundColor: theme.accentSoft }]}>
                <Text style={[styles.ratingText, { color: theme.accentStrong }]}>{plan.rating}</Text>
              </View>
            </View>
            <View style={styles.planDetailRow}>
              <Ionicons name="location-outline" size={17} color={theme.muted} />
              <Text style={[styles.planDetailText, { color: theme.muted }]}>{plan.address}</Text>
            </View>
            <View style={styles.planFacts}>
              <View style={[styles.factPill, { backgroundColor: theme.surfaceAlt }]}>
                <Ionicons name="cash-outline" size={16} color={theme.accentStrong} />
                <Text style={[styles.factText, { color: theme.text }]}>{plan.budget}</Text>
              </View>
              <View style={[styles.factPill, { backgroundColor: theme.surfaceAlt }]}>
                <Ionicons name="navigate-outline" size={16} color={theme.accentStrong} />
                <Text style={[styles.factText, { color: theme.text }]}>{plan.transport}</Text>
              </View>
            </View>
            <Text style={[styles.planAuthor, { color: theme.muted }]}>par {plan.author}</Text>
          </View>
        </View>
      ))}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  headerCard: { borderRadius: 28, borderWidth: 1, gap: 12, padding: 20 },
  title: { fontFamily: fonts.title, fontSize: 44, fontWeight: '700' },
  heroPanel: { borderRadius: 24, gap: 4, padding: 20 },
  heroNumber: { color: '#FFFFFF', fontFamily: fonts.title, fontSize: 46, fontWeight: '700' },
  heroText: { color: '#FFFFFF', fontFamily: fonts.body, fontSize: 15, fontWeight: '900' },
  sectionTitle: { fontFamily: fonts.title, fontSize: 32, fontWeight: '700' },
  planCard: { borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  visualPanel: {
    alignItems: 'center',
    height: 178,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  visualHalo: {
    borderRadius: 999,
    height: 142,
    opacity: 0.24,
    position: 'absolute',
    right: -22,
    top: -34,
    width: 142,
  },
  visualBase: {
    borderRadius: 999,
    bottom: -34,
    height: 86,
    opacity: 0.28,
    position: 'absolute',
    width: 230,
  },
  visualIconCircle: {
    alignItems: 'center',
    borderRadius: 52,
    height: 104,
    justifyContent: 'center',
    width: 104,
  },
  visualLabel: {
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: 12,
    textTransform: 'uppercase',
  },
  planBody: { gap: 12, padding: 16 },
  planTitleRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 12 },
  planTitleBlock: { flex: 1, gap: 4 },
  planTitle: { fontFamily: fonts.title, fontSize: 27, fontWeight: '700' },
  planCategory: { fontFamily: fonts.body, fontSize: 13, fontWeight: '900' },
  planDetailRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 8 },
  planDetailText: { flex: 1, fontFamily: fonts.body, fontSize: 14, fontWeight: '800', lineHeight: 20 },
  planFacts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  factPill: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  factText: { fontFamily: fonts.body, fontSize: 13, fontWeight: '900' },
  planAuthor: { fontFamily: fonts.body, fontSize: 12, fontWeight: '800' },
  ratingPill: { borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8 },
  ratingText: { fontFamily: fonts.body, fontSize: 15, fontWeight: '900' },
});
