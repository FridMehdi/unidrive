import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { navigateFromNotification } from '@/lib/navigateFromNotification';

// Detect if running in Expo Go
const isExpoGo = Constants.executionEnvironment === 'storeClient';
const isExpoGoAndroid = isExpoGo && Platform.OS === 'android';

// Conditionally import expo-notifications to avoid error in Expo Go on Android
let Notifications: typeof import('expo-notifications') | null = null;

if (!isExpoGoAndroid) {
  // Safe to import on iOS or in development builds
  Notifications = require('expo-notifications');
}

export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface UseNotificationsReturn {
  // State
  expoPushToken: string | null;
  permissionStatus: NotificationPermissionStatus;
  isLoading: boolean;
  isExpoGoAndroid: boolean;

  // Actions
  requestPermissions: () => Promise<boolean>;
  sendTestNotification: () => Promise<void>;
  scheduleNotification: (title: string, body: string, seconds?: number) => Promise<string | null>;
  cancelAllNotifications: () => Promise<void>;
  getBadgeCount: () => Promise<number>;
  setBadgeCount: (count: number) => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>('undetermined');
  const [isLoading, setIsLoading] = useState(true);

  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  // Check current permission status
  const checkPermissionStatus = useCallback(async () => {
    if (!Notifications) return 'undetermined';
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status as NotificationPermissionStatus);
    return status;
  }, []);

  // Register for push notifications
  const registerForPushNotifications = useCallback(async () => {
    if (!Notifications) return null;

    // Check if physical device (required for push notifications)
    if (!Device.isDevice) {
      console.log('[Notifications] Push notifications require a physical device');
      return null;
    }

    // Check current permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    setPermissionStatus(finalStatus as NotificationPermissionStatus);

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission not granted');
      return null;
    }

    // Get Expo push token
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

      if (!projectId) {
        console.log('[Notifications] No project ID found - using local notifications only');
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      console.log('[Notifications] Push token:', tokenData.data);
      return tokenData.data;
    } catch (error) {
      console.log('[Notifications] Error getting push token:', error);
      return null;
    }
  }, []);

  // Request permissions
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    // Handle Expo Go on Android
    if (isExpoGoAndroid) {
      Alert.alert(
        'Development Build Required',
        'Push notifications are not supported in Expo Go on Android (SDK 53+). Create a development build to test notifications.',
        [{ text: 'OK' }]
      );
      return false;
    }

    if (!Notifications) return false;

    setIsLoading(true);
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status as NotificationPermissionStatus);

      if (status === 'granted') {
        const token = await registerForPushNotifications();
        if (token) {
          setExpoPushToken(token);
        }
        return true;
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [registerForPushNotifications]);

  // Send a test local notification
  const sendTestNotification = useCallback(async () => {
    // Handle Expo Go on Android
    if (isExpoGoAndroid || !Notifications) {
      Alert.alert(
        'Test Notification',
        'This is a test notification from Noty!\n\n(Demo mode - in a real build this would appear as a system notification)',
        [{ text: 'OK' }]
      );
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test Notification',
        body: 'This is a test notification from Noty!',
        data: { type: 'test' },
        sound: true,
      },
      trigger: null, // Send immediately
    });
  }, []);

  // Schedule a notification
  const scheduleNotification = useCallback(async (
    title: string,
    body: string,
    seconds: number = 0
  ): Promise<string | null> => {
    // Handle Expo Go on Android
    if (isExpoGoAndroid || !Notifications) {
      console.log('[Notifications] Skipping - Expo Go on Android');
      return null;
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: seconds > 0 ? { type: 'timeInterval', seconds, repeats: false } as any : null,
    });
    return id;
  }, []);

  // Cancel all scheduled notifications
  const cancelAllNotifications = useCallback(async () => {
    if (!Notifications) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  }, []);

  // Get badge count
  const getBadgeCount = useCallback(async (): Promise<number> => {
    if (!Notifications) return 0;
    return await Notifications.getBadgeCountAsync();
  }, []);

  // Set badge count
  const setBadgeCount = useCallback(async (count: number) => {
    if (!Notifications) return;
    await Notifications.setBadgeCountAsync(count);
  }, []);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      // Skip initialization in Expo Go on Android
      if (isExpoGoAndroid || !Notifications) {
        console.log('[Notifications] Running in Expo Go on Android - notifications disabled');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      // Check current permission status
      await checkPermissionStatus();

      // Set up Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6366f1',
        });
      }

      // Try to get existing push token if permission already granted
      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'granted' && Device.isDevice) {
        const token = await registerForPushNotifications();
        if (token) {
          setExpoPushToken(token);
        }
      }

      setIsLoading(false);
    };

    init();

    // Skip listeners in Expo Go on Android
    if (isExpoGoAndroid || !Notifications) {
      return;
    }

    // Set up notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('[Notifications] Received:', notification.request.content.title);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as any;
      console.log('[Notifications] Tap:', data);
      navigateFromNotification(data?.actionUrl ?? data?.action_url, data?.screen);
    });

    return () => {
      // Use .remove() method on the subscription object (new API)
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [checkPermissionStatus, registerForPushNotifications]);

  return {
    expoPushToken,
    permissionStatus,
    isLoading,
    isExpoGoAndroid,
    requestPermissions,
    sendTestNotification,
    scheduleNotification,
    cancelAllNotifications,
    getBadgeCount,
    setBadgeCount,
  };
}
