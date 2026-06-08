import React, { forwardRef } from 'react';
import ActionSheet, { ActionSheetProps, ActionSheetRef } from 'react-native-actions-sheet';
import useThemeColors from '@/contexts/ThemeColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable, View } from 'react-native';
import ThemedText from './ThemedText';
import Icon, { IconName } from './Icon';


interface ActionSheetThemedProps extends ActionSheetProps { }

const ActionSheetThemed = forwardRef<ActionSheetRef, ActionSheetThemedProps>(({ containerStyle, ...props }, ref) => {
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();
    return (
        <View className='flex-1 absolute top-0 left-0 right-0 bottom-0 h-full w-full'>
            <ActionSheet
                {...props}
                ref={ref}

                containerStyle={{
                    backgroundColor: colors.secondary,
                    paddingTop: 5,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    paddingBottom: insets.bottom,
                    ...containerStyle
                }}
            />
        </View>
    );
});

export const ActionSheetItem = ({ title, onPress, icon }: { title: string, onPress: () => void, icon: IconName }) => {
    return (
        <Pressable onPress={onPress} className='flex-row items-center flex py-3 px-2'>
            <Icon name={icon} size={20} />
            <ThemedText className='ml-3'>{title}</ThemedText>
        </Pressable>
    );
};

export default ActionSheetThemed;