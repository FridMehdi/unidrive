import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import Header from 'components/Header';
import ThemedText from '@/components/ThemedText';
import AnimatedView from '@/components/AnimatedView';
import Icon from '@/components/Icon';
import { Button } from '@/components/Button';
import { shadowPresets } from '@/utils/useShadow';
import useThemeColors from '@/contexts/ThemeColors';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalSearchParams } from 'expo-router';
import { chauffeurProfileApi, vehicleApi, documentApi, type Vehicle, type VtcDocument } from '@/services/api';
import { router } from 'expo-router';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function statutLabel(statut: Vehicle['statut']): string {
  return (
    { en_service: 'En service', disponible: 'Disponible', en_revision: 'En révision', hors_service: 'Hors service' }[statut] ?? statut
  );
}

function statutColor(statut: Vehicle['statut']): string {
  return (
    { en_service: '#22c55e', disponible: '#3b82f6', en_revision: '#f59e0b', hors_service: '#ef4444' }[statut] ?? '#888'
  );
}

// ─── Vehicle doc types ────────────────────────────────────────────────────────

const VEHICLE_DOC_META: Record<string, { label: string; icon: string }> = {
  carte_grise:        { label: 'Carte grise',          icon: 'FileText' },
  assurance:          { label: 'Assurance',             icon: 'Shield' },
  controle_technique: { label: 'Contrôle technique',   icon: 'ClipboardCheck' },
  vignette:           { label: 'Vignette',              icon: 'Tag' },
  autre:              { label: 'Autre document',        icon: 'File' },
};

const DOC_TYPES = Object.keys(VEHICLE_DOC_META);

