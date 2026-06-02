import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { seasonThemes } from '@/constants/truefeed';

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

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarHideOnKeyboard: true,
        tabBarInactiveTintColor: '#9C91B3',
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarActiveTintColor: seasonThemes.summer.accentStrong,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name="home" size={focused ? 28 : 24} color={color} />
          ),
          tabBarStyle: createTabBarStyle(seasonThemes.summer.tabBar, seasonThemes.summer.border),
        }}
      />
      <Tabs.Screen
        name="bonplan"
        options={{
          title: 'BonPlan',
          tabBarActiveTintColor: seasonThemes.autumn.accentStrong,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name="search" size={focused ? 28 : 24} color={color} />
          ),
          tabBarStyle: createTabBarStyle(seasonThemes.autumn.tabBar, seasonThemes.autumn.border),
        }}
      />
      <Tabs.Screen
        name="publish"
        options={{
          title: 'Publier',
          tabBarActiveTintColor: seasonThemes.autumn.accentStrong,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name="add-circle" size={focused ? 32 : 28} color={color} />
          ),
          tabBarStyle: createTabBarStyle(seasonThemes.autumn.tabBar, seasonThemes.autumn.border),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarActiveTintColor: seasonThemes.winter.accent,
          tabBarInactiveTintColor: '#7B87A4',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name="map" size={focused ? 28 : 24} color={color} />
          ),
          tabBarStyle: createTabBarStyle(seasonThemes.winter.tabBar, seasonThemes.winter.border),
        }}
      />
      <Tabs.Screen
        name="debate"
        options={{
          title: 'Debat',
          tabBarActiveTintColor: seasonThemes.spring.accentStrong,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name="chatbubble-ellipses" size={focused ? 28 : 24} color={color} />
          ),
          tabBarStyle: createTabBarStyle(seasonThemes.spring.tabBar, seasonThemes.spring.border),
        }}
      />
    </Tabs>
  );
}
