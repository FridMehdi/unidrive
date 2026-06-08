import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { chauffeurProfileApi, documentApi, type MandatoryCheckResult } from '@/services/api';

interface UseChauffeurMandatoryDocsReturn {
  result: MandatoryCheckResult | null;
  loading: boolean;
  complete: boolean;
  refresh: () => void;
}

export function useChauffeurMandatoryDocs(): UseChauffeurMandatoryDocsReturn {
  const { token } = useAuth();
  const [result, setResult]   = useState<MandatoryCheckResult | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try {
      const profile = await chauffeurProfileApi.me(token);
      const r = await documentApi.mandatoryCheck(profile.id, token);
      setResult(r);
    } catch {
      // fail-open : on ne bloque pas sur erreur réseau
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetch();
    }, [fetch])
  );

  return {
    result,
    loading,
    complete: !result || result.complete, // fail-open
    refresh:  fetch,
  };
}
