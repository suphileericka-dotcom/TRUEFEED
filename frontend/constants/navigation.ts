// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
export type AccessLevel = 'public' | 'authenticated' | 'moderator' | 'admin';

export type NavigationItem = {
  route: string;
  label: string;
  access: AccessLevel;
  kind: 'stack' | 'tab' | 'modal';
  status: 'existing' | 'planned';
};

export const navigationSitemap: NavigationItem[] = [
  {
    route: '/(tabs)',
    label: 'Tabs principales',
    access: 'public',
    kind: 'stack',
    status: 'existing',
  },
  {
    route: '/(tabs)',
    label: 'Accueil',
    access: 'public',
    kind: 'tab',
    status: 'existing',
  },
  {
    route: '/(tabs)/bonplan',
    label: 'BonPlan',
    access: 'public',
    kind: 'tab',
    status: 'existing',
  },
  {
    route: '/(tabs)/publish',
    label: 'Publier',
    access: 'authenticated',
    kind: 'tab',
    status: 'existing',
  },
  {
    route: '/(tabs)/explore',
    label: 'Explore',
    access: 'public',
    kind: 'tab',
    status: 'existing',
  },
  {
    route: '/(tabs)/debate',
    label: 'TrueDebate',
    access: 'public',
    kind: 'tab',
    status: 'existing',
  },
  {
    route: '/modal',
    label: 'Modal',
    access: 'public',
    kind: 'modal',
    status: 'existing',
  },
  {
    route: '/(auth)/login',
    label: 'Connexion',
    access: 'public',
    kind: 'stack',
    status: 'planned',
  },
  {
    route: '/(auth)/register',
    label: 'Inscription',
    access: 'public',
    kind: 'stack',
    status: 'planned',
  },
  {
    route: '/(auth)/forgot-password',
    label: 'Mot de passe oublie',
    access: 'public',
    kind: 'stack',
    status: 'planned',
  },
  {
    route: '/post/[id]',
    label: 'Detail publication',
    access: 'public',
    kind: 'stack',
    status: 'planned',
  },
  {
    route: '/destination/[id]',
    label: 'Detail destination',
    access: 'public',
    kind: 'stack',
    status: 'planned',
  },
  {
    route: '/profile/[id]',
    label: 'Profil utilisateur',
    access: 'public',
    kind: 'stack',
    status: 'planned',
  },
  {
    route: '/profile/edit',
    label: 'Edition profil',
    access: 'authenticated',
    kind: 'stack',
    status: 'planned',
  },
  {
    route: '/settings',
    label: 'Reglages',
    access: 'authenticated',
    kind: 'stack',
    status: 'planned',
  },
  {
    route: '/moderation/reports',
    label: 'Reports',
    access: 'moderator',
    kind: 'stack',
    status: 'planned',
  },
];
