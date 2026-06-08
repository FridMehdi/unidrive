import React, { useEffect } from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import ThemedScroller from 'components/ThemeScroller';
import Header, { HeaderIcon } from 'components/Header';
import ThemedText from '@/components/ThemedText';
import AnimatedView from '@/components/AnimatedView';
import Icon from '@/components/Icon';
import { shadowPresets } from '@/utils/useShadow';
import { router } from 'expo-router';
import { CardScroller } from '@/components/CardScroller';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import ThemeToggle from '@/components/ThemeToggle';

export default function HomeScreen() {
  const quickLinks = [
    { icon: 'Palette', label: 'Components', desc: '40+ UI components', href: '/screens/components', isInverted: true },
    { icon: 'Settings', label: 'Settings', desc: 'App preferences', href: '/screens/settings' },
    { icon: 'User', label: 'Profile', desc: 'Edit your profile', href: '/screens/edit-profile' },
    { icon: 'HelpCircle', label: 'Help', desc: 'FAQs & resources', href: '/screens/help' },
  ];

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
    <>
      <Header
        leftComponent={<ThemedText className="text-2xl font-outfit-bold">Uni<ThemedText className="text-highlight">.</ThemedText></ThemedText>}
        rightComponents={[<HeaderIcon icon="Bell" hasBadge href="/screens/notifications" />]}
      />
      <ThemedScroller>
        <AnimatedView animation="scaleIn" duration={300} delay={100}>
          {/* Welcome Section */}
          <View className=' pb-14 pt-20 pr-10'>
            <Animated.Image source={require('@/assets/img/uniwind-paper.png')} className='size-24 mb-10' style={animatedStyle} />
            <ThemedText className='text-4xl font-bold'>Welcome to</ThemedText>
            <ThemedText className='text-4xl font-bold'>Uniwind Starter</ThemedText>
            <ThemedText className='text-base mt-3 text-subtext'>
              40+ components, theming, and navigation.
            </ThemedText>
          </View>

          {/* Quick Links */}
          <ThemedText className="text-lg font-semibold mb-4 px-2">Explore</ThemedText>
          <CardScroller>
            {quickLinks.map((link, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.8}
                className="bg-secondary rounded-2xl p-5 w-[150px] mb-10"
                style={shadowPresets.large}
                onPress={() => router.push(link.href as any)}
              >
                <Icon name={link.icon as any} size={28} className="text-highlight ml-auto mb-20" />
                <ThemedText className="font-semibold">{link.label}</ThemedText>
                <ThemedText className="text-xs text-subtext mt-1">{link.desc}</ThemedText>
              </TouchableOpacity>
            ))}
          </CardScroller>

          {/* What's Included */}
          <ThemedText className="text-lg font-semibold mb-4 px-2 mt-6">What's Included</ThemedText>
          <View className=" mb-6" style={shadowPresets.large}>
            {[
              { icon: 'Moon', label: 'Theming', desc: 'Dark & light mode' },
              { icon: 'Globe', label: 'i18n', desc: 'Multi-language support' },
              { icon: 'Bell', label: 'Notifications', desc: 'Push notifications ready' },
              { icon: 'Layout', label: 'Components', desc: '40+ reusable components' },
              { icon: 'Navigation', label: 'Navigation', desc: 'Drawer, tabs & stack routing' },
              { icon: 'Type', label: 'Typography', desc: 'Outfit font pre-configured' },
            ].map((feature, index) => (
              <View
                key={feature.label}
                className={`flex-row items-center py-4 ${index > 0 ? '' : ''}`}
              >
                <View className="size-12 rounded-2xl bg-secondary items-center justify-center mr-4">
                  <Icon name={feature.icon as any} size={20} />
                </View>
                <View className="flex-1">
                  <ThemedText className="font-semibold">{feature.label}</ThemedText>
                  <ThemedText className="text-sm text-subtext">{feature.desc}</ThemedText>
                </View>
              </View>
            ))}
          </View>

        </AnimatedView>
        <View className='w-full h-[100px]' />
      </ThemedScroller>
    </>
  );
}
