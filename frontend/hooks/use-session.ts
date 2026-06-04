import { useEffect, useState } from 'react';

type SessionState = {
  isAuthenticated: boolean;
  hasKnownAccount: boolean;
};

const fallbackSession: SessionState = {
  isAuthenticated: false,
  hasKnownAccount: false,
};

function readSession(): SessionState {
  if (typeof localStorage === 'undefined') {
    return fallbackSession;
  }

  return {
    isAuthenticated: localStorage.getItem('truefeed:isAuthenticated') === 'true',
    hasKnownAccount: localStorage.getItem('truefeed:hasKnownAccount') === 'true',
  };
}

function writeSession(nextSession: SessionState) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem('truefeed:isAuthenticated', String(nextSession.isAuthenticated));
  localStorage.setItem('truefeed:hasKnownAccount', String(nextSession.hasKnownAccount));
  window.dispatchEvent(new Event('truefeed-session-change'));
}

export function useSession() {
  const [session, setSession] = useState<SessionState>(fallbackSession);

  useEffect(() => {
    setSession(readSession());

    if (typeof window === 'undefined') {
      return undefined;
    }

    function syncSession() {
      setSession(readSession());
    }

    window.addEventListener('storage', syncSession);
    window.addEventListener('truefeed-session-change', syncSession);

    return () => {
      window.removeEventListener('storage', syncSession);
      window.removeEventListener('truefeed-session-change', syncSession);
    };
  }, []);

  function signIn() {
    const nextSession = { isAuthenticated: true, hasKnownAccount: true };
    writeSession(nextSession);
    setSession(nextSession);
  }

  function signOut() {
    const nextSession = { isAuthenticated: false, hasKnownAccount: true };
    writeSession(nextSession);
    setSession(nextSession);
  }

  function deleteAccount() {
    writeSession(fallbackSession);
    setSession(fallbackSession);
  }

  return {
    ...session,
    signIn,
    signOut,
    deleteAccount,
  };
}
