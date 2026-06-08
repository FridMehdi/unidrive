import { View, Text, Image, Pressable, TouchableOpacity } from 'react-native';
import React, { useEffect } from 'react';
import ThemedText from '@/components/ThemedText';
import ThemeToggle from '@/components/ThemeToggle';
import { AntDesign } from '@expo/vector-icons';
import useThemeColors from '@/contexts/ThemeColors';
import { router } from 'expo-router';
import Icon from '@/components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';

export default function OnboardingScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View className="flex flex-col flex-1 bg-background">

      <View className="w-full items-end justify-center pr-6 pt-6" style={{ paddingTop: insets.top }}>
        <ThemeToggle />
      </View>
      <View className='flex-1 items-center justify-center'>

        <Animated.Image source={require('@/assets/img/uniwind-paper.png')} className='size-44' style={animatedStyle} />
        <ThemedText className='text-base mt-10'>Welcome to</ThemedText>
        <ThemedText className='text-4xl font-outfit-bold'>Uniwind Starter.</ThemedText>

      </View>

      {/* Login/Signup Buttons */}
      <View className="mb-global w-full flex-col gap-2 px-6">
        <View className="flex flex-row flex-wrap items-center justify-center gap-2">
          <View className="mb-4 w-full flex-row gap-2">
            <TouchableOpacity
              onPress={() => router.push('/screens/onboarding-start')}
              className="flex flex-1 py-4 flex-row items-center justify-center rounded-full bg-secondary">
              <AntDesign name="google" size={22} color={colors.text} />
              <ThemedText className="ml-2 text-sm font-semibold">Google</ThemedText>
            </TouchableOpacity>
            <Pressable
              onPress={() => router.push('/screens/onboarding-start')}
              className="flex flex-1 py-4 flex-row items-center justify-center rounded-full bg-secondary">
              <AntDesign name="apple" size={22} color={colors.text} />
              <ThemedText className="ml-2 text-sm font-semibold">Apple</ThemedText>
            </Pressable>
          </View>
          <Pressable
            onPress={() => router.push('/screens/signup')}
            className="flex w-1/4 h-14 flex-1 flex-row items-center justify-center rounded-full bg-text">
            <Icon name="Mail" size={20} color={colors.invert} />
            <Text className="ml-2 text-sm text-invert font-semibold">Email</Text>
          </Pressable>
        </View>
      </View>

    </View>
  );
}
