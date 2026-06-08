import { Stack } from 'expo-router';
import useThemeColors from '@/contexts/ThemeColors';

export default function ChauffeurLayout() {
  const colors = useThemeColors();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="screens/mission-detail" />
      <Stack.Screen name="screens/historique" />
      <Stack.Screen name="screens/calculateur" />
      <Stack.Screen name="screens/partenaires" />
      <Stack.Screen name="screens/documents-legaux" />
      <Stack.Screen name="screens/mes-vehicules" />
      <Stack.Screen name="screens/mon-vehicule" />
      <Stack.Screen name="screens/ajouter-vehicule" />
    </Stack>
  );
}
