import { Platform } from 'react-native';

export type SeasonKey = 'summer' | 'autumn' | 'winter' | 'spring';

export type SeasonTheme = {
  key: SeasonKey;
  label: string;
  shortLabel: string;
  emoji: string;
  accent: string;
  accentStrong: string;
  accentSoft: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  muted: string;
  border: string;
  tabBar: string;
  statusBar: 'light' | 'dark';
};

export const fonts = {
  title:
    Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: "Georgia, 'Times New Roman', serif",
      default: 'serif',
    }) ?? 'serif',
  body:
    Platform.select({
      ios: 'Arial',
      android: 'sans-serif',
      web: "Calibri, 'Segoe UI', sans-serif",
      default: 'sans-serif',
    }) ?? 'sans-serif',
};

export const seasonThemes: Record<SeasonKey, SeasonTheme> = {
  summer: {
    key: 'summer',
    label: 'Ete',
    shortLabel: 'Ete',
    emoji: '🌞',
    accent: '#F5B12A',
    accentStrong: '#F29B14',
    accentSoft: '#FDE8BD',
    background: '#F7F0E3',
    surface: '#FFFCF7',
    surfaceAlt: '#F2E6D5',
    text: '#2B241B',
    muted: '#776955',
    border: '#E8D9C2',
    tabBar: '#FFF8EE',
    statusBar: 'dark',
  },
  autumn: {
    key: 'autumn',
    label: 'Automne',
    shortLabel: 'Automne',
    emoji: '🍂',
    accent: '#D86A27',
    accentStrong: '#C95D1E',
    accentSoft: '#F3D5C1',
    background: '#F3E6DC',
    surface: '#FFF8F3',
    surfaceAlt: '#F0DDD0',
    text: '#3B2418',
    muted: '#876554',
    border: '#E5CCBC',
    tabBar: '#FFF6EF',
    statusBar: 'dark',
  },
  winter: {
    key: 'winter',
    label: 'Hiver',
    shortLabel: 'Hiver',
    emoji: '❄️',
    accent: '#5C8FD7',
    accentStrong: '#4778BE',
    accentSoft: '#1C2942',
    background: '#0F172A',
    surface: '#141F37',
    surfaceAlt: '#1C2A47',
    text: '#F1F5FF',
    muted: '#9DACCF',
    border: '#243350',
    tabBar: '#111A2D',
    statusBar: 'light',
  },
  spring: {
    key: 'spring',
    label: 'Printemps',
    shortLabel: 'Printemps',
    emoji: '🌸',
    accent: '#5FAF78',
    accentStrong: '#44935D',
    accentSoft: '#DCEEDD',
    background: '#EEF7EF',
    surface: '#FFFFFF',
    surfaceAlt: '#E5F2E6',
    text: '#223326',
    muted: '#64806B',
    border: '#D3E5D5',
    tabBar: '#F5FBF5',
    statusBar: 'dark',
  },
};

export const seasonOrder: SeasonKey[] = ['summer', 'autumn', 'winter', 'spring'];

export function getSeasonFromDate(date = new Date()): SeasonKey {
  const month = date.getMonth() + 1;

  if (month >= 3 && month <= 5) {
    return 'spring';
  }

  if (month >= 6 && month <= 8) {
    return 'summer';
  }

  if (month >= 9 && month <= 11) {
    return 'autumn';
  }

  return 'winter';
}

export const storyUsers = ['Lucas', 'Sara', 'Karim', 'Yuna', 'Alex'];

export const feedBySeason: Record<
  SeasonKey,
  {
    chip: string;
    visualTag: string;
    emoji: string;
    author: string;
    location: string;
    likes: string;
    caption: string;
    hint: string;
  }
