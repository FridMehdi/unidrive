import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import ThemedScroller from 'components/ThemeScroller';
import Header, { HeaderIcon } from 'components/Header';
import ThemedText from '@/components/ThemedText';
import AnimatedView from '@/components/AnimatedView';
import Icon from '@/components/Icon';
import { SmallChartCard } from '@/components/SmallChartCard';
import { SmallCircleCard } from '@/components/SmallCircleCard';
import ListLink from '@/components/ListLink';
import { shadowPresets } from '@/utils/useShadow';
import { router, useFocusEffect } from 'expo-router';
import useThemeColors from '@/contexts/ThemeColors';
import { useAuth } from '@/contexts/AuthContext';
import { chauffeurProfileApi, missionApi, vehicleApi, documentApi, type ChauffeurProfile, type Mission } from '@/services/api';
import { useChauffeurMandatoryDocs } from '@/hooks/useChauffeurMandatoryDocs';
import { ChauffeurDocsBanner } from '@/components/ChauffeurDocsBanner';
import { ChauffeurVehicleBanner } from '@/components/ChauffeurVehicleBanner';
import { ChauffeurVehicleDocsBanner } from '@/components/ChauffeurVehicleDocsBanner';

const STATUT_COLOR: Record<string, string> = {
  planifiée: '#6366f1',
  acceptée: '#3b82f6',
  en_cours: '#f59e0b',
  terminée: '#22c55e',
  validée: '#22c55e',
  facturée: '#22c55e',
  annulée: '#ef4444',
};

const STATUT_LABEL: Record<string, string> = {
  planifiée: 'Planifiée',
  acceptée: 'Acceptée',
  en_cours: 'En cours',
  terminée: 'Terminée',
  validée: 'Validée',
  facturée: 'Facturée',
  annulée: 'Annulée',
};

function isSameDay(dateStr: string, ref: Date = new Date()) {
  // Compare by local date string to avoid UTC/timezone shift issues
  const d = new Date(dateStr);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth()    === ref.getMonth() &&
    d.getDate()     === ref.getDate()
  );
}

function isToday(dateStr: string) {
  return isSameDay(dateStr);
}

