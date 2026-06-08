import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import Header from 'components/Header';
import ThemedText from '@/components/ThemedText';
import AnimatedView from '@/components/AnimatedView';
import Icon from '@/components/Icon';
import { Button } from '@/components/Button';
import { shadowPresets } from '@/utils/useShadow';
import useThemeColors from '@/contexts/ThemeColors';
import { useAuth } from '@/contexts/AuthContext';
import { chauffeurProfileApi, vehicleApi, type Vehicle } from '@/services/api';

export default function AjouterVehicule() {
  const colors = useThemeColors();
  const { token } = useAuth();

  const [loading, setLoading] = useState(false);
  
  // Form state
  const [marque, setMarque] = useState('');
  const [modele, setModele] = useState('');
  const [immat, setImmat] = useState('');
  const [annee, setAnnee] = useState('');
  const [couleur, setCouleur] = useState('');
  const [kilometrage, setKilometrage] = useState('');
  const [dateCT, setDateCT] = useState('');
  const [dateAssurance, setDateAssurance] = useState('');
  const [notes, setNotes] = useState('');

  const inputStyle = {
    backgroundColor: colors.bg,
    color: colors.text,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  } as const;

  const handleSubmit = async () => {
    // Validation
    if (!marque.trim() || !modele.trim() || !immat.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir au minimum la marque, le modèle et l\'immatriculation.');
      return;
    }

    if (!token) {
      Alert.alert('Erreur', 'Vous devez être connecté');
      return;
    }

    setLoading(true);
    try {
      // Get chauffeur profile to get ID
      const profile = await chauffeurProfileApi.me(token);

      // Create vehicle
      const vehicleData: Partial<Vehicle> = {
        marque: marque.trim(),
        modele: modele.trim(),
        immat: immat.trim().toUpperCase(),
        annee: annee ? parseInt(annee) : undefined,
        couleur: couleur.trim() || undefined,
        kilometrage: kilometrage ? parseInt(kilometrage.replace(/\s/g, '')) : undefined,
        date_ct: dateCT ? formatDateForAPI(dateCT) : undefined,
        date_assurance: dateAssurance ? formatDateForAPI(dateAssurance) : undefined,
        notes: notes.trim() || undefined,
        statut: 'disponible',
        owner_type: 'chauffeur',
        owner_id: profile.id,
        created_by: profile.user_id || undefined,
      };

      await vehicleApi.create(vehicleData, token);

      Alert.alert(
        'Succès',
        'Votre véhicule a été ajouté. Un gestionnaire devra valider votre véhicule avant que vous puissiez recevoir des missions.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Impossible d\'ajouter le véhicule');
    } finally {
      setLoading(false);
    }
  };

  function formatDateForAPI(dateStr: string): string {
    // Convert DD/MM/YYYY to YYYY-MM-DD
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  }

  return (
    <>
      <Header title="Ajouter un véhicule" showBackButton />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <AnimatedView animation="fadeIn" duration={400}>
            {/* Info banner */}
            <View
              className="bg-secondary rounded-2xl p-4 mb-6 flex-row gap-3"
              style={shadowPresets.small}
            >
              <Icon name="Info" size={20} color={colors.highlight} />
              <View className="flex-1">
                <ThemedText className="text-sm text-subtext">
                  Vous pouvez ajouter jusqu'à <ThemedText className="font-bold">2 véhicules</ThemedText>.
                  Après validation par un gestionnaire, vous pourrez recevoir des missions avec ce véhicule.
                </ThemedText>
              </View>
            </View>

            {/* Form */}
            <View className="bg-secondary rounded-2xl p-5 mb-4" style={shadowPresets.medium}>
              <View className="flex-row items-center gap-2 mb-4">
                <Icon name="Car" size={20} className="text-highlight" />
                <ThemedText className="text-base font-semibold">Informations du véhicule</ThemedText>
              </View>

              {/* Marque */}
              <View className="mb-4">
                <ThemedText className="text-sm font-medium mb-2">
                  Marque <ThemedText className="text-error">*</ThemedText>
                </ThemedText>
                <TextInput
                  style={inputStyle}
                  placeholder="Mercedes, BMW, Audi..."
                  placeholderTextColor={colors.subtext}
                  value={marque}
                  onChangeText={setMarque}
                  autoCapitalize="words"
                />
              </View>

              {/* Modèle */}
              <View className="mb-4">
                <ThemedText className="text-sm font-medium mb-2">
                  Modèle <ThemedText className="text-error">*</ThemedText>
                </ThemedText>
                <TextInput
                  style={inputStyle}
                  placeholder="Classe E, Série 5, A6..."
                  placeholderTextColor={colors.subtext}
                  value={modele}
                  onChangeText={setModele}
                  autoCapitalize="words"
                />
              </View>

              {/* Immatriculation */}
              <View className="mb-4">
                <ThemedText className="text-sm font-medium mb-2">
                  Immatriculation <ThemedText className="text-error">*</ThemedText>
                </ThemedText>
                <TextInput
                  style={inputStyle}
                  placeholder="AB-123-CD"
                  placeholderTextColor={colors.subtext}
                  value={immat}
                  onChangeText={setImmat}
                  autoCapitalize="characters"
                />
              </View>

              {/* Row: Année + Couleur */}
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <ThemedText className="text-sm font-medium mb-2">Année</ThemedText>
                  <TextInput
                    style={inputStyle}
                    placeholder="2020"
                    placeholderTextColor={colors.subtext}
                    value={annee}
                    onChangeText={setAnnee}
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                </View>
                <View className="flex-1">
                  <ThemedText className="text-sm font-medium mb-2">Couleur</ThemedText>
                  <TextInput
                    style={inputStyle}
                    placeholder="Noir"
                    placeholderTextColor={colors.subtext}
                    value={couleur}
                    onChangeText={setCouleur}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Kilométrage */}
              <View className="mb-4">
                <ThemedText className="text-sm font-medium mb-2">Kilométrage (km)</ThemedText>
                <TextInput
                  style={inputStyle}
                  placeholder="75000"
                  placeholderTextColor={colors.subtext}
                  value={kilometrage}
                  onChangeText={setKilometrage}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {/* Dates réglementaires */}
            <View className="bg-secondary rounded-2xl p-5 mb-4" style={shadowPresets.medium}>
              <View className="flex-row items-center gap-2 mb-4">
                <Icon name="Calendar" size={20} className="text-highlight" />
                <ThemedText className="text-base font-semibold">Dates réglementaires</ThemedText>
              </View>

              {/* Contrôle technique */}
              <View className="mb-4">
                <ThemedText className="text-sm font-medium mb-2">
                  Contrôle technique
                </ThemedText>
                <TextInput
                  style={inputStyle}
                  placeholder="31/12/2025 (JJ/MM/AAAA)"
                  placeholderTextColor={colors.subtext}
                  value={dateCT}
                  onChangeText={setDateCT}
                  keyboardType="numbers-and-punctuation"
                />
              </View>

              {/* Assurance */}
              <View className="mb-4">
                <ThemedText className="text-sm font-medium mb-2">
                  Assurance
                </ThemedText>
                <TextInput
                  style={inputStyle}
                  placeholder="31/12/2025 (JJ/MM/AAAA)"
                  placeholderTextColor={colors.subtext}
                  value={dateAssurance}
                  onChangeText={setDateAssurance}
                  keyboardType="numbers-and-punctuation"
                />
              </View>

              <View
                className="p-3 rounded-xl flex-row gap-2"
                style={{ backgroundColor: colors.highlight + '15' }}
              >
                <Icon name="AlertCircle" size={16} color={colors.highlight} style={{ marginTop: 2 }} />
                <ThemedText className="text-xs flex-1" style={{ color: colors.highlight }}>
                  Vous devrez uploader les documents justificatifs (carte grise, assurance, CT) après avoir créé le véhicule.
                </ThemedText>
              </View>
            </View>

            {/* Notes */}
            <View className="bg-secondary rounded-2xl p-5 mb-6" style={shadowPresets.medium}>
              <View className="flex-row items-center gap-2 mb-4">
                <Icon name="FileText" size={20} className="text-highlight" />
                <ThemedText className="text-base font-semibold">Notes (optionnel)</ThemedText>
              </View>

              <TextInput
                style={[inputStyle, { minHeight: 80, textAlignVertical: 'top' }]}
                placeholder="Informations complémentaires..."
                placeholderTextColor={colors.subtext}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Submit button */}
            <Button
              title={loading ? 'Ajout en cours...' : 'Ajouter le véhicule'}
              onPress={handleSubmit}
              disabled={loading}
              loading={loading}
              iconStart={loading ? undefined : 'Plus'}
              style={{ marginBottom: 20 }}
            />

            {/* Disclaimer */}
            <View className="px-4">
              <ThemedText className="text-xs text-subtext text-center">
                En ajoutant ce véhicule, vous certifiez être en possession de tous les documents nécessaires et que les informations fournies sont exactes.
              </ThemedText>
            </View>
          </AnimatedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
