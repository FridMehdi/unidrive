import React, { useState, useEffect, useMemo } from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import ThemedScroller from 'components/ThemeScroller';
import Header from 'components/Header';
import ThemedText from '@/components/ThemedText';
import AnimatedView from '@/components/AnimatedView';
import Icon from '@/components/Icon';
import { Chip } from '@/components/Chip';
import { shadowPresets } from '@/utils/useShadow';
import useThemeColors from '@/contexts/ThemeColors';
import { useAuth } from '@/contexts/AuthContext';
import { missionApi, chauffeurProfileApi, type Mission } from '@/services/api';

const FILTRES = ['Tout', 'Ce mois', 'Dernier mois', 'Trimestre'];

export default function Historique() {
  const [filtreActif, setFiltreActif] = useState('Ce mois');
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const colors = useThemeColors();
  const { token } = useAuth();
  const router = useRouter();

  // Charger les missions terminées
  useEffect(() => {
    if (!token) return;
    
    const loadMissions = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Récupérer le profil chauffeur pour avoir l'ID
        const profile = await chauffeurProfileApi.me(token);
        
        // Charger toutes les missions du chauffeur
        const result = await missionApi.listByChauffeur(profile.id, token, { limit: 500 });
        
        // Filtrer seulement les missions terminées, validées, facturées ou annulées
        const completedMissions = result.data.filter((m) =>
          ['terminée', 'validée', 'facturée', 'annulée'].includes(m.statut)
        );
        
        // Trier par date (plus récentes en premier)
        completedMissions.sort((a, b) => {
          const dateA = new Date(a.date_arrivee_reelle || a.date_arrivee_prevue || a.date_depart);
          const dateB = new Date(b.date_arrivee_reelle || b.date_arrivee_prevue || b.date_depart);
          return dateB.getTime() - dateA.getTime();
        });
        
        setMissions(completedMissions);
      } catch (err: any) {
        console.error('Erreur chargement historique:', err);
        setError(err?.message ?? 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    
    loadMissions();
  }, [token]);

  // Filtrer les missions par période
  const missionsFiltrees = useMemo(() => {
    if (filtreActif === 'Tout') return missions;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return missions.filter((m) => {
      const date = new Date(m.date_arrivee_reelle || m.date_arrivee_prevue || m.date_depart);
      const month = date.getMonth();
      const year = date.getFullYear();
      
      if (filtreActif === 'Ce mois') {
        return month === currentMonth && year === currentYear;
      }
      
      if (filtreActif === 'Dernier mois') {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return month === lastMonth && year === lastMonthYear;
      }
      
      if (filtreActif === 'Trimestre') {
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        return date >= threeMonthsAgo;
      }
      
      return true;
    });
  }, [missions, filtreActif]);

  // Calculer les statistiques
  const stats = useMemo(() => {
    const defaultStats = { revenu: 0, count: 0, note: 0 };
    
    if (!missionsFiltrees || missionsFiltrees.length === 0) {
      return defaultStats;
    }
    
    try {
      const totalRevenu = missionsFiltrees.reduce((sum, m) => {
        if (m.statut !== 'annulée') {
          const prix = parseFloat(String(m.prix_achat_chauffeur || 0));
          return sum + (isNaN(prix) ? 0 : prix);
        }
        return sum;
      }, 0);
      
      const nbMissions = missionsFiltrees.filter((m) => m.statut !== 'annulée').length;
      
      return {
        revenu: isNaN(totalRevenu) ? 0 : totalRevenu,
        count: nbMissions || 0,
        note: 0, // Pour l'instant, pas de système de notation
      };
    } catch (err) {
      console.error('Erreur calcul stats:', err);
      return defaultStats;
    }
  }, [missionsFiltrees]);

  // Formatter la date en DD/MM
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  };

  return (
    <>
      <Header title="Historique" showBackButton />
      <ThemedScroller>
        <AnimatedView animation="scaleIn" duration={300}>

          {/* État de chargement */}
          {loading && (
            <View className="py-20 items-center justify-center">
              <ActivityIndicator size="large" color={colors.highlight} />
              <ThemedText className="mt-4 text-subtext">Chargement de l'historique...</ThemedText>
            </View>
          )}

          {/* État d'erreur */}
          {!loading && error && (
            <View className="py-20 items-center justify-center">
              <Icon name="AlertCircle" size={48} color={colors.destructive} />
              <ThemedText className="mt-4 text-center text-subtext">{error}</ThemedText>
            </View>
          )}

          {/* Contenu principal */}
          {!loading && !error && (
            <>
              {/* Résumé du mois */}
              <View className="flex-row gap-3 py-5">
                <View className="flex-1 bg-secondary rounded-2xl p-3 items-center" style={shadowPresets.small}>
                  <ThemedText className="text-2xl font-bold text-highlight">
                    {(stats?.revenu && !isNaN(stats.revenu) ? stats.revenu : 0).toFixed(0)}€
                  </ThemedText>
                  <ThemedText className="text-xs text-subtext mt-1">Revenus</ThemedText>
                </View>
                <View className="flex-1 bg-secondary rounded-2xl p-3 items-center" style={shadowPresets.small}>
                  <ThemedText className="text-2xl font-bold">{stats?.count ?? 0}</ThemedText>
                  <ThemedText className="text-xs text-subtext mt-1">Missions</ThemedText>
                </View>
                <View className="flex-1 bg-secondary rounded-2xl p-3 items-center" style={shadowPresets.small}>
                  <View className="flex-row items-center gap-1">
                    <ThemedText className="text-2xl font-bold">-</ThemedText>
                  </View>
                  <ThemedText className="text-xs text-subtext mt-1">Note</ThemedText>
                </View>
              </View>

              {/* Filtres */}
              <View className="flex-row gap-2 mb-5">
                {FILTRES.map((f) => (
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

              {/* Liste vide */}
              {missionsFiltrees.length === 0 && (
                <View className="py-20 items-center justify-center">
                  <Icon name="Calendar" size={48} color={colors.subtext} />
                  <ThemedText className="mt-4 text-center text-subtext">
                    Aucune mission terminée pour cette période
                  </ThemedText>
                </View>
              )}

              {/* Liste des missions */}
              {missionsFiltrees.length > 0 && (
                <View className="gap-3">
                  {missionsFiltrees.map((mission) => {
                    const isCompleted = ['terminée', 'validée', 'facturée'].includes(mission.statut);
                    const isCancelled = mission.statut === 'annulée';
                    const prix = parseFloat(String(mission.prix_achat_chauffeur || 0));
                    const prixAffiche = isNaN(prix) ? 0 : prix;
                    
                    return (
                      <TouchableOpacity
                        key={mission.id}
                        className="bg-secondary rounded-2xl p-4 flex-row items-center gap-3"
                        style={shadowPresets.medium}
                        activeOpacity={0.8}
                        onPress={() => router.push(`/chauffeur/screens/mission-detail?id=${mission.id}`)}
                      >
                        <View
                          className="size-10 rounded-xl items-center justify-center"
                          style={{ backgroundColor: isCompleted ? '#22c55e20' : '#ef444420' }}
                        >
                          <Icon
                            name={isCompleted ? 'CheckCircle' : 'XCircle'}
                            size={20}
                            color={isCompleted ? '#22c55e' : '#ef4444'}
                          />
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center justify-between mb-1">
                            <ThemedText className="text-xs text-subtext">
                              {formatDate(mission.date_arrivee_reelle || mission.date_arrivee_prevue || mission.date_depart)} · {mission.numero}
                            </ThemedText>
                            {!isCancelled && (
                              <ThemedText className="font-bold text-highlight">
                                {prixAffiche.toFixed(0)}€
                              </ThemedText>
                            )}
                          </View>
                          <ThemedText className="text-sm font-semibold">{mission.adresse_depart}</ThemedText>
                          <ThemedText className="text-xs text-subtext">{mission.adresse_arrivee}</ThemedText>
                        </View>
                        <Icon name="ChevronRight" size={16} className="text-subtext" />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </>
          )}

        </AnimatedView>
      </ThemedScroller>
    </>
  );
}
