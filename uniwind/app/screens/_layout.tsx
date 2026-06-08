import { Stack } from 'expo-router';
import useThemeColors from '@/contexts/ThemeColors';

export default function ScreensLayout() {
  const colors = useThemeColors();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="auth/role-select" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/register" />
      <Stack.Screen name="auth/forgot-password" />
    </Stack>
  );
}
