import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import ThemedScroller from 'components/ThemeScroller';
import Header, { HeaderIcon } from 'components/Header';
import ThemedText from '@/components/ThemedText';
import AnimatedView from '@/components/AnimatedView';
import Icon from '@/components/Icon';
import { Chip } from '@/components/Chip';
import { Button } from '@/components/Button';
import { shadowPresets } from '@/utils/useShadow';
import { router } from 'expo-router';
import useThemeColors from '@/contexts/ThemeColors';
import { useChauffeurMandatoryDocs } from '@/hooks/useChauffeurMandatoryDocs';
import { ChauffeurDocsBanner } from '@/components/ChauffeurDocsBanner';

const FILTRES_BOURSE = ['Disponibles', 'Mes offres', 'Échanges'];

const missionsDisponibles = [
  { id: 'B1', partenaire: 'Karim T.', heure: '09:30', depart: 'Gare Montparnasse', arrivee: 'CDG T1', km: 38, tarif: '78€', expiration: '15min', avatarColor: '#6366f1' },
  { id: 'B2', partenaire: 'Lucas M.', heure: '11:00', depart: 'Paris 15e', arrivee: 'Orly T2', km: 22, tarif: '52€', expiration: '8min', avatarColor: '#f59e0b' },
  { id: 'B3', partenaire: 'Sofia B.', heure: '13:15', depart: 'Vincennes', arrivee: 'La Défense', km: 18, tarif: '41€', expiration: '32min', avatarColor: '#22c55e' },
  { id: 'B4', partenaire: 'Mehdi K.', heure: '15:00', depart: 'Saint-Denis', arrivee: 'Roissy CDG', km: 12, tarif: '35€', expiration: '1h', avatarColor: '#ec4899' },
];

export default function Bourse() {
  const colors = useThemeColors();
  const [filtreActif, setFiltreActif] = useState('Disponibles');
  const { result: mandatoryResult, loading: mandatoryLoading } = useChauffeurMandatoryDocs();

  return (
    <>
      <Header
        title="Bourse d'échange"
        rightComponents={[<HeaderIcon icon="Plus" onPress={() => {}} />]}
      />
      <ThemedScroller>
        <AnimatedView animation="scaleIn" duration={300}>

          {/* Documents obligatoires */}
          {!mandatoryLoading && mandatoryResult && !mandatoryResult.complete && (
            <ChauffeurDocsBanner result={mandatoryResult} contextLabel="accéder à la bourse d'échange" />
          )}

          {/* Intro */}
          <View className="bg-highlight/10 rounded-2xl p-4 mb-4 flex-row items-center gap-3">
            <Icon name="RefreshCw" size={20} className="text-highlight" />
            <View className="flex-1">
              <ThemedText className="font-semibold text-highlight">Bourse en temps réel</ThemedText>
              <ThemedText className="text-xs text-subtext mt-0.5">Échangez des missions avec vos partenaires</ThemedText>
            </View>
          </View>

          {/* Filtres */}
          <View className="flex-row gap-2 mb-5">
            {FILTRES_BOURSE.map((f) => (
              <Chip
                key={f}
                label={f}
                selectable
                isSelected={filtreActif === f}
                onPress={() => setFiltreActif(f)}
                size="sm"
              />
            ))}
          </View>

          {/* Missions en bourse */}
          <View className="gap-3">
            {missionsDisponibles.map((mission) => (
              <View
                key={mission.id}
                className="bg-secondary rounded-2xl p-4"
                style={shadowPresets.medium}
              >
                {/* Partenaire + expiration */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-2">
                    <View
                      className="size-8 rounded-full items-center justify-center"
                      style={{ backgroundColor: `${mission.avatarColor}30` }}
                    >
                      <ThemedText className="text-xs font-bold" style={{ color: mission.avatarColor }}>
                        {mission.partenaire.charAt(0)}
                      </ThemedText>
                    </View>
                    <ThemedText className="font-semibold">{mission.partenaire}</ThemedText>
                  </View>
                  <View className="flex-row items-center gap-1 bg-background px-2 py-1 rounded-full">
                    <Icon name="Hourglass" size={11} className="text-subtext" />
                    <ThemedText className="text-xs text-subtext">{mission.expiration}</ThemedText>
                  </View>
                </View>

                {/* Trajet */}
                <View className="flex-row items-start gap-3 mb-3">
                  <View className="items-center gap-1 mt-1">
                    <View className="size-2 rounded-full bg-highlight" />
                    <View className="w-px h-5 bg-border" />
                    <Icon name="MapPin" size={10} className="text-subtext" />
                  </View>
                  <View className="flex-1 gap-2">
                    <ThemedText className="text-sm font-semibold">{mission.depart}</ThemedText>
                    <ThemedText className="text-sm text-subtext">{mission.arrivee}</ThemedText>
                  </View>
                  <ThemedText className="text-xl font-bold text-highlight">{mission.tarif}</ThemedText>
                </View>

                {/* Footer */}
                <View className="flex-row items-center justify-between pt-3 border-t border-border">
                  <View className="flex-row items-center gap-3">
                    <View className="flex-row items-center gap-1">
                      <Icon name="Clock" size={13} className="text-subtext" />
                      <ThemedText className="text-xs text-subtext">{mission.heure}</ThemedText>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Icon name="Route" size={13} className="text-subtext" />
                      <ThemedText className="text-xs text-subtext">{mission.km} km</ThemedText>
                    </View>
                  </View>
                  <Button title="Prendre" size="small" rounded="full" iconStart="ArrowRight" />
                </View>
              </View>
            ))}
          </View>

        </AnimatedView>
      </ThemedScroller>
    </>
  );
}
