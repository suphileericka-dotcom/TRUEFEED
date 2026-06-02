import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { SpaceIcon } from '@/components/truefeed/ui';
import { seasonThemes, truefeedSpaces, type TruefeedSpaceKey } from '@/constants/truefeed';
import { useGlobalSeason } from '@/hooks/use-global-season';

function createTabBarStyle(backgroundColor: string, borderColor: string) {
  return {
    backgroundColor,
    borderTopColor: borderColor,
    borderTopWidth: 1,
    elevation: 0,
    height: 88,
    paddingBottom: 16,
    paddingTop: 10,
  } as const;
}

function getSpace(key: TruefeedSpaceKey) {
  return truefeedSpaces.find((space) => space.key === key) ?? truefeedSpaces[0];
}

export default function TabLayout() {
  const { selectedSeason } = useGlobalSeason();
  const theme = seasonThemes[selectedSeason];
  const feedSpace = getSpace('feed');
  const bonplanSpace = getSpace('bonplan');
  const publishSpace = getSpace('publish');
  const exploreSpace = getSpace('explore');
  const debateSpace = getSpace('debate');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: theme.accentStrong,
        tabBarInactiveTintColor: theme.muted,
        tabBarShowLabel: false,
        tabBarStyle: createTabBarStyle(theme.tabBar, theme.border),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: feedSpace.label,
          tabBarIcon: ({ color, focused }) => (
            <SpaceIcon
              active={focused}
              activeName={feedSpace.activeIcon}
              inactiveName={feedSpace.inactiveIcon}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="bonplan"
        options={{
          title: bonplanSpace.label,
          tabBarIcon: ({ color, focused }) => (
            <SpaceIcon
              active={focused}
              activeName={bonplanSpace.activeIcon}
              inactiveName={bonplanSpace.inactiveIcon}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="publish"
        options={{
          title: publishSpace.label,
          tabBarIcon: ({ color, focused }) => (
            <SpaceIcon
              active={focused}
              activeName={publishSpace.activeIcon}
              inactiveName={publishSpace.inactiveIcon}
              color={color}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: exploreSpace.label,
          tabBarIcon: ({ color, focused }) => (
            <SpaceIcon
              active={focused}
              activeName={exploreSpace.activeIcon}
              inactiveName={exploreSpace.inactiveIcon}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="debate"
        options={{
          title: debateSpace.label,
          tabBarIcon: ({ color, focused }) => (
            <SpaceIcon
              active={focused}
              activeName={debateSpace.activeIcon}
              inactiveName={debateSpace.inactiveIcon}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
