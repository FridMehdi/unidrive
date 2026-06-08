import { View } from 'react-native';
import Header from '@/components/Header';
import ListLink from '@/components/ListLink';
import ThemedScroller from '@/components/ThemeScroller';
import React from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import Section from '@/components/layout/Section';

export default function SettingsScreen() {
    return (
        <>
            <Header showBackButton rightComponents={[<ThemeToggle />]} />
            <View className='flex-1'>
                <ThemedScroller className='flex-1 pt-4'>
                    <Section title="Settings" titleSize="4xl" className=" mt-6 mb-14" />
                    <View className='gap-4'>
                        <ListLink title="Notifications" description="Customize how you get updates" showChevron icon="Bell" href="/screens/notification-settings" />
                        <ListLink title="Help" description="Get help with your account" showChevron icon="HelpCircle" href="/screens/help" />
                        <ListLink title="Profile" description="Manage your profile" showChevron icon="Settings" href="/screens/edit-profile" />
                        <ListLink title="Language" description="Change your language" showChevron icon="Globe" href="/screens/languages" />
                    </View>
                </ThemedScroller>
            </View>
        </>
    );
}
