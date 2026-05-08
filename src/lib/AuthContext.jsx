import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { dataService } from '@/services';
import { shouldUseSupabase, supabase } from '@/api/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Stable reference — safe to use in dependency arrays and Supabase subscriptions.
  const checkAppState = useCallback(async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const currentUser = await dataService.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      const msg = String(error?.message || '');
      // 'Not signed in' is the expected unauthenticated state, not an error.
      // Only surface real errors (network failure, permission denied, etc.).
      if (msg !== 'Not signed in') {
        setAuthError({ type: 'auth_error', message: msg });
      }
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
    setIsLoadingAuth(false);
    await dataService.auth.logout();
  }, []);

  // Run once on mount.
  useEffect(() => {
    checkAppState();
  }, [checkAppState]);

  // Keep context in sync with Supabase auth state changes (tab focus, token
  // refresh, sign-out from another tab, etc.).
  useEffect(() => {
    if (!shouldUseSupabase || !supabase) return;

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null);
        setIsAuthenticated(false);
        setAuthError(null);
        setIsLoadingAuth(false);
        return;
      }
      checkAppState();
    });

    return () => data.subscription.unsubscribe();
  }, [checkAppState]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoadingAuth, authError, logout, checkAppState }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
