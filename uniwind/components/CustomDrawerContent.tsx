import { router } from 'expo-router';
import { View, Pressable, TouchableOpacity } from 'react-native';
import ThemedText from './ThemedText';
import Icon, { IconName } from './Icon';
import Avatar from './Avatar';
import ThemedScroller from './ThemeScroller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ActionSheetThemed from './ActionSheetThemed';
import { ActionSheetRef } from 'react-native-actions-sheet';
import React, { useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function CustomDrawerContent() {
    const insets = useSafeAreaInsets();
    const switchAccountRef = useRef<ActionSheetRef>(null);
    const { user: profile } = useAuth();
    const displayName = profile?.first_name || 'there';

  // Get full name for avatar initials
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'User';
    return (
        <>
            <ThemedScroller className="flex-1 !px-10 bg-background " style={{ paddingTop: insets.top }}>


                {/* User Profile Section */}
                <View className=" mb-8 py-10 border-b border-border flex-row  rounded-xl">
                    <Avatar
                        src={profile?.avatar_url || undefined}
                        name={fullName}
                        size="lg"
                        bgColor='bg-neutral-700'
                        textColor='text-white'
                    />

                    <View className='ml-3'>
                        <View className='flex-row items-center'>
                            {profile?.first_name && profile?.last_name ? (
                            <ThemedText className="font-semibold text-xl">{profile?.first_name} {profile?.last_name}</ThemedText>
                            ) : (
                            <ThemedText className="font-semibold text-xl">John Doe</ThemedText>
                            )}
                        </View>
                        {profile?.email ? (
                            <ThemedText className="text-base opacity-50">{profile?.email}</ThemedText>
                        ) : (
                            <ThemedText className="text-base opacity-50">john.doe@example.com</ThemedText>
                        )}
                    </View>
                </View>

                <View className='flex-col pb-6 mb-6 border-b border-border'>
                    <NavItem href="/screens/edit-profile" icon="User" label="Profile" />
                    <NavItem href="/screens/settings" icon="Settings" label="Settings" />
                    <NavItem href="/screens/components" icon="ToggleRight" label="Components" />
                    <NavItem href="/screens/onboarding-start" icon="Layers2" label="Onboarding" />
                    <NavItem href="/screens/welcome" icon="LogOut" label="Logout" />

                </View>

                <View className='flex-row justify-between items-center'>
                    <ThemedText className='text-sm text-text'>Version 1.0.0</ThemedText>
                </View>

            </ThemedScroller>
            <SwitchAccountDrawer ref={switchAccountRef} />
        </>
    );
}

type NavItemProps = {
    href?: string;
    icon: IconName;
    label: string;
    className?: string;
    description?: string;
    onPress?: () => void;
};

export const NavItem = ({ href, icon, label, description, onPress }: NavItemProps) => (
    <TouchableOpacity onPress={onPress ? onPress : href ? () => router.push(href) : undefined} className={`flex-row items-center py-2`}>

        <Icon name={icon} size={18} strokeWidth={1.8} className='bg-secondary rounded-full p-4' />

        <View className='flex-1 ml-6 '>
            {label &&
                <ThemedText className="text-xl font-semibold ">{label}</ThemedText>
            }
            {description &&
                <ThemedText className='opacity-50 text-xs'>{description}</ThemedText>
            }
        </View>
    </TouchableOpacity>
);


const SwitchAccountDrawer = React.forwardRef<ActionSheetRef>((props, ref) => {
    return (
        <ActionSheetThemed
            gestureEnabled
            ref={ref}>
            <View className='p-global'>

                <ProfileItem isSelected src={require('@/assets/img/thomino.jpg')} name='Thomino' label='Personal account' />
                <ProfileItem name='TZ Studios' label='Business account' />
                <Pressable className='items-center justify-center pt-6 mt-6 border-t border-border'>
                    <ThemedText className='text-lg font-semibold'>Add Account</ThemedText>
                </Pressable>

            </View>
        </ActionSheetThemed>
    );
});

const ProfileItem = (props: any) => {
    return (
        <Pressable className='flex-row items-center  bg-secondary rounded-2xl py-4'>

            <View className='flex-1'>
                <ThemedText className='font-semibold text-xl'>{props.name}</ThemedText>
                <ThemedText className='text-sm'>{props.label}</ThemedText>
            </View>
            <View className='relative mr-4 flex-row items-center'>
                {props.isSelected && <Icon name='Check' color='white' size={14} strokeWidth={2} className=' w-7 mr-2 h-7 bg-highlight rounded-full border-2 border-secondary' />}
                <Avatar bgColor='bg-slate-500' src={props.src} size="sm" name={props.name} className='border border-border' />
            </View>
        </Pressable>
    );
}


