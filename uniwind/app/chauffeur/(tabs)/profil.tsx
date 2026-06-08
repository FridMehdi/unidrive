import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { View, Switch, TouchableOpacity } from 'react-native';
import ListLink from '@/components/ListLink';
import ThemedScroller from 'components/ThemeScroller';
import Header from 'components/Header';
import ThemedText from '@/components/ThemedText';
import AnimatedView from '@/components/AnimatedView';
import Icon from '@/components/Icon';
import Avatar from '@/components/Avatar';
import { shadowPresets } from '@/utils/useShadow';
import { useTheme } from '@/contexts/ThemeContext';
import useThemeColors from '@/contexts/ThemeColors';
import { useAuth } from '@/contexts/AuthContext';
import { chauffeurProfileApi, type ChauffeurProfile } from '@/services/api';

export default function ProfilChauffeur() {
  const { theme, toggleTheme } = useTheme();
  const colors = useThemeColors();
  const isDark = theme === 'dark';
  const { user, token, logout } = useAuth();
  const fullName = user ? `${user.first_name} ${user.last_name}` : 'Chauffeur VTC';
  
  const [profile, setProfile] = useState<ChauffeurProfile | null>(null);
  
  useEffect(() => {
    if (token) {
      chauffeurProfileApi.me(token)
        .then(setProfile)
        .catch(() => {});
    }
  }, [token]);
  
  const isInterne = profile?.type_chauffeur === 'interne';

  const handleLogout = async () => {
    await logout();
    router.replace('/screens/auth/login' as any);
  };

  return (
    <>
      <Header title="Profil" />
      <ThemedScroller>
        <AnimatedView animation="scaleIn" duration={300}>

          {/* Avatar + infos */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/screens/edit-profile' as any)}
          >
            <View className="items-center py-8">
              <Avatar name={fullName} size="xl" className="mb-3" />
              <ThemedText className="text-xl font-bold">{fullName}</ThemedText>
              <ThemedText className="text-sm text-subtext mt-1">{user?.email ?? 'Chauffeur VTC'}</ThemedText>
              <View className="flex-row items-center gap-1 mt-2">
                <Icon name="Pencil" size={12} className="text-highlight" />
                <ThemedText className="text-xs" style={{ color: colors.highlight }}>Modifier le profil</ThemedText>
              </View>
            </View>
          </TouchableOpacity>

          {/* Mon compte */}
          <ThemedText className="text-sm font-semibold text-subtext mb-2 px-2">MON COMPTE</ThemedText>
          <View className="bg-secondary rounded-2xl overflow-hidden mb-4" style={shadowPresets.medium}>
            <ListLink icon="User" title="Modifier le profil" href="/screens/edit-profile" showChevron hasBorder={!isInterne} />
            {/* Documents et véhicules : uniquement pour chauffeurs indépendants */}
            {!isInterne && (
              <>
                <ListLink icon="Shield" title="Documents légaux" description="Carte VTC, assurance…" onPress={() => router.push('/chauffeur/screens/documents-legaux' as any)} showChevron hasBorder />
                <ListLink icon="Car" title="Mes véhicules" description="Gérer mes véhicules (max 2)" onPress={() => router.push('/chauffeur/screens/mes-vehicules' as any)} showChevron />
              </>
            )}
          </View>

          {/* Paramètres */}
          <ThemedText className="text-sm font-semibold text-subtext mb-2 px-2">PARAMÈTRES</ThemedText>
          <View className="bg-secondary rounded-2xl overflow-hidden mb-4" style={shadowPresets.medium}>
            <ListLink icon="Bell" title="Notifications" href="/screens/notification-settings" showChevron hasBorder />
            <ListLink icon="Globe" title="Langue" href="/screens/languages" showChevron hasBorder />
            {/* Thème avec toggle */}
            <View className="flex-row items-center justify-between px-4 py-3">
              <View className="flex-row items-center gap-3">
                <View className="size-8 rounded-lg bg-highlight/10 items-center justify-center">
                  <Icon name={isDark ? 'Moon' : 'Sun'} size={16} className="text-highlight" />
                </View>
                <View>
                  <ThemedText className="text-sm font-medium">Thème</ThemedText>
                  <ThemedText className="text-xs text-subtext">{isDark ? 'Mode sombre' : 'Mode clair'}</ThemedText>
                </View>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.highlight }}
                thumbColor={isDark ? '#fff' : '#fff'}
              />
            </View>
          </View>

          {/* Support */}
          <ThemedText className="text-sm font-semibold text-subtext mb-2 px-2">SUPPORT</ThemedText>
          <View className="bg-secondary rounded-2xl overflow-hidden mb-4" style={shadowPresets.medium}>
            <ListLink icon="HelpCircle" title="Aide & FAQ" href="/screens/help" showChevron hasBorder />
            <ListLink icon="LogOut" title="Déconnexion" onPress={handleLogout} showChevron />
          </View>

        </AnimatedView>
      </ThemedScroller>
    </>
  );
}
