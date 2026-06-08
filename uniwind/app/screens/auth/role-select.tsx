import React from 'react';
import { View, StatusBar, ImageBackground } from 'react-native';
import ThemedText from '@/components/ThemedText';
import AnimatedView from '@/components/AnimatedView';
import Icon from '@/components/Icon';
import { Button } from '@/components/Button';
import { shadowPresets } from '@/utils/useShadow';
import useThemeColors from '@/contexts/ThemeColors';
import { router } from 'expo-router';

export default function RoleSelect() {
  const colors = useThemeColors();

  return (
    <View className="flex-1 bg-background">
      <StatusBar barStyle="light-content" />

      {/* Hero */}
      <View className="flex-1 items-center justify-center px-8" style={{ backgroundColor: colors.highlight }}>
        <AnimatedView animation="scaleIn" duration={500} className="items-center">
          <View className="size-24 rounded-3xl bg-white/20 items-center justify-center mb-6" style={shadowPresets.large}>
            <Icon name="Car" size={44} color="#fff" />
          </View>
          <ThemedText className="text-4xl font-outfit-bold text-center" style={{ color: '#fff' }}>
            Uniwind VTC
          </ThemedText>
          <ThemedText className="text-base text-center mt-2" style={{ color: 'rgba(255,255,255,0.75)' }}>
            La solution professionnelle{'\n'}pour votre activité VTC
          </ThemedText>

          {/* Badges */}
          <View className="flex-row gap-3 mt-8">
            {['Missions', 'Facturation', 'Statistiques'].map((label) => (
              <View key={label} className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                <Icon name="Check" size={11} color="rgba(255,255,255,0.9)" />
                <ThemedText className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>{label}</ThemedText>
              </View>
            ))}
          </View>
        </AnimatedView>
      </View>

      {/* Bas — bouton de login */}
      <View className="bg-background px-global pt-8 pb-10 gap-4">
        <AnimatedView animation="scaleIn" duration={400}>

          <ThemedText className="text-2xl font-bold mb-1">Bienvenue 👋</ThemedText>
          <ThemedText className="text-sm text-subtext mb-6">
            Connectez-vous à votre espace chauffeur
          </ThemedText>

          {/* Bouton Chauffeur */}
          <View
            className="bg-secondary rounded-2xl p-4 mb-3 flex-row items-center gap-4"
            style={shadowPresets.medium}
          >
            <View className="size-12 rounded-xl items-center justify-center" style={{ backgroundColor: '#6366f115' }}>
              <Icon name="Car" size={22} style={{ color: '#6366f1' }} />
            </View>
            <View className="flex-1">
              <ThemedText className="font-bold text-base">Espace Chauffeur</ThemedText>
              <ThemedText className="text-xs text-subtext mt-0.5">Missions, revenus, documents</ThemedText>
            </View>
            <Button
              title="Accéder"
              rounded="xl"
              onPress={() => router.push({ pathname: '/screens/auth/login' as any, params: { role: 'chauffeur' } })}
              style={{ backgroundColor: '#6366f1' }}
            />
          </View>

          <ThemedText className="text-center text-xs text-subtext mt-6">
            © 2026 Uniwind VTC
          </ThemedText>

        </AnimatedView>
      </View>
    </View>
  );
}
