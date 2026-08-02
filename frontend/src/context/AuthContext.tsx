import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, AuthTokens, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  login: (tokens: AuthTokens) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(() => {
    const saved = localStorage.getItem('auth_tokens');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    try {
      if (localStorage.getItem('auth_token')) {
        const profile = await api.getProfile();
        setUser(profile);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error('Failed to load user profile:', e);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = (newTokens: AuthTokens) => {
    setTokens(newTokens);
    localStorage.setItem('auth_token', newTokens.access_token);
    localStorage.setItem('refresh_token', newTokens.refresh_token);
    localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
    refreshProfile();
  };

  const logout = () => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_tokens');
    setIsLoading(false);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'PORTAL_ADMIN') return true;
    if (user.permissions?.includes('ALL') || user.permissions?.includes(permission)) return true;
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, tokens, isLoading, login, logout, refreshProfile, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
