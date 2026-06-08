import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

// Navigation is handled by AuthGuard in _layout.tsx once the nav tree is ready.
// This screen just shows a spinner while the token/session is being restored.
export default function Index() {
  const { isLoading } = useAuth();

  if (!isLoading) return null;

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
