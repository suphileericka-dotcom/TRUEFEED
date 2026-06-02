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

type UiState = 'loading' | 'empty' | 'error' | 'offline';

type StatePanelProps = {
  theme: SeasonTheme;
  state: UiState;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

type SpaceIconProps = {
  active: boolean;
  activeName: ComponentProps<typeof Ionicons>['name'];
  inactiveName: ComponentProps<typeof Ionicons>['name'];
  color: string;
  size?: number;
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

export function StatePanel({
  theme,
  state,
  title,
  message,
  actionLabel,
  onAction,
}: StatePanelProps) {
  const iconByState: Record<UiState, ComponentProps<typeof Ionicons>['name']> = {
    loading: 'sync',
    empty: 'file-tray-outline',
    error: 'warning-outline',
    offline: 'cloud-offline-outline',
  };

  return (
    <View
      style={[styles.statePanel, { backgroundColor: theme.surface, borderColor: theme.border }]}
    >
      <View style={[styles.stateIcon, { backgroundColor: theme.accentSoft }]}>
        <Ionicons name={iconByState[state]} size={22} color={theme.accentStrong} />
      </View>
      <View style={styles.stateCopy}>
        <Text style={[styles.stateTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.stateMessage, { color: theme.muted }]}>{message}</Text>
      </View>
      {actionLabel ? (
        <Pressable
          onPress={onAction}
          style={[styles.stateAction, { backgroundColor: theme.accentStrong }]}
        >
          <Text style={styles.stateActionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function SpaceIcon({ active, activeName, inactiveName, color, size = 24 }: SpaceIconProps) {
  return (
    <Ionicons
      name={active ? activeName : inactiveName}
      size={active ? size + 2 : size}
      color={color}
    />
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
  statePanel: {
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  stateIcon: {
    alignItems: 'center',
    borderRadius: 18,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  stateCopy: {
    flex: 1,
    gap: 4,
  },
  stateTitle: {
    fontFamily: fonts.body,
    fontSize: 16,
    fontWeight: '800',
  },
  stateMessage: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
  },
  stateAction: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  stateActionText: {
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '800',
  },
});
