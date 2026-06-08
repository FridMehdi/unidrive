import { View, Text, Pressable } from 'react-native';
import Header, { HeaderIcon } from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import Avatar from '@/components/Avatar';
import ListLink from '@/components/ListLink';
import AnimatedView from '@/components/AnimatedView';
import ThemedScroller from '@/components/ThemeScroller';
import React from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import Icon from '@/components/Icon';
import { Link } from 'expo-router';

export default function ProfileScreen() {

    return (
        <View className="flex-1 bg-background">
            <Header
                title="Profile"
                rightComponents={[<ThemeToggle />]} />
            <View className='flex-1 bg-background'>
                <ThemedScroller>
                    <AnimatedView className='pt-4' animation='scaleIn'>
                        <View className="flex-row  items-center justify-center mb-0  p-10">
                            <View className='flex-col items-center w-1/2'>
                                <Avatar src={require('@/assets/img/thomino.jpg')} size="xxl" />
                                <View className="flex-1 mt-2 items-center justify-center">
                                    <ThemedText className="text-2xl font-bold">Thomino</ThemedText>
                                    <View className='flex flex-row items-center'>
                                        <ThemedText className='text-sm text-text ml-2'>Bratislava, Slovakia</ThemedText>
                                    </View>
                                </View>
                            </View>
                        </View>
                        <SubscribeCard />
                        <View className='gap-0'>
                            <ListLink showChevron title="Account settings" icon="Settings" href="/screens/settings" />
                            <ListLink showChevron title="Error page" icon="CircleX" href="[404]" />
                            <ListLink showChevron title="Edit profile" icon="UserRoundPen" href="/screens/edit-profile" />
                            <ListLink showChevron title="Log out" icon="LogOut" href="/screens/welcome" />
                            <ListLink showChevron title="Get help" icon="HelpCircle" href="/screens/help" />
                        </View>
                    </AnimatedView>
                </ThemedScroller>
            </View>
        </View>
    );
}


const SubscribeCard = () => {
    return (
        <Link asChild href="/screens/paywall">
            <Pressable className='bg-highlight flex flex-row rounded-3xl mb-4 p-6'>
                <View className='flex-1 pr-6'>
                    <Text className='text-2xl font-outfit-bold text-white'>Subscribe card</Text>
                    <Text className='text-base  text-white'>Start your journey to becoming a better you.</Text>
                </View>
                <Icon name="Sparkles" size={30} color="white" className='w-20 h-20 bg-black/5 border border-border rounded-full' />
            </Pressable>
        </Link>
    );
}
