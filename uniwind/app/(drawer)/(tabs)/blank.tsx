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

export default function BlankScreen() {

    return (
        <>
            <Header
                title="Blank"
                rightComponents={[<HeaderIcon icon="Info" />]} />

            <View className='flex-1 bg-background'>
                <ThemedScroller>
                    <AnimatedView className='pt-4 flex-1 items-center justify-center' animation='scaleIn'>
                        <Icon name="FileText" size={24} className='p-6 bg-secondary rounded-2xl' />
                        <ThemedText className='text-lg mt-4 font-semibold'>Your content here</ThemedText>
                    </AnimatedView>
                </ThemedScroller>



        </View >
        </>
    );
}