
import useThemeColors from '@/contexts/ThemeColors';
import { TabButton } from '@/components/TabButton';
import { Tabs, TabList, TabTrigger, TabSlot } from 'expo-router/ui';
import React, { useRef } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DrawerButton from '@/components/DrawerButton';
import Icon from '@/components/Icon';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import { ActionSheetRef } from 'react-native-actions-sheet';
import ThemedText from '@/components/ThemedText';
import { Button } from '@/components/Button';

export default function Layout() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<ActionSheetRef>(null);

  return (
    <Tabs>
      <TabSlot />
      <TabList
        style={{
          alignItems: 'center',
          paddingBottom: insets.bottom,
          left: 0,
          right: 0,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.bg,
        }}
      >

        <TabTrigger
          name="index"
          href="/"
          asChild
        >
          <TabButton isLabelVisible={true} icon="Home">Home</TabButton>
        </TabTrigger>

        <TabTrigger
          name="blank"
          href="/blank"
          asChild
        >
          <TabButton isLabelVisible={true} icon="File">Blank</TabButton>
        </TabTrigger>


        <View className='w-1/5 items-center justify-center'>
          <Icon onPress={() => sheetRef.current?.show()} name="Plus" size={20} color={colors.invert} className='bg-text rounded-full p-1.5' />
        </View>

        <ActionSheetThemed ref={sheetRef} gestureEnabled>
          <View className="px-6 pt-2 pb-4 gap-4">
            <View className="gap-1 p-10 items-center justify-center">
              <ThemedText className="text-3xl font-bold">Custom Sheet</ThemedText>
              <ThemedText className="text-base">Insert any content you like here.</ThemedText>
            </View>
            <Button title="Dismiss"  rounded="full" onPress={() => sheetRef.current?.hide()} />
          </View>
        </ActionSheetThemed>
   

       

        <TabTrigger
          name="profile"
          href="/profile"
          asChild
        >
          <TabButton isLabelVisible={true} icon="User">Profile</TabButton>
        </TabTrigger>

        <View className='w-1/5 items-center justify-center'>
          <DrawerButton />
        </View>


      </TabList>
    </Tabs>
  );
}
