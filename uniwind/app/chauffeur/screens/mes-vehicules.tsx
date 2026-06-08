import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Header from 'components/Header';
import ThemedText from '@/components/ThemedText';
import AnimatedView from '@/components/AnimatedView';
import Icon from '@/components/Icon';
import { Button } from '@/components/Button';
import { shadowPresets } from '@/utils/useShadow';
import useThemeColors from '@/contexts/ThemeColors';
import { useAuth } from '@/contexts/AuthContext';
import { chauffeurProfileApi, vehicleApi, type Vehicle } from '@/services/api';

// ─── Helper Functions ────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getStatutConfig(statut: Vehicle['statut_validation']) {
  switch (statut) {
    case 'approuve':
      return { label: 'Validé', color: '#22c55e', icon: 'CheckCircle' as const };
    case 'refuse':
      return { label: 'Refusé', color: '#ef4444', icon: 'XCircle' as const };
    case 'en_attente':
    default:
      return { label: 'En attente', color: '#f59e0b', icon: 'Clock' as const };
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MesVehicules() {
  const colors = useThemeColors();
  const { token } = useAuth();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chauffeurId, setChauffeurId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const profile = await chauffeurProfileApi.me(token);
      setChauffeurId(profile.id);
      const res = await vehicleApi.listByChauffeur(profile.id, token);
      setVehicles(res.data ?? []);
    } catch (e: any) {
      setError(e?.message ?? 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const canAddVehicle = vehicles.length < 2;

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <Header title="Mes véhicules" />
        <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.bg }}>
          <ActivityIndicator size="large" color={colors.highlight} />
          <ThemedText className="mt-4 text-subtext">Chargement...</ThemedText>
        </View>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header title="Mes véhicules" />
        <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: colors.bg }}>
          <Icon name="AlertTriangle" size={48} color="#ef4444" className="mb-4" />
          <ThemedText className="text-center mb-4" style={{ color: '#ef4444' }}>{error}</ThemedText>
          <Button title="Réessayer" onPress={load} />
        </View>
      </>
    );
  }

  return (
    <>
      <Header 
        title="Mes véhicules"
        showBackButton
        rightComponents={canAddVehicle ? [
          <TouchableOpacity 
            key="add"
            onPress={() => router.push('/chauffeur/screens/ajouter-vehicule' as any)}
          >
            <Icon name="Plus" size={24} color={colors.highlight} />
          </TouchableOpacity>
        ] : []}
      />
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16 }}>
        
        {/* Header Info */}
        <AnimatedView animation="fadeIn" duration={400} delay={0}>
          <View className="mb-6">
            <ThemedText className="text-sm text-subtext">
              Vous pouvez ajouter jusqu'à <ThemedText className="font-bold" style={{ color: colors.highlight }}>2 véhicules</ThemedText>{' '}
              en tant que chauffeur indépendant.
            </ThemedText>
            <ThemedText className="text-xs text-subtext mt-2">
              {vehicles.length} / 2 véhicules ajoutés
            </ThemedText>
          </View>
        </AnimatedView>

        {/* Empty State */}
        {vehicles.length === 0 && (
          <AnimatedView animation="scaleIn" duration={500} delay={100}>
            <View
              className="bg-secondary rounded-3xl p-8 items-center"
              style={shadowPresets.medium}
            >
              <View style={{ opacity: 0.3 }}>
                <Icon name="Car" size={64} color={colors.subtext} className="mb-4" />
              </View>
              <ThemedText className="text-lg font-semibold mb-2 text-center">
                Aucun véhicule ajouté
              </ThemedText>
              <ThemedText className="text-sm text-subtext text-center mb-6">
                Ajoutez votre premier véhicule pour commencer à recevoir des missions.
              </ThemedText>
            </View>
          </AnimatedView>
        )}

        {/* Vehicle List */}
        {vehicles.map((vehicle, index) => {
          const statusConfig = getStatutConfig(vehicle.statut_validation);
          const ctDays = daysUntil(vehicle.date_ct);
          const assurDays = daysUntil(vehicle.date_assurance);
          
          return (
            <AnimatedView
              key={vehicle.id}
              animation="fadeIn"
              duration={400}
              delay={index * 100}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push(`/chauffeur/screens/mon-vehicule?id=${vehicle.id}` as any)}
                className="mb-4"
              >
                <View
                  className="bg-secondary rounded-3xl p-5"
                  style={shadowPresets.medium}
                >
                  {/* Header */}
                  <View className="flex-row items-start justify-between mb-4">
                    <View className="flex-1">
                      <ThemedText className="text-lg font-bold mb-1">
                        {vehicle.marque} {vehicle.modele}
                      </ThemedText>
                      <ThemedText className="text-sm text-subtext">
                        {vehicle.immat} · {vehicle.annee}
                      </ThemedText>
                    </View>
                    <View
                      className="px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: statusConfig.color + '20' }}
                    >
                      <View className="flex-row items-center gap-1">
                        <Icon name={statusConfig.icon} size={12} color={statusConfig.color} />
                        <ThemedText className="text-xs font-medium" style={{ color: statusConfig.color }}>
                          {statusConfig.label}
                        </ThemedText>
                      </View>
                    </View>
                  </View>

                  {/* Details */}
                  <View className="space-y-2">
                    <View className="flex-row items-center gap-2">
                      <Icon name="Palette" size={14} className="text-subtext" />
                      <ThemedText className="text-sm flex-1">Couleur</ThemedText>
                      <ThemedText className="text-sm font-medium">{vehicle.couleur}</ThemedText>
                    </View>
                    
                    <View className="flex-row items-center gap-2">
                      <Icon name="Gauge" size={14} className="text-subtext" />
                      <ThemedText className="text-sm flex-1">Kilométrage</ThemedText>
                      <ThemedText className="text-sm font-medium">
                        {vehicle.kilometrage ? `${vehicle.kilometrage.toLocaleString()} km` : '—'}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Regulatory Dates */}
                  <View className="mt-4 pt-4" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center gap-2 flex-1">
                        <Icon
                          name="ClipboardCheck"
                          size={14}
                          color={ctDays && ctDays < 30 ? '#ef4444' : ctDays && ctDays < 90 ? '#f59e0b' : '#22c55e'}
                        />
                        <ThemedText className="text-xs flex-1">Contrôle technique</ThemedText>
                      </View>
                      <ThemedText
                        className="text-xs font-medium"
                        style={{ color: ctDays && ctDays < 30 ? '#ef4444' : ctDays && ctDays < 90 ? '#f59e0b' : '#22c55e' }}
                      >
                        {formatDate(vehicle.date_ct)}
                        {ctDays !== null && ` (${ctDays} j)`}
                      </ThemedText>
                    </View>
                    
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2 flex-1">
                        <Icon
                          name="Shield"
                          size={14}
                          color={assurDays && assurDays < 30 ? '#ef4444' : assurDays && assurDays < 90 ? '#f59e0b' : '#22c55e'}
                        />
                        <ThemedText className="text-xs flex-1">Assurance</ThemedText>
                      </View>
                      <ThemedText
                        className="text-xs font-medium"
                        style={{ color: assurDays && assurDays < 30 ? '#ef4444' : assurDays && assurDays < 90 ? '#f59e0b' : '#22c55e' }}
                      >
                        {formatDate(vehicle.date_assurance)}
                        {assurDays !== null && ` (${assurDays} j)`}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Chevron */}
                  <View className="absolute right-4 top-1/2 -mt-3">
                    <Icon name="ChevronRight" size={20} className="text-subtext" />
                  </View>
                </View>
              </TouchableOpacity>
            </AnimatedView>
          );
        })}

        {/* Add Vehicle Button */}
        {canAddVehicle && (
          <AnimatedView
            animation="fadeIn"
            duration={400}
            delay={vehicles.length * 100 + 100}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/chauffeur/screens/ajouter-vehicule' as any)}
              className="mb-8"
            >
              <View
                className="bg-secondary rounded-3xl p-6 items-center"
                style={[shadowPresets.medium, { borderWidth: 2, borderColor: colors.highlight, borderStyle: 'dashed' }]}
              >
                <View
                  className="w-16 h-16 rounded-full items-center justify-center mb-3"
                  style={{ backgroundColor: colors.highlight + '20' }}
                >
                  <Icon name="Plus" size={32} color={colors.highlight} />
                </View>
                <ThemedText className="text-base font-semibold" style={{ color: colors.highlight }}>
                  Ajouter un véhicule
                </ThemedText>
                <ThemedText className="text-xs text-subtext mt-1">
                  {2 - vehicles.length} véhicule{2 - vehicles.length > 1 ? 's' : ''} restant{2 - vehicles.length > 1 ? 's' : ''}
                </ThemedText>
              </View>
            </TouchableOpacity>
          </AnimatedView>
        )}

        {/* Info when limit reached */}
        {!canAddVehicle && (
          <AnimatedView animation="fadeIn" duration={400} delay={200}>
            <View
              className="bg-secondary rounded-2xl p-4 flex-row items-center gap-3 mb-6"
              style={shadowPresets.small}
            >
              <Icon name="Info" size={20} color={colors.highlight} />
              <ThemedText className="text-xs text-subtext flex-1">
                Vous avez atteint la limite de 2 véhicules. Supprimez un véhicule existant pour en ajouter un nouveau.
              </ThemedText>
            </View>
          </AnimatedView>
        )}

      </ScrollView>
    </>
  );
}
