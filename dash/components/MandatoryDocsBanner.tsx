/**
 * MandatoryDocsBanner
 * Affiche une bannière d'avertissement si les documents obligatoires de
 * l'agence ne sont pas tous validés. Bloque visuellement les actions critiques.
 *
 * Usage: placer en haut de chauffeurs.tsx / missions.tsx / clients.tsx
 */
"use client";

import Link from "next/link";
import { AlertTriangleIcon, ShieldCheckIcon, ArrowRightIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { type MandatoryCheckResult } from "@/lib/api";

const TYPE_LABEL: Record<string, string> = {
  kbis_agence:         "Kbis Agence",
  assurance_rc_pro:    "Assurance RC Pro",
  licence_transport:   "Licence de transport",
  assurance:           "Assurance",
  permis_conduire:     "Permis de conduire",
  carte_vtc:           "Carte VTC",
  piece_identite:      "Pièce d'identité",
  visite_medicale:     "Visite médicale",
};

const STATUS_COLOR: Record<string, string> = {
  manquant:   "#ef4444",
  en_attente: "#f59e0b",
  expire:     "#ef4444",
  refuse:     "#8b5cf6",
};

const STATUS_LABEL: Record<string, string> = {
  manquant:   "Manquant",
  en_attente: "En attente de validation",
  expire:     "Expiré",
  refuse:     "Refusé",
};

interface Props {
  result: MandatoryCheckResult;
  /** Si true, affiche aussi quand complete === true (confirmation que c'est OK) */
  showWhenComplete?: boolean;
  /** Label de contexte : "créer une mission", "ajouter un chauffeur"… */
  contextLabel?: string;
}

export function MandatoryDocsBanner({ result, showWhenComplete = false, contextLabel }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  // Tout est validé
  if (result.complete) {
    if (!showWhenComplete) return null;
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 text-sm mb-4">
        <ShieldCheckIcon className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1">Tous les documents obligatoires de l'agence sont validés.</span>
        <button onClick={() => setDismissed(true)} className="ml-2 opacity-50 hover:opacity-100">
          <XIcon className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 mb-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangleIcon className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            Documents obligatoires incomplets
          </p>
        </div>
        <button onClick={() => setDismissed(true)} className="opacity-40 hover:opacity-80 flex-shrink-0">
          <XIcon className="w-4 h-4 text-amber-700" />
        </button>
      </div>

      {contextLabel && (
        <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
          Pour pouvoir {contextLabel}, complétez et faites valider les documents suivants :
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        {result.blocking.map((item) => (
          <span
            key={item.type}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
            style={{ color: STATUS_COLOR[item.status] ?? "#ef4444", backgroundColor: `${STATUS_COLOR[item.status] ?? "#ef4444"}18` }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {TYPE_LABEL[item.type] ?? item.type}
            <span className="opacity-70">— {STATUS_LABEL[item.status] ?? item.status}</span>
          </span>
        ))}
      </div>

      <Link
        href="/documents"
        className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline"
      >
        Gérer les documents <ArrowRightIcon className="w-3 h-3" />
      </Link>
    </div>
  );
}
