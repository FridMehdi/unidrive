import React, { useState } from 'react';
import { View, StatusBar, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import ThemedText from '@/components/ThemedText';
import AnimatedView from '@/components/AnimatedView';
import Icon from '@/components/Icon';
import { Button } from '@/components/Button';
import Input from '@/components/forms/Input';
import useThemeColors from '@/contexts/ThemeColors';
import { shadowPresets } from '@/utils/useShadow';
import { authApi } from '@/services/api';

export default function ForgotPassword() {
  const colors = useThemeColors();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!email.trim()) { setError('Veuillez saisir votre adresse email.'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError('Adresse email invalide.'); return; }
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err: any) {
      setError(err?.message ?? 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1, backgroundColor: colors.bg }}>

        {/* Header */}
        <View className="px-global pt-14 pb-8 items-center bg-highlight">
          <AnimatedView animation="scaleIn" duration={400} className="items-center">
            <View className="size-14 rounded-2xl bg-white/20 items-center justify-center mb-3" style={shadowPresets.medium}>
              <Icon name="KeyRound" size={26} color="#fff" />
            </View>
            <ThemedText className="text-2xl font-bold" style={{ color: '#fff' }}>Mot de passe oublié</ThemedText>
            <ThemedText className="text-sm mt-1 text-center" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Saisissez votre email pour recevoir{'\n'}un lien de réinitialisation
            </ThemedText>
          </AnimatedView>
        </View>

        <View className="px-global pt-8 gap-4">
          <AnimatedView animation="scaleIn" duration={300}>

            {!sent ? (
              <>
                {!!error && (
                  <View className="flex-row items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10">
                    <Icon name="AlertCircle" size={15} color="#ef4444" />
                    <ThemedText className="text-sm flex-1" style={{ color: '#ef4444' }}>{error}</ThemedText>
                  </View>
                )}

                <Input
                  label="Adresse email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />

                <Button
                  title={loading ? 'Envoi en cours…' : 'Envoyer le lien'}
                  rounded="xl"
                  className="mt-2"
                  onPress={handleSend}
                  disabled={loading}
                />
              </>
            ) : (
              /* État succès */
              <View className="items-center gap-4 py-6 px-4 rounded-2xl bg-secondary" style={shadowPresets.medium}>
                <View className="size-16 rounded-full items-center justify-center" style={{ backgroundColor: '#22c55e20' }}>
                  <Icon name="MailCheck" size={32} color="#22c55e" />
                </View>
                <ThemedText className="text-xl font-bold text-center">Email envoyé !</ThemedText>
                <ThemedText className="text-sm text-subtext text-center">
                  Vérifiez votre boîte de réception.{'\n'}Le lien expirera dans 30 minutes.
                </ThemedText>
                <Button
                  title="Retour à la connexion"
                  rounded="xl"
                  className="w-full"
                  onPress={() => router.replace('/screens/auth/login' as any)}
                />
              </View>
            )}

            {/* Retour */}
            {!sent && (
              <TouchableOpacity
                className="flex-row items-center justify-center gap-2 mt-3"
                onPress={() => router.back()}
              >
                <Icon name="ArrowLeft" size={14} className="text-subtext" />
                <ThemedText className="text-sm text-subtext">Retour à la connexion</ThemedText>
              </TouchableOpacity>
            )}

          </AnimatedView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
