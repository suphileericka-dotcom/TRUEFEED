import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { AuthSession, AuthUser } from '@/services/api/auth';

export type StoredSessionState = {
  isAuthenticated: boolean;
  hasKnownAccount: boolean;
  user: AuthUser | null;
  session: AuthSession | null;
};

export const emptySessionState: StoredSessionState = {
  isAuthenticated: false,
  hasKnownAccount: false,
  user: null,
  session: null,
};

const keys = {
  isAuthenticated: 'truefeed:isAuthenticated',
  hasKnownAccount: 'truefeed:hasKnownAccount',
  user: 'truefeed:user',
  session: 'truefeed:session',
};

function canUseLocalStorage() {
  return Platform.OS === 'web' && typeof localStorage !== 'undefined';
}

async function getItem(key: string) {
  if (canUseLocalStorage()) {
    return localStorage.getItem(key);
  }

  return AsyncStorage.getItem(key);
}

async function setItem(key: string, value: string) {
  if (canUseLocalStorage()) {
    localStorage.setItem(key, value);
    return;
  }

  await AsyncStorage.setItem(key, value);
}

async function removeItem(key: string) {
  if (canUseLocalStorage()) {
    localStorage.removeItem(key);
    return;
  }

  await AsyncStorage.removeItem(key);
}

function notifySessionChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('truefeed-session-change'));
  }
}

async function readJson<T>(key: string): Promise<T | null> {
  const raw = await getItem(key);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function readStoredSession(): Promise<StoredSessionState> {
  return {
    isAuthenticated: (await getItem(keys.isAuthenticated)) === 'true',
    hasKnownAccount: (await getItem(keys.hasKnownAccount)) === 'true',
    user: await readJson<AuthUser>(keys.user),
    session: await readJson<AuthSession>(keys.session),
  };
}

export async function writeStoredSession(nextSession: StoredSessionState) {
  await setItem(keys.isAuthenticated, String(nextSession.isAuthenticated));
  await setItem(keys.hasKnownAccount, String(nextSession.hasKnownAccount));

  if (nextSession.user) {
    await setItem(keys.user, JSON.stringify(nextSession.user));
  } else {
    await removeItem(keys.user);
  }

  if (nextSession.session) {
    await setItem(keys.session, JSON.stringify(nextSession.session));
  } else {
    await removeItem(keys.session);
  }

  notifySessionChange();
}

export async function clearStoredSession(keepKnownAccount = true) {
  await writeStoredSession({
    ...emptySessionState,
    hasKnownAccount: keepKnownAccount,
  });
}
