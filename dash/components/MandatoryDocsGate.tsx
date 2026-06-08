/**
 * MandatoryDocsGate
 *
 * Affiche une bannière bloquante si les documents obligatoires de l'agence
 * ne sont pas tous validés. Wrap le contenu d'une page pour empêcher les
 * actions tant que le dossier agence n'est pas complet.
 *
 * Usage:
 *   <MandatoryDocsGate>
 *     <Button>Créer un chauffeur</Button>
 *   </MandatoryDocsGate>
 *
 * Ou en mode "alerte seulement" (sans bloquer) avec allowAction={true}.
 */
import { useRouter } from "next/router";
import { AlertTriangleIcon, ShieldCheckIcon, FileTextIcon, ClockIcon, XCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMandatoryDocs } from "@/hooks/useMandatoryDocs";
import type { MandatoryDocItem } from "@/lib/api";

const TYPE_LABEL: Record<string, string> = {
  kbis_agence:       "Kbis de l'agence",
  assurance_rc_pro:  "Assurance RC Pro",
  licence_transport: "Licence de transport",
};

function StatusIcon({ status }: { status: MandatoryDocItem["status"] }) {
  if (status === "manquant") return <FileTextIcon className="w-4 h-4 text-red-500" />;
  if (status === "en_attente") return <ClockIcon className="w-4 h-4 text-amber-500" />;
  if (status === "refuse") return <XCircleIcon className="w-4 h-4 text-red-600" />;
  if (status === "expire") return <AlertTriangleIcon className="w-4 h-4 text-red-500" />;
  return <ShieldCheckIcon className="w-4 h-4 text-green-500" />;
}

const STATUS_LABEL: Record<MandatoryDocItem["status"], string> = {
  manquant:    "Manquant",
  en_attente:  "En attente de validation",
  refuse:      "Refusé",
  expire:      "Expiré",
  valide:      "Validé",
};

interface Props {
  /** Si true, affiche uniquement une alerte sans empêcher les actions */
  alertOnly?: boolean;
  children: React.ReactNode;
}

export function MandatoryDocsGate({ children, alertOnly = false }: Props) {
  const { loading, complete, result, isGestionnaire } = useMandatoryDocs();
  const router = useRouter();

  // Pas gestionnaire ou chargement → on laisse passer
  if (!isGestionnaire || loading || complete) return <>{children}</>;

  const blocking = result?.blocking ?? [];

  return (
    <>
      {/* Bannière d'avertissement */}
      <div className={`mx-6 mt-4 rounded-xl border ${alertOnly ? "border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800" : "border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800"} p-4`}>
        <div className="flex items-start gap-3">
          <AlertTriangleIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${alertOnly ? "text-amber-600" : "text-red-600"}`} />
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm ${alertOnly ? "text-amber-800 dark:text-amber-300" : "text-red-800 dark:text-red-300"}`}>
              {alertOnly ? "Documents agence incomplets" : "Action bloquée — Documents agence requis"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 mb-3">
              {alertOnly
                ? "Certains documents obligatoires de l'agence sont manquants ou en attente de validation."
                : "Vous devez compléter et faire valider les documents obligatoires de votre agence avant de réaliser cette action."}
            </p>

            {/* Liste des docs bloquants */}
            <div className="flex flex-wrap gap-2 mb-3">
              {blocking.map((item) => (
                <span key={item.type}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-border text-xs font-medium">
                  <StatusIcon status={item.status} />
                  {TYPE_LABEL[item.type] ?? item.type}
                  <span className="text-muted-foreground">· {STATUS_LABEL[item.status]}</span>
                </span>
              ))}
            </div>

            <Button size="sm" variant="outline" onClick={() => router.push("/documents")}>
              <FileTextIcon className="w-3.5 h-3.5 mr-1.5" />
              Gérer les documents agence
            </Button>
          </div>
        </div>
      </div>

      {/* Contenu : affiché mais désactivé si blocking */}
      {alertOnly ? (
        <>{children}</>
      ) : (
        <div className="pointer-events-none opacity-40 select-none" aria-disabled="true">
          {children}
        </div>
      )}
    </>
  );
}

/**
 * Variante légère : juste une bannière inline (pas de wrapper enfants).
 * Utile dans les modals de création.
 */
export function MandatoryDocsBanner({ onGoToDocs }: { onGoToDocs?: () => void }) {
  const { loading, complete, result, isGestionnaire } = useMandatoryDocs();
  const router = useRouter();

  if (!isGestionnaire || loading || complete) return null;

  const blocking = result?.blocking ?? [];

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 p-3 mb-2">
      <div className="flex items-start gap-2">
        <AlertTriangleIcon className="w-4 h-4 mt-0.5 text-red-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-red-800 dark:text-red-300">Documents agence requis</p>
          <p className="text-xs text-muted-foreground mt-0.5 mb-2">
            {blocking.length} document(s) manquant(s) ou non validé(s) : {blocking.map(b => TYPE_LABEL[b.type] ?? b.type).join(", ")}.
          </p>
          <button
            type="button"
            className="text-xs text-red-700 dark:text-red-400 underline underline-offset-2"
            onClick={() => { onGoToDocs ? onGoToDocs() : router.push("/documents"); }}>
            Compléter le dossier agence →
          </button>
        </div>
      </div>
    </div>
  );
}
