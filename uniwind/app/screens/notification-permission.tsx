import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import ThemedText from '@/components/ThemedText';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';

export default function NotificationPermissionScreen() {
  const handleSkip = () => {
    router.replace('/screens/location-permission');
  };

  return (
    <View className="flex-1 bg-background p-6">
      <View className="flex-1 items-center justify-center px-10">
        <View className='w-24 h-24 bg-highlight rounded-2xl items-center justify-center mb-8'>
          <Icon name="BellDot" size={44} strokeWidth={2} color="white" />
        </View>
        <ThemedText className="text-4xl font-bold text-center mb-2 mt-8">
          Enable Notifications
        </ThemedText>
        <ThemedText className="text-text text-center mb-12">
          Stay updated with note reminders, sync alerts, and important updates
        </ThemedText>
      </View>

      <View className="gap-1">
        <Button
          title="Allow Notifications"
          size="large"
          className='!bg-highlight'
          textClassName='!text-white'
          rounded='full'
          onPress={handleSkip}
        />
        <Button
          title="Skip for Now"
          onPress={handleSkip}
          variant="ghost"
          size="large"
        />
      </View>
    </View>
  );
}