export default function DashboardChauffeur() {
  const colors = useThemeColors();
  const { token } = useAuth();

  const [profile, setProfile] = useState<ChauffeurProfile | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasVehicles, setHasVehicles] = useState<boolean | null>(null); // null = non chargé
  const [vehicleWithoutDocs, setVehicleWithoutDocs] = useState<{ id: string; name: string } | null>(null);
  const chauffeurIdRef = useRef<string | null>(null);
  const { result: mandatoryResult, loading: mandatoryLoading } = useChauffeurMandatoryDocs();

  const fetchData = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    try {
      // Fetch profile if not yet loaded
      if (!chauffeurIdRef.current || !profile) {
        const p = await chauffeurProfileApi.me(token);
        setProfile(p);
        chauffeurIdRef.current = p.id;
      }
      const cid = chauffeurIdRef.current;
      if (!cid) return;
      
      // Charger les véhicules et les missions en parallèle
      const [vehiclesRes, missionsRes] = await Promise.all([
        vehicleApi.listByChauffeur(cid, token).catch(() => ({ data: [], total: 0 })),
        missionApi.listByChauffeur(cid, token, { limit: 100 }),
      ]);
      
      const vehicles = vehiclesRes.data ?? [];
      // Vérifier si le chauffeur a des véhicules
      setHasVehicles(vehicles.length > 0);
      
      // Vérifier si un véhicule n'a pas de documents
      if (vehicles.length > 0) {
        let foundVehicleWithoutDocs = null;
        for (const vehicle of vehicles) {
          try {
            const docsRes = await documentApi.listByVehicle(vehicle.id, token);
            const docs = docsRes.data ?? [];
            // Si le véhicule n'a aucun document, on le marque
            if (docs.length === 0) {
              foundVehicleWithoutDocs = {
                id: vehicle.id,
                name: `${vehicle.marque} ${vehicle.modele}`.trim() || 'votre véhicule'
              };
              break; // On en affiche qu'un à la fois
            }
          } catch (e) {
            // Erreur lors du chargement des documents, on continue
          }
        }
        setVehicleWithoutDocs(foundVehicleWithoutDocs);
      } else {
        setVehicleWithoutDocs(null);
      }
      
      // isToday compare en heure locale → fiable quel que soit le fuseau
      const today = (missionsRes.data ?? []).filter(m => isToday(m.date_depart));
      setMissions(today);
    } catch (e) {
      // silent fail
    } finally {
      if (!silent) setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
      const interval = setInterval(() => fetchData(true), 15_000);
      return () => clearInterval(interval);
    }, [fetchData])
  );

  const STATUTS_ACTIFS = ['planifiée', 'acceptée', 'en_cours'];
  const missionsActives = missions.filter(m => STATUTS_ACTIFS.includes(m.statut));

  const terminées = missions.filter(m => m.statut === 'terminée' || m.statut === 'validée' || m.statut === 'facturée').length;
  const totalAujourdhui = missions.length;
  const revenuJour = Number(missions
    .filter(m => m.statut === 'terminée' || m.statut === 'validée' || m.statut === 'facturée')
    .reduce((sum, m) => sum + (Number(m.prix_achat_chauffeur ?? m.montant ?? 0)), 0)) || 0;
  const pourcentage = totalAujourdhui > 0 ? Math.round((terminées / totalAujourdhui) * 100) : 0;

  const prenom = profile?.first_name ?? '…';
  const nomInitiale = profile?.last_name ? profile.last_name.charAt(0).toUpperCase() + '.' : '';

  return (
    <>
      <Header
        leftComponent={
          <ThemedText className="text-2xl font-outfit-bold">
            VTC<ThemedText className="text-highlight">.</ThemedText>
          </ThemedText>
        }
        rightComponents={[
          <HeaderIcon icon="Bell" hasBadge href="/screens/notifications" />,
        ]}
      />

      <ThemedScroller>
        <AnimatedView animation="scaleIn" duration={300} delay={100}>

          {/* Bonjour + statut */}
          <View className="flex-row items-center justify-between py-6">
            <View className="flex-1">
              <ThemedText className="text-sm text-subtext">Bonjour,</ThemedText>
              {loading && !profile ? (
                <ActivityIndicator size="small" color={colors.highlight} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
              ) : (
                <ThemedText className="text-2xl font-bold">{prenom} {nomInitiale}</ThemedText>
              )}
            </View>
            <View
              className="flex-row items-center gap-2 px-4 py-2 rounded-full"
              style={{ backgroundColor: profile?.disponible ? '#22c55e20' : '#ef444420' }}
            >
              <View
                className="size-2 rounded-full"
                style={{ backgroundColor: profile?.disponible ? '#22c55e' : '#ef4444' }}
              />
              <ThemedText
                className="text-sm font-semibold"
                style={{ color: profile?.disponible ? '#22c55e' : '#ef4444' }}
              >
                {profile?.disponible ? 'Disponible' : 'Indisponible'}
              </ThemedText>
            </View>
          </View>

          {/* Documents obligatoires - NE PAS AFFICHER POUR CHAUFFEURS INTERNES */}
          {profile?.type_chauffeur !== 'interne' && !mandatoryLoading && mandatoryResult && !mandatoryResult.complete && (
            <ChauffeurDocsBanner result={mandatoryResult} contextLabel="utiliser la plateforme" />
          )}

          {/* Véhicules - Afficher seulement si documents complets et pas de véhicules - NE PAS AFFICHER POUR CHAUFFEURS INTERNES */}
          {profile?.type_chauffeur !== 'interne' && !mandatoryLoading && mandatoryResult && mandatoryResult.complete && hasVehicles === false && (
            <ChauffeurVehicleBanner hasVehicles={hasVehicles} />
          )}

          {/* Documents véhicule - Afficher si véhicule existe mais sans documents - NE PAS AFFICHER POUR CHAUFFEURS INTERNES */}
          {profile?.type_chauffeur !== 'interne' && !mandatoryLoading && mandatoryResult && mandatoryResult.complete && hasVehicles === true && vehicleWithoutDocs && (
            <ChauffeurVehicleDocsBanner 
              vehicleId={vehicleWithoutDocs.id} 
              vehicleName={vehicleWithoutDocs.name}
            />
          )}

          {/* KPI */}
          <View className="flex-row gap-3 mb-6">
            <SmallChartCard
              title="Revenus du jour"
              value={revenuJour.toFixed(0)}
              unit="€"
              data={[0, revenuJour]}
              className="flex-1"
              lineColor={colors.highlight}
            />
            <SmallCircleCard
              title="Missions"
              value={String(terminées)}
              unit={`/${totalAujourdhui}`}
              percentage={pourcentage}
              className="flex-1"
              circleColor={colors.highlight}
            />
          </View>

          {/* Missions du jour */}
          <ThemedText className="text-lg font-semibold mb-3">Missions du jour</ThemedText>

          {loading ? (
            <View className="items-center py-10">
              <ActivityIndicator size="large" color={colors.highlight} />
            </View>
          ) : missionsActives.length === 0 ? (
            <View className="bg-secondary rounded-2xl p-6 items-center mb-6" style={shadowPresets.medium}>
              <Icon name="CalendarX" size={32} className="text-subtext mb-2" />
              <ThemedText className="text-subtext text-sm">Aucune mission à venir aujourd'hui</ThemedText>
            </View>
          ) : (
            <View className="gap-3 mb-6">
              {missionsActives.map((mission) => {
                const heure = new Date(mission.date_depart).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                const color = STATUT_COLOR[mission.statut] ?? '#6366f1';
                const tarif = mission.prix_achat_chauffeur ?? mission.montant;
                return (
                  <TouchableOpacity
                    key={mission.id}
                    className="bg-secondary rounded-2xl p-4"
                    style={shadowPresets.medium}
                    onPress={() => router.push(`/chauffeur/screens/mission-detail?id=${mission.id}` as any)}
                    activeOpacity={0.8}
                  >
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center gap-2">
                        <Icon name="Clock" size={14} className="text-subtext" />
                        <ThemedText className="text-sm text-subtext">{heure}</ThemedText>
                      </View>
                      <View
                        className="px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <ThemedText className="text-xs font-semibold" style={{ color }}>
                          {STATUT_LABEL[mission.statut] ?? mission.statut}
                        </ThemedText>
                      </View>
                    </View>

                    <View className="flex-row items-start gap-3 mb-3">
                      <View className="items-center gap-1 mt-1">
                        <View className="size-2 rounded-full bg-highlight" />
                        <View className="w-px h-6 bg-border" />
                        <Icon name="MapPin" size={10} className="text-subtext" />
                      </View>
                      <View className="flex-1 gap-2">
                        <ThemedText className="text-sm font-semibold" numberOfLines={1}>{mission.adresse_depart}</ThemedText>
                        <ThemedText className="text-sm text-subtext" numberOfLines={1}>{mission.adresse_arrivee}</ThemedText>
                      </View>
                      {tarif != null && (
                        <ThemedText className="text-lg font-bold text-highlight">{tarif}€</ThemedText>
                      )}
                    </View>

                    <View className="flex-row items-center gap-2 pt-3 border-t border-border">
                      <Icon name="Hash" size={14} className="text-subtext" />
                      <ThemedText className="text-sm text-subtext">{mission.numero}</ThemedText>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Accès rapides */}
          <ThemedText className="text-lg font-semibold mb-3">Accès rapides</ThemedText>
          <View className="bg-secondary rounded-2xl overflow-hidden mb-6" style={shadowPresets.medium}>
            <ListLink icon="History" title="Historique" description="Toutes mes missions" href="/chauffeur/screens/historique" showChevron hasBorder />
            <ListLink icon="Users" title="Mes partenaires" description="Cercles & messagerie" href="/chauffeur/screens/partenaires" showChevron />
          </View>

        </AnimatedView>
      </ThemedScroller>
    </>
  );
}
