'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { getToken, authApi, UserProfile } from '@/lib/api';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  logout: () => void;
  setUser: (user: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Vérifier si on a un token dès le chargement initial
const hasTokenOnLoad = () => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('vtc_token');
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Attendre que le router soit prêt
    if (!router.isReady) return;
    
    // Ne s'exécuter qu'une seule fois
    if (isInitialized) return;

    const checkAuth = async () => {
      // Pages publiques (pas besoin d'auth)
      const publicPages = ['/login'];
      const isPublicPage = publicPages.includes(router.pathname);

      // Vérification synchrone du token
      const token = getToken();
      
      if (!token) {
        if (!isPublicPage) {
          // Rester en loading pendant la redirection
          await router.replace('/login');
        }
        setLoading(false);
        setIsInitialized(true);
        return;
      }

      // Si on a un token, vérifier qu'il est valide
      try {
        const userData = await authApi.me();
        setUser(userData.user);
        
        // Si déjà authentifié et sur /login, rediriger vers dashboard
        if (isPublicPage) {
          await router.replace('/');
        }
        
        setLoading(false);
        setIsInitialized(true);
      } catch (error) {
        // Token invalide ou expiré
        console.error('Auth check failed:', error);
        localStorage.removeItem('vtc_token');
        setUser(null);
        
        if (!isPublicPage) {
          await router.replace('/login');
        }
        
        setLoading(false);
        setIsInitialized(true);
      }
    };

    checkAuth();
  }, [router.isReady, isInitialized]);

  const logout = () => {
    localStorage.removeItem('vtc_token');
    setUser(null);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
