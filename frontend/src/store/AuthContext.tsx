// ============================================================================
// Gemba Management System - Authentication Context
// ============================================================================

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import type { ReactNode } from 'react';
import { api } from '../api/client';
import type { User } from '../types';

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

const TOKEN_KEY = 'gemba_token';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY),
  );
  const [loading, setLoading] = useState<boolean>(!!localStorage.getItem(TOKEN_KEY));

  // Fetch current user when a token is present on mount
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    // Ensure the API client knows about the stored token
    api.setToken(token);

    let cancelled = false;

    const fetchUser = async () => {
      try {
        const response = await api.getMe();
        if (!cancelled) {
          setUser(response.data);
        }
      } catch {
        // Token is invalid or expired – clear it
        if (!cancelled) {
          localStorage.removeItem(TOKEN_KEY);
          api.clearToken();
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchUser();

    return () => {
      cancelled = true;
    };
  }, [token]);

  // ---- Login -------------------------------------------------------------

  const login = useCallback(async (username: string, password: string) => {
    const response = await api.login(username, password);
    const { token: newToken, user: loggedInUser } = response.data;

    // Persist token
    localStorage.setItem(TOKEN_KEY, newToken);
    api.setToken(newToken);

    setToken(newToken);
    setUser(loggedInUser);
  }, []);

  // ---- Logout ------------------------------------------------------------

  const logout = useCallback(() => {
    // Fire-and-forget server-side logout
    api.logout().catch(() => {
      // Ignore errors – we clear local state regardless
    });

    localStorage.removeItem(TOKEN_KEY);
    api.clearToken();
    setToken(null);
    setUser(null);
  }, []);

  // ---- Memoised value ----------------------------------------------------

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!user && !!token,
      loading,
      login,
      logout,
    }),
    [user, token, loading, login, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
