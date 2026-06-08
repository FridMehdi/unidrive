import React, { useState } from 'react';
import { View, StatusBar, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import ThemedText from '@/components/ThemedText';
import AnimatedView from '@/components/AnimatedView';
import Icon from '@/components/Icon';
import { Button } from '@/components/Button';
import Input from '@/components/forms/Input';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/services/api';
import useThemeColors from '@/contexts/ThemeColors';
import { shadowPresets } from '@/utils/useShadow';

type Role = 'chauffeur' | 'gestionnaire';

const ROLES: { key: Role; label: string; subtitle: string; icon: string; color: string }[] = [
  { key: 'chauffeur', label: 'Chauffeur', subtitle: 'Missions, revenus, documents', icon: 'Car', color: '#6366f1' },
];

export default function Register() {
  const { registerOtp } = useAuth();
  const colors = useThemeColors();
  const { role: roleParam } = useLocalSearchParams<{ role?: Role }>();

  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role>(roleParam ?? 'chauffeur');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [sentPhone, setSentPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const accentColor = role === 'gestionnaire' ? '#0ea5e9' : '#6366f1';

  const formatPhoneNumber = (text: string) => {
    // Retirer tous les caractères non numériques
    let digits = text.replace(/\D/g, '');
    
    // Si commence par 0, le remplacer par 33
    if (digits.startsWith('0')) {
      digits = '33' + digits.slice(1);
    }
    
    // Si ne commence pas par 33, l'ajouter
    if (!digits.startsWith('33')) {
      digits = '33' + digits;
    }
    
    // Limiter à 11 chiffres (33 + 9 chiffres)
    digits = digits.slice(0, 11);
    
    // Formater: +33 6 12 34 56 78
    let formatted = '+' + digits.slice(0, 2); // +33
    if (digits.length > 2) formatted += ' ' + digits.slice(2, 3); // +33 6
    if (digits.length > 3) formatted += ' ' + digits.slice(3, 5); // +33 6 12
    if (digits.length > 5) formatted += ' ' + digits.slice(5, 7); // +33 6 12 34
    if (digits.length > 7) formatted += ' ' + digits.slice(7, 9); // +33 6 12 34 56
    if (digits.length > 9) formatted += ' ' + digits.slice(9, 11); // +33 6 12 34 56 78
    
    return formatted;
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhone(formatted);
  };

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = 'Prénom requis';
    if (!lastName.trim()) e.lastName = 'Nom requis';
    if (!email.trim()) e.email = 'Email requis';
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Email invalide';
    if (!phone.trim()) e.phone = 'Téléphone requis';
    else if (!/^\+33[67]\d{8}$/.test(phone.replace(/\s/g, ''))) e.phone = 'Numéro mobile français invalide';
    if (!password) e.password = 'Mot de passe requis';
    else if (password.length < 8) e.password = 'Minimum 8 caractères';
    if (password !== confirmPassword) e.confirmPassword = 'Les mots de passe ne correspondent pas';
    return e;
  };

  const handleSendOtp = async () => {
    const e = validateForm();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await authApi.sendOtp({ email: email.trim().toLowerCase(), password, first_name: firstName.trim(), last_name: lastName.trim(), role, phone: phone.trim() });
      setSentPhone(res.phone);
      setStep(2);
    } catch (err: any) {
      setErrors({ global: err?.message ?? 'Une erreur est survenue.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) { setErrors({ otp: 'Saisissez le code à 6 chiffres' }); return; }
    setErrors({});
    setLoading(true);
    try {
      const u = await registerOtp(phone.trim(), otp.trim());
      router.replace(u.role === 'gestionnaire' ? '/gestionnaire' : '/chauffeur' as any);
    } catch (err: any) {
      setErrors({ otp: err?.message ?? 'Code invalide ou expiré.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const res = await authApi.sendOtp({ email: email.trim().toLowerCase(), password, first_name: firstName.trim(), last_name: lastName.trim(), role, phone: phone.trim() });
      setSentPhone(res.phone);
      setOtp('');
      setErrors({});
    } catch (err: any) {
      setErrors({ otp: err?.message ?? 'Erreur lors du renvoi.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-global pt-14 pb-8 items-center" style={{ backgroundColor: accentColor }}>
          <AnimatedView animation="scaleIn" duration={400} className="items-center">
            <View className="size-14 rounded-2xl bg-white/20 items-center justify-center mb-3" style={shadowPresets.medium}>
              <Icon name="UserPlus" size={26} color="#fff" />
            </View>
            <ThemedText className="text-2xl font-bold" style={{ color: '#fff' }}>Créer un compte chauffeur</ThemedText>
            <ThemedText className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.75)' }}>Rejoignez Uniwind VTC</ThemedText>
          </AnimatedView>
        </View>

        <View className="px-global pt-6 pb-10 gap-4">
          <AnimatedView animation="scaleIn" duration={300}>

            {/* Erreur globale */}
            {!!errors.global && (
              <View className="flex-row items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10">
                <Icon name="AlertCircle" size={15} color="#ef4444" />
                <ThemedText className="text-sm flex-1" style={{ color: '#ef4444' }}>{errors.global}</ThemedText>
              </View>
            )}

            {step === 1 ? (
              <>
                {/* Champs */}
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Input label="Prénom" value={firstName} onChangeText={setFirstName} autoCapitalize="words" error={errors.firstName} />
                  </View>
                  <View className="flex-1">
                    <Input label="Nom" value={lastName} onChangeText={setLastName} autoCapitalize="words" error={errors.lastName} />
                  </View>
                </View>
                <Input label="Adresse email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={errors.email} />
                <Input label="Téléphone mobile" value={phone} onChangeText={handlePhoneChange} keyboardType="phone-pad" autoComplete="tel" placeholder="+33 6 12 34 56 78" error={errors.phone} />
                <Input label="Mot de passe" value={password} onChangeText={setPassword} isPassword error={errors.password} />
                <Input label="Confirmer le mot de passe" value={confirmPassword} onChangeText={setConfirmPassword} isPassword error={errors.confirmPassword} />

                <Button
                  title={loading ? 'Envoi du code…' : 'Recevoir mon code SMS'}
                  rounded="xl"
                  className="mt-2"
                  onPress={handleSendOtp}
                  disabled={loading}
                  style={{ backgroundColor: accentColor }}
                />

                {/* Retour login */}
                <TouchableOpacity
                  className="flex-row items-center justify-center gap-2 mt-3"
                  onPress={() => router.back()}
                >
                  <Icon name="ArrowLeft" size={14} className="text-subtext" />
                  <ThemedText className="text-sm text-subtext">Déjà un compte ? Se connecter</ThemedText>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Étape 2 : OTP */}
                <View className="items-center gap-2 py-4">
                  <View className="size-14 rounded-full items-center justify-center mb-1" style={{ backgroundColor: `${accentColor}20` }}>
                    <Icon name="MessageSquare" size={28} color={accentColor} />
                  </View>
                  <ThemedText className="text-lg font-bold text-center">Code envoyé !</ThemedText>
                  <ThemedText className="text-sm text-subtext text-center">
                    {'Un SMS a été envoyé au\n'}
                    <ThemedText className="font-semibold" style={{ color: accentColor }}>{sentPhone}</ThemedText>
                  </ThemedText>
                </View>

                <Input
                  label="Code à 6 chiffres"
                  value={otp}
                  onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  error={errors.otp}
                />

                <Button
                  title={loading ? 'Vérification…' : 'Valider mon compte'}
                  rounded="xl"
                  className="mt-2"
                  onPress={handleVerifyOtp}
                  disabled={loading}
                  style={{ backgroundColor: accentColor }}
                />

                <View className="flex-row items-center justify-center gap-1 mt-3">
                  <ThemedText className="text-sm text-subtext">Pas reçu ?</ThemedText>
                  <TouchableOpacity onPress={handleResendOtp} disabled={loading}>
                    <ThemedText className="text-sm font-semibold" style={{ color: accentColor }}>Renvoyer</ThemedText>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  className="flex-row items-center justify-center gap-2 mt-1"
                  onPress={() => { setStep(1); setOtp(''); setErrors({}); }}
                >
                  <Icon name="ArrowLeft" size={14} className="text-subtext" />
                  <ThemedText className="text-sm text-subtext">Modifier mes informations</ThemedText>
                </TouchableOpacity>
              </>
            )}

          </AnimatedView>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
