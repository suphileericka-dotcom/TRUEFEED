export type ApiHealth = {
  ok: boolean;
  app: string;
  timestamp: string;
};

export type ApiUserRole = 'user' | 'admin';

export type ApiUser = {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  role: ApiUserRole;
  status: 'active' | 'suspended' | 'deleted';
  createdAt: string;
  updatedAt: string;
};

export type ApiAuthSession = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
};

export type ApiAuthResponse = {
  user: ApiUser;
  session: ApiAuthSession;
};

export type ApiProfileUpdatePayload = {
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
};

export type ApiSearchResultType = 'destination' | 'tag' | 'user' | 'post';

export type ApiSearchResult = {
  id: string;
  type: ApiSearchResultType;
  name?: string;
  title?: string;
  username?: string;
  tags?: string[];
};

export type ApiDebateThread = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  author: string;
  upVotes: number;
  downVotes: number;
  repliesCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ApiMapPlace = {
  id: string;
  name: string;
  category: string;
  city: string;
  lat: number;
  lng: number;
  score: number;
  tags: string[];
  distanceKm?: number;
};

export type ApiPresignedUpload = {
  mediaId: string;
  key: string;
  uploadMode: 'single' | 'multipart';
  uploadUrl: string;
  publicUrl: string;
  expiresIn: number;
};
