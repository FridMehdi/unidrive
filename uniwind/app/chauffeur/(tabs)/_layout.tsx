import useThemeColors from '@/contexts/ThemeColors';
import { TabButton } from '@/components/TabButton';
import { Tabs, TabList, TabTrigger, TabSlot } from 'expo-router/ui';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChauffeurTabsLayout() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

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
        <TabTrigger name="index" href="/chauffeur" asChild>
          <TabButton isLabelVisible icon="LayoutDashboard">Dashboard</TabButton>
        </TabTrigger>

        <TabTrigger name="missions" href="/chauffeur/missions" asChild>
          <TabButton isLabelVisible icon="Navigation">Missions</TabButton>
        </TabTrigger>

        <TabTrigger name="documents" href="/chauffeur/documents" asChild>
          <TabButton isLabelVisible icon="CalendarDays">Agenda</TabButton>
        </TabTrigger>

        <TabTrigger name="profil" href="/chauffeur/profil" asChild>
          <TabButton isLabelVisible icon="User">Profil</TabButton>
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}
