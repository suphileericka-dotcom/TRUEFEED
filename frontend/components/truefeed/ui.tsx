import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import type { ComponentProps, ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
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

type SeasonalTagProps = {
  label: string;
  theme: SeasonTheme;
  active?: boolean;
  onPress?: () => void;
};

type MediaOption = {
  key: string;
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
};

type MediaSelectorProps<T extends MediaOption> = {
  options: readonly T[];
  selectedKey: T['key'];
  theme: SeasonTheme;
  onSelect: (key: T['key']) => void;
};

type TruefeedModalProps = {
  visible: boolean;
  theme: SeasonTheme;
  title: string;
  message?: string;
  children?: ReactNode;
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  onClose: () => void;
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

export function SeasonalTag({ label, theme, active = false, onPress }: SeasonalTagProps) {
  return (
    <Chip
      label={`#${label}`}
      icon={active ? theme.emoji : undefined}
      active={active}
      backgroundColor={active ? theme.accentSoft : theme.surfaceAlt}
      textColor={active ? theme.accentStrong : theme.muted}
      onPress={onPress}
    />
  );
}

export function MediaSelector<T extends MediaOption>({
  options,
  selectedKey,
  theme,
  onSelect,
}: MediaSelectorProps<T>) {
  return (
    <View style={styles.mediaSelector}>
      {options.map((option) => {
        const isActive = selectedKey === option.key;

        return (
          <Pressable
            key={option.key}
            onPress={() => onSelect(option.key)}
            style={[
              styles.mediaSelectorOption,
              {
                backgroundColor: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.18)',
              },
            ]}
          >
            <Ionicons
              name={option.icon}
              size={18}
              color={isActive ? theme.accentStrong : '#FFFFFF'}
            />
            <Text
              style={[
                styles.mediaSelectorText,
                { color: isActive ? theme.accentStrong : '#FFFFFF' },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function TruefeedModal({
  visible,
  theme,
  title,
  message,
  children,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  onClose,
}: TruefeedModalProps) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{title}</Text>
            <Pressable
              onPress={onClose}
              style={[styles.modalClose, { backgroundColor: theme.surfaceAlt }]}
            >
              <Ionicons name="close" size={18} color={theme.muted} />
            </Pressable>
          </View>
          {message ? (
            <Text style={[styles.modalMessage, { color: theme.muted }]}>{message}</Text>
          ) : null}
          {children}
          {primaryLabel || secondaryLabel ? (
            <View style={styles.modalActions}>
              {secondaryLabel ? (
                <Pressable
                  onPress={onSecondary ?? onClose}
                  style={[styles.modalSecondary, { borderColor: theme.border }]}
                >
                  <Text style={[styles.modalSecondaryText, { color: theme.text }]}>
                    {secondaryLabel}
                  </Text>
                </Pressable>
              ) : null}
              {primaryLabel ? (
                <Pressable
                  onPress={onPrimary}
                  style={[styles.modalPrimary, { backgroundColor: theme.accentStrong }]}
                >
                  <Text style={styles.modalPrimaryText}>{primaryLabel}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
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
  mediaSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  mediaSelectorOption: {
    alignItems: 'center',
    borderRadius: 999,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 11,
  },
  mediaSelectorText: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '800',
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.54)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 28,
    gap: 14,
    maxWidth: 420,
    padding: 20,
    width: '100%',
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalTitle: {
    flex: 1,
    fontFamily: fonts.title,
    fontSize: 28,
    fontWeight: '700',
  },
  modalClose: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  modalMessage: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 23,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalSecondary: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 13,
  },
  modalSecondaryText: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '800',
  },
  modalPrimary: {
    alignItems: 'center',
    borderRadius: 16,
    flex: 1,
    paddingVertical: 13,
  },
  modalPrimaryText: {
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '800',
  },
});
