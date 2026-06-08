/**
 * useMandatoryDocs
 * Vérifie si les documents obligatoires de l'agence (gestionnaire) sont tous validés.
 * Utilisé comme garde sur toutes les pages créant des ressources.
 * Pour un chauffeur individuel, utiliser checkChauffeur(id).
 */
import { useState, useEffect, useCallback } from "react";
import { documentApi, userApi, type MandatoryCheckResult } from "@/lib/api";

export interface UseMandatoryDocsResult {
  loading: boolean;
  complete: boolean;
  result: MandatoryCheckResult | null;
  refresh: () => void;
  isGestionnaire: boolean;
}

export function useMandatoryDocs(): UseMandatoryDocsResult {
  const [loading, setLoading]           = useState(true);
  const [result, setResult]             = useState<MandatoryCheckResult | null>(null);
  const [isGestionnaire, setIsGest]     = useState(false);

  const check = useCallback(async () => {
    setLoading(true);
    try {
      const meRes = await userApi.me();
      const role  = meRes.user.role;
      setIsGest(role === "gestionnaire");
      if (role === "gestionnaire") {
        const r = await documentApi.mandatoryCheck("agency");
        setResult(r);
      } else {
        setResult({ complete: true, mandatory: [], blocking: [] });
      }
    } catch {
      // En cas d'erreur réseau, ne pas bloquer
      setResult({ complete: true, mandatory: [], blocking: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { check(); }, [check]);

  return {
    loading,
    complete: result?.complete ?? true,
    result,
    refresh: check,
    isGestionnaire,
  };
}

/** Vérification des docs obligatoires d'un chauffeur spécifique (usage ponctuel). */
export async function checkChauffeurDocs(chauffeurId: string): Promise<MandatoryCheckResult> {
  try {
    return await documentApi.mandatoryCheck("chauffeur", chauffeurId);
  } catch {
    return { complete: true, mandatory: [], blocking: [] };
  }
}