const STATUT_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  valide:     { label: 'Validé',      color: '#22c55e', icon: 'CheckCircle' },
  en_attente: { label: 'En attente',  color: '#f59e0b', icon: 'Clock' },
  expire:     { label: 'Expiré',      color: '#ef4444', icon: 'XCircle' },
  refuse:     { label: 'Refusé',      color: '#ef4444', icon: 'XCircle' },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function MonVehicule() {
  const colors = useThemeColors();
  const { token } = useAuth();
  const { id: vehicleIdParam } = useLocalSearchParams<{ id?: string }>();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Edit vehicle modal ────────────────────────────────────────────────────
  const [editModal, setEditModal]   = useState(false);
  const [editImmat, setEditImmat]   = useState('');
  const [editMarque, setEditMarque] = useState('');
  const [editModele, setEditModele] = useState('');
  const [editAnnee,  setEditAnnee]  = useState('');
  const [editCouleur, setEditCouleur] = useState('');
  const [editKm,     setEditKm]     = useState('');
  const [editNotes,  setEditNotes]  = useState('');
  const [saving,     setSaving]     = useState(false);

  // ── Delete vehicle ────────────────────────────────────────────────────────
  const [deletingVehicle,  setDeletingVehicle]  = useState(false);
  const [deletingDocId,    setDeletingDocId]    = useState<string | null>(null);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);

  const [uploadModal, setUploadModal] = useState(false);
  const [uploadType,  setUploadType]  = useState('');
  const [uploadNom,   setUploadNom]   = useState('');
  const [uploadDate,  setUploadDate]  = useState('');
  const [uploadFile,  setUploadFile]  = useState<{ uri: string; name: string; mimeType: string } | null>(null);
  const [uploading,   setUploading]   = useState(false);
  const [filePickerVisible, setFilePickerVisible] = useState(false);
  const [uploadOldDocId, setUploadOldDocId] = useState<string | null>(null);

  // ── Docs state ────────────────────────────────────────────────────────────
  const [docs, setDocs] = useState<VtcDocument[]>([]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const profile = await chauffeurProfileApi.me(token);
      const res = await vehicleApi.listByChauffeur(profile.id, token);
      // Si un vehicle_id est passé en paramètre, charger ce véhicule précis
      const v = vehicleIdParam
        ? (res.data.find((v: Vehicle) => v.id === vehicleIdParam) ?? res.data[0] ?? null)
        : (res.data[0] ?? null);
      setVehicle(v);
      if (v) {
        const docsRes = await documentApi.listByVehicle(v.id, token);
        setDocs(docsRes.data ?? []);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [token, vehicleIdParam]);

  useEffect(() => { load(); }, [load]);

  // ── Auto mise en service ──────────────────────────────────────────────────
  // Si CT + assurance sont valides et non expirés → passe le véhicule en_service
  useEffect(() => {
    if (!vehicle || !token || vehicle.statut === 'en_service') return;

    const latest = (type: string) =>
      docs
        .filter(d => d.type_doc === type)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    const ct  = latest('controle_technique');
    const ass = latest('assurance');

    const ctOk  = ct?.statut  === 'valide' && daysUntil(ct.date_expiration  ?? null) !== null && (daysUntil(ct.date_expiration  ?? null) ?? -1) >= 0;
    const assOk = ass?.statut === 'valide' && daysUntil(ass.date_expiration ?? null) !== null && (daysUntil(ass.date_expiration ?? null) ?? -1) >= 0;

    if (ctOk && assOk) {
      vehicleApi.update(vehicle.id, { statut: 'en_service' }, token)
        .then(() => setVehicle(v => v ? { ...v, statut: 'en_service' } : v))
        .catch(() => {});
    }
  }, [docs, vehicle?.id, vehicle?.statut, token]);

  // ── Pickers ───────────────────────────────────────────────────────────────
  async function pickFromGallery() {
    setFilePickerVisible(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', "Autorisez l'accès à la galerie dans les Paramètres.", [
        { text: 'Paramètres', onPress: () => Linking.openSettings() },
        { text: 'Annuler' },
      ]);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
      exif: false,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const name = asset.uri.split('/').pop()?.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg') ?? 'document.jpg';
      setUploadFile({ uri: asset.uri, name, mimeType: 'image/jpeg' });
      if (!uploadNom) setUploadNom(VEHICLE_DOC_META[uploadType]?.label ?? name);
    }
  }

  async function pickFromFiles() {
    setFilePickerVisible(false);
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setUploadFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? 'application/pdf' });
      if (!uploadNom) setUploadNom(VEHICLE_DOC_META[uploadType]?.label ?? asset.name);
    }
  }

  async function handleUpload() {
    if (!uploadFile || !uploadType || !vehicle || !token) return;
    setUploading(true);
    try {
      await documentApi.uploadVehicle({
        vehicleId:      vehicle.id,
        typeDoc:        uploadType,
        nom:            uploadNom || (VEHICLE_DOC_META[uploadType]?.label ?? uploadType),
        fileUri:        uploadFile.uri,
        fileName:       uploadFile.name,
        mimeType:       uploadFile.mimeType,
        dateExpiration: uploadDate ? uploadDate.split('/').reverse().join('-') : undefined,
        token,
      });

      setUploadModal(false);
      // Supprimer l'ancien document si on remplace
      if (uploadOldDocId) {
        await documentApi.delete(uploadOldDocId, token).catch(() => {});
        setUploadOldDocId(null);
      }
      setUploadFile(null); setUploadDate(''); setUploadNom(''); setUploadType('');
      load();
    } catch (e) {
      Alert.alert('Erreur', (e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function openUploadFor(typeDoc: string, oldDocId?: string) {
    setUploadType(typeDoc);
    setUploadNom(VEHICLE_DOC_META[typeDoc]?.label ?? '');
    setUploadDate('');
    setUploadFile(null);
    setUploadOldDocId(oldDocId ?? null);
    setUploadModal(true);
  }

  function openEditVehicle() {
    if (!vehicle) return;
    setEditImmat(vehicle.immatriculation ?? '');
    setEditMarque(vehicle.marque ?? '');
    setEditModele(vehicle.modele ?? '');
    setEditAnnee(vehicle.annee != null ? String(vehicle.annee) : '');
    setEditCouleur(vehicle.couleur ?? '');
    setEditKm(vehicle.kilometrage != null ? String(vehicle.kilometrage) : '');
    setEditNotes(vehicle.notes ?? '');
    setEditModal(true);
  }

  async function handleSaveVehicle() {
    if (!vehicle || !token) return;
    setSaving(true);
    try {
      await vehicleApi.update(vehicle.id, {
        immatriculation: editImmat,
        marque: editMarque,
        modele: editModele,
        annee: editAnnee ? Number(editAnnee) : undefined,
        couleur: editCouleur,
        kilometrage: editKm ? Number(editKm) : undefined,
        notes: editNotes,
      }, token);
      setEditModal(false);
      load();
    } catch (e) {
      Alert.alert('Erreur', (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteVehicle() {
    if (!vehicle) return;
    Alert.alert(
      'Supprimer le véhicule',
      `Voulez-vous vraiment supprimer le véhicule ${vehicle.immatriculation} ? Cette action supprimera aussi tous ses documents.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setDeletingVehicle(true);
            try {
              await vehicleApi.delete(vehicle.id, token!);
              router.back();
            } catch (e) {
              Alert.alert('Erreur', (e as Error).message);
              setDeletingVehicle(false);
            }
          },
        },
      ]
    );
  }

  async function handleDownloadDoc(docId: string) {
    setDownloadingDocId(docId);
    try {
      const res = await documentApi.getDownloadUrl(docId, token!);
      await Linking.openURL(res.url);
    } catch (e) {
      Alert.alert('Erreur', (e as Error).message);
    } finally {
      setDownloadingDocId(null);
    }
  }

  function handleDeleteDoc(docId: string, docLabel: string) {
    Alert.alert(
      'Supprimer le document',
      `Voulez-vous vraiment supprimer "${docLabel}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setDeletingDocId(docId);
            try {
              await documentApi.delete(docId, token!);
              load();
            } catch (e) {
              Alert.alert('Erreur', (e as Error).message);
            } finally {
              setDeletingDocId(null);
            }
          },
        },
      ]
    );
  }

  const inputStyle = {
    backgroundColor: colors.bg,
    color: colors.text,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  } as const;

  // ── Expiry colors ──────────────────────────────────────────────────────────
  // Dates tirées du document le plus récent par type (robuste après remplacement)
  const latestByType = (type: string) =>
    docs
      .filter(d => d.type_doc === type)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  const docCT  = latestByType('controle_technique');
  const docAss = latestByType('assurance');
  const dateCT  = docCT?.date_expiration  ?? null;
  const dateAss = docAss?.date_expiration ?? null;

  const daysCT        = daysUntil(dateCT);
  const daysAssurance = daysUntil(dateAss);

  const ctColor  = daysCT        === null ? colors.subtext : daysCT        < 30 ? '#ef4444' : daysCT        < 60 ? '#f59e0b' : '#22c55e';
  const assColor = daysAssurance === null ? colors.subtext : daysAssurance < 30 ? '#ef4444' : daysAssurance < 60 ? '#f59e0b' : '#22c55e';

  function expiryLabel(days: number | null, dateStr: string | null): string {
    if (days === null) return formatDate(dateStr);
    if (days < 0) return `Expiré (${formatDate(dateStr)})`;
    if (days === 0) return "Expire aujourd'hui";
    return `${formatDate(dateStr)} (${days} j)`;
  }

  return (
    <>
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Mon véhicule" showBackButton />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.highlight} />
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
          <Icon name="AlertCircle" size={40} color="#ef4444" />
          <ThemedText className="text-center text-subtext">{error}</ThemedText>
          <TouchableOpacity
            onPress={load}
            style={{ backgroundColor: colors.highlight, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 }}
          >
            <ThemedText style={{ color: '#fff', fontWeight: '600' }}>Réessayer</ThemedText>
          </TouchableOpacity>
        </View>
      ) : !vehicle ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 }}>
          <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: `${colors.highlight}15`, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <Icon name="Car" size={28} className="text-highlight" />
          </View>
          <ThemedText className="text-lg font-bold">Aucun véhicule assigné</ThemedText>
          <ThemedText className="text-sm text-subtext text-center">
            Votre gestionnaire n'a pas encore associé de véhicule à votre compte.
          </ThemedText>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 12 }}
        >
          <AnimatedView animation="scaleIn" duration={300}>

            {/* ── Identité ─────────────────────────────────────────────── */}
            <View className="bg-secondary rounded-2xl p-5 mb-4" style={shadowPresets.medium}>
              <View className="flex-row items-center gap-3 mb-4">
                <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: `${colors.highlight}15`, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="Car" size={22} className="text-highlight" />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText className="text-lg font-bold">{vehicle.marque} {vehicle.modele}</ThemedText>
                  <ThemedText className="text-sm text-subtext">{vehicle.immat}{vehicle.annee ? ` · ${vehicle.annee}` : ''}</ThemedText>
                </View>
                <View className="flex-row items-center gap-2">
                  <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: `${statutColor(vehicle.statut)}20` }}>
                    <ThemedText className="text-xs font-semibold" style={{ color: statutColor(vehicle.statut) }}>
                      {statutLabel(vehicle.statut)}
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    onPress={openEditVehicle}
                    style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: `${colors.highlight}15`, alignItems: 'center', justifyContent: 'center' }}
                    activeOpacity={0.7}
                  >
                    <Icon name="Pencil" size={14} className="text-highlight" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ gap: 10 }}>
                {(
                  [
                    { icon: 'Palette',  label: 'Couleur',     value: vehicle.couleur },
                    { icon: 'Gauge',    label: 'Kilométrage', value: vehicle.kilometrage != null ? `${vehicle.kilometrage.toLocaleString('fr-FR')} km` : null },
                    { icon: 'FileText', label: 'Notes',       value: vehicle.notes },
                  ] as { icon: string; label: string; value: string | null | undefined }[]
                ).filter((r) => r.value != null && r.value !== '').map(({ icon, label, value }) => (
                  <View key={label} className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Icon name={icon as any} size={14} className="text-subtext" />
                      <ThemedText className="text-sm text-subtext">{label}</ThemedText>
                    </View>
                    <ThemedText className="text-sm font-medium" style={{ maxWidth: '60%', textAlign: 'right' }}>{value}</ThemedText>
                  </View>
                ))}
              </View>

              {/* Supprimer véhicule */}
              <TouchableOpacity
                onPress={handleDeleteVehicle}
                className="flex-row items-center justify-center gap-2 mt-4 py-2.5 rounded-xl"
                style={{ backgroundColor: '#ef444412', borderWidth: 1, borderColor: '#ef444430' }}
                activeOpacity={0.7}
                disabled={deletingVehicle}
              >
                {deletingVehicle ? (
                  <ActivityIndicator size={14} color="#ef4444" />
                ) : (
                  <Icon name="Trash2" size={14} color="#ef4444" />
                )}
                <ThemedText className="text-sm font-medium" style={{ color: '#ef4444' }}>
                  Supprimer ce véhicule
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* ── Dates réglementaires ─────────────────────────────────── */}
            <View className="bg-secondary rounded-2xl p-4 mb-4" style={shadowPresets.small}>
              <View className="flex-row items-center gap-2 mb-3">
                <Icon name="Calendar" size={16} className="text-highlight" />
                <ThemedText className="font-semibold">Dates réglementaires</ThemedText>
              </View>

              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <Icon name="ClipboardCheck" size={14} color={ctColor} />
                  <ThemedText className="text-sm text-subtext">Contrôle technique</ThemedText>
                </View>
                <ThemedText className="text-sm font-semibold" style={{ color: ctColor }}>
                  {expiryLabel(daysCT, dateCT)}
                </ThemedText>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Icon name="ShieldCheck" size={14} color={assColor} />
                  <ThemedText className="text-sm text-subtext">Assurance</ThemedText>
                </View>
                <ThemedText className="text-sm font-semibold" style={{ color: assColor }}>
                  {expiryLabel(daysAssurance, dateAss)}
                </ThemedText>
              </View>
            </View>

            {/* ── Conformité VTC ───────────────────────────────────────── */}
            <View className="bg-secondary rounded-2xl p-4 mb-4" style={shadowPresets.small}>
              <View className="flex-row items-center gap-2 mb-3">
                <Icon name="ShieldCheck" size={16} className="text-highlight" />
                <ThemedText className="font-semibold">Conformité VTC</ThemedText>
              </View>
              {[
                { label: 'Véhicule en service',        ok: vehicle.statut === 'en_service' },
                { label: 'Contrôle technique valide',  ok: daysCT !== null && daysCT >= 0 },
                { label: 'Assurance valide',           ok: daysAssurance !== null && daysAssurance >= 0 },
              ].map(({ label, ok }) => (
                <View key={label} className="flex-row items-center gap-2 mb-1.5">
                  <Icon name={ok ? 'CheckCircle' : 'XCircle'} size={14} color={ok ? '#22c55e' : '#ef4444'} />
                  <ThemedText className="text-sm" style={{ color: ok ? colors.text : '#ef4444' }}>
                    {label}
                  </ThemedText>
                </View>
              ))}
            </View>

            {/* ── Documents véhicule ───────────────────────────────────── */}
            <View className="bg-secondary rounded-2xl p-4 mb-4" style={shadowPresets.small}>
              <View className="flex-row items-center gap-2 mb-4">
                <Icon name="FolderOpen" size={16} className="text-highlight" />
                <ThemedText className="font-semibold">Documents véhicule</ThemedText>
              </View>

              <View style={{ gap: 10 }}>
                {DOC_TYPES.map((typeDoc) => {
                  const meta = VEHICLE_DOC_META[typeDoc];
                  const doc = docs.find(d => d.type_doc === typeDoc);
                  const statusKey = doc?.statut ?? 'manquant';
                  const statusCfg = STATUT_CONFIG[statusKey] ?? { label: 'Manquant', color: '#9ca3af', icon: 'Circle' };
                  const canUpload = !doc || doc.statut === 'refuse' || doc.statut === 'expire';

                  return (
                    <View
                      key={typeDoc}
                      className="rounded-xl p-3"
                      style={{ backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }}
                    >
                      <View className="flex-row items-center gap-3">
                        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${statusCfg.color}15`, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon name={meta.icon as any} size={16} color={statusCfg.color} />
                        </View>

                        <View style={{ flex: 1, minWidth: 0 }}>
                          <ThemedText className="text-sm font-semibold">{meta.label}</ThemedText>
                          {doc ? (
                            <ThemedText className="text-xs text-subtext" numberOfLines={1}>{doc.nom}</ThemedText>
                          ) : (
                            <ThemedText className="text-xs text-subtext">Non soumis</ThemedText>
                          )}
                          {doc?.date_expiration && (
                            <ThemedText className="text-xs text-subtext">
                              Exp : {new Date(doc.date_expiration).toLocaleDateString('fr-FR')}
                            </ThemedText>
                          )}
                          {doc?.notes && doc.statut === 'refuse' && (
                            <ThemedText className="text-xs" style={{ color: '#ef4444' }}>Motif : {doc.notes}</ThemedText>
                          )}
                        </View>

                        <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: `${statusCfg.color}20`, flexShrink: 0 }}>
                          <Icon name={statusCfg.icon as any} size={10} color={statusCfg.color} />
                          <ThemedText className="text-xs font-medium" style={{ color: statusCfg.color }}>{statusCfg.label}</ThemedText>
                        </View>
                      </View>

                      {/* Actions : upload si manquant, télécharger+remplacer+supprimer si doc existe */}
                      {doc ? (
                        <View className="flex-row gap-2 mt-2.5">
                          <TouchableOpacity
                            onPress={() => handleDownloadDoc(doc.id)}
                            className="flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-xl"
                            style={{ backgroundColor: `${colors.highlight}18`, borderWidth: 1, borderColor: `${colors.highlight}35` }}
                            activeOpacity={0.7}
                            disabled={downloadingDocId === doc.id}
                          >
                            {downloadingDocId === doc.id ? (
                              <ActivityIndicator size={12} style={{ color: colors.highlight }} />
                            ) : (
                              <Icon name="Download" size={12} style={{ color: colors.highlight }} />
                            )}
                            <ThemedText className="text-xs font-medium" style={{ color: colors.highlight }}>Télécharger</ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => openUploadFor(typeDoc, doc.id)}
                            className="flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-xl"
                            style={{ backgroundColor: `${colors.highlight}12`, borderWidth: 1, borderColor: `${colors.highlight}30` }}
                            activeOpacity={0.7}
                          >
                            <Icon name="RefreshCw" size={12} style={{ color: colors.highlight }} />
                            <ThemedText className="text-xs font-medium" style={{ color: colors.highlight }}>Remplacer</ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteDoc(doc.id, doc.nom)}
                            className="flex-row items-center justify-center gap-1 py-2 px-3 rounded-xl"
                            style={{ backgroundColor: '#ef444415', borderWidth: 1, borderColor: '#ef444430' }}
                            activeOpacity={0.7}
                            disabled={deletingDocId === doc.id}
                          >
                            {deletingDocId === doc.id ? (
                              <ActivityIndicator size={12} color="#ef4444" />
                            ) : (
                              <Icon name="Trash2" size={12} color="#ef4444" />
                            )}
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={() => openUploadFor(typeDoc)}
                          className="mt-2.5 flex-row items-center justify-center gap-2 py-2 rounded-xl"
                          style={{ backgroundColor: `${colors.highlight}12`, borderWidth: 1, borderColor: `${colors.highlight}30`, borderStyle: 'dashed' }}
                          activeOpacity={0.7}
                        >
                          <Icon name="Upload" size={13} style={{ color: colors.highlight }} />
                          <ThemedText className="text-xs font-medium" style={{ color: colors.highlight }}>
                            Joindre le document
                          </ThemedText>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>

          </AnimatedView>
        </ScrollView>
      )}
    </View>

    {/* ── Modal Upload ──────────────────────────────────────────────────────── */}
    <Modal
      visible={uploadModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setUploadModal(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: colors.bg, position: 'relative' }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center gap-3">
              <View className="size-10 rounded-xl items-center justify-center" style={{ backgroundColor: `${colors.highlight}15` }}>
                <Icon name={(VEHICLE_DOC_META[uploadType]?.icon ?? 'FileText') as any} size={18} style={{ color: colors.highlight }} />
              </View>
              <View>
                <ThemedText className="font-bold text-base">{VEHICLE_DOC_META[uploadType]?.label ?? uploadType}</ThemedText>
                <ThemedText className="text-xs text-subtext">Document véhicule · soumission</ThemedText>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setUploadModal(false)}
              className="size-8 rounded-full bg-secondary items-center justify-center"
            >
              <Icon name="X" size={16} className="text-text" />
            </TouchableOpacity>
          </View>

          {/* Nom */}
          <ThemedText className="text-sm font-semibold mb-2 text-subtext">Nom du document</ThemedText>
          <TextInput
            value={uploadNom}
            onChangeText={setUploadNom}
            placeholder="Ex: Carte grise Toyota Prius"
            placeholderTextColor={colors.subtext}
            style={[inputStyle, { marginBottom: 16 }]}
          />

          {/* Date expiration */}
          <ThemedText className="text-sm font-semibold mb-2 text-subtext">Date d'expiration (JJ/MM/AAAA)</ThemedText>
          <TextInput
            value={uploadDate}
            onChangeText={setUploadDate}
            placeholder="Ex: 31/12/2027 (vide si illimitée)"
            placeholderTextColor={colors.subtext}
            keyboardType="numbers-and-punctuation"
            style={[inputStyle, { marginBottom: 20 }]}
          />

          {/* Fichier */}
          <View className="mb-6">
            <Button
              title={uploadFile ? uploadFile.name : 'Choisir un fichier / photo'}
              iconStart={uploadFile ? 'ImageIcon' : 'Upload'}
              variant="outline"
              rounded="xl"
              onPress={() => setFilePickerVisible(true)}
            />
          </View>

          {/* Actions */}
          <View className="gap-3 pb-8">
            <Button
              title={uploading ? 'Envoi en cours…' : 'Soumettre pour validation'}
              iconStart={uploading ? undefined : 'Send'}
              rounded="xl"
              onPress={handleUpload}
              disabled={!uploadFile || uploading}
            />
            <Button
              title="Annuler"
              variant="outline"
              rounded="xl"
              onPress={() => setUploadModal(false)}
            />
          </View>
        </ScrollView>

        {/* Bottom sheet source fichier */}
        {filePickerVisible && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }}>
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: '#00000055' }}
              activeOpacity={1}
              onPress={() => setFilePickerVisible(false)}
            />
            <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 36, paddingHorizontal: 20, paddingTop: 16 }}>
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 18 }} />
                <ThemedText style={{ fontWeight: '700', fontSize: 17 }}>Joindre un document</ThemedText>
                <ThemedText style={{ fontSize: 13, color: colors.subtext, marginTop: 4 }}>Choisissez une source</ThemedText>
              </View>

              <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
                <TouchableOpacity
                  onPress={pickFromFiles}
                  activeOpacity={0.7}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, backgroundColor: colors.secondary, borderBottomWidth: 1, borderBottomColor: colors.border }}
                >
                  <ThemedText style={{ fontSize: 16 }}>Fichiers (PDF)</ThemedText>
                  <Icon name="FileText" size={22} style={{ color: colors.subtext }} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={pickFromGallery}
                  activeOpacity={0.7}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, backgroundColor: colors.secondary }}
                >
                  <ThemedText style={{ fontSize: 16 }}>Photo (galerie)</ThemedText>
                  <Icon name="Image" size={22} style={{ color: colors.subtext }} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => setFilePickerVisible(false)}
                activeOpacity={0.7}
                style={{ marginTop: 12, padding: 16, borderRadius: 16, backgroundColor: colors.secondary, alignItems: 'center' }}
              >
                <ThemedText style={{ fontSize: 16, fontWeight: '600' }}>Annuler</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>

    {/* ── Modal Édition Véhicule ─────────────────────────────────────────── */}
    <Modal
      visible={editModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setEditModal(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: colors.bg }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <ThemedText className="text-xl font-bold">Modifier le véhicule</ThemedText>
            <TouchableOpacity onPress={() => setEditModal(false)} style={{ padding: 8 }} activeOpacity={0.7}>
              <Icon name="X" size={22} style={{ color: colors.subtext }} />
            </TouchableOpacity>
          </View>

          {/* Champs */}
          {[
            { label: 'Immatriculation', value: editImmat,   setter: setEditImmat,   placeholder: 'AB-123-CD' },
            { label: 'Marque',         value: editMarque,  setter: setEditMarque,  placeholder: 'Mercedes' },
            { label: 'Modèle',         value: editModele,  setter: setEditModele,  placeholder: 'Classe E' },
            { label: 'Couleur',        value: editCouleur, setter: setEditCouleur, placeholder: 'Noir' },
            { label: 'Année',          value: editAnnee,   setter: setEditAnnee,   placeholder: '2022', keyboardType: 'numeric' },
            { label: 'Kilométrage',    value: editKm,      setter: setEditKm,      placeholder: '50000', keyboardType: 'numeric' },
          ].map(({ label, value, setter, placeholder, keyboardType }) => (
            <View key={label} className="mb-4">
              <ThemedText className="text-sm font-medium mb-1.5" style={{ color: colors.subtext }}>{label}</ThemedText>
              <TextInput
                value={value}
                onChangeText={setter}
                placeholder={placeholder}
                placeholderTextColor={colors.subtext}
                keyboardType={(keyboardType as any) ?? 'default'}
                style={inputStyle}
              />
            </View>
          ))}

          <View className="mb-6">
            <ThemedText className="text-sm font-medium mb-1.5" style={{ color: colors.subtext }}>Notes</ThemedText>
            <TextInput
              value={editNotes}
              onChangeText={setEditNotes}
              placeholder="Informations complémentaires"
              placeholderTextColor={colors.subtext}
              multiline
              numberOfLines={3}
              style={[inputStyle, { minHeight: 80, textAlignVertical: 'top' }]}
            />
          </View>

          {/* Bouton sauvegarder */}
          <TouchableOpacity
            onPress={handleSaveVehicle}
            disabled={saving}
            className="flex-row items-center justify-center gap-2 py-3.5 rounded-2xl mb-8"
            style={{ backgroundColor: colors.highlight }}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size={18} color="#fff" />
            ) : (
              <Icon name="Save" size={18} color="#fff" />
            )}
            <ThemedText className="text-base font-semibold" style={{ color: '#fff' }}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
    </>
  );
}
