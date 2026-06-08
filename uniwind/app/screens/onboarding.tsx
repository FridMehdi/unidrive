import React, { useState } from 'react';
import { View, ScrollView, Image, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import MultiStep, { Step } from '@/components/MultiStep';
import { Chip } from '@/components/Chip';
import Selectable from '@/components/forms/Selectable';
import Switch from '@/components/forms/Switch';
import Input from '@/components/forms/Input';
import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';

// ─── Mock Data ───────────────────────────────────────────────────────────────

const AVATARS = [
  require('@/assets/img/user-1.jpg'),
  require('@/assets/img/user-2.jpg'),
  require('@/assets/img/user-3.jpg'),
  require('@/assets/img/user-4.jpg'),
];

const INTERESTS = [
  'Photography', 'Travel', 'Music', 'Gaming',
  'Cooking', 'Fitness', 'Technology', 'Art',
  'Reading', 'Design', 'Sports', 'Film',
];

const ROLES = [
  { title: 'Designer', description: 'UI/UX, brand, visual', icon: 'Palette' as const },
  { title: 'Developer', description: 'Frontend, backend, mobile', icon: 'Code2' as const },
  { title: 'Product', description: 'Strategy, roadmap, growth', icon: 'LayoutDashboard' as const },
  { title: 'Marketer', description: 'Content, campaigns, SEO', icon: 'Megaphone' as const },
  { title: 'Founder', description: 'Building something new', icon: 'Rocket' as const },
  { title: 'Student', description: 'Learning and exploring', icon: 'GraduationCap' as const },
];

const NOTIFICATIONS = [
  { id: 'messages', label: 'Direct messages', description: 'New message received', icon: 'MessageCircle' as const },
  { id: 'updates', label: 'App updates', description: 'New features and improvements', icon: 'Sparkles' as const },
  { id: 'reminders', label: 'Reminders', description: 'Daily tips and activity nudges', icon: 'Bell' as const },
  { id: 'promotions', label: 'Promotions', description: 'Offers, deals and newsletters', icon: 'Tag' as const },
];

// ─── Steps ────────────────────────────────────────────────────────────────────

const ProfileStep = ({ avatar, onSelectAvatar, nickname, onChangeNickname }: {
  avatar: any;
  onSelectAvatar: (source: any) => void;
  nickname: string;
  onChangeNickname: (text: string) => void;
}) => {
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      onSelectAvatar({ uri: result.assets[0].uri });
    }
  };

  const isPickedSelected = avatar?.uri !== undefined;

  return (
    <ScrollView className="flex-1 px-global" showsVerticalScrollIndicator={false}>
      <ThemedText className="text-3xl font-bold mt-2">Set up your profile</ThemedText>
      <ThemedText className="text-base opacity-50 mt-1 mb-8">Choose a photo and pick a nickname.</ThemedText>

      <View className="flex-row flex-wrap gap-3 mb-8">
        {/* Upload from library */}
        <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
          <View className="w-16 h-16 rounded-full bg-secondary border border-border items-center justify-center overflow-hidden">
            {isPickedSelected ? (
              <Image source={avatar} className="w-16 h-16 rounded-full" />
            ) : (
              <Icon name="Plus" size={22} />
            )}
          </View>
          {isPickedSelected && (
            <View className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-highlight items-center justify-center">
              <Icon name="Check" size={11} color="white" />
            </View>
          )}
        </TouchableOpacity>

        {AVATARS.map((source) => (
          <TouchableOpacity key={source} onPress={() => onSelectAvatar(source)} activeOpacity={0.8}>
            <Image
              source={source}
              className="w-16 h-16 rounded-full"
              style={{ opacity: avatar === source ? 1 : 0.4 }}
            />
            {avatar === source && (
              <View className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-highlight items-center justify-center">
                <Icon name="Check" size={11} color="white" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Input
        label="Nickname"
        placeholder="e.g. alex_design"
        value={nickname}
        onChangeText={onChangeNickname}
        autoCapitalize="none"
      />
      <View className="h-10" />
    </ScrollView>
  );
};

const InterestsStep = ({ selected, onToggle }: {
  selected: string[];
  onToggle: (item: string) => void;
}) => (
  <ScrollView className="flex-1 px-global" showsVerticalScrollIndicator={false}>
    <ThemedText className="text-3xl font-bold mt-2">Your interests</ThemedText>
    <ThemedText className="text-base opacity-50 mt-1 mb-8">Pick a few things you care about.</ThemedText>

    <View className="flex-row flex-wrap gap-2">
      {INTERESTS.map((item) => (
        <Chip
          key={item}
          label={item}
          isSelected={selected.includes(item)}
          onPress={() => onToggle(item)}
          size="lg"
        />
      ))}
    </View>
    <View className="h-10" />
  </ScrollView>
);

const RoleStep = ({ role, onSelect }: {
  role: string;
  onSelect: (title: string) => void;
}) => (
  <ScrollView className="flex-1 px-global" showsVerticalScrollIndicator={false}>
    <ThemedText className="text-3xl font-bold mt-2">Your role</ThemedText>
    <ThemedText className="text-base opacity-50 mt-1 mb-8">What best describes you?</ThemedText>

    {ROLES.map((item) => (
      <Selectable
        key={item.title}
        title={item.title}
        description={item.description}
        icon={item.icon}
        selected={role === item.title}
        onPress={() => onSelect(item.title)}
      />
    ))}
    <View className="h-10" />
  </ScrollView>
);

const NotificationsStep = ({ enabled, onToggle }: {
  enabled: string[];
  onToggle: (id: string) => void;
}) => (
  <ScrollView className="flex-1 px-global" showsVerticalScrollIndicator={false}>
    <ThemedText className="text-3xl font-bold mt-2">Notifications</ThemedText>
    <ThemedText className="text-base opacity-50 mt-1 mb-8">Choose what you want to hear about.</ThemedText>

    <View className="gap-8">
      {NOTIFICATIONS.map((item) => (
        <Switch
          key={item.id}
          icon={item.icon}
          label={item.label}
          description={item.description}
          value={enabled.includes(item.id)}
          onChange={() => onToggle(item.id)}
        />
      ))}
    </View>
    <View className="h-10" />
  </ScrollView>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [nickname, setNickname] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [role, setRole] = useState('');
  const [notifications, setNotifications] = useState<string[]>(['messages', 'updates']);

  const toggleInterest = (item: string) =>
    setInterests((prev) => prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]);

  const toggleNotification = (id: string) =>
    setNotifications((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  return (
    <MultiStep onComplete={() => router.replace('/(drawer)/')} onClose={() => router.back()}>
      <Step title="Profile">
        <ProfileStep
          avatar={avatar}
          onSelectAvatar={setAvatar}
          nickname={nickname}
          onChangeNickname={setNickname}
        />
      </Step>

      <Step title="Interests">
        <InterestsStep selected={interests} onToggle={toggleInterest} />
      </Step>

      <Step title="Role">
        <RoleStep role={role} onSelect={setRole} />
      </Step>

      <Step title="Notifications">
        <NotificationsStep enabled={notifications} onToggle={toggleNotification} />
      </Step>
    </MultiStep>
  );
}
