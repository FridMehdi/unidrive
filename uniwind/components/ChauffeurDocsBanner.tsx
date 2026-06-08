import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';
import type { MandatoryCheckResult } from '@/services/api';

const TYPE_LABELS: Record<string, string> = {
  permis_conduire: 'Permis de conduire',
  carte_vtc:       'Carte VTC',
  assurance:       'Assurance professionnelle',
  visite_medicale: 'Visite médicale',
  piece_identite:  'Pièce d\'identité',
  kbis:            'Kbis',
};

interface Props {
  result: MandatoryCheckResult;
  contextLabel?: string;
}

export function ChauffeurDocsBanner({ result, contextLabel = 'accepter des courses' }: Props) {
  if (result.complete) return null;

  // Ne montrer que les documents vraiment manquants (pas uploadés)
  const blocking = result.mandatory?.filter(m => m.status === 'manquant') ?? [];

  // Si aucun document manquant, masquer la bannière
  if (blocking.length === 0) return null;

  return (
    <View className="p-4 rounded-2xl mb-5" style={{ backgroundColor: '#f59e0b15' }}>
      {/* En-tête */}
      <View className="flex-row items-center gap-3 mb-3">
        <Icon name="AlertTriangle" size={18} color="#f59e0b" />
        <View className="flex-1">
          <ThemedText className="font-semibold text-sm" style={{ color: '#d97706' }}>
            Documents obligatoires incomplets
          </ThemedText>
          <ThemedText className="text-xs mt-0.5" style={{ color: '#d9770690' }}>
            Certains documents manquent. Vous ne pourrez pas {contextLabel} avant leur ajout.
          </ThemedText>
        </View>
      </View>

      {/* Liste docs bloquants */}
      {blocking.length > 0 && (
        <View className="gap-1.5 mb-3 pl-7">
          {blocking.map(item => (
            <View key={item.type} className="flex-row items-center gap-2">
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  flexShrink: 0,
                  backgroundColor: '#ef4444',
                }}
              />
              <ThemedText className="text-xs" style={{ color: '#d97706' }}>
                {TYPE_LABELS[item.type] ?? item.type}
              </ThemedText>
            </View>
          ))}
        </View>
      )}

      {/* Lien */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push('/chauffeur/screens/documents-legaux')}
        className="flex-row items-center gap-1 pl-7"
      >
        <ThemedText className="text-xs font-semibold" style={{ color: '#d97706' }}>
          Compléter mes documents
        </ThemedText>
        <Icon name="ArrowRight" size={12} color="#d97706" />
      </TouchableOpacity>
    </View>
  );
}

