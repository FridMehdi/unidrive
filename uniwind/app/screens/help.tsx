import React from 'react';
import { View, TouchableOpacity, Linking } from 'react-native';
import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import Expandable from '@/components/Expandable';
import Section from '@/components/layout/Section';
import Icon from '@/components/Icon';
import { Button } from '@/components/Button';
import AnimatedView from '@/components/AnimatedView';
import ThemedScroller from '@/components/ThemeScroller';

export default function HelpScreen() {
  const faqData = [
    {
      id: '1',
      question: 'How do I customize the theme?',
      answer: 'Edit global.css to change colors inside @layer theme:\n\n• highlight: Primary brand color\n• background/secondary: Background colors\n• text/subtext: Text colors\n\nAlso update the matching values in contexts/ThemeColors.tsx for JS usage.\n\nThe app supports dark/light mode automatically via ThemeContext.',
    },
    {
      id: '2',
      question: 'How do I add a new language?',
      answer: 'The Languages screen (screens/languages.tsx) contains a static list of languages. To add real i18n support, integrate a library like i18next or expo-localization.',
    },
    {
      id: '3',
      question: 'How do I add new screens?',
      answer: 'This starter uses Expo Router (file-based routing):\n\n1. Create a new file in app/screens/ (e.g., my-screen.tsx)\n2. Export a default component\n3. Navigate with: router.push("/screens/my-screen")\n\nFor tabs: add files in app/(drawer)/(tabs)/',
    },
    {
      id: '4',
      question: 'How do I use the components?',
      answer: 'Browse all 40+ components in the Components screen from home.\n\nImport any component:\n  import { Button } from "@/components/Button"\n  import Card from "@/components/Card"\n\nSee CLAUDE.md for full component reference and props.',
    },
    {
      id: '5',
      question: 'How do I add push notifications?',
      answer: 'Push notifications are pre-configured with expo-notifications.\n\n1. For iOS: Works in development builds\n2. Get your Expo push token from the useNotifications hook\n3. Store tokens in your backend to send notifications\n4. Use Expo Push API or a service like OneSignal to send',
    },
    {
      id: '6',
      question: 'How do I create a development build?',
      answer: 'Run:\n  npx eas build --profile development --platform ios\n  npx eas build --profile development --platform android\n\nDevelopment builds are required for:\n• Push notifications on Android\n• Native device features',
    },
    {
      id: '7',
      question: 'How do I deploy to app stores?',
      answer: '1. Update app.json with your app name, bundle ID, etc.\n2. Replace icons in /assets folder\n3. Run: eas build --profile production --platform ios\n4. Run: eas build --profile production --platform android\n5. Submit: eas submit --platform ios/android',
    },
  ];

  const resources = [
    {
      id: 'expo',
      title: 'Expo Docs',
      subtitle: 'React Native framework',
      icon: 'Smartphone' as const,
      action: () => Linking.openURL('https://docs.expo.dev'),
    },
    {
      id: 'uniwind',
      title: 'Uniwind Docs',
      subtitle: 'Tailwind CSS for React Native',
      icon: 'Palette' as const,
      action: () => Linking.openURL('https://docs.uniwind.dev'),
    },
    {
      id: 'router',
      title: 'Expo Router Docs',
      subtitle: 'File-based navigation',
      icon: 'Navigation' as const,
      action: () => Linking.openURL('https://docs.expo.dev/router/introduction'),
    },
  ];

  return (
    <View className="flex-1 bg-background">
      <Header title="Help & Setup" showBackButton />

      <ThemedScroller showsVerticalScrollIndicator={false}>
        <AnimatedView animation="fadeIn" duration={400}>
          {/* FAQ Section */}
          <Section title="Frequently Asked Questions" titleSize="xl" className="pt-6 pb-2" />

          <View className="overflow-hidden">
            {faqData.map((faq) => (
              <Expandable key={faq.id} title={faq.question} className="py-1">
                <ThemedText className="text-text leading-6 whitespace-pre-line">{faq.answer}</ThemedText>
              </Expandable>
            ))}
          </View>

          {/* Resources Section */}
          <Section
            title="Helpful Resources"
            titleSize="xl"
            className="mb-4 mt-14"
            subtitle="Documentation and guides"
          />

          <View className=" overflow-hidden">
            {resources.map((resource, index) => (
              <TouchableOpacity
                key={resource.id}
                onPress={resource.action}
                className={`flex-row items-center py-4 ${index < resources.length - 1 ? 'border-b border-border' : ''}`}
              >
                <View className="size-12 rounded-2xl bg-secondary items-center justify-center mr-4">
                  <Icon name={resource.icon} size={22} className="text-highlight" />
                </View>
                <View className="flex-1">
                  <ThemedText className="font-semibold">{resource.title}</ThemedText>
                  <ThemedText className="text-sm text-subtext">{resource.subtitle}</ThemedText>
                </View>
                <Icon name="ExternalLink" size={18} className="text-subtext" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Support Section */}
          <Section title="Need More Help?" titleSize="xl" className="mb-4 mt-14" />

          <View className="bg-secondary rounded-3xl p-5">
            <ThemedText className="text-center text-subtext mb-4">
              Check the README.md for detailed setup instructions, or reach out for support.
            </ThemedText>
            <Button title="View README" iconStart="FileText" onPress={() => Linking.openURL('https://github.com')} />
          </View>

          <View className="h-24" />
        </AnimatedView>
      </ThemedScroller>
    </View>
  );
}
