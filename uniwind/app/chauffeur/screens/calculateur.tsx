import React, { useState } from 'react';
import { View, TextInput } from 'react-native';
import ThemedScroller from 'components/ThemeScroller';
import Header from 'components/Header';
import ThemedText from '@/components/ThemedText';
import AnimatedView from '@/components/AnimatedView';
import Icon from '@/components/Icon';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import ProgressBar from '@/components/ProgressBar';
import { shadowPresets } from '@/utils/useShadow';
import useThemeColors from '@/contexts/ThemeColors';

const TYPES_MISSION = ['Standard', 'Aéroport', 'VIP', 'Nuit'];

export default function Calculateur() {
  const colors = useThemeColors();
  const [km, setKm] = useState('');
  const [type, setType] = useState('Standard');
  const [duree, setDuree] = useState('');
  const [resultat, setResultat] = useState<null | { tarif: number; frais: number; net: number; rentabilite: number }>(null);

  const calculer = () => {
    const distKm = parseFloat(km) || 0;
    const dureeMin = parseFloat(duree) || 0;
    const multiplicateurs = { Standard: 1, Aéroport: 1.2, VIP: 1.5, Nuit: 1.3 };
    const base = distKm * 1.8 + dureeMin * 0.4;
    const tarif = Math.round(base * (multiplicateurs[type as keyof typeof multiplicateurs] || 1));
    const frais = Math.round(distKm * 0.22 + 3);
    const net = tarif - frais;
    const rentabilite = Math.round((net / tarif) * 100);
    setResultat({ tarif, frais, net, rentabilite });
  };

  return (
    <>
      <Header title="Calculateur de tarif" showBackButton />
      <ThemedScroller>
        <AnimatedView animation="scaleIn" duration={300}>

          {/* Formulaire */}
          <View className="bg-secondary rounded-2xl p-4 mt-5 mb-4" style={shadowPresets.medium}>
            <ThemedText className="text-xs text-subtext mb-3 font-semibold uppercase tracking-wide">Paramètres de la mission</ThemedText>

            {/* Km */}
            <View className="mb-4">
              <ThemedText className="text-sm font-semibold mb-2">Distance (km)</ThemedText>
              <View className="flex-row items-center bg-background rounded-xl px-3 py-2 border border-border gap-2">
                <Icon name="Route" size={16} className="text-subtext" />
                <TextInput
                  value={km}
                  onChangeText={setKm}
                  keyboardType="numeric"
                  placeholder="Ex: 35"
                  placeholderTextColor={colors.subtext}
                  className="flex-1 text-text"
                  style={{ color: colors.text }}
                />
                <ThemedText className="text-sm text-subtext">km</ThemedText>
              </View>
            </View>

            {/* Durée */}
            <View className="mb-4">
              <ThemedText className="text-sm font-semibold mb-2">Durée estimée (min)</ThemedText>
              <View className="flex-row items-center bg-background rounded-xl px-3 py-2 border border-border gap-2">
                <Icon name="Clock" size={16} className="text-subtext" />
                <TextInput
                  value={duree}
                  onChangeText={setDuree}
                  keyboardType="numeric"
                  placeholder="Ex: 45"
                  placeholderTextColor={colors.subtext}
                  className="flex-1"
                  style={{ color: colors.text }}
                />
                <ThemedText className="text-sm text-subtext">min</ThemedText>
              </View>
            </View>

            {/* Type */}
            <View className="mb-4">
              <ThemedText className="text-sm font-semibold mb-2">Type de mission</ThemedText>
              <View className="flex-row gap-2 flex-wrap">
                {TYPES_MISSION.map((t) => (
                  <Chip
                    key={t}
                    label={t}
                    selectable
                    isSelected={type === t}
                    onPress={() => setType(t)}
                    size="sm"
                  />
                ))}
              </View>
            </View>

            <Button title="Calculer" onPress={calculer} iconEnd="Calculator" />
          </View>

          {/* Résultat */}
          {resultat && (
            <AnimatedView animation="scaleIn" duration={250}>
              <View className="bg-secondary rounded-2xl p-4 mb-4" style={shadowPresets.medium}>
                <ThemedText className="text-xs text-subtext mb-4 font-semibold uppercase tracking-wide">Résultat</ThemedText>

                <View className="flex-row gap-3 mb-5">
                  <View className="flex-1 bg-background rounded-xl p-3 items-center">
                    <ThemedText className="text-2xl font-bold text-highlight">{resultat.tarif}€</ThemedText>
                    <ThemedText className="text-xs text-subtext mt-1">Tarif à appliquer</ThemedText>
                  </View>
                  <View className="flex-1 bg-background rounded-xl p-3 items-center">
                    <ThemedText className="text-2xl font-bold" style={{ color: '#22c55e' }}>{resultat.net}€</ThemedText>
                    <ThemedText className="text-xs text-subtext mt-1">Bénéfice net</ThemedText>
                  </View>
                </View>

                <View className="mb-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <ThemedText className="text-sm font-semibold">Rentabilité</ThemedText>
                    <ThemedText className="text-sm font-bold text-highlight">{resultat.rentabilite}%</ThemedText>
                  </View>
                  <ProgressBar progress={resultat.rentabilite / 100} />
                </View>

                <View className="bg-background rounded-xl p-3">
                  <View className="flex-row justify-between">
                    <ThemedText className="text-sm text-subtext">Carburant & usure estimés</ThemedText>
                    <ThemedText className="text-sm" style={{ color: '#ef4444' }}>-{resultat.frais}€</ThemedText>
                  </View>
                </View>
              </View>
            </AnimatedView>
          )}

        </AnimatedView>
      </ThemedScroller>
    </>
  );
}
