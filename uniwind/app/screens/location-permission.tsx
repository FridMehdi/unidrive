import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import ThemedText from '@/components/ThemedText';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';

export default function LocationPermissionScreen() {
  const handleAllowLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      router.push('/(tabs)/');
    }
  };

  const handleSkip = () => {
    router.push('/(tabs)/');
  };

  return (
    <View className="flex-1 bg-background p-6">
      <View className="flex-1 items-center justify-center px-10">
        <View className='w-24 h-24 bg-highlight rounded-2xl items-center justify-center mb-8'>
          <Icon name="MapPinned" size={44} strokeWidth={2} color="white" />
        </View>
        <ThemedText className="text-4xl font-bold text-center mb-2 mt-8">
          Enable Location
        </ThemedText>
        <ThemedText className="text-text text-center mb-12">
          Share your location with others when collaborating
        </ThemedText>
      </View>

      <View className="gap-4">
        <Button
          title="Allow Location Access"
          size="large"
          className='!bg-highlight'
          textClassName='!text-white'
          rounded='full'
          onPress={handleAllowLocation}
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
