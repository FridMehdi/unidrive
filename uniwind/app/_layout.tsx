import '../global.css';
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform } from 'react-native';
import useThemeColors from '@/contexts/ThemeColors';
import * as Notifications from 'expo-notifications';

// Must be called at module level — tells iOS/Android to show notifications while app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// AuthGuard runs INSIDE the navigation tree, so router/segments are safe to use.
function AuthGuard() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthScreens =
      segments[0] === 'screens' && segments[1] === 'auth';
    const inRoleSpace =
      segments[0] === 'chauffeur' ||
      (segments[0] === 'screens' && segments[1] !== 'auth');

    if (!isAuthenticated && !inAuthScreens) {
      router.replace('/screens/auth/login' as any);
    } else if (isAuthenticated && user && !inRoleSpace) {
      // covers: index screen after session restore, and any auth screen after login
      router.replace('/chauffeur' as any);
    }
  }, [isLoading, isAuthenticated, user, segments]);

  return null;
}

function RootLayoutNav() {
  const colors = useThemeColors();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(drawer)" />
      <Stack.Screen name="screens" />
      <Stack.Screen name="chauffeur" />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(n => {
      console.log('[Notif] Reçue en foreground:', n.request.content.title, n.request.content.body);
    });
    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView className={`bg-background ${Platform.OS === 'ios' ? 'pb-0 ' : ''}`} style={{ flex: 1 }}>
      <AuthProvider>
        <ThemeProvider>
          <RootLayoutNav />
          <AuthGuard />
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
