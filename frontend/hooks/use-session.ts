import { useEffect, useState } from 'react';

import type { AuthResponse, AuthSession, AuthUser } from '@/services/api/auth';
import {
  clearStoredSession,
  emptySessionState,
  readStoredSession,
  writeStoredSession,
} from '@/services/session-storage';

type SessionState = {
  isAuthenticated: boolean;
  hasKnownAccount: boolean;
  user: AuthUser | null;
  session: AuthSession | null;
};

const fallbackSession: SessionState = {
  ...emptySessionState,
};

export function useSession() {
  const [sessionState, setSessionState] = useState<SessionState>(fallbackSession);

  useEffect(() => {
    readStoredSession().then(setSessionState).catch(() => setSessionState(fallbackSession));

    if (typeof window === 'undefined') {
      return undefined;
    }

    function syncSession() {
      readStoredSession().then(setSessionState).catch(() => setSessionState(fallbackSession));
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
    writeStoredSession(nextSession);
    setSessionState(nextSession);
  }

  function signOut() {
    const nextSession = {
      isAuthenticated: false,
      hasKnownAccount: true,
      user: null,
      session: null,
    };
    writeStoredSession(nextSession);
    setSessionState(nextSession);
  }

  function deleteAccount() {
    clearStoredSession(false);
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
