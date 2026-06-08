import React from 'react';
import { View, TouchableOpacity, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';

interface Props {
  vehicleId: string;
  vehicleName?: string;
}

export function ChauffeurVehicleDocsBanner({ vehicleId, vehicleName }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Couleurs adaptatives selon le thème - Orange comme le banner de documents
  const textColor = isDark ? '#ffffff' : '#ea580c';
  const subtextColor = isDark ? '#ffffff90' : '#ea580c90';
  const iconColor = isDark ? '#ffffff' : '#f97316';
  const bgColor = isDark ? '#f9731630' : '#f9731615';

  return (
    <View className="p-4 rounded-2xl mb-5" style={{ backgroundColor: bgColor }}>
      {/* En-tête */}
      <View className="flex-row items-center gap-3 mb-3">
        <Icon name="FileWarning" size={18} color={iconColor} />
        <View className="flex-1">
          <ThemedText className="font-semibold text-sm" style={{ color: textColor }}>
            Documents véhicule manquants
          </ThemedText>
          <ThemedText className="text-xs mt-0.5" style={{ color: subtextColor }}>
            {vehicleName ? `Complétez les documents de votre ${vehicleName}` : 'Complétez les documents de votre véhicule'}
          </ThemedText>
        </View>
      </View>

      {/* Message d'encouragement */}
      <View className="pl-7 mb-3">
        <ThemedText className="text-xs" style={{ color: textColor }}>
          • Carte grise
        </ThemedText>
        <ThemedText className="text-xs mt-1" style={{ color: textColor }}>
          • Attestation d'assurance
        </ThemedText>
        <ThemedText className="text-xs mt-1" style={{ color: textColor }}>
          • Contrôle technique
        </ThemedText>
      </View>

      {/* Lien */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push(`/chauffeur/screens/mon-vehicule?id=${vehicleId}` as any)}
        className="flex-row items-center gap-1 pl-7"
      >
        <ThemedText className="text-xs font-semibold" style={{ color: textColor }}>
          Ajouter les documents
        </ThemedText>
        <Icon name="ArrowRight" size={12} color={iconColor} />
      </TouchableOpacity>
    </View>
  );
}
