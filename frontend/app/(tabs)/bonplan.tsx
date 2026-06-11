// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenShell } from '@/components/truefeed/ui';
import { getGoodTipVisual } from '@/constants/good-tip-visuals';
import { fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';
import { useTranslatedText } from '@/hooks/use-translated-text';
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

const initialPlans: Plan[] = [];

function TipVisual({ visualKey }: { visualKey: string }) {
  const { t } = useTranslation();
  const visual = getGoodTipVisual(visualKey);

  return (
    <View style={[styles.visualPanel, { backgroundColor: visual.backgroundColor }]}>
      <View style={[styles.visualHalo, { backgroundColor: visual.accentColor }]} />
      <View style={[styles.visualBase, { backgroundColor: visual.shapeColor }]} />
      <View style={[styles.visualIconCircle, { backgroundColor: visual.accentColor }]}>
        <Ionicons name={visual.icon} size={54} color={visual.shapeColor} />
      </View>
      <Text style={styles.visualLabel}>{t(`bonplan.visuals.${visual.key}`, { defaultValue: visual.label })}</Text>
    </View>
  );
}

function getPlanKey(plan: Plan) {
  return `${plan.place}-${plan.author}-${plan.address}`;
}

function PlanCard({
  plan,
  theme,
  userRating,
  mode,
  onChooseMode,
  onOpenExplore,
  onRate,
}: {
  plan: Plan;
  theme: (typeof seasonThemes)['summer'];
  userRating?: number;
  mode?: 'actions' | 'review';
  onChooseMode: () => void;
  onOpenExplore: () => void;
  onRate: (stars: number) => void;
}) {
  const { t } = useTranslation();
  const translatedPlace = useTranslatedText(plan.place);
  const translatedAddress = useTranslatedText(plan.address);
  const translatedCategory = useTranslatedText(plan.category);
  const translatedTransport = useTranslatedText(plan.transport);

  return (
    <View
      style={[styles.planCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
    >
      <TipVisual visualKey={plan.visualKey} />
      <View style={styles.planBody}>
        <View style={styles.planTitleRow}>
          <View style={styles.planTitleBlock}>
            <Text style={[styles.planTitle, { color: theme.text }]}>{translatedPlace}</Text>
            <Text style={[styles.planCategory, { color: theme.accentStrong }]}>
              {translatedCategory}
            </Text>
          </View>
          <View style={[styles.ratingPill, { backgroundColor: theme.accentSoft }]}>
            <Text style={[styles.ratingText, { color: theme.accentStrong }]}>{plan.rating}</Text>
          </View>
        </View>
        <View style={styles.planDetailRow}>
          <Ionicons name="location-outline" size={17} color={theme.muted} />
          <Text style={[styles.planDetailText, { color: theme.muted }]}>{translatedAddress}</Text>
        </View>
        <View style={styles.planFacts}>
          <View style={[styles.factPill, { backgroundColor: theme.surfaceAlt }]}>
            <Ionicons name="cash-outline" size={16} color={theme.accentStrong} />
            <Text style={[styles.factText, { color: theme.text }]}>{plan.budget}</Text>
          </View>
          <View style={[styles.factPill, { backgroundColor: theme.surfaceAlt }]}>
            <Ionicons name="navigate-outline" size={16} color={theme.accentStrong} />
            <Text style={[styles.factText, { color: theme.text }]}>{translatedTransport}</Text>
          </View>
        </View>
        <Text style={[styles.planAuthor, { color: theme.muted }]}>
          {t('bonplan.by')} {plan.author}
        </Text>
        {mode ? (
          <View style={styles.actionPanel}>
            <Pressable
              onPress={onOpenExplore}
              style={[styles.planActionButton, { backgroundColor: theme.accentStrong }]}
            >
              <Ionicons name="map-outline" size={18} color="#FFFFFF" />
              <Text style={styles.planActionText}>Ouvrir sur Explore</Text>
            </Pressable>
            <Pressable
              onPress={onChooseMode}
              style={[styles.planActionButton, { backgroundColor: theme.surfaceAlt }]}
            >
              <Ionicons name="star-outline" size={18} color={theme.accentStrong} />
              <Text style={[styles.planActionText, { color: theme.accentStrong }]}>Donner un avis</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={onChooseMode}
            style={[styles.mainPlanButton, { backgroundColor: theme.surfaceAlt }]}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={theme.accentStrong} />
          </Pressable>
        )}
        {mode === 'review' ? (
          <View style={styles.starSection}>
            <Text style={[styles.starLabel, { color: theme.muted }]}>Ton avis</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((stars) => (
                <Pressable key={stars} onPress={() => onRate(stars)} style={styles.starButton}>
                  <Ionicons
                    name={(userRating || 0) >= stars ? 'star' : 'star-outline'}
                    size={26}
                    color={(userRating || 0) >= stars ? '#F59E0B' : theme.muted}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function BonPlanScreen() {
  const { t } = useTranslation();
  const { selectedSeason } = useGlobalSeason();
  const theme = seasonThemes[selectedSeason];
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [openPlanKey, setOpenPlanKey] = useState<string | null>(null);
  const [reviewPlanKey, setReviewPlanKey] = useState<string | null>(null);
  const sharedCount = plans.length;
  const sortedPlans = useMemo(
    () =>
      [...plans].sort((a, b) => {
        const ratingA = ratings[getPlanKey(a)] ? ratings[getPlanKey(a)] * 2 : a.rating;
        const ratingB = ratings[getPlanKey(b)] ? ratings[getPlanKey(b)] * 2 : b.rating;

        return ratingB - ratingA;
      }),
    [plans, ratings],
  );

  function ratePlan(plan: Plan, stars: number) {
    const planKey = getPlanKey(plan);

    setRatings((current) => ({ ...current, [planKey]: stars }));
    setPlans((current) =>
      current.map((item) => {
        if (getPlanKey(item) !== planKey) {
          return item;
        }

        return {
          ...item,
          rating: Math.round(((item.rating / 2 + stars) / 2) * 20) / 10,
        };
      }),
    );
  }

  function openExplore(plan: Plan) {
    router.push({ pathname: '/explore', params: { q: plan.place } });
  }

  useEffect(() => {
    goodTipsApi
      .list()
      .then((response) => {
        if (response.items.length > 0) {
          setPlans(
            response.items.map((tip) => ({
              place: tip.place,
              address: tip.address || t('bonplan.addressMissing'),
              category: tip.category || t('bonplan.title'),
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
  }, [t]);

  return (
    <ScreenShell theme={theme}>
      <View style={[styles.headerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>{t('bonplan.title')}</Text>
        <View style={[styles.heroPanel, { backgroundColor: theme.accentStrong }]}>
          <Text style={styles.heroNumber}>{sharedCount}</Text>
          <Text style={styles.heroText}>{t('bonplan.hero')}</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('bonplan.nearby')}</Text>
      {sortedPlans.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.emptyText, { color: theme.muted }]}>
            Aucun bon plan reel publie pour le moment.
          </Text>
        </View>
      ) : null}
      {sortedPlans.map((plan) => (
        <PlanCard
          key={getPlanKey(plan)}
          plan={plan}
          theme={theme}
          userRating={ratings[getPlanKey(plan)]}
          mode={
            reviewPlanKey === getPlanKey(plan)
              ? 'review'
              : openPlanKey === getPlanKey(plan)
                ? 'actions'
                : undefined
          }
          onChooseMode={() => {
            const planKey = getPlanKey(plan);

            if (openPlanKey === planKey) {
              setReviewPlanKey(planKey);
              return;
            }

            setOpenPlanKey(planKey);
            setReviewPlanKey(null);
          }}
          onOpenExplore={() => openExplore(plan)}
          onRate={(stars) => ratePlan(plan, stars)}
        />
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
  emptyCard: { borderRadius: 22, borderWidth: 1, padding: 16 },
  emptyText: { fontFamily: fonts.body, fontSize: 14, fontWeight: '800', lineHeight: 20 },
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
  actionPanel: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mainPlanButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 42,
  },
  planActionButton: {
    alignItems: 'center',
    borderRadius: 18,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  planActionText: { color: '#FFFFFF', fontFamily: fonts.body, fontSize: 13, fontWeight: '900' },
  starSection: { gap: 7 },
  starLabel: { fontFamily: fonts.body, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  starRow: { flexDirection: 'row', gap: 6 },
  starButton: { paddingVertical: 2 },
});