> = {
  summer: {
    chip: 'Mode Ete',
    visualTag: 'GR CYCLADES',
    emoji: '🏖️',
    author: 'maya_explores',
    location: 'Santorin, Grece',
    likes: "2 847 j'aime",
    caption:
      'Le coucher de soleil le plus dingue de ma vie. Oia a 19h, snack local et vue sur la caldeira.',
    hint: 'Publie un vlog solaire, rapide et spontané.',
  },
  autumn: {
    chip: 'Mode Automne',
    visualTag: 'JP KANSAI',
    emoji: '🍁',
    author: 'nora.nomad',
    location: 'Kyoto, Japon',
    likes: "1 922 j'aime",
    caption:
      "Petit matin au Fushimi Inari. Lumiere doree, foule calme et carnet rempli d'idees.",
    hint: 'Parfait pour partager un bon plan ou une fiche destination.',
  },
  winter: {
    chip: 'Mode Hiver',
    visualTag: 'FR ALPES',
    emoji: '🏔️',
    author: 'leo.tracks',
    location: 'Chamonix, France',
    likes: "3 104 j'aime",
    caption:
      "Lever a la station, cafe chaud et une premiere trace qui vaut le reveil a 5h20.",
    hint: 'Les contenus Explore performent bien avec cartes et spots.',
  },
  spring: {
    chip: 'Mode Printemps',
    visualTag: 'JP HANAMI',
    emoji: '🌸',
    author: 'sophie_bpkt',
    location: 'Tokyo, Japon',
    likes: "1 488 j'aime",
    caption:
      'Hanami du soir, parc plein a craquer et debat ouvert: experience poetique ou trop touristique ?',
    hint: 'Bon moment pour lancer un debat ou un post communautaire.',
  },
};

export const destinationSpotlight = {
  city: 'Kyoto',
  region: 'JP JAPON · KANSAI',
  rating: '4.9',
  posts: '12k',
  plans: '847',
  tip: "Le Fushimi Inari a l'aube en octobre offre une lumiere douce et presque aucune foule.",
  nearby: [
    { name: 'Fushimi Inari', type: 'Temple · Gratuit', score: '9.8', icon: '⛩️' },
    { name: 'Nishiki Market', type: 'Street food · 15 min', score: '9.5', icon: '🥢' },
    { name: 'Arashiyama', type: 'Nature · Matin conseille', score: '9.3', icon: '🎋' },
  ],
};

export const exploreCategories = ['Montagne', 'Urbain', 'Marches'];

export const winterSpots = [
  { name: 'Chamonix', posts: '3.4k posts', icon: '⛰️', tone: '#34568A' },
  { name: "Val d'Isere", posts: '2.1k posts', icon: '🛷', tone: '#41618F' },
  { name: 'Laponie', posts: '1.8k posts', icon: '🌌', tone: '#1E2F67' },
  { name: 'Prague', posts: '4.2k posts', icon: '🏰', tone: '#4D72A5' },
];

export const debateTopics = [
  {
    tags: ['HOT', 'Sac a dos'],
    title: 'Voyager avec 7kg max : une liberte ou une contrainte ?',
    excerpt:
      'Les ultra-legers affirment ne plus pouvoir revenir en arriere. Mais sacrifie-t-on trop de confort ?',
    percent: 67,
    author: 'sophie_bpkt',
    responses: '142 reponses',
    age: '2h',
  },
  {
    tags: ['NOUVEAU', 'Slow travel'],
    title: 'Rester 1 mois vs 4 pays en 15 jours : que choisir ?',
    excerpt:
      'Le slow travel gagne du terrain, mais certains preferent enchainer les decouvertes pour un premier voyage.',
    percent: 54,
    author: 'maya_explores',
    responses: '96 reponses',
    age: '4h',
  },
];

export const postFormats = [
  { key: 'photo', label: 'Photo' },
  { key: 'vlog', label: 'Vlog' },
  { key: 'debate', label: 'Debat' },
  { key: 'tip', label: 'Bon plan' },
];

export const attachmentOptions = [
  { label: 'Media', detail: 'Images ou reel', icon: '🖼️' },
  { label: 'Lieu', detail: 'Ville ou spot', icon: '📍' },
  { label: 'Tags', detail: 'Saison et themes', icon: '#️⃣' },
  { label: 'Budget', detail: 'Optionnel', icon: '💸' },
];

export const visibilityOptions = ['Public', 'Amis', 'Brouillon prive'];
