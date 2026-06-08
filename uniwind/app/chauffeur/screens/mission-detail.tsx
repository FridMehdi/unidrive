import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, TouchableOpacity, Linking, Alert, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import ThemedScroller from 'components/ThemeScroller';
import Header from 'components/Header';
import ThemedText from '@/components/ThemedText';
import AnimatedView from '@/components/AnimatedView';
import Icon from '@/components/Icon';
import { Button } from '@/components/Button';
import SwipeButton from '@/components/SwipeButton';
import { shadowPresets } from '@/utils/useShadow';
import { useLocalSearchParams, useRouter } from 'expo-router';
import useThemeColors from '@/contexts/ThemeColors';
import { useAuth } from '@/contexts/AuthContext';
import { missionApi, userApi, geoApi, billingApi, type Mission, type AuthUser, type EtaResult, type BonDeMission } from '@/services/api';

// Decode a Google Maps encoded polyline to lat/lng array
function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
  const coords: { latitude: number; longitude: number }[] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    coords.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return coords;
}

const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

const STATUT_COLOR: Record<string, string> = {
  planifiée:  '#6366f1',
  acceptée:   '#3b82f6',
  en_cours:  '#f59e0b',
  terminée:  '#22c55e',
  validée:   '#22c55e',
  facturée: '#22c55e',
  annulée:   '#ef4444',
};

function formatDatetime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    + ' · '
    + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}


