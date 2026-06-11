// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
import type { ComponentProps } from 'react';

import type { Ionicons } from '@expo/vector-icons';

export type GoodTipVisualKey =
  | 'restaurant'
  | 'park'
  | 'museum'
  | 'cafe'
  | 'concert'
  | 'hike'
  | 'monument'
  | 'shopping'
  | 'beach'
  | 'hotel'
  | 'bar'
  | 'theater'
  | 'station'
  | 'viewpoint'
  | 'market'
  | 'generic';

export type GoodTipVisual = {
  key: GoodTipVisualKey;
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  backgroundColor: string;
  accentColor: string;
  shapeColor: string;
};

export const goodTipVisuals: Record<GoodTipVisualKey, GoodTipVisual> = {
  restaurant: {
    key: 'restaurant',
    label: 'Restaurant',
    icon: 'restaurant-outline',
    backgroundColor: '#F97316',
    accentColor: '#FFF7ED',
    shapeColor: '#7C2D12',
  },
  park: {
    key: 'park',
    label: 'Parc',
    icon: 'leaf-outline',
    backgroundColor: '#16A34A',
    accentColor: '#DCFCE7',
    shapeColor: '#14532D',
  },
  museum: {
    key: 'museum',
    label: 'Musee',
    icon: 'library-outline',
    backgroundColor: '#7C3AED',
    accentColor: '#F3E8FF',
    shapeColor: '#2E1065',
  },
  cafe: {
    key: 'cafe',
    label: 'Cafe',
    icon: 'cafe-outline',
    backgroundColor: '#A16207',
    accentColor: '#FEF3C7',
    shapeColor: '#422006',
  },
  concert: {
    key: 'concert',
    label: 'Concert',
    icon: 'musical-notes-outline',
    backgroundColor: '#DB2777',
    accentColor: '#FCE7F3',
    shapeColor: '#831843',
  },
  hike: {
    key: 'hike',
    label: 'Randonnee',
    icon: 'trail-sign-outline',
    backgroundColor: '#0F766E',
    accentColor: '#CCFBF1',
    shapeColor: '#134E4A',
  },
  monument: {
    key: 'monument',
    label: 'Monument',
    icon: 'business-outline',
    backgroundColor: '#F59E0B',
    accentColor: '#FEF3C7',
    shapeColor: '#312E81',
  },
  shopping: {
    key: 'shopping',
    label: 'Shopping',
    icon: 'bag-handle-outline',
    backgroundColor: '#2563EB',
    accentColor: '#DBEAFE',
    shapeColor: '#1E3A8A',
  },
  beach: {
    key: 'beach',
    label: 'Plage',
    icon: 'sunny-outline',
    backgroundColor: '#0891B2',
    accentColor: '#CFFAFE',
    shapeColor: '#164E63',
  },
  hotel: {
    key: 'hotel',
    label: 'Hotel',
    icon: 'bed-outline',
    backgroundColor: '#4F46E5',
    accentColor: '#E0E7FF',
    shapeColor: '#312E81',
  },
  bar: {
    key: 'bar',
    label: 'Bar',
    icon: 'wine-outline',
    backgroundColor: '#BE123C',
    accentColor: '#FFE4E6',
    shapeColor: '#881337',
  },
  theater: {
    key: 'theater',
    label: 'Theatre',
    icon: 'ticket-outline',
    backgroundColor: '#9333EA',
    accentColor: '#F3E8FF',
    shapeColor: '#581C87',
  },
  station: {
    key: 'station',
    label: 'Gare',
    icon: 'train-outline',
    backgroundColor: '#475569',
    accentColor: '#E2E8F0',
    shapeColor: '#0F172A',
  },
  viewpoint: {
    key: 'viewpoint',
    label: 'Vue',
    icon: 'telescope-outline',
    backgroundColor: '#0284C7',
    accentColor: '#E0F2FE',
    shapeColor: '#0C4A6E',
  },
  market: {
    key: 'market',
    label: 'Marche',
    icon: 'basket-outline',
    backgroundColor: '#CA8A04',
    accentColor: '#FEF9C3',
    shapeColor: '#713F12',
  },
  generic: {
    key: 'generic',
    label: 'Bon plan',
    icon: 'sparkles-outline',
    backgroundColor: '#F97316',
    accentColor: '#FFF7ED',
    shapeColor: '#7C2D12',
  },
};

export function getGoodTipVisual(key?: string | null) {
  return goodTipVisuals[(key || 'generic') as GoodTipVisualKey] || goodTipVisuals.generic;
}
