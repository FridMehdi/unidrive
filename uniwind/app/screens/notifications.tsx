import { View, Pressable, RefreshControl, Alert } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { notificationApi, InAppNotification, documentApi, vehicleSharingApi } from '@/services/api';
import { useRouter } from 'expo-router';
import { navigateFromNotification } from '@/lib/navigateFromNotification';

export default function NotificationsScreen() {
  const { token, logout } = useAuth();
  const router = useRouter();
  const {
    permissionStatus,
    expoPushToken,
    isLoading: isPermissionLoading,
    isExpoGoAndroid,
    requestPermissions,
    sendTestNotification,
  } = useNotifications();

  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Charger les notifications
  const loadNotifications = useCallback(async () => {
    if (!token) return;
    
    try {
      const [notifData, countData] = await Promise.all([
        notificationApi.getNotifications(token, { limit: 50 }),
        notificationApi.getUnreadCount(token),
      ]);
      
      setNotifications(notifData.notifications);
      setUnreadCount(countData.count);
    } catch (error: any) {
      console.error('Erreur chargement notifications:', error);
      
      // Si le token est invalide ou expiré, déconnecter l'utilisateur
      if (error?.status === 401 || error?.message?.includes('token')) {
        Alert.alert(
          'Session expirée',
          'Votre session a expiré. Veuillez vous reconnecter.',
          [
            {
              text: 'OK',
              onPress: async () => {
                await logout();
                router.replace('/(auth)/login');
              },
            },
          ]
        );
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token, logout, router]);

  // Charger au montage
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Rafraîchir
  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadNotifications();
  }, [loadNotifications]);

  // Gérer le clic sur une notification
  const handleNotificationPress = useCallback(async (notification: InAppNotification) => {
    if (!token) return;

    // Marquer comme lue si pas encore lue
    if (!notification.is_read) {
      try {
        await notificationApi.markAsRead(notification.id, token);
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error: any) {
        console.error('Erreur marquage lecture:', error);
        
        // Si le token est invalide ou expiré, déconnecter l'utilisateur
        if (error?.status === 401 || error?.message?.includes('token')) {
          Alert.alert(
            'Session expirée',
            'Votre session a expiré. Veuillez vous reconnecter.',
            [
              {
                text: 'OK',
                onPress: async () => {
                  await logout();
                  router.replace('/(auth)/login');
                },
              },
            ]
          );
          return;
        }
      }
    }

    // Naviguer vers l'action si disponible
    if (notification.action_url) {
      navigateFromNotification(notification.action_url);
    }
  }, [token, logout, router]);

  // Formater le temps relatif (fonction simple sans dépendance)
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMinutes < 1) return "À l'instant";
      if (diffMinutes < 60) return `il y a ${diffMinutes} min`;
      if (diffHours < 24) return `il y a ${diffHours}h`;
      if (diffDays === 1) return "Hier";
      if (diffDays < 7) return `il y a ${diffDays} jours`;
      
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch {
      return dateString;
    }
  };

  // Gérer l'approbation d'une demande
  const handleApprove = useCallback(async (notification: InAppNotification) => {
    if (!token) return;
    
    const requestId = notification.data?.requestId;
    if (!requestId) {
      Alert.alert('Erreur', 'ID de demande manquant');
      return;
    }

    try {
      // Déterminer si c'est une demande de documents ou de véhicules
      if (notification.type === 'vehicle_sharing_request') {
        await vehicleSharingApi.approveRequest(requestId, token);
        await notificationApi.markAsRead(notification.id, token);
        Alert.alert('Succès', 'Demande approuvée ! Le gestionnaire peut maintenant accéder à vos véhicules.');
      } else {
        await documentApi.approveRequest(requestId, token);
        await notificationApi.markAsRead(notification.id, token);
        Alert.alert('Succès', 'Demande approuvée ! Le gestionnaire peut maintenant accéder à vos documents.');
      }
      
      loadNotifications();
    } catch (error) {
      console.error('Erreur approbation:', error);
      Alert.alert('Erreur refus', error instanceof Error ? error.message : 'Erreur lors de l\'approbation');
    }
  }, [token, loadNotifications]);

  // Gérer le refus d'une demande
  const handleReject = useCallback(async (notification: InAppNotification) => {
    if (!token) return;
    
    const requestId = notification.data?.requestId;
    if (!requestId) {
      Alert.alert('Erreur', 'ID de demande manquant');
      return;
    }

    Alert.prompt(
      'Refuser la demande',
      'Voulez-vous indiquer un motif de refus ? (optionnel)',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: async (motif) => {
            try {
              // Déterminer si c'est une demande de documents ou de véhicules
              if (notification.type === 'vehicle_sharing_request') {
                await vehicleSharingApi.rejectRequest(requestId, motif || 'Refusé', token);
              } else {
                await documentApi.rejectRequest(requestId, motif || 'Refusé', token);
              }
              
              await notificationApi.markAsRead(notification.id, token);
              Alert.alert('Refusée', 'La demande a été refusée.');
              loadNotifications();
            } catch (error) {
              console.error('Erreur refus:', error);
              Alert.alert('Erreur refus', error instanceof Error ? error.message : 'Erreur lors du refus');
            }
          }
        }
      ],
      'plain-text'
    );
  }, [token, loadNotifications]);

  // Obtenir l'icône basée sur le type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'sharing_request':
        return 'FileText';
      case 'vehicle_sharing_request':
        return 'Truck';
      case 'vehicle_sharing_approved':
      case 'sharing_approved':
      case 'profile_approved':
        return 'CheckCircle';
      case 'vehicle_sharing_rejected':
      case 'sharing_rejected':
      case 'profile_rejected':
        return 'XCircle';
      case 'mission_assigned':
        return 'MapPin';
      default:
        return 'Bell';
    }
  };

  return (
    <>
      <Header showBackButton title="Notifications" />
      <ThemedScroller
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* Notifications List */}
        {isLoading ? (
          <View className="items-center justify-center py-16">
            <ThemedText className="opacity-60">Chargement...</ThemedText>
          </View>
        ) : notifications.length === 0 ? (
          <View className="items-center justify-center py-16">
            <View className="w-20 h-20 rounded-full bg-secondary items-center justify-center mb-4">
              <Icon name="Bell" size={32} className="opacity-40" />
            </View>
            <ThemedText className="font-semibold text-lg mb-2">
              Aucune notification
            </ThemedText>
            <ThemedText className="text-sm opacity-60 text-center px-8">
              Vous n'avez pas encore de notifications. Elles apparaîtront ici.
            </ThemedText>
          </View>
        ) : (
          notifications.map((notification, index) => (
            <View
              key={notification.id}
              className={`py-4 gap-3 ${
                index < notifications.length - 1 ? 'border-b border-border' : ''
              } ${!notification.is_read ? 'bg-highlight/5' : ''}`}
            >
              <Pressable
                onPress={() => handleNotificationPress(notification)}
                className="flex-row items-start gap-3"
              >
                <View className="relative">
                  <View className={`w-10 h-10 rounded-full items-center justify-center ${
                    !notification.is_read ? 'bg-highlight' : 'bg-secondary'
                  }`}>
                    <Icon
                      name={getNotificationIcon(notification.type)}
                      size={18}
                      color={!notification.is_read ? '#fff' : undefined}
                      className={notification.is_read ? 'opacity-60' : ''}
                    />
                  </View>
                  {!notification.is_read && (
                    <View className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-background" />
                  )}
                </View>
                <View className="flex-1">
                  <View className="flex-row items-baseline justify-between gap-2 mb-1">
                    <ThemedText className={`font-semibold text-sm flex-1 ${
                      !notification.is_read ? 'text-highlight' : ''
                    }`}>
                      {notification.title}
                    </ThemedText>
                    <ThemedText className="text-xs opacity-40">
                      {formatTime(notification.created_at)}
                    </ThemedText>
                  </View>
                  <ThemedText 
                    className={`text-sm mt-0.5 ${
                      !notification.is_read ? 'opacity-90' : 'opacity-60'
                    }`}
                    numberOfLines={3}
                  >
                    {notification.message}
                  </ThemedText>
                </View>
              </Pressable>

              {/* Boutons d'action pour les demandes de partage non traitées */}
              {(notification.type === 'sharing_request' || notification.type === 'vehicle_sharing_request') && !notification.is_read && (
                <View className="flex-row gap-2 mt-2 ml-13">
                  <Button
                    title="Refuser"
                    onPress={() => handleReject(notification)}
                    variant="outline"
                    className="flex-1 !border-red-500"
                    textClassName="!text-red-500"
                    rounded="lg"
                  />
                  <Button
                    title="Approuver"
                    onPress={() => handleApprove(notification)}
                    className="flex-1 !bg-green-600"
                    textClassName="!text-white"
                    rounded="lg"
                  />
                </View>
              )}
            </View>
          ))
        )}
      </ThemedScroller>
    </>
  );
}
