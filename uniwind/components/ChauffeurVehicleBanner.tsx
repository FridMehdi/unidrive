import React from 'react';
import { View, TouchableOpacity, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';

interface Props {
  hasVehicles: boolean;
}

export function ChauffeurVehicleBanner({ hasVehicles }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Couleurs adaptatives selon le thème
  const textColor = isDark ? '#ffffff' : '#2563eb';
  const subtextColor = isDark ? '#ffffff90' : '#2563eb90';
  const iconColor = isDark ? '#ffffff' : '#3b82f6';
  const bgColor = isDark ? '#3b82f630' : '#3b82f615';
  
  // Si le chauffeur a déjà des véhicules, ne rien afficher
  if (hasVehicles) return null;

  return (
    <View className="p-4 rounded-2xl mb-5" style={{ backgroundColor: bgColor }}>
      {/* En-tête */}
      <View className="flex-row items-center gap-3 mb-3">
        <Icon name="Truck" size={18} color={iconColor} />
        <View className="flex-1">
          <ThemedText className="font-semibold text-sm" style={{ color: textColor }}>
            Véhicules non renseignés
          </ThemedText>
          <ThemedText className="text-xs mt-0.5" style={{ color: subtextColor }}>
            Ajoutez au moins un véhicule pour pouvoir accepter des missions.
          </ThemedText>
        </View>
      </View>

      {/* Message d'encouragement */}
      <View className="pl-7 mb-3">
        <ThemedText className="text-xs" style={{ color: textColor }}>
          • Informations du véhicule (marque, modèle, immatriculation)
        </ThemedText>
        <ThemedText className="text-xs mt-1" style={{ color: textColor }}>
          • Documents obligatoires (carte grise, assurance, contrôle technique)
        </ThemedText>
      </View>

      {/* Lien */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push('/chauffeur/screens/mes-vehicules')}
        className="flex-row items-center gap-1 pl-7"
      >
        <ThemedText className="text-xs font-semibold" style={{ color: textColor }}>
          Ajouter un véhicule
        </ThemedText>
        <Icon name="ArrowRight" size={12} color={iconColor} />
      </TouchableOpacity>
    </View>
  );
}
