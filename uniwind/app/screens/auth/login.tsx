import React, { useState } from 'react';
import { View, StatusBar, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import ThemedText from '@/components/ThemedText';
import AnimatedView from '@/components/AnimatedView';
import Icon from '@/components/Icon';
import { Button } from '@/components/Button';
import Input from '@/components/forms/Input';
import { useAuth } from '@/contexts/AuthContext';
import useThemeColors from '@/contexts/ThemeColors';
import { shadowPresets } from '@/utils/useShadow';

const ACCENT = '#6366f1';

export default function Login() {
  const { login } = useAuth();
  const colors = useThemeColors();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/chauffeur' as any);
    } catch (err: any) {
      setError(err?.message ?? 'Identifiants incorrects.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header coloré */}
        <View
          className="px-global pt-14 pb-10 items-center"
          style={{ backgroundColor: ACCENT }}
        >
          <AnimatedView animation="scaleIn" duration={400} className="items-center">
            <View className="size-16 rounded-2xl bg-white/20 items-center justify-center mb-4" style={shadowPresets.medium}>
              <Icon name="Car" size={30} color="#fff" />
            </View>
            <ThemedText className="text-2xl font-bold text-center" style={{ color: '#fff' }}>
              Espace Chauffeur
            </ThemedText>
            <ThemedText className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Connectez-vous à votre compte
            </ThemedText>
          </AnimatedView>
        </View>

        {/* Formulaire */}
        <View className="px-global pt-8 pb-10 gap-4">
          <AnimatedView animation="scaleIn" duration={300}>

            {/* Erreur globale */}
            {!!error && (
              <View className="flex-row items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 mb-1">
                <Icon name="AlertCircle" size={15} color="#ef4444" />
                <ThemedText className="text-sm flex-1" style={{ color: '#ef4444' }}>{error}</ThemedText>
              </View>
            )}

            <Input label="Adresse email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
            <Input label="Mot de passe" value={password} onChangeText={setPassword} isPassword />

            {/* Mot de passe oublié */}
            <TouchableOpacity
              className="self-end -mt-2"
              onPress={() => router.push('/screens/auth/forgot-password' as any)}
            >
              <ThemedText className="text-sm font-medium" style={{ color: ACCENT }}>
                Mot de passe oublié ?
              </ThemedText>
            </TouchableOpacity>

            {/* Bouton connexion */}
            <Button
              title={loading ? 'Connexion…' : 'Se connecter'}
              rounded="xl"
              className="mt-2"
              onPress={handleLogin}
              disabled={loading}
              style={{ backgroundColor: ACCENT }}
            />

            {/* Séparateur */}
            <View className="flex-row items-center gap-3 my-2">
              <View className="flex-1 h-px bg-border" />
              <ThemedText className="text-xs text-subtext">ou</ThemedText>
              <View className="flex-1 h-px bg-border" />
            </View>

            {/* Lien inscription */}
            <View
              className="flex-row items-center justify-between p-4 rounded-2xl bg-secondary"
              style={shadowPresets.small}
            >
              <View>
                <ThemedText className="font-semibold text-sm">Pas encore de compte ?</ThemedText>
                <ThemedText className="text-xs text-subtext mt-0.5">Inscription gratuite</ThemedText>
              </View>
              <Button
                title="S'inscrire"
                rounded="xl"
                variant="outline"
                onPress={() => router.push({ pathname: '/screens/auth/register' as any, params: { role: 'chauffeur' } })}
              />
            </View>

            {/* Activation par token */}
            <TouchableOpacity
              className="flex-row items-center justify-center gap-2 mt-1"
              onPress={() => router.push('/screens/auth/activate-account' as any)}
            >
              <Icon name="KeyRound" size={14} color={ACCENT} />
              <ThemedText className="text-sm font-medium" style={{ color: ACCENT }}>
                Activer mon compte avec un token
              </ThemedText>
            </TouchableOpacity>

          </AnimatedView>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
