import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { authApi, userApi, notificationApi, type AuthUser, type RegisterPayload } from '@/services/api';

const TOKEN_KEY = '@uniwind:token';
const PUSH_TOKEN_KEY = '@uniwind:push_token';

// Obtenir le token Expo push (demande la permission si pas encore accordée)
async function getExpoPushToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      console.log('[Push] Pas un vrai device — notifications ignorées');
      return null;
    }
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('[Push] Permission refusée :', finalStatus);
      return null;
    }
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) {
      console.log('[Push] projectId manquant dans app.json');
      return null;
    }
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log('[Push] Token obtenu :', data);
    return data;
  } catch (e) {
    console.log('[Push] Erreur getExpoPushToken :', e);
    return null;
  }
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  registerOtp: (phone: string, otp: string) => Promise<AuthUser>;
  updateProfile: (data: { first_name?: string; last_name?: string; phone?: string }) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pushTokenRef = useRef<string | null>(null);

  // ── Enregistrer push token après authentification ───────────────────────
  async function registerPushToken(authToken: string) {
    try {
      const pushToken = await getExpoPushToken();
      if (!pushToken) return;
      pushTokenRef.current = pushToken;
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, pushToken);
      await notificationApi.registerDeviceToken(
        pushToken,
        Platform.OS === 'ios' ? 'ios' : 'android',
        authToken
      );
      console.log('[Push] Token enregistré:', pushToken);
    } catch (e) {
      console.log('[Push] Échec enregistrement:', e);
    }
  }

  async function unregisterPushToken(authToken: string) {
    try {
      const stored = pushTokenRef.current ?? await AsyncStorage.getItem(PUSH_TOKEN_KEY);
      if (!stored) return;
      await notificationApi.unregisterDeviceToken(stored, authToken);
      await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
      pushTokenRef.current = null;
    } catch (e) {
      console.log('[Push] Échec désinscription:', e);
    }
  }

  // Restore session on startup
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(TOKEN_KEY);
        if (stored) {
          try {
            const { user: me } = await authApi.me(stored);
            setToken(stored);
            setUser(me);
            registerPushToken(stored);
          } catch (error: any) {
            // Si le token est invalide ou expiré, le supprimer
            console.log('Token invalide ou expiré, nettoyage...');
            await AsyncStorage.removeItem(TOKEN_KEY);
            setToken(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la restauration de session:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Returns the logged-in user so the caller can navigate
  const login = async (email: string, password: string): Promise<AuthUser> => {
    const { user: u, token: t } = await authApi.login(email, password);
    await AsyncStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    setUser(u);
    registerPushToken(t);
    return u;
  };

  const register = async (payload: RegisterPayload): Promise<AuthUser> => {
    const { user: u, token: t } = await authApi.register(payload);
    await AsyncStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    setUser(u);
    registerPushToken(t);
    return u;
  };

  const registerOtp = async (phone: string, otp: string): Promise<AuthUser> => {
    const { user: u, token: t } = await authApi.verifyOtp(phone, otp);
    await AsyncStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    setUser(u);
    registerPushToken(t);
    return u;
  };

  const updateProfile = async (data: { first_name?: string; last_name?: string; phone?: string }): Promise<AuthUser> => {
    if (!token) throw new Error('Non authentifié');
    const updated = await userApi.updateProfile(token, data);
    setUser(updated);
    return updated;
  };

  const logout = async () => {
    if (token) await unregisterPushToken(token);
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    // caller is responsible for navigating
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated: !!user, login, register, registerOtp, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export type { AuthUser as Profile };
