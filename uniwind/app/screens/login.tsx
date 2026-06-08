import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Link, router } from 'expo-router';
import Input from '@/components/forms/Input';
import ThemedText from '@/components/ThemedText';
import { Button } from '@/components/Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@/components/Icon';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-background p-10">
      <Icon name="ArrowLeft" size={24} onPress={() => router.back()} className='mr-auto' />
      <View className="mt-8">
        <ThemedText className="mb-14 font-outfit-bold text-4xl">Welcome back</ThemedText>

        <Input
          label="Email"
          variant="classic"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <Input
          label="Password"
          variant="classic"
          value={password}
          onChangeText={setPassword}
          isPassword={true}
          autoCapitalize="none"
        />

        <Button
          title="Log in"
          onPress={() => router.replace('/')}
          size="large"
          className="mb-6"
          rounded="full"
        />

        <View className="flex-row justify-center">
          <ThemedText className="text-subtext">Don't have an account? </ThemedText>
          <Link href="/screens/signup" asChild>
            <Pressable>
              <ThemedText className="underline">Sign up</ThemedText>
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  );
}
