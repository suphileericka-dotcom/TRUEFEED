import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ScreenShell } from '@/components/truefeed/ui';
import { fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';
import { goodTipsApi } from '@/services/api/good-tips';

const initialPlans = [
  { place: 'Fushimi Inari', budget: '0 EUR', transport: 'Train', rating: 9.8, author: 'nora.nomad' },
  { place: 'Nishiki Market', budget: '15 EUR', transport: 'Metro', rating: 9.5, author: 'maya_explores' },
  { place: 'Montmartre', budget: '8 EUR', transport: 'Metro', rating: 9.4, author: 'lucas.trips' },
];

export default function BonPlanScreen() {
  const { selectedSeason } = useGlobalSeason();
  const theme = seasonThemes[selectedSeason];
  const [plans, setPlans] = useState(initialPlans);
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
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  headerCard: { borderRadius: 28, borderWidth: 1, gap: 12, padding: 20 },
  title: { fontFamily: fonts.title, fontSize: 44, fontWeight: '700' },
  copy: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23 },
  heroPanel: { borderRadius: 24, gap: 4, padding: 20 },
  heroNumber: { color: '#FFFFFF', fontFamily: fonts.title, fontSize: 46, fontWeight: '700' },
  heroText: { color: '#FFFFFF', fontFamily: fonts.body, fontSize: 15, fontWeight: '900' },
  sectionTitle: { fontFamily: fonts.title, fontSize: 32, fontWeight: '700' },
  planCard: { alignItems: 'center', borderRadius: 24, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 16 },
  planCopy: { flex: 1, gap: 4 },
  planTitle: { fontFamily: fonts.body, fontSize: 19, fontWeight: '900' },
  planMeta: { fontFamily: fonts.body, fontSize: 13, fontWeight: '800' },
  ratingPill: { borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8 },
  ratingText: { fontFamily: fonts.body, fontSize: 15, fontWeight: '900' },
});
