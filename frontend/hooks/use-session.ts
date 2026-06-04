import { useEffect, useState } from 'react';

import type { AuthResponse, AuthSession, AuthUser } from '@/services/api/auth';

type SessionState = {
  isAuthenticated: boolean;
  hasKnownAccount: boolean;
  user: AuthUser | null;
  session: AuthSession | null;
};

const fallbackSession: SessionState = {
  isAuthenticated: false,
  hasKnownAccount: false,
  user: null,
  session: null,
};

function readJson<T>(key: string): T | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  const raw = localStorage.getItem(key);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readSession(): SessionState {
  if (typeof localStorage === 'undefined') {
    return fallbackSession;
  }

  return {
    isAuthenticated: localStorage.getItem('truefeed:isAuthenticated') === 'true',
    hasKnownAccount: localStorage.getItem('truefeed:hasKnownAccount') === 'true',
    user: readJson<AuthUser>('truefeed:user'),
    session: readJson<AuthSession>('truefeed:session'),
  };
}

function notifySessionChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('truefeed-session-change'));
  }
}

function writeSession(nextSession: SessionState) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem('truefeed:isAuthenticated', String(nextSession.isAuthenticated));
  localStorage.setItem('truefeed:hasKnownAccount', String(nextSession.hasKnownAccount));

  if (nextSession.user) {
    localStorage.setItem('truefeed:user', JSON.stringify(nextSession.user));
  } else {
    localStorage.removeItem('truefeed:user');
  }

  if (nextSession.session) {
    localStorage.setItem('truefeed:session', JSON.stringify(nextSession.session));
  } else {
    localStorage.removeItem('truefeed:session');
  }

  notifySessionChange();
}

export function useSession() {
  const [sessionState, setSessionState] = useState<SessionState>(fallbackSession);

  useEffect(() => {
    setSessionState(readSession());

    if (typeof window === 'undefined') {
      return undefined;
    }

    function syncSession() {
      setSessionState(readSession());
    }

    window.addEventListener('storage', syncSession);
    window.addEventListener('truefeed-session-change', syncSession);

    return () => {
      window.removeEventListener('storage', syncSession);
      window.removeEventListener('truefeed-session-change', syncSession);
    };
  }, []);

  function signIn(authResponse: AuthResponse) {
    const nextSession = {
      isAuthenticated: true,
      hasKnownAccount: true,
      user: authResponse.user,
      session: authResponse.session,
    };
    writeSession(nextSession);
    setSessionState(nextSession);
  }

  function signOut() {
    const nextSession = {
      isAuthenticated: false,
      hasKnownAccount: true,
      user: null,
      session: null,
    };
    writeSession(nextSession);
    setSessionState(nextSession);
  }

  function deleteAccount() {
    writeSession(fallbackSession);
    setSessionState(fallbackSession);
  }

  return {
    ...sessionState,
    isAdmin: sessionState.user?.role === 'admin',
    signIn,
    signOut,
    deleteAccount,
  };
}
