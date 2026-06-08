import React, { useState, useEffect } from 'react';
import {
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import AnimatedView from '@/components/AnimatedView';
import Icon from '@/components/Icon';
import Avatar from '@/components/Avatar';
import { Button } from '@/components/Button';
import { shadowPresets } from '@/utils/useShadow';
import useThemeColors from '@/contexts/ThemeColors';
import { useAuth } from '@/contexts/AuthContext';
import { userApi } from '@/services/api';
import { router } from 'expo-router';

function Field({
  label, value, onChangeText, placeholder, keyboardType, editable = true, secureTextEntry = false,
}: {
  label: string;
  value: string;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  editable?: boolean;
  secureTextEntry?: boolean;
}) {
  const colors = useThemeColors();
  return (
    <View style={{ marginBottom: 14 }}>
      <ThemedText style={{ fontSize: 12, fontWeight: '600', color: colors.subtext, marginBottom: 6 }}>
        {label}
      </ThemedText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.subtext}
        keyboardType={keyboardType ?? 'default'}
        editable={editable}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        style={{
          backgroundColor: editable ? colors.secondary : `${colors.secondary}80`,
          color: editable ? colors.text : colors.subtext,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 15,
        }}
      />
    </View>
  );
}

export default function EditProfileScreen() {
  const colors  = useThemeColors();
  const { user, token, updateProfile } = useAuth();

  // Infos personnelles
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [phone,     setPhone]     = useState('');
  const [saving,    setSaving]    = useState(false);

  // Changement de mot de passe
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd,     setNewPwd]     = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [savingPwd,  setSavingPwd]  = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name  || '');
      setPhone(user.phone         || '');
    }
  }, [user]);

  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Chauffeur';

  const handleSaveInfo = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Erreur', 'Le prénom et le nom sont requis.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ first_name: firstName.trim(), last_name: lastName.trim(), phone: phone.trim() || undefined });
      Alert.alert('Succès', 'Informations mises à jour.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Impossible de sauvegarder.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPwd || !newPwd || !confirmPwd) {
      Alert.alert('Erreur', 'Tous les champs sont requis.');
      return;
    }
    if (newPwd !== confirmPwd) {
      Alert.alert('Erreur', 'Les nouveaux mots de passe ne correspondent pas.');
      return;
    }
    if (newPwd.length < 8) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (!token) return;
    setSavingPwd(true);
    try {
      await userApi.updatePassword(token, currentPwd, newPwd);
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      Alert.alert('Succès', 'Mot de passe modifié avec succès.');
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Mot de passe actuel incorrect.');
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      <Header showBackButton title="Modifier le profil" />

      <ThemedScroller>
        <AnimatedView animation="scaleIn" duration={300}>

          {/* Avatar */}
          <View style={{ alignItems: 'center', paddingVertical: 28 }}>
            <Avatar name={fullName} size="xl" style={{ marginBottom: 12 }} />
            <ThemedText style={{ fontSize: 20, fontWeight: '700' }}>{fullName}</ThemedText>
            <ThemedText style={{ fontSize: 13, color: colors.subtext, marginTop: 4 }}>{user?.email ?? ''}</ThemedText>
          </View>

          {/* Informations personnelles */}
          <View style={{ marginBottom: 4 }}>
            <ThemedText style={{ fontSize: 12, fontWeight: '700', color: colors.subtext, marginBottom: 10, paddingHorizontal: 2, letterSpacing: 0.8 }}>
              INFORMATIONS PERSONNELLES
            </ThemedText>
          </View>

          <View className="bg-secondary rounded-2xl p-4 mb-5" style={shadowPresets.medium}>
            <Field label="Prénom" value={firstName} onChangeText={setFirstName} placeholder="Votre prénom" />
            <Field label="Nom" value={lastName} onChangeText={setLastName} placeholder="Votre nom" />
            <Field label="Téléphone" value={phone} onChangeText={setPhone} placeholder="+33 6 00 00 00 00" keyboardType="phone-pad" />
            <Field label="Email" value={user?.email ?? ''} editable={false} />

            <Button
              title={saving ? 'Sauvegarde…' : 'Enregistrer les modifications'}
              iconStart={saving ? undefined : 'Save'}
              rounded="xl"
              onPress={handleSaveInfo}
              disabled={saving}
              style={{ marginTop: 6 }}
            />
          </View>

          {/* Changer le mot de passe */}
          <View style={{ marginBottom: 4 }}>
            <ThemedText style={{ fontSize: 12, fontWeight: '700', color: colors.subtext, marginBottom: 10, paddingHorizontal: 2, letterSpacing: 0.8 }}>
              CHANGER LE MOT DE PASSE
            </ThemedText>
          </View>

          <View className="bg-secondary rounded-2xl p-4 mb-10" style={shadowPresets.medium}>
            <Field label="Mot de passe actuel" value={currentPwd} onChangeText={setCurrentPwd} placeholder="••••••••" secureTextEntry />
            <Field label="Nouveau mot de passe" value={newPwd} onChangeText={setNewPwd} placeholder="Min. 8 caractères" secureTextEntry />
            <Field label="Confirmer le nouveau mot de passe" value={confirmPwd} onChangeText={setConfirmPwd} placeholder="••••••••" secureTextEntry />

            <Button
              title={savingPwd ? 'Modification…' : 'Changer le mot de passe'}
              iconStart={savingPwd ? undefined : 'Lock'}
              variant="outline"
              rounded="xl"
              onPress={handleChangePassword}
              disabled={savingPwd}
              style={{ marginTop: 6 }}
            />
          </View>

        </AnimatedView>
      </ThemedScroller>
    </KeyboardAvoidingView>
  );
}
