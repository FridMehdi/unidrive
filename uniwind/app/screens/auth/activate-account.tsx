import React, { useState } from 'react';
import { View, StatusBar, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import ThemedText from '@/components/ThemedText';
import AnimatedView from '@/components/AnimatedView';
import Icon from '@/components/Icon';
import { Button } from '@/components/Button';
import Input from '@/components/forms/Input';
import useThemeColors from '@/contexts/ThemeColors';
import { shadowPresets } from '@/utils/useShadow';
import { chauffeurAccountApi } from '@/services/api';

const ACCENT = '#6366f1';

export default function ActivateAccount() {
  const colors = useThemeColors();
  const { token: paramToken } = useLocalSearchParams<{ token?: string }>();

  const [token, setToken] = useState(paramToken ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleActivate = async () => {
    setError('');
    if (!token.trim()) { setError("Veuillez entrer votre token d'invitation."); return; }
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return; }

    setLoading(true);
    try {
      await chauffeurAccountApi.activate(token.trim(), password);
      setSuccess(true);
      setTimeout(() => router.replace('/screens/auth/login?role=chauffeur' as any), 2000);
    } catch (err: any) {
      setError(err?.message ?? 'Une erreur est survenue.');
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
        {/* Header */}
        <View
          className="px-global pt-14 pb-10 items-center"
          style={{ backgroundColor: ACCENT }}
        >
          <AnimatedView animation="scaleIn" duration={400} className="items-center">
            <View className="size-16 rounded-2xl bg-white/20 items-center justify-center mb-4" style={shadowPresets.medium}>
              <Icon name="KeyRound" size={30} color="#fff" />
            </View>
            <ThemedText className="text-2xl font-bold text-center" style={{ color: '#fff' }}>
              Activer mon compte
            </ThemedText>
            <ThemedText className="text-sm mt-1 text-center" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Utilisez votre token d'invitation
            </ThemedText>
          </AnimatedView>
        </View>

        {/* Formulaire */}
        <View className="px-global pt-8 pb-10 gap-4">
          <AnimatedView animation="scaleIn" duration={300}>

            {/* Erreur */}
            {!!error && (
              <View className="flex-row items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 mb-1">
                <Icon name="AlertCircle" size={15} color="#ef4444" />
                <ThemedText className="text-sm flex-1" style={{ color: '#ef4444' }}>{error}</ThemedText>
              </View>
            )}

            {/* Succès */}
            {success && (
              <View className="flex-row items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 mb-1">
                <Icon name="CheckCircle" size={15} color="#22c55e" />
                <ThemedText className="text-sm flex-1" style={{ color: '#22c55e' }}>
                  Compte activé ! Redirection en cours…
                </ThemedText>
              </View>
            )}

            {/* Info */}
            <View className="flex-row items-start gap-2 px-4 py-3 rounded-xl bg-secondary mb-1">
              <Icon name="Info" size={15} color={ACCENT} />
              <ThemedText className="text-xs text-subtext flex-1">
                Votre gestionnaire vous a transmis un token d'invitation à 64 caractères. Entrez-le ci-dessous et choisissez votre mot de passe.
              </ThemedText>
            </View>

            <Input
              label="Token d'invitation"
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="ex: a3f8c0..."
            />

            <Input
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              isPassword
              placeholder="Minimum 8 caractères"
            />

            <Input
              label="Confirmer le mot de passe"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              isPassword
              placeholder="Répétez votre mot de passe"
            />

            <Button
              title={loading ? 'Activation…' : 'Activer mon compte'}
              rounded="xl"
              className="mt-2"
              onPress={handleActivate}
              disabled={loading || success}
              style={{ backgroundColor: ACCENT }}
            />

            {/* Retour connexion */}
            <TouchableOpacity
              className="flex-row items-center justify-center gap-2 mt-2"
              onPress={() => router.replace('/screens/auth/login?role=chauffeur' as any)}
            >
              <Icon name="ArrowLeft" size={14} className="text-subtext" />
              <ThemedText className="text-sm text-subtext">Retour à la connexion</ThemedText>
            </TouchableOpacity>

          </AnimatedView>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