export default function MissionDetail() {
  const colors = useThemeColors();
  const { token } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [mission, setMission] = useState<Mission | null>(null);
  const [gestionnaire, setGestionnaire] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [updating, setUpdating] = useState(false);

  // Bon de mission
  const [bon, setBon]               = useState<BonDeMission | null>(null);
  const [bonLoading, setBonLoading] = useState(false);
  const [bonError, setBonError]     = useState<string | null>(null);
  const [bonDownloading, setBonDownloading] = useState(false);

  // GPS / Map state
  const [eta, setEta]             = useState<EtaResult | null>(null);
  const [myPos, setMyPos]         = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeReady, setRouteReady] = useState(false);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [originCoord, setOriginCoord]   = useState<{ latitude: number; longitude: number } | null>(null);
  const [destCoord, setDestCoord]       = useState<{ latitude: number; longitude: number } | null>(null);
  const locationSub  = useRef<Location.LocationSubscription | null>(null);
  const mapRef        = useRef<MapView>(null);
  const hasFitRef     = useRef(false); // fit la carte une seule fois après chargement du trajet

  const load = useCallback(async () => {
    if (!token || !id) return;
    try {
      setError('');
      const m = await missionApi.getOne(id, token);
      console.log('Mission loaded:', { id: m.id, created_by: m.created_by });
      setMission(m);
      if (m.created_by) {
        try {
          console.log('Fetching gestionnaire:', m.created_by);
          const g = await userApi.getOne(m.created_by, token);
          console.log('Gestionnaire loaded:', g);
          setGestionnaire(g);
        } catch (err) {
          console.error('Failed to load gestionnaire:', err);
        }
      } else {
        console.log('No created_by in mission');
      }
    } catch (err: any) {
      setError(err?.message ?? 'Impossible de charger la mission');
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => { load(); }, [load]);

  // Charger le bon de mission quand la mission est disponible
  useEffect(() => {
    if (!mission?.id || !token) return;
    console.log('[BonDeMission] Chargement pour mission', mission.id);
    setBonLoading(true);
    setBonError(null);
    billingApi.getBonByMission(mission.id, token)
      .then(res => {
        console.log('[BonDeMission] Chargé avec succès:', res.data);
        setBon(res.data);
      })
      .catch((err) => {
        console.log('[BonDeMission] Erreur:', err?.message || err);
        setBonError(err?.message || 'Impossible de charger le bon');
        setBon(null);
      })
      .finally(() => setBonLoading(false));
  }, [mission?.id, token]);

  const handleBonDownload = async () => {
    if (!bon || !token) return;
    setBonDownloading(true);
    try {
      const { url } = await billingApi.getBonDownload(bon.id, token);
      await Linking.openURL(url);
    } catch (e: any) {
      Alert.alert('Erreur', "Impossible d'ouvrir le bon de mission");
    } finally {
      setBonDownloading(false);
    }
  };

  // GPS tracking — requests permission + watches position for active missions
  useEffect(() => {
    if (!mission || !token) return;
    const active = mission.statut === 'en_cours' || mission.statut === 'acceptée';

    // Always try to get current position for map centering
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      if (!active) {
        // Just get position once for map center
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setMyPos({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        return;
      }

      // Active mission: watch position
      let cancelled = false;
      locationSub.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 10_000, distanceInterval: 20 },
        async (loc) => {
          const { latitude, longitude, accuracy, speed, heading } = loc.coords;
          setMyPos({ latitude, longitude });
          try {
            await geoApi.pushPosition(token, {
              lat: latitude, lng: longitude,
              accuracy: (accuracy != null && accuracy >= 0) ? accuracy : undefined,
              speed: (speed != null && speed >= 0) ? speed : undefined,
              heading: (heading != null && heading >= 0) ? heading : undefined,
              mission_id: mission.id,
            });
            if (mission.adresse_arrivee) {
              const etaRes = await geoApi.getEta(token, `${latitude},${longitude}`, mission.adresse_arrivee);
              setEta(etaRes.data);
            }
          } catch { /* silent */ }
        },
      );
      return () => {
        cancelled = true;
        locationSub.current?.remove();
        locationSub.current = null;
      };
    })();

    return () => {
      locationSub.current?.remove();
      locationSub.current = null;
    };
  }, [mission?.statut, mission?.id, token]);

  // Fetch route directly from Google Directions REST API — pour TOUS les statuts
  useEffect(() => {
    if (!mission?.adresse_depart || !mission?.adresse_arrivee || !GOOGLE_MAPS_KEY) return;
    setRouteCoords([]);
    setOriginCoord(null);
    setDestCoord(null);
    setRouteReady(false);
    hasFitRef.current = false;
    const origin = encodeURIComponent(mission.adresse_depart);
    const dest   = encodeURIComponent(mission.adresse_arrivee);
    fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${dest}&mode=driving&language=fr&key=${GOOGLE_MAPS_KEY}`
    )
      .then(r => r.json())
      .then(data => {
        if (data.status !== 'OK') {
          console.warn('[Directions] status:', data.status, data.error_message);
          return;
        }
        const route = data.routes?.[0];
        if (!route) { console.warn('[Directions] no route'); return; }
        const coords = decodePolyline(route.overview_polyline.points);
        console.log('[Directions] coords:', coords.length);
        setRouteCoords(coords);
        setRouteReady(true);
        if (coords.length > 0) {
          setOriginCoord(coords[0]);
          setDestCoord(coords[coords.length - 1]);
        }
        if (!hasFitRef.current) {
          hasFitRef.current = true;
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(coords, {
              edgePadding: { top: 50, right: 50, bottom: 60, left: 50 },
              animated: true,
            });
          }, 400);
        }
      })
      .catch(err => console.warn('[Directions] fetch error:', err));
  }, [mission?.id, mission?.adresse_depart, mission?.adresse_arrivee]);

  // (pas de re-fit automatique sur chaque update GPS — laisse l'utilisateur libre de naviguer)

  const handleStatut = async (newStatut: string) => {
    if (!token || !mission) return;
    const labels: Record<string, string> = {
      'acceptée':  'Accepter la mission',
      'en_cours':  'Démarrer la mission',
      'terminée':  'Terminer la mission',
      'annulée':   'Refuser / annuler la mission',
    };
    const messages: Record<string, string> = {
      'acceptée':  'Confirmer l’acceptation de cette mission ?',
      'en_cours':  'Démarrer la prise en charge maintenant ?',
      'terminée':  'Marquer cette mission comme terminée ?',
      'annulée':   'Êtes-vous sûr de vouloir refuser / annuler cette mission ?',
    };
    Alert.alert(
      labels[newStatut] ?? 'Confirmer',
      messages[newStatut] ?? '',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: newStatut === 'annulée' ? 'destructive' : 'default',
          onPress: async () => {
            setUpdating(true);
            try {
              const updated = await missionApi.updateStatut(mission.id, newStatut, token);
              setMission(updated);
            } catch (err: any) {
              Alert.alert('Erreur', err?.message ?? 'Impossible de mettre à jour le statut');
            } finally {
              setUpdating(false);
            }
          },
        },
      ],
    );
  };

  const couleur = STATUT_COLOR[mission?.statut ?? 'planifiée'] ?? '#6366f1';

  // Couleur du trajet selon statut
  const routeColor = ['terminée', 'validée', 'facturée'].includes(mission?.statut ?? '')
    ? '#22c55e'
    : mission?.statut === 'annulée'
    ? '#6b7280'
    : '#f97316';

  if (loading) {
    return (
      <>
        <Header title="Détail mission" showBackButton />
        <View className="flex-1 items-center justify-center gap-3">
          <Icon name="Loader" size={28} className="text-subtext" />
          <ThemedText className="text-sm text-subtext">Chargement…</ThemedText>
        </View>
      </>
    );
  }

  if (error || !mission) {
    return (
      <>
        <Header title="Détail mission" showBackButton />
        <View className="flex-1 items-center justify-center px-global gap-4">
          <Icon name="AlertCircle" size={40} color="#ef4444" />
          <ThemedText className="text-base font-semibold text-center">{error || 'Mission introuvable'}</ThemedText>
          <Button title="Réessayer" onPress={load} rounded="xl" />
        </View>
      </>
    );
  }

  const prixAchat = mission.prix_achat_chauffeur != null ? parseFloat(String(mission.prix_achat_chauffeur)) : null;

  // Mode navigation en cours
  if (mission.statut === 'en_cours') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {/* Carte plein écran */}
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
          initialRegion={{
            latitude: 48.8566,
            longitude: 2.3522,
            latitudeDelta: 0.3,
            longitudeDelta: 0.3,
          }}
          showsMyLocationButton={false}
          showsUserLocation={true}
          followsUserLocation={true}
        >
          {/* Polyline trajet */}
          <Polyline
            coordinates={routeCoords}
            strokeColor={routeColor}
            strokeWidth={6}
            lineCap="round"
            lineJoin="round"
          />

          {/* Marqueur départ */}
          {originCoord && (
            <Marker coordinate={originCoord} anchor={{ x: 0.5, y: 0.5 }} title="Départ" zIndex={10}>
              <View style={{
                width: 28, height: 28, borderRadius: 14,
                backgroundColor: '#3b82f6',
                borderWidth: 3, borderColor: '#fff',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />
              </View>
            </Marker>
          )}

          {/* Marqueur arrivée */}
          {destCoord && (
            <Marker coordinate={destCoord} anchor={{ x: 0.5, y: 0.5 }} title="Arrivée" zIndex={10}>
              <View style={{
                width: 28, height: 28, borderRadius: 14,
                backgroundColor: '#22c55e',
                borderWidth: 3, borderColor: '#fff',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />
              </View>
            </Marker>
          )}

          {/* Position actuelle */}
          {myPos && (
            <Marker coordinate={myPos} anchor={{ x: 0.5, y: 0.5 }} title="Ma position" zIndex={20}>
              <View style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: '#6366f1',
                borderWidth: 3, borderColor: '#fff',
                alignItems: 'center', justifyContent: 'center',
                shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 4, elevation: 6,
              }}>
                <Icon name="Navigation" size={16} color="white" />
              </View>
            </Marker>
          )}
        </MapView>

        {/* Header flottant */}
        <View
          style={{
            position: 'absolute',
            top: 60,
            left: 16,
            right: 16,
            backgroundColor: colors.secondary,
            borderRadius: 16,
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
            ...shadowPresets.medium,
          }}
        >
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Icon name="ArrowLeft" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <ThemedText className="text-sm font-bold">{mission.numero}</ThemedText>
            {eta && (
              <ThemedText className="text-xs text-subtext">
                {eta.distance_text} · {eta.duration_text} · ETA {eta.arrival_time}
              </ThemedText>
            )}
          </View>
        </View>

        {/* Bottom sheet avec swipe button */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.secondary,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            paddingBottom: 30,
            ...shadowPresets.large,
          }}
        >
          {/* Rémunération */}
          {prixAchat != null && (
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <ThemedText className="text-3xl font-bold" style={{ color: '#f59e0b' }}>
                {prixAchat.toFixed(2)}€
              </ThemedText>
              <ThemedText className="text-xs text-subtext mt-1">Votre rémunération</ThemedText>
            </View>
          )}

          {/* Adresses */}
          <View style={{ gap: 12, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#3b82f620', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="MapPin" size={20} color="#3b82f6" />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText className="text-xs text-subtext">Prise en charge</ThemedText>
                <ThemedText className="text-sm font-semibold">{mission.adresse_depart}</ThemedText>
              </View>
            </View>

            <View style={{ height: 1, backgroundColor: colors.border }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#22c55e20', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="MapPin" size={20} color="#22c55e" />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText className="text-xs text-subtext">Destination</ThemedText>
                <ThemedText className="text-sm font-semibold">{mission.adresse_arrivee}</ThemedText>
              </View>
            </View>
          </View>

          {/* Swipe button pour terminer */}
          <View style={{ alignItems: 'center' }}>
            <SwipeButton
              text="Glisser pour terminer"
              icon="CheckCircle"
              backgroundColor="#22c55e"
              disabled={updating}
              onSuccess={() => handleStatut('terminée')}
            />
          </View>
        </View>
      </View>
    );
  }

  // Mode normal (autres statuts)
  return (
    <>
      <Header title="Détail mission" showBackButton />
      <ThemedScroller>
        <AnimatedView animation="scaleIn" duration={300}>

          {/* Référence + statut */}
          <View className="flex-row items-center justify-between py-5">
            <View>
              <ThemedText className="text-xs text-subtext mb-1">{mission.numero}</ThemedText>
              <View className="flex-row items-center gap-2">
                <Icon name="Clock" size={15} className="text-subtext" />
                <ThemedText className="text-sm text-subtext">{formatDatetime(mission.date_depart)}</ThemedText>
              </View>
            </View>
            <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: `${couleur}20` }}>
              <ThemedText className="text-xs font-bold" style={{ color: couleur }}>
                {mission.statut.replace('_', ' ')}
              </ThemedText>
            </View>
          </View>

          {/* Trajet */}
          <View className="bg-secondary rounded-2xl p-4 mb-4" style={shadowPresets.medium}>
            <ThemedText className="text-xs text-subtext mb-3 font-semibold uppercase tracking-wide">Trajet</ThemedText>
            <View className="flex-row items-start gap-3">
              <View className="items-center gap-1 mt-1">
                <View className="size-3 rounded-full" style={{ backgroundColor: couleur }} />
                <View className="w-px h-8 bg-border" />
                <Icon name="MapPin" size={14} className="text-subtext" />
              </View>
              <View className="flex-1 gap-3">
                <View>
                  <ThemedText className="text-base font-bold">{mission.adresse_depart}</ThemedText>
                  <ThemedText className="text-xs text-subtext">Départ</ThemedText>
                </View>
                <View>
                  <ThemedText className="text-base font-bold">{mission.adresse_arrivee}</ThemedText>
                  <ThemedText className="text-xs text-subtext">Arrivée</ThemedText>
                </View>
              </View>
            </View>
            <View className="flex-row gap-4 mt-4 pt-4 border-t border-border flex-wrap">
              {mission.distance_km != null && (
                <View className="flex-row items-center gap-1">
                  <Icon name="Route" size={14} className="text-subtext" />
                  <ThemedText className="text-sm text-subtext">
                    {parseFloat(String(mission.distance_km)).toFixed(1)} km
                  </ThemedText>
                </View>
              )}
              {mission.duree_minutes != null && (
                <View className="flex-row items-center gap-1">
                  <Icon name="Timer" size={14} className="text-subtext" />
                  <ThemedText className="text-sm text-subtext">
                    {mission.duree_minutes >= 60
                      ? `${Math.floor(mission.duree_minutes / 60)}h${mission.duree_minutes % 60 > 0 ? String(mission.duree_minutes % 60).padStart(2, '0') : ''}`
                      : `${mission.duree_minutes}min`}
                  </ThemedText>
                </View>
              )}
              {mission.nombre_passagers != null && (
                <View className="flex-row items-center gap-1">
                  <Icon name="Users" size={14} className="text-subtext" />
                  <ThemedText className="text-sm text-subtext">
                    {mission.nombre_passagers} passager{mission.nombre_passagers > 1 ? 's' : ''}
                  </ThemedText>
                </View>
              )}
              {mission.date_arrivee_prevue && (
                <View className="flex-row items-center gap-1">
                  <Icon name="Flag" size={14} className="text-subtext" />
                  <ThemedText className="text-sm text-subtext">
                    Arrivée prévue {new Date(mission.date_arrivee_prevue).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>

          {/* Rémunération */}
          {prixAchat != null && (
            <View className="bg-secondary rounded-2xl p-4 mb-4" style={shadowPresets.medium}>
              <ThemedText className="text-xs text-subtext mb-3 font-semibold uppercase tracking-wide">Rémunération</ThemedText>
              <View className="items-center py-2">
                <ThemedText className="text-4xl font-bold" style={{ color: '#f59e0b' }}>
                  {prixAchat.toFixed(2)}€
                </ThemedText>
                <ThemedText className="text-sm text-subtext mt-2">Votre rémunération pour cette mission</ThemedText>
              </View>
            </View>
          )}

          {/* Map */}
          {mission.adresse_depart && mission.adresse_arrivee && (
            <View className="bg-secondary rounded-2xl overflow-hidden mb-4" style={[shadowPresets.medium, { height: 240 }]}>
              <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFillObject}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
                initialRegion={{
                  latitude: 48.8566,
                  longitude: 2.3522,
                  latitudeDelta: 0.3,
                  longitudeDelta: 0.3,
                }}
                showsMyLocationButton={false}
                showsUserLocation={false}
                followsUserLocation={false}
              >
                {/* Polyline trajet — toujours montée, évite le bug de rendu tardif sur MapKit */}
                <Polyline
                  coordinates={routeCoords}
                  strokeColor={routeColor}
                  strokeWidth={6}
                  lineCap="round"
                  lineJoin="round"
                />

                {/* Marqueur départ — custom view (pinColor hex ignoré sur iOS) */}
                {originCoord && (
                  <Marker coordinate={originCoord} anchor={{ x: 0.5, y: 0.5 }} title="Départ" zIndex={10}>
                    <View style={{
                      width: 28, height: 28, borderRadius: 14,
                      backgroundColor: '#3b82f6',
                      borderWidth: 3, borderColor: '#fff',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />
                    </View>
                  </Marker>
                )}

                {/* Marqueur arrivée — custom view */}
                {destCoord && (
                  <Marker coordinate={destCoord} anchor={{ x: 0.5, y: 0.5 }} title="Arrivée" zIndex={10}>
                    <View style={{
                      width: 28, height: 28, borderRadius: 14,
                      backgroundColor: '#22c55e',
                      borderWidth: 3, borderColor: '#fff',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />
                    </View>
                  </Marker>
                )}

                {/* Position actuelle du chauffeur */}
                {myPos && (
                  <Marker coordinate={myPos} anchor={{ x: 0.5, y: 0.5 }} title="Ma position" zIndex={20}>
                    <View style={{
                      width: 36, height: 36, borderRadius: 18,
                      backgroundColor: '#6366f1',
                      borderWidth: 3, borderColor: '#fff',
                      alignItems: 'center', justifyContent: 'center',
                      shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 4, elevation: 6,
                    }}>
                      <Icon name="Navigation" size={16} color="white" />
                    </View>
                  </Marker>
                )}
              </MapView>

              {/* Barre info bas */}
              <View
                style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  backgroundColor: 'rgba(0,0,0,0.65)',
                  paddingHorizontal: 16, paddingVertical: 10,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name="Navigation" size={13} color="white" />
                  <ThemedText style={{ color: 'white', fontSize: 11 }}>
                    {(mission.statut === 'en_cours' || mission.statut === 'acceptée')
                      ? (myPos ? 'Position active' : 'En attente GPS…')
                      : 'Trajet affiché'}
                  </ThemedText>
                </View>
                {eta && (mission.statut === 'en_cours' || mission.statut === 'acceptée') ? (
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <ThemedText style={{ color: '#4ade80', fontSize: 11, fontWeight: '700' }}>{eta.duration_text}</ThemedText>
                    <ThemedText style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>{eta.distance_text}</ThemedText>
                    <ThemedText style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>
                      ETA {new Date(eta.eta_iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </ThemedText>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                    <Icon name="Route" size={13} color="rgba(255,255,255,0.6)" />
                    <ThemedText style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
                      {mission.distance_km ? `${parseFloat(String(mission.distance_km)).toFixed(1)} km` : 'Calcul...'}
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Bon de mission */}
          <View className="bg-secondary rounded-2xl p-4 mb-4" style={shadowPresets.medium}>
            <ThemedText className="text-xs text-subtext mb-3 font-semibold uppercase tracking-wide">Bon de mission</ThemedText>
            {bonLoading ? (
              <View className="flex-row items-center gap-2">
                <Icon name="Loader" size={16} className="text-subtext animate-spin" />
                <ThemedText className="text-sm text-subtext">Chargement du bon...</ThemedText>
              </View>
            ) : bonError ? (
              <View className="bg-orange-500/10 rounded-xl p-3 flex-row items-center gap-2">
                <Icon name="AlertCircle" size={16} color="#f97316" />
                <ThemedText className="flex-1 text-xs" style={{ color: '#f97316' }}>
                  {bonError}
                </ThemedText>
              </View>
            ) : bon ? (
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="size-10 rounded-full bg-indigo-500/10 items-center justify-center">
                    <Icon name="FileText" size={18} color="#6366f1" />
                  </View>
                  <View>
                    <ThemedText className="font-semibold">{bon.numero}</ThemedText>
                    <ThemedText className="text-xs text-subtext capitalize">{bon.statut.replace('_', ' ')}</ThemedText>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handleBonDownload}
                  disabled={bonDownloading}
                  className="flex-row items-center gap-2 bg-indigo-500/10 px-4 py-2 rounded-xl"
                  style={{ opacity: bonDownloading ? 0.5 : 1 }}
                >
                  <Icon name="Download" size={16} color="#6366f1" />
                  <ThemedText style={{ color: '#6366f1', fontSize: 13, fontWeight: '600' }}>
                    {bonDownloading ? 'Ouverture…' : 'Télécharger PDF'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-3">
                <ThemedText className="text-sm text-subtext text-center">
                  Aucun bon de mission généré
                </ThemedText>
              </View>
            )}
          </View>

          {/* Notes */}
          {mission.notes && (
            <View className="bg-secondary rounded-2xl p-4 mb-4" style={shadowPresets.medium}>
              <ThemedText className="text-xs text-subtext mb-3 font-semibold uppercase tracking-wide">Notes</ThemedText>
              <View className="flex-row items-start gap-3">
                <Icon name="FileText" size={16} className="text-subtext mt-0.5" />
                <ThemedText className="flex-1 text-sm leading-5">{mission.notes}</ThemedText>
              </View>
            </View>
          )}

          {/* Gestionnaire */}
          {gestionnaire && (
            <View className="bg-secondary rounded-2xl p-4 mb-4" style={shadowPresets.medium}>
              <ThemedText className="text-xs text-subtext mb-3 font-semibold uppercase tracking-wide">Gestionnaire</ThemedText>
              <View className="flex-row items-center gap-3 mb-3">
                <View className="size-10 rounded-full bg-highlight/20 items-center justify-center">
                  <Icon name="User" size={18} className="text-highlight" />
                </View>
                <View className="flex-1">
                  <ThemedText className="font-semibold">
                    {[gestionnaire.first_name, gestionnaire.last_name].filter(Boolean).join(' ') || '—'}
                  </ThemedText>
                  {gestionnaire.phone && (
                    <ThemedText className="text-sm text-subtext">{gestionnaire.phone}</ThemedText>
                  )}
                </View>
                {gestionnaire.phone && (
                  <TouchableOpacity
                    className="size-10 rounded-full bg-highlight/10 items-center justify-center"
                    onPress={() => Linking.openURL(`tel:${gestionnaire.phone}`)}
                  >
                    <Icon name="Phone" size={18} className="text-highlight" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Actions selon statut */}
          {mission.statut === 'planifiée' && (
            <View className="flex-row gap-3 pt-2 pb-6">
              <Button
                title="Refuser"
                variant="outline"
                className="flex-1"
                iconStart="X"
                disabled={updating}
                onPress={() => handleStatut('annulée')}
              />
              <Button
                title={updating ? 'En cours…' : 'Accepter'}
                variant="primary"
                className="flex-1"
                iconStart="Check"
                disabled={updating}
                style={{ backgroundColor: '#3b82f6' }}
                onPress={() => handleStatut('acceptée')}
              />
            </View>
          )}

          {mission.statut === 'acceptée' && (
            <View className="pb-6">
              <Button
                title={updating ? 'En cours…' : 'Démarrer la mission'}
                variant="primary"
                iconStart="Play"
                disabled={updating}
                style={{ backgroundColor: '#f59e0b' }}
                onPress={() => handleStatut('en_cours')}
              />
            </View>
          )}

          {(mission.statut === 'terminée' || mission.statut === 'validée' || mission.statut === 'facturée' || mission.statut === 'annulée') && (
            <View
              className="rounded-2xl p-4 items-center mb-6"
              style={{ backgroundColor: `${couleur}15` }}
            >
              <Icon
                name={mission.statut === 'annulée' ? 'XCircle' : 'CheckCircle'}
                size={32}
                color={couleur}
              />
              <ThemedText className="font-bold mt-2 capitalize" style={{ color: couleur }}>
                Mission {mission.statut.replace('_', ' ')}
              </ThemedText>
              {mission.date_arrivee_reelle && (
                <ThemedText className="text-xs text-subtext mt-1">
                  Terminée le {formatDatetime(mission.date_arrivee_reelle)}
                </ThemedText>
              )}
            </View>
          )}

        </AnimatedView>
      </ThemedScroller>
    </>
  );
}
