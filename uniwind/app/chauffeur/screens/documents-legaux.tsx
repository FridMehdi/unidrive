import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import Header from 'components/Header';
import ThemedScroller from 'components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import AnimatedView from '@/components/AnimatedView';
import Icon from '@/components/Icon';
import { Button } from '@/components/Button';
import { shadowPresets } from '@/utils/useShadow';
import useThemeColors from '@/contexts/ThemeColors';
import { useAuth } from '@/contexts/AuthContext';
import { documentApi, chauffeurProfileApi, type VtcDocument, type MandatoryItem } from '@/services/api';

// ── Config docs obligatoires ──────────────────────────────────────────────────
const MANDATORY_ORDER = [
  'permis_conduire',
  'carte_vtc',
  'piece_identite',
  'assurance',
  'visite_medicale',
];

const TYPE_META: Record<string, { label: string; description: string; icon: string }> = {
  permis_conduire:  { label: 'Permis de conduire',         description: 'Permis B en cours de validité',              icon: 'Car' },
  carte_vtc:        { label: 'Carte professionnelle VTC',  description: 'Délivrée par l\'ITG / préfecture',            icon: 'CreditCard' },
  piece_identite:   { label: 'Pièce d\'identité',          description: 'CNI ou passeport en cours de validité',       icon: 'IdCard' },
  assurance:        { label: 'Assurance professionnelle',  description: 'RC Pro + tous risques obligatoire',            icon: 'Shield' },
  visite_medicale:  { label: 'Visite médicale',            description: 'Aptitude médicale à la conduite pro',         icon: 'Stethoscope' },
  kbis:             { label: 'Extrait Kbis / SIRET',       description: 'Pour auto-entrepreneurs et sociétés',         icon: 'Building2' },
  autre:            { label: 'Autre document',             description: '',                                            icon: 'FileText' },
};

