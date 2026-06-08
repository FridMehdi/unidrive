import React, { useState, useCallback, useRef } from 'react';
import { View, TouchableOpacity, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import ThemedScroller from 'components/ThemeScroller';
import Header from 'components/Header';
import ThemedText from '@/components/ThemedText';
import AnimatedView from '@/components/AnimatedView';
import Icon from '@/components/Icon';
import { Chip } from '@/components/Chip';
import { shadowPresets } from '@/utils/useShadow';
import useThemeColors from '@/contexts/ThemeColors';
import { useAuth } from '@/contexts/AuthContext';
import { chauffeurProfileApi, missionApi, type Mission } from '@/services/api';
import { useChauffeurMandatoryDocs } from '@/hooks/useChauffeurMandatoryDocs';
import { ChauffeurDocsBanner } from '@/components/ChauffeurDocsBanner';

const FILTRES = ['Toutes', 'planifiée', 'acceptée', 'en_cours', 'terminée', 'annulée'];
const FILTER_LABELS: Record<string, string> = {
  'Toutes':     'Toutes',
  'planifiée':  'Planifiées',
  'acceptée':   'Acceptées',
  'en_cours':   'En cours',
  'terminée':   'Terminées',
  'annulée':    'Annulées',
};

function formatHeure(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return 'Aujourd\'hui';
  if (d.toDateString() === tomorrow.toDateString()) return 'Demain';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const STATUT_COLOR: Record<string, string> = {
  planifiée:  '#6366f1',
  acceptée:   '#3b82f6',
  en_cours:  '#f59e0b',
  terminée:  '#22c55e',
  validée:   '#22c55e',
  facturée:  '#22c55e',
  annulée:   '#ef4444',
};

export default function MissionsChauffeur() {
  const colors = useThemeColors();
  const { token } = useAuth();
  const { result: mandatoryResult, loading: mandatoryLoading } = useChauffeurMandatoryDocs();

  const [missions, setMissions]   = useState<Mission[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState('');
  const [filtreActif, setFiltreActif] = useState('Toutes');
  const chauffeurIdRef = useRef<string | null>(null);
  const POLL_INTERVAL = 10_000; // 10s

  // Fetch silencieux (pas de setLoading) pour le polling
  const fetchSilent = useCallback(async () => {
    if (!token) return;
    try {
      if (!chauffeurIdRef.current) {
        const chauffeur = await chauffeurProfileApi.me(token);
        chauffeurIdRef.current = chauffeur.id;
      }
      const { data } = await missionApi.listByChauffeur(chauffeurIdRef.current!, token);
      // Tri : missions futures proches d'abord, puis futures lointaines, puis passées récentes
      const now = new Date().getTime();
      data.sort((a, b) => {
        const timeA = new Date(a.date_depart).getTime();
        const timeB = new Date(b.date_depart).getTime();
        const isFutureA = timeA >= now;
        const isFutureB = timeB >= now;
        
        // Les missions futures avant les passées
        if (isFutureA && !isFutureB) return -1;
        if (!isFutureA && isFutureB) return 1;
        
        // Pour les futures : tri croissant (plus proches d'abord)
        if (isFutureA && isFutureB) return timeA - timeB;
        
        // Pour les passées : tri décroissant (plus récentes d'abord)
        return timeB - timeA;
      });
      setMissions(data);
      setError('');
    } catch { /* silent */ }
  }, [token]);

  const fetchMissions = useCallback(async () => {
    try {
      setError('');
      if (!token) { setError('Non authentifié'); setLoading(false); return; }

      const chauffeur = await chauffeurProfileApi.me(token);
      chauffeurIdRef.current = chauffeur.id;

      const { data } = await missionApi.listByChauffeur(chauffeur.id, token);
      // Tri : missions futures proches d'abord, puis futures lointaines, puis passées récentes
      const now = new Date().getTime();
      data.sort((a, b) => {
        const timeA = new Date(a.date_depart).getTime();
        const timeB = new Date(b.date_depart).getTime();
        const isFutureA = timeA >= now;
        const isFutureB = timeB >= now;
        
        // Les missions futures avant les passées
        if (isFutureA && !isFutureB) return -1;
        if (!isFutureA && isFutureB) return 1;
        
        // Pour les futures : tri croissant (plus proches d'abord)
        if (isFutureA && isFutureB) return timeA - timeB;
        
        // Pour les passées : tri décroissant (plus récentes d'abord)
        return timeB - timeA;
      });
      setMissions(data);
    } catch (err: any) {
      setError(err?.message ?? 'Erreur lors du chargement des missions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  // Polling actif uniquement quand l'écran est focus
  useFocusEffect(
    useCallback(() => {
      fetchMissions();
      const interval = setInterval(fetchSilent, POLL_INTERVAL);
      return () => clearInterval(interval);
    }, [fetchMissions, fetchSilent])
  );

  const onRefresh = () => { setRefreshing(true); fetchMissions(); };

  const missionsFiltrees = filtreActif === 'Toutes'
    ? missions
    : missions.filter((m) => m.statut === filtreActif);

  return (
    <>
      <Header title="Mes missions" />
      <ThemedScroller
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <AnimatedView animation="scaleIn" duration={300}>

          {/* Documents obligatoires */}
          {!mandatoryLoading && mandatoryResult && !mandatoryResult.complete && (
            <ChauffeurDocsBanner result={mandatoryResult} contextLabel="accepter des courses" />
          )}

          {/* Filtres */}
          <View className="flex-row gap-2 py-4 flex-wrap">
            {FILTRES.map((f) => (
              <Chip
                key={f}
                label={FILTER_LABELS[f]}
                selectable
                isSelected={filtreActif === f}
                onPress={() => setFiltreActif(f)}
                size="sm"
              />
            ))}
          </View>

          {/* Erreur */}
          {!!error && (
            <View className="flex-row items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 mb-3">
              <Icon name="AlertCircle" size={14} color="#ef4444" />
              <ThemedText className="text-sm flex-1" style={{ color: '#ef4444' }}>{error}</ThemedText>
              <TouchableOpacity onPress={fetchMissions}>
                <ThemedText className="text-sm font-semibold" style={{ color: '#ef4444' }}>Réessayer</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* Chargement */}
          {loading && !refreshing && (
            <View className="items-center py-12 gap-3">
              <Icon name="Loader" size={28} className="text-subtext" />
              <ThemedText className="text-sm text-subtext">Chargement des missions…</ThemedText>
            </View>
          )}

          {/* Compteur */}
          {!loading && (
            <ThemedText className="text-sm text-subtext mb-4">
              {missionsFiltrees.length} mission{missionsFiltrees.length > 1 ? 's' : ''} {filtreActif === 'Toutes' ? 'assignée' : FILTER_LABELS[filtreActif].toLowerCase()}{missionsFiltrees.length > 1 ? 's' : ''}
            </ThemedText>
          )}

          {/* Vide */}
          {!loading && missionsFiltrees.length === 0 && !error && (
            <View className="items-center py-16 gap-3">
              <Icon name="CalendarX2" size={40} className="text-subtext" />
              <ThemedText className="text-base font-semibold text-center">Aucune mission</ThemedText>
              <ThemedText className="text-sm text-subtext text-center">
                {filtreActif === 'Toutes'
                  ? 'Aucune mission ne vous est assignée pour l\'instant.'
                  : `Aucune mission avec le statut « ${FILTER_LABELS[filtreActif].toLowerCase()} ».`}
              </ThemedText>
            </View>
          )}

          {/* Liste missions */}
          {!loading && (
            <View className="gap-3">
              {missionsFiltrees.map((mission) => {
                const couleur = STATUT_COLOR[mission.statut] ?? '#6366f1';
                return (
                  <TouchableOpacity
                    key={mission.id}
                    className="bg-secondary rounded-2xl p-4"
                    style={shadowPresets.medium}
                    onPress={() => router.push(`/chauffeur/screens/mission-detail?id=${mission.id}` as any)}
                    activeOpacity={0.8}
                  >
                    {/* En-tête */}
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center gap-2">
                        <Icon name="Clock" size={14} className="text-subtext" />
                        <ThemedText className="text-sm text-subtext">
                          {formatDate(mission.date_depart)} · {formatHeure(mission.date_depart)}
                        </ThemedText>
                        <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: `${couleur}20` }}>
                          <ThemedText className="text-xs font-medium" style={{ color: couleur }}>
                            {mission.statut.replace('_', ' ')}
                          </ThemedText>
                        </View>
                      </View>
                      {mission.montant != null && (
                        <ThemedText className="text-xl font-bold" style={{ color: couleur }}>
                          {parseFloat(String(mission.montant)).toFixed(0)}€
                        </ThemedText>
                      )}
                    </View>

                    {/* Trajet */}
                    <View className="flex-row items-start gap-3 mb-3">
                      <View className="items-center gap-1 mt-1">
                        <View className="size-2 rounded-full" style={{ backgroundColor: couleur }} />
                        <View className="w-px h-6 bg-border" />
                        <Icon name="MapPin" size={10} className="text-subtext" />
                      </View>
                      <View className="flex-1 gap-2">
                        <ThemedText className="text-sm font-semibold" numberOfLines={1}>{mission.adresse_depart}</ThemedText>
                        <ThemedText className="text-sm text-subtext" numberOfLines={1}>{mission.adresse_arrivee}</ThemedText>
                      </View>
                    </View>

                    {/* Métriques */}
                    <View className="flex-row items-center justify-between pt-3 border-t border-border">
                      {mission.distance_km != null ? (
                        <View className="flex-row items-center gap-1">
                          <Icon name="Route" size={13} className="text-subtext" />
                          <ThemedText className="text-xs text-subtext">{parseFloat(String(mission.distance_km)).toFixed(0)} km</ThemedText>
                        </View>
                      ) : <View />}
                      {mission.duree_minutes != null ? (
                        <View className="flex-row items-center gap-1">
                          <Icon name="Timer" size={13} className="text-subtext" />
                          <ThemedText className="text-xs text-subtext">
                            {mission.duree_minutes >= 60
                              ? `${Math.floor(mission.duree_minutes / 60)}h${mission.duree_minutes % 60 > 0 ? String(mission.duree_minutes % 60).padStart(2, '0') : ''}`
                              : `${mission.duree_minutes}min`}
                          </ThemedText>
                        </View>
                      ) : <View />}
                      {mission.nombre_passagers != null && (
                        <View className="flex-row items-center gap-1">
                          <Icon name="Users" size={13} className="text-subtext" />
                          <ThemedText className="text-xs text-subtext">{mission.nombre_passagers} pax</ThemedText>
                        </View>
                      )}
                      <TouchableOpacity
                        className="flex-row items-center gap-1 px-3 py-1 rounded-full"
                        style={{ backgroundColor: `${couleur}20` }}
                        onPress={() => router.push(`/chauffeur/screens/mission-detail?id=${mission.id}` as any)}
                      >
                        <ThemedText className="text-xs font-semibold" style={{ color: couleur }}>Voir</ThemedText>
                        <Icon name="ChevronRight" size={12} color={couleur} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

        </AnimatedView>
      </ThemedScroller>
    </>
  );
}

