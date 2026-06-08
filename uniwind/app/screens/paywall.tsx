import React, { useRef, useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ActionSheetRef } from 'react-native-actions-sheet';
import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import useThemeColors from '@/contexts/ThemeColors';

// ─── Data ─────────────────────────────────────────────────────────────────────

const PLANS = [
  { id: 'monthly', label: 'Monthly', price: '$9.99', period: '/month', savings: null },
  { id: 'yearly', label: 'Yearly', price: '$59.99', period: '/year', savings: 'Save 50%' },
];

const FEATURES = [
  { icon: 'Zap', text: 'Unlimited access to all features' },
  { icon: 'ShieldCheck', text: 'Priority support & faster responses' },
  { icon: 'RefreshCw', text: 'Sync across all your devices' },
  { icon: 'Ban', text: 'No ads, ever' },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PaywallScreen() {
  const sheetRef = useRef<ActionSheetRef>(null);
  const colors = useThemeColors();
  const [selectedPlan, setSelectedPlan] = useState('yearly');

  const activePlan = PLANS.find(p => p.id === selectedPlan)!;

  return (
    <>
      <Header showBackButton />

      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View className="items-center px-global pt-4 pb-8">
          <View className="w-20 h-20 rounded-3xl bg-highlight items-center justify-center mb-6">
            <Icon name="Crown" size={36} color="white" />
          </View>
          <ThemedText className="text-4xl font-bold text-center">Go Pro</ThemedText>
          <ThemedText className="text-base opacity-50 text-center mt-2 leading-6">
            Unlock everything and get the{'\n'}best experience possible.
          </ThemedText>
        </View>

        {/* Features */}
        <View className="px-global gap-3 mb-8">
          {FEATURES.map((feature) => (
            <View key={feature.icon} className="flex-row items-center gap-4">
              <View className="w-10 h-10 rounded-xl bg-secondary items-center justify-center">
                <Icon name={feature.icon as any} size={18} />
              </View>
              <ThemedText className="flex-1 text-base">{feature.text}</ThemedText>
            </View>
          ))}
        </View>

        {/* Plan selector */}
        <View className="px-global flex-row gap-3 mb-8">
          {PLANS.map((plan) => {
            const isActive = selectedPlan === plan.id;
            return (
              <View
                key={plan.id}
                className="flex-1 relative"
                style={{ opacity: 1 }}
              >
                {plan.savings && (
                  <View className="bg-highlight z-20 absolute top-0 right-1/2 -translate-y-2 translate-x-1/2 rounded-full px-3 py-0.5 self-center">
                    <ThemedText className="text-xs font-semibold text-white">{plan.savings}</ThemedText>
                  </View>
                )}
                <View
                  className={`rounded-2xl p-4 border-2 ${isActive ? 'border-highlight bg-secondary' : 'border-border bg-secondary'}`}
                  style={{ opacity: 1 }}
                >
                  <Button
                    title=""
                    onPress={() => setSelectedPlan(plan.id)}
                    variant="ghost"

                  />
                  <ThemedText className="text-sm opacity-60 mb-1">{plan.label}</ThemedText>
                  <ThemedText className="text-2xl font-bold">{plan.price}</ThemedText>
                  <ThemedText className="text-xs opacity-40">{plan.period}</ThemedText>
                  {isActive && (
                    <View className="absolute top-3 right-3">
                      <Icon name="CheckCircle2" size={18} color={colors.highlight} />
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* CTA */}
        <View className="px-global gap-3">
          <Button
            title={`Subscribe · ${activePlan.price}${activePlan.period}`}
            onPress={() => sheetRef.current?.show()}
            size="large"
            rounded="full"
          />
          <ThemedText className="text-xs opacity-40 text-center">
            Cancel anytime. Billed {selectedPlan === 'yearly' ? 'annually' : 'monthly'}.
          </ThemedText>
        </View>
      </ScrollView>

      {/* Confirmation sheet */}
      <ActionSheetThemed ref={sheetRef} gestureEnabled>
        <View className="px-global pt-2 pb-6 gap-6">
          <View className="items-center gap-2 pt-4">
            <View className="w-14 h-14 rounded-2xl bg-highlight items-center justify-center mb-2">
              <Icon name="Crown" size={26} color="white" />
            </View>
            <ThemedText className="text-2xl font-bold">Confirm subscription</ThemedText>
            <ThemedText className="text-base opacity-50 text-center">
              You're subscribing to the {activePlan.label} plan for{' '}
              <ThemedText className="font-semibold opacity-100">{activePlan.price}{activePlan.period}</ThemedText>.
            </ThemedText>
          </View>

          <View className="bg-secondary rounded-2xl p-4 gap-2">
            <View className="flex-row justify-between">
              <ThemedText className="opacity-50">Plan</ThemedText>
              <ThemedText className="font-medium">{activePlan.label}</ThemedText>
            </View>
            <View className="flex-row justify-between">
              <ThemedText className="opacity-50">Price</ThemedText>
              <ThemedText className="font-medium">{activePlan.price}{activePlan.period}</ThemedText>
            </View>
            <View className="flex-row justify-between">
              <ThemedText className="opacity-50">Renewal</ThemedText>
              <ThemedText className="font-medium">Auto-renews</ThemedText>
            </View>
          </View>

          <View className="gap-3">
            <Button
              title="Subscribe Now"
              size="large"
              rounded="full"
              onPress={() => {
                sheetRef.current?.hide();
                router.back();
              }}
            />
            <Button
              title="Cancel"
              variant="ghost"
              size="large"
              rounded="full"
              onPress={() => sheetRef.current?.hide()}
            />
          </View>
        </View>
      </ActionSheetThemed>
    </>
  );
}
