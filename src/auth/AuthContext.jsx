import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, refreshSession, setAccessToken, setSessionLostHandler } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState({ status: 'loading', user: null });

  const startSession = useCallback((session) => {
    setAccessToken(session.access_token);
    setState({ status: 'authenticated', user: session.user });
  }, []);

  const endSession = useCallback(() => {
    setAccessToken(null);
    queryClient.clear();
    setState({ status: 'anonymous', user: null });
  }, [queryClient]);

  // Restore the session from the refresh cookie. refreshSession() is single-flight, so the
  // StrictMode double-invoke in development shares one request instead of tripping reuse detection.
  useEffect(() => {
    let cancelled = false;
    refreshSession()
      .then((session) => !cancelled && startSession(session))
      .catch(() => !cancelled && setState({ status: 'anonymous', user: null }));
    return () => {
      cancelled = true;
    };
  }, [startSession]);

  useEffect(() => setSessionLostHandler(endSession), [endSession]);

  const value = useMemo(
    () => ({
      ...state,
      login: async (credentials) => startSession(await api.login(credentials)),
      register: async (details) => startSession(await api.register(details)),
      logout: async () => {
        try {
          await api.logout();
        } finally {
          endSession();
        }
      },
    }),
    [state, startSession, endSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
