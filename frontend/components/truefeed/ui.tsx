import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  fonts,
  seasonOrder,
  seasonThemes,
  type SeasonKey,
  type SeasonTheme,
} from '@/constants/truefeed';

type ScreenShellProps = {
  children: ReactNode;
  theme: SeasonTheme;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

type HeaderAction = {
  icon: ComponentProps<typeof Ionicons>['name'];
  tint?: string;
};

type BrandHeaderProps = {
  theme: SeasonTheme;
  badgeText: string;
  badgeIcon?: string;
  actions?: HeaderAction[];
};

type ChipProps = {
  label: string;
  backgroundColor: string;
  textColor: string;
  icon?: string;
  active?: boolean;
  onPress?: () => void;
};

type SeasonSwitcherProps = {
  selectedSeason: SeasonKey;
  onSelect: (season: SeasonKey) => void;
};

type SectionLabelProps = {
  theme: SeasonTheme;
  label: string;
};

type ProgressBarProps = {
  value: number;
  color: string;
  backgroundColor: string;
};

export function ScreenShell({ children, theme, contentContainerStyle }: ScreenShellProps) {
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.statusBar} />
      <ScrollView
        contentContainerStyle={[styles.content, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function BrandHeader({ theme, badgeText, badgeIcon, actions = [] }: BrandHeaderProps) {
  return (
    <View style={styles.headerWrap}>
      <View style={styles.headerTopRow}>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: theme.accentSoft,
            },
          ]}
        >
          {badgeIcon ? <Text style={styles.badgeIcon}>{badgeIcon}</Text> : null}
          <Text style={[styles.badgeText, { color: theme.accentStrong }]}>{badgeText}</Text>
        </View>

        <View style={styles.headerActions}>
          {actions.map((action) => (
            <View
              key={action.icon}
              style={[
                styles.headerActionBubble,
                {
                  backgroundColor: theme.surfaceAlt,
                },
              ]}
            >
              <Ionicons name={action.icon} size={18} color={action.tint ?? theme.accentStrong} />
            </View>
          ))}
        </View>
      </View>

      <Text style={[styles.brandTitle, { color: theme.text }]}>TrueFeed</Text>
    </View>
  );
}

export function Chip({
  label,
  backgroundColor,
  textColor,
  icon,
  active = false,
  onPress,
}: ChipProps) {
  const chipStyle: StyleProp<ViewStyle> = [
    styles.chip,
    {
      backgroundColor,
      borderColor: active ? textColor : 'transparent',
      borderWidth: active ? 1 : 0,
    },
  ];

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={chipStyle}>
        {icon ? <Text style={styles.chipIcon}>{icon}</Text> : null}
        <Text style={[styles.chipText, { color: textColor }]}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <View style={chipStyle}>
      {icon ? <Text style={styles.chipIcon}>{icon}</Text> : null}
      <Text style={[styles.chipText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

export function SectionLabel({ theme, label }: SectionLabelProps) {
  return (
    <View style={styles.sectionLabelRow}>
      <View style={[styles.sectionDot, { backgroundColor: theme.accentStrong }]} />
      <Text style={[styles.sectionLabelText, { color: theme.muted }]}>{label}</Text>
    </View>
  );
}

export function SeasonSwitcher({ selectedSeason, onSelect }: SeasonSwitcherProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.seasonSwitcher}
    >
      {seasonOrder.map((season) => {
        const theme = seasonThemes[season];
        const isActive = selectedSeason === season;

        return (
          <Chip
            key={season}
            label={theme.label}
            icon={theme.emoji}
            active={isActive}
            backgroundColor={isActive ? theme.accent : theme.accentSoft}
            textColor={isActive ? '#FFFFFF' : theme.accentStrong}
            onPress={() => onSelect(season)}
          />
        );
      })}
    </ScrollView>
  );
}

export function ProgressBar({ value, color, backgroundColor }: ProgressBarProps) {
  return (
    <View style={[styles.progressTrack, { backgroundColor }]}>
      <View style={[styles.progressFill, { width: `${value}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 140,
    gap: 18,
  },
  headerWrap: {
    gap: 10,
  },
  headerTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeIcon: {
    fontSize: 14,
  },
  badgeText: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  headerActionBubble: {
    alignItems: 'center',
    borderRadius: 18,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  brandTitle: {
    fontFamily: fonts.title,
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: -1,
  },
  chip: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipIcon: {
    fontSize: 14,
  },
  chipText: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '700',
  },
  sectionLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  sectionDot: {
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  sectionLabelText: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  seasonSwitcher: {
    gap: 10,
    paddingRight: 6,
  },
  progressTrack: {
    borderRadius: 999,
    height: 10,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 999,
    height: '100%',
  },
});
