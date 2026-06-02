import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Chip, ScreenShell, SectionLabel } from '@/components/truefeed/ui';
import { bonPlanCategories, destinationSpotlight, fonts, seasonThemes } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';

export default function BonPlanScreen() {
  const { selectedSeason } = useGlobalSeason();
  const theme = seasonThemes[selectedSeason];
  const [planTitle, setPlanTitle] = useState('');
  const [category, setCategory] = useState(bonPlanCategories[0]);
  const [budget, setBudget] = useState('');
  const canSubmit = planTitle.trim().length >= 3 && budget.trim().length >= 1;

  return (
    <ScreenShell theme={theme}>
      <SectionLabel theme={theme} label={`Fiche destination - ${theme.label}`} />

      <View
        style={[
          styles.hero,
          {
            backgroundColor: theme.accentStrong,
          },
        ]}
      >
        <View style={styles.heroTop}>
          <View style={[styles.heroIconBubble, { backgroundColor: 'rgba(60, 28, 14, 0.26)' }]}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </View>

          <Chip
            label={`Mode ${theme.label}`}
            icon={theme.emoji}
            backgroundColor="rgba(60, 28, 14, 0.26)"
            textColor="#FFFFFF"
          />

          <View style={[styles.heroIconBubble, { backgroundColor: 'rgba(60, 28, 14, 0.26)' }]}>
            <Ionicons name="sparkles" size={20} color="#FF8FB7" />
          </View>
        </View>

        <Text style={styles.heroEmoji}>{theme.emoji}</Text>
        <Text style={styles.city}>{destinationSpotlight.city}</Text>
        <Text style={styles.region}>{destinationSpotlight.region}</Text>
      </View>

      <View
        style={[
          styles.metrics,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <MetricBlock
          themeColor={theme.accentStrong}
          label="Note"
          value={destinationSpotlight.rating}
        />
        <MetricBlock
          themeColor={theme.accentStrong}
          label="Posts"
          value={destinationSpotlight.posts}
        />
        <MetricBlock
          themeColor={theme.accentStrong}
          label="BonPlans"
          value={destinationSpotlight.plans}
        />
      </View>

      <View
        style={[
          styles.tipCard,
          {
            backgroundColor: theme.surfaceAlt,
            borderLeftColor: theme.accentStrong,
          },
        ]}
      >
        <Text style={[styles.tipLabel, { color: theme.accentStrong }]}>Conseil {theme.label}</Text>
        <Text style={[styles.tipText, { color: theme.text }]}>{destinationSpotlight.tip}</Text>
      </View>

      <Text style={[styles.blockTitle, { color: theme.text }]}>BonPlans nearby</Text>

      {destinationSpotlight.nearby.map((spot) => (
        <View
          key={spot.name}
          style={[
            styles.nearbyCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.nearbyLeft}>
            <Text style={styles.nearbyIcon}>{spot.icon}</Text>
            <View>
              <Text style={[styles.nearbyName, { color: theme.text }]}>{spot.name}</Text>
              <Text style={[styles.nearbyMeta, { color: theme.muted }]}>{spot.type}</Text>
            </View>
          </View>
          <View style={[styles.scorePill, { backgroundColor: theme.accentSoft }]}>
            <Text style={[styles.scoreText, { color: theme.accentStrong }]}>{spot.score}</Text>
          </View>
        </View>
      ))}

      <View
        style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <Text style={[styles.blockTitle, { color: theme.text }]}>Ajouter un bon plan</Text>
        <TextInput
          onChangeText={setPlanTitle}
          placeholder="Nom du spot"
          placeholderTextColor={theme.muted}
          style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text }]}
          value={planTitle}
        />
        <View style={styles.categoryRow}>
          {bonPlanCategories.map((item) => (
            <Chip
              key={item}
              label={item}
              active={category === item}
              backgroundColor={category === item ? theme.accentSoft : theme.surfaceAlt}
              textColor={category === item ? theme.accentStrong : theme.muted}
              onPress={() => setCategory(item)}
            />
          ))}
        </View>
        <TextInput
          onChangeText={setBudget}
          placeholder="Budget estime, ex: 12 EUR"
          placeholderTextColor={theme.muted}
          style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text }]}
          value={budget}
        />
        <Pressable
          style={[
            styles.submitButton,
            { backgroundColor: canSubmit ? theme.accentStrong : theme.border },
          ]}
        >
          <Text style={styles.submitText}>
            {canSubmit ? 'Proposer le bon plan' : 'Complete le formulaire'}
          </Text>
        </Pressable>
      </View>
    </ScreenShell>
  );
}

function MetricBlock({
  label,
  value,
  themeColor,
}: {
  label: string;
  value: string;
  themeColor: string;
}) {
  return (
    <View style={styles.metricBlock}>
      <Text style={[styles.metricValue, { color: themeColor }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 34,
    gap: 10,
    padding: 22,
  },
  heroTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroIconBubble: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  heroEmoji: {
    alignSelf: 'center',
    fontSize: 90,
    marginVertical: 38,
  },
  city: {
    color: '#FFFFFF',
    fontFamily: fonts.title,
    fontSize: 46,
    fontWeight: '700',
  },
  region: {
    color: '#F9E7DD',
    fontFamily: fonts.body,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  metrics: {
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 18,
  },
  metricBlock: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  metricValue: {
    fontFamily: fonts.title,
    fontSize: 34,
    fontWeight: '700',
  },
  metricLabel: {
    color: '#9A7C6A',
    fontFamily: fonts.body,
    fontSize: 14,
  },
  tipCard: {
    borderLeftWidth: 4,
    borderRadius: 24,
    gap: 10,
    padding: 20,
  },
  tipLabel: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  tipText: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 28,
  },
  blockTitle: {
    fontFamily: fonts.title,
    fontSize: 34,
    fontWeight: '700',
  },
  nearbyCard: {
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 18,
  },
  nearbyLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  nearbyIcon: {
    fontSize: 28,
  },
  nearbyName: {
    fontFamily: fonts.body,
    fontSize: 20,
    fontWeight: '800',
  },
  nearbyMeta: {
    fontFamily: fonts.body,
    fontSize: 14,
    marginTop: 4,
  },
  scorePill: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  scoreText: {
    fontFamily: fonts.body,
    fontSize: 16,
    fontWeight: '800',
  },
  formCard: {
    borderRadius: 28,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  input: {
    borderRadius: 18,
    fontFamily: fonts.body,
    fontSize: 16,
    padding: 15,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  submitButton: {
    alignItems: 'center',
    borderRadius: 18,
    paddingVertical: 15,
  },
  submitText: {
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 15,
    fontWeight: '800',
  },
});