export default function DocumentsLegaux() {
  const colors  = useThemeColors();
  const { token } = useAuth();

  const [chauffeurId, setChauffeurId] = useState<string | null>(null);
  const [docs,        setDocs]        = useState<VtcDocument[]>([]);
  const [mandatory,   setMandatory]   = useState<MandatoryItem[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  // Upload modal
  const [uploadType,  setUploadType]  = useState<string>('');
  const [uploadModal, setUploadModal] = useState(false);
  const [uploadDate,  setUploadDate]  = useState('');
  const [uploadNom,   setUploadNom]   = useState('');
  const [uploadFile,  setUploadFile]  = useState<{ uri: string; name: string; mimeType: string } | null>(null);
  const [uploading,   setUploading]   = useState(false);
  const [filePickerVisible, setFilePickerVisible] = useState(false);
  const [uploadOldDocId, setUploadOldDocId] = useState<string | null>(null);
  const [deletingDocId,    setDeletingDocId]    = useState<string | null>(null);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);

  // ── Chargement données ────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError(null);
    try {
      const profile  = await chauffeurProfileApi.me(token);
      const cid      = profile.id;
      setChauffeurId(cid);
      const [docsRes, checkRes] = await Promise.all([
        documentApi.listMine(cid, token),
        documentApi.mandatoryCheck(cid, token),
      ]);
      setDocs(docsRes.data ?? []);
      setMandatory(checkRes.mandatory ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // ── Pickers ──────────────────────────────────────────────────────────────
  async function pickFromGallery() {
    setFilePickerVisible(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Autorisez l\'accès à la galerie dans les Paramètres.', [
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
      const name  = asset.uri.split('/').pop()?.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg') ?? 'document.jpg';
      setUploadFile({ uri: asset.uri, name, mimeType: 'image/jpeg' });
      if (!uploadNom) setUploadNom(TYPE_META[uploadType]?.label ?? name);
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
      if (!uploadNom) setUploadNom(TYPE_META[uploadType]?.label ?? asset.name);
    }
  }

  function pickFile() {
    setFilePickerVisible(true);
  }

  async function handleUpload() {
    if (!uploadFile || !uploadType || !chauffeurId || !token) return;
    setUploading(true);
    try {
      await documentApi.upload({
        chauffeurId,
        typeDoc:         uploadType,
        nom:             uploadNom || (TYPE_META[uploadType]?.label ?? uploadType),
        fileUri:         uploadFile.uri,
        fileName:        uploadFile.name,
        mimeType:        uploadFile.mimeType,
        dateExpiration:  uploadDate ? uploadDate.split('/').reverse().join('-') : undefined,
        token,
      });
      // Supprimer l'ancien document si on remplace
      if (uploadOldDocId) {
        await documentApi.delete(uploadOldDocId, token).catch(() => {});
        setUploadOldDocId(null);
      }
      setUploadModal(false);
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
    setUploadNom(TYPE_META[typeDoc]?.label ?? '');
    setUploadDate('');
    setUploadFile(null);
    setUploadOldDocId(oldDocId ?? null);
    setUploadModal(true);
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
      `Voulez-vous vraiment supprimer "${docLabel}" ? Cette action est irréversible.`,
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

  // ── Statistiques ────────────────────────────────────────────────────────────
  const docByType: Record<string, VtcDocument> = {};
  for (const d of docs) {
    if (!docByType[d.type_doc]) docByType[d.type_doc] = d;
  }

  // Vérifier si tous les documents obligatoires ont été uploadés
  const mandatoryComplete = MANDATORY_ORDER.every(type => docByType[type]);
  const uploadedMandatoryCount = MANDATORY_ORDER.filter(type => docByType[type]).length;

  // Tous les types à afficher : obligatoires + docs déjà soumis non-obligatoires
  const shownTypes = Array.from(new Set([
    ...MANDATORY_ORDER,
    ...docs.map(d => d.type_doc),
  ]));

  const inputStyle = {
    backgroundColor: colors.bg,
    color: colors.text,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  };

  if (loading) {
    return (
      <>
        <Header title="Documents légaux" showBackButton />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.highlight} />
        </View>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header title="Documents légaux" showBackButton />
        <View className="flex-1 items-center justify-center p-6">
          <ThemedText className="text-center text-subtext mb-4">{error}</ThemedText>
          <Button title="Réessayer" onPress={load} />
        </View>
      </>
    );
  }

  return (
    <>
      <Header title="Documents légaux" showBackButton />
      <ThemedScroller>
        <AnimatedView animation="scaleIn" duration={300}>

          {/* ── Statut global ──────────────────────────────────────────── */}
          <View className="flex-row gap-3 mb-5 mt-1">
            <View className="flex-1 bg-secondary rounded-2xl p-3 items-center" style={shadowPresets.small}>
              <ThemedText className="text-2xl font-bold" style={{ color: colors.highlight }}>
                {uploadedMandatoryCount} / {MANDATORY_ORDER.length}
              </ThemedText>
              <ThemedText className="text-xs text-subtext mt-1">Obligatoires</ThemedText>
            </View>
            <View className="flex-1 bg-secondary rounded-2xl p-3 items-center" style={shadowPresets.small}>
              <ThemedText className="text-2xl font-bold" style={{ color: colors.highlight }}>
                {docs.length}
              </ThemedText>
              <ThemedText className="text-xs text-subtext mt-1">Total</ThemedText>
            </View>
          </View>

          {/* ── Alerte si incomplet ────────────────────────────────────── */}
          {!mandatoryComplete && (
            <View className="flex-row items-center gap-3 p-4 rounded-2xl mb-5" style={{ backgroundColor: '#f59e0b15' }}>
              <Icon name="AlertTriangle" size={18} color="#f59e0b" />
              <View className="flex-1">
                <ThemedText className="font-semibold text-sm" style={{ color: '#d97706' }}>
                  Documents obligatoires incomplets
                </ThemedText>
                <ThemedText className="text-xs mt-0.5" style={{ color: '#d9770690' }}>
                  Veuillez uploader tous les documents obligatoires.
                </ThemedText>
              </View>
            </View>
          )}

          {/* ── Bannière tout uploadé ───────────────────────────────────── */}
          {mandatoryComplete && (
            <View className="flex-row items-center gap-3 p-4 rounded-2xl mb-5" style={{ backgroundColor: '#22c55e15' }}>
              <Icon name="CheckCircle" size={18} color="#22c55e" />
              <ThemedText className="font-semibold text-sm" style={{ color: '#16a34a' }}>
                Tous vos documents obligatoires sont uploadés !
              </ThemedText>
            </View>
          )}

          {/* ── Liste docs ─────────────────────────────────────────────── */}
          <View className="gap-3 mb-8">
            {shownTypes.map((typeDoc) => {
              const meta     = TYPE_META[typeDoc] ?? { label: typeDoc, description: '', icon: 'FileText' };
              const doc      = docByType[typeDoc];
              const isMandat = MANDATORY_ORDER.includes(typeDoc);

              const isExpired = doc?.statut === 'expire';
              const isRefused = doc?.statut === 'refuse';
              const isWaiting = doc?.statut === 'en_attente';

              const STATUT_BADGE: Record<string, { label: string; color: string; bg: string }> = {
                expire:     { label: 'Expiré',      color: '#ef4444', bg: '#ef444420' },
                valide:     { label: 'Valide',      color: '#22c55e', bg: '#22c55e20' },
                en_attente: { label: 'En attente',  color: '#f59e0b', bg: '#f59e0b20' },
                refuse:     { label: 'Refusé',      color: '#ef4444', bg: '#ef444420' },
              };
              const badge = doc ? (STATUT_BADGE[doc.statut] ?? null) : null;

              return (
                <View
                  key={typeDoc}
                  className="rounded-2xl p-4"
                  style={[
                    shadowPresets.medium,
                    {
                      backgroundColor:
                        isExpired || isRefused ? '#ef444410' :
                        isWaiting              ? '#f59e0b10' :
                        colors.secondary,
                      borderWidth: isExpired || isRefused || isWaiting ? 1 : 0,
                      borderColor:
                        isExpired || isRefused ? '#ef444440' :
                        isWaiting              ? '#f59e0b40' :
                        'transparent',
                    },
                  ]}
                >
                  <View className="flex-row items-start gap-3">
                    {/* Icône */}
                    <View
                      className="size-11 rounded-xl items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${colors.highlight}15` }}
                    >
                      <Icon name={meta.icon as any} size={20} style={{ color: colors.highlight }} />
                    </View>

                    {/* Infos */}
                    <View className="flex-1 min-w-0">
                      <View className="flex-row items-center gap-2 flex-wrap">
                        <ThemedText className="font-semibold text-sm" numberOfLines={1}>
                          {meta.label}
                        </ThemedText>
                        {badge && (
                          <View style={{ backgroundColor: badge.bg, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 }}>
                            <ThemedText style={{ fontSize: 10, fontWeight: '700', color: badge.color }}>
                              {badge.label}
                            </ThemedText>
                          </View>
                        )}
                      </View>

                      {meta.description ? (
                        <ThemedText className="text-xs text-subtext mt-0.5">{meta.description}</ThemedText>
                      ) : null}

                      {/* Infos doc soumis */}
                      {doc && (
                        <View className="mt-1.5 gap-0.5">
                          <ThemedText className="text-xs text-subtext">{doc.nom}</ThemedText>
                          {doc.date_expiration && (
                            <ThemedText className="text-xs" style={{ color: isExpired ? '#ef4444' : undefined }} >
                              Exp : {new Date(doc.date_expiration).toLocaleDateString('fr-FR')}
                            </ThemedText>
                          )}
                        </View>
                      )}

                      {!doc && (
                        <ThemedText className="text-xs text-subtext mt-1">
                          Aucun document soumis
                        </ThemedText>
                      )}
                    </View>
                  </View>

                  {/* Actions : upload si vide, remplacer+supprimer si doc existe */}
                  {doc ? (
                    <View className="flex-row gap-2 mt-3">
                      <TouchableOpacity
                        onPress={() => handleDownloadDoc(doc.id)}
                        className="flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-xl"
                        style={{ backgroundColor: `${colors.highlight}18`, borderWidth: 1, borderColor: `${colors.highlight}35` }}
                        activeOpacity={0.7}
                        disabled={downloadingDocId === doc.id}
                      >
                        {downloadingDocId === doc.id ? (
                          <ActivityIndicator size={13} style={{ color: colors.highlight }} />
                        ) : (
                          <Icon name="Download" size={13} style={{ color: colors.highlight }} />
                        )}
                        <ThemedText className="text-xs font-medium" style={{ color: colors.highlight }}>Télécharger</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => openUploadFor(typeDoc, doc.id)}
                        className="flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-xl"
                        style={{ backgroundColor: `${colors.highlight}12`, borderWidth: 1, borderColor: `${colors.highlight}30` }}
                        activeOpacity={0.7}
                      >
                        <Icon name="RefreshCw" size={13} style={{ color: colors.highlight }} />
                        <ThemedText className="text-xs font-medium" style={{ color: colors.highlight }}>Remplacer</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteDoc(doc.id, doc.nom)}
                        className="flex-row items-center justify-center gap-1.5 py-2 px-3 rounded-xl"
                        style={{ backgroundColor: '#ef444415', borderWidth: 1, borderColor: '#ef444430' }}
                        activeOpacity={0.7}
                        disabled={deletingDocId === doc.id}
                      >
                        {deletingDocId === doc.id ? (
                          <ActivityIndicator size={13} color="#ef4444" />
                        ) : (
                          <Icon name="Trash2" size={13} color="#ef4444" />
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => openUploadFor(typeDoc)}
                      className="mt-3 flex-row items-center justify-center gap-2 py-2.5 rounded-xl"
                      style={{
                        backgroundColor: `${colors.highlight}12`,
                        borderWidth: 1,
                        borderColor: `${colors.highlight}30`,
                        borderStyle: 'dashed',
                      }}
                      activeOpacity={0.7}
                    >
                      <Icon name="Upload" size={15} style={{ color: colors.highlight }} />
                      <ThemedText className="text-sm font-medium" style={{ color: colors.highlight }}>
                        Joindre le document
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>

        </AnimatedView>
      </ThemedScroller>

      {/* ── Modal Upload ─────────────────────────────────────────────────────── */}
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
            {/* Header modal */}
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-row items-center gap-3">
                <View
                  className="size-10 rounded-xl items-center justify-center"
                  style={{ backgroundColor: `${colors.highlight}15` }}
                >
                  <Icon name={(TYPE_META[uploadType]?.icon ?? 'FileText') as any} size={18} style={{ color: colors.highlight }} />
                </View>
                <View>
                  <ThemedText className="font-bold text-base">
                    {TYPE_META[uploadType]?.label ?? uploadType}
                  </ThemedText>
                  <ThemedText className="text-xs text-subtext">Upload de document</ThemedText>
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
              placeholder="Ex: Permis de conduire Jean Dupont"
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
                title={uploadFile ? uploadFile.name : 'Choisir une photo / image'}
                iconStart={uploadFile ? 'ImageIcon' : 'Upload'}
                variant="outline"
                rounded="xl"
                onPress={pickFile}
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

          {/* ── Bottom sheet : choisir source fichier (dans le même Modal) ── */}
          {filePickerVisible && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }}>
              {/* Overlay */}
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: '#00000055' }}
                activeOpacity={1}
                onPress={() => setFilePickerVisible(false)}
              />
              {/* Sheet */}
              <View
                style={{
                  backgroundColor: colors.bg,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  paddingBottom: 36,
                  paddingHorizontal: 20,
                  paddingTop: 16,
                }}
              >
                {/* Pill + titre */}
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                  <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 18 }} />
                  <ThemedText style={{ fontWeight: '700', fontSize: 17 }}>Joindre un document</ThemedText>
                  <ThemedText style={{ fontSize: 13, color: colors.subtext, marginTop: 4 }}>Choisissez une source</ThemedText>
                </View>

                {/* Options groupées */}
                <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
                  <TouchableOpacity
                    onPress={pickFromFiles}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      padding: 18, backgroundColor: colors.secondary,
                      borderBottomWidth: 1, borderBottomColor: colors.border,
                    }}
                  >
                    <ThemedText style={{ fontSize: 16 }}>Choisir depuis les fichiers</ThemedText>
                    <Icon name="FileText" size={22} style={{ color: colors.subtext }} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={pickFromGallery}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      padding: 18, backgroundColor: colors.secondary,
                    }}
                  >
                    <ThemedText style={{ fontSize: 16 }}>Photo</ThemedText>
                    <Icon name="Image" size={22} style={{ color: colors.subtext }} />
                  </TouchableOpacity>
                </View>

                {/* Annuler */}
                <TouchableOpacity
                  onPress={() => setFilePickerVisible(false)}
                  activeOpacity={0.7}
                  style={{
                    marginTop: 12, padding: 16, borderRadius: 16,
                    backgroundColor: colors.secondary, alignItems: 'center',
                  }}
                >
                  <ThemedText style={{ fontSize: 16, fontWeight: '600' }}>Annuler</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>


    </>
  );
}
