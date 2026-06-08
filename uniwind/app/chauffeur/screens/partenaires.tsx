import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import ThemedScroller from 'components/ThemeScroller';
import Header, { HeaderIcon } from 'components/Header';
import ThemedText from '@/components/ThemedText';
import AnimatedView from '@/components/AnimatedView';
import Icon from '@/components/Icon';
import { Chip } from '@/components/Chip';
import { Button } from '@/components/Button';
import { shadowPresets } from '@/utils/useShadow';
import { useAuth } from '@/contexts/AuthContext';
import { chauffeurProfileApi, userApi, type AuthUser } from '@/services/api';

interface Gestionnaire {
  gestionnaire_id: string;
  docs_validated: boolean;
  vehicles_validated: boolean;
  connected_since: string;
  user?: AuthUser;
}

export default function Partenaires() {
  const { token } = useAuth();
  const [gestionnaires, setGestionnaires] = useState<Gestionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Récupérer les gestionnaires connectés
        const gests = await chauffeurProfileApi.myGestionnaires(token);
        
        // Récupérer les infos de chaque gestionnaire
        const gestsWithUsers = await Promise.all(
          gests.map(async (g) => {
            try {
              const user = await userApi.getOne(g.gestionnaire_id, token);
              return { ...g, user };
            } catch {
              return g; // Gestionnaire sans infos user
            }
          })
        );
        
        setGestionnaires(gestsWithUsers);
      } catch (err: any) {
        setError(err?.message ?? 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    
    load();
  }, [token]);

  const getInitials = (user?: AuthUser) => {
    if (!user) return '?';
    return `${user.first_name?.charAt(0) ?? ''}${user.last_name?.charAt(0) ?? ''}`.toUpperCase() || '?';
  };

  const getAvatarColor = (index: number) => {
    const colors = ['#6366f1', '#f59e0b', '#22c55e', '#ec4899', '#3b82f6', '#8b5cf6'];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <>
        <Header title="Mes partenaires" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header title="Mes partenaires" />
        <View className="flex-1 items-center justify-center p-6">
          <Icon name="AlertCircle" size={48} className="text-destructive mb-4" />
          <ThemedText className="text-center text-destructive">{error}</ThemedText>
        </View>
      </>
    );
  }

  return (
    <>
      <Header title="Mes partenaires" showBackButton />
      <ThemedScroller>
        <AnimatedView animation="scaleIn" duration={300}>

          {/* Stats cercle */}
          <View className="flex-row gap-3 py-5">
            <View className="flex-1 bg-secondary rounded-2xl p-3 items-center" style={shadowPresets.small}>
              <ThemedText className="text-2xl font-bold">{gestionnaires.length}</ThemedText>
              <ThemedText className="text-xs text-subtext mt-1">Gestionnaires</ThemedText>
            </View>
            <View className="flex-1 bg-secondary rounded-2xl p-3 items-center" style={shadowPresets.small}>
              <ThemedText className="text-2xl font-bold text-highlight">🔌</ThemedText>
              <ThemedText className="text-xs text-subtext mt-1">Connecté</ThemedText>
            </View>
          </View>

          {/* Message si aucun gestionnaire */}
          {gestionnaires.length === 0 && (
            <View className="bg-secondary rounded-2xl p-6 items-center" style={shadowPresets.medium}>
              <Icon name="Users" size={48} className="text-subtext mb-3" />
              <ThemedText className="text-center font-semibold mb-2">Aucun gestionnaire connecté</ThemedText>
              <ThemedText className="text-center text-sm text-subtext">
                Attendez qu'un gestionnaire valide votre profil et vos documents
              </ThemedText>
            </View>
          )}

          {/* Liste gestionnaires */}
          <View className="gap-3">
            {gestionnaires.map((g, index) => (
              <View
                key={g.gestionnaire_id}
                className="bg-secondary rounded-2xl p-4"
                style={shadowPresets.medium}
              >
                <View className="flex-row items-center gap-3">
                  <View
                    className="size-12 rounded-2xl items-center justify-center"
                    style={{ backgroundColor: `${getAvatarColor(index)}25` }}
                  >
                    <ThemedText className="text-lg font-bold" style={{ color: getAvatarColor(index) }}>
                      {getInitials(g.user)}
                    </ThemedText>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-1">
                      <ThemedText className="font-semibold">
                        {g.user ? `${g.user.first_name} ${g.user.last_name}` : 'Gestionnaire'}
                      </ThemedText>
                      <View
                        className="px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: '#22c55e20' }}
                      >
                        <ThemedText className="text-xs" style={{ color: '#22c55e' }}>
                          Connecté
                        </ThemedText>
                      </View>
                    </View>
                    {g.user?.email && (
                      <ThemedText className="text-xs text-subtext mb-0.5">{g.user.email}</ThemedText>
                    )}
                    {g.user?.phone && (
                      <ThemedText className="text-xs text-subtext">{g.user.phone}</ThemedText>
                    )}
                    <ThemedText className="text-xs text-subtext mt-1">
                      Connecté depuis {new Date(g.connected_since).toLocaleDateString('fr-FR')}
                    </ThemedText>
                  </View>
                </View>

                <View className="flex-row gap-2 mt-3 pt-3 border-t border-border">
                  <View className="flex-1 flex-row items-center justify-center gap-1 px-3 py-2 bg-green-500/10 rounded-full">
                    <Icon name="FileCheck" size={14} />
                    <ThemedText className="text-xs">Documents validés</ThemedText>
                  </View>
                  <View className="flex-1 flex-row items-center justify-center gap-1 px-3 py-2 bg-blue-500/10 rounded-full">
                    <Icon name="Car" size={14} />
                    <ThemedText className="text-xs">Véhicules validés</ThemedText>
                  </View>
                </View>
              </View>
            ))}
          </View>

        </AnimatedView>
      </ThemedScroller>
    </>
  );
}
