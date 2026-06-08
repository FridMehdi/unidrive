/**
 * useMandatoryVehicleDocs
 * Vérifie si les documents obligatoires d'un véhicule sont tous validés.
 * Documents obligatoires: carte_grise, assurance, controle_technique
 */
import { documentApi, type MandatoryCheckResult, type VtcDocument } from "@/lib/api";

const MANDATORY_VEHICLE_DOCS = [
  { type: "carte_grise", label: "Carte grise" },
  { type: "assurance", label: "Assurance" },
  { type: "controle_technique", label: "Contrôle technique" },
];

/**
 * Vérifie les documents obligatoires d'un véhicule spécifique.
 * Retourne un résultat compatible avec MandatoryCheckResult.
 */
export async function checkVehicleDocs(vehicleId: string): Promise<MandatoryCheckResult> {
  try {
    const res = await documentApi.list({ owner_type: "vehicle", owner_id: vehicleId });
    const docs = res.data ?? [];
    
    const validDocs = docs.filter((d: VtcDocument) => d.statut === "valide");
    const validTypes = new Set(validDocs.map((d: VtcDocument) => d.type_doc));
    
    const mandatory = MANDATORY_VEHICLE_DOCS.map(({ type, label }) => ({
      type,
      status: validTypes.has(type) ? ("valide" as const) : ("manquant" as const),
    }));
    
    const blocking = mandatory.filter((d) => d.status === "manquant");
    const complete = blocking.length === 0;
    
    return { complete, mandatory, blocking };
  } catch (error) {
    // En cas d'erreur, considérer comme incomplet pour la sécurité
    return {
      complete: false,
      mandatory: MANDATORY_VEHICLE_DOCS.map(({ type, label }) => ({
        type,
        status: "manquant" as const,
      })),
      blocking: MANDATORY_VEHICLE_DOCS.map(({ type, label }) => ({
        type,
        status: "manquant" as const,
      })),
    };
  }
}
