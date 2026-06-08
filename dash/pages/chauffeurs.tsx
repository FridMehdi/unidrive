"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter } from "next/router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PlusIcon, SearchIcon, AlertTriangleIcon, PhoneIcon, MailIcon,
  Loader2Icon, XIcon, UserIcon, CheckCircleIcon, RefreshCwIcon, CopyIcon,
  KeyRoundIcon, UploadCloudIcon, FileTextIcon, SkipForwardIcon, CheckIcon,
} from "lucide-react";
import { chauffeurApi, documentApi, userApi, type Chauffeur, type ChauffeurStats } from "@/lib/api";
import { useMandatoryDocs } from "@/hooks/useMandatoryDocs";
import { MandatoryDocsBanner } from "@/components/MandatoryDocsBanner";

const STATUT: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  actif:      { label: "Actif",      color: "#22c55e", bg: "#22c55e18", dot: "#22c55e" },
  en_mission: { label: "En mission", color: "#3b82f6", bg: "#3b82f618", dot: "#3b82f6" },
  inactif:    { label: "Inactif",    color: "#94a3b8", bg: "#94a3b818", dot: "#94a3b8" },
  suspendu:   { label: "Suspendu",   color: "#ef4444", bg: "#ef444418", dot: "#ef4444" },
  en_conge:   { label: "En congé",   color: "#f59e0b", bg: "#f59e0b18", dot: "#f59e0b" },
};

const FILTER_TABS = ["tous", "actif", "en_mission", "inactif", "suspendu"];

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

function ExpiryBadge({ label, dateStr }: { label: string; dateStr: string | null }) {
  const d = daysUntil(dateStr);
  if (d === null) return null;
  if (d < 0)  return <span className="text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">{label} expiré</span>;
  if (d < 60) return <span className="text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">{label} &lt; {d}j</span>;
  return null;
}

function EditModal({ chauffeur, onClose, onSaved, onDeleted }: {
  chauffeur: Chauffeur;
  onClose: () => void;
  onSaved: (c: Chauffeur) => void;
  onDeleted: (id: string) => void;
}) {
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [form, setForm] = useState({
    first_name:             chauffeur.first_name ?? "",
    last_name:              chauffeur.last_name ?? "",
    email:                  chauffeur.email ?? "",
    phone:                  chauffeur.phone ?? "",
    statut:                 chauffeur.statut ?? "actif",
    ville:                  chauffeur.ville ?? "",
    numero_carte_vtc:       chauffeur.numero_carte_vtc ?? "",
    date_expiry_carte_vtc:  chauffeur.date_expiry_carte_vtc ? chauffeur.date_expiry_carte_vtc.slice(0,10) : "",
    numero_permis:          chauffeur.numero_permis ?? "",
    date_expiry_permis:     chauffeur.date_expiry_permis ? chauffeur.date_expiry_permis.slice(0,10) : "",
    notes:                  chauffeur.notes ?? "",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setSaving(true);
    try {
      const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ""));
      const updated = await chauffeurApi.update(String(chauffeur.id), payload);
      // Sync compte utilisateur : actif/en_mission → is_active=true, sinon → false
      if (chauffeur.user_id) {
        const isActive = form.statut === "actif" || form.statut === "en_mission";
        await userApi.updateUser(chauffeur.user_id, { is_active: isActive }).catch(() => {});
      }
      onSaved(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de sauvegarde");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true); setError(null);
    try {
      if (chauffeur.user_id) {
        await userApi.updateUser(chauffeur.user_id, { is_active: false }).catch(() => {});
      }
      await chauffeurApi.remove(String(chauffeur.id));
      onDeleted(String(chauffeur.id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de suppression");
    } finally { setDeleting(false); }
  };

  const inputCls = "w-full px-3 py-2 rounded-xl border border-border bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const lbl = "text-xs font-medium text-muted-foreground mb-1 block";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-base">{chauffeur.first_name} {chauffeur.last_name}</h2>
          <button onClick={onClose}><XIcon className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Identité</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Prénom</label><input className={inputCls} value={form.first_name} onChange={set("first_name")} /></div>
              <div><label className={lbl}>Nom</label><input className={inputCls} value={form.last_name} onChange={set("last_name")} /></div>
              <div><label className={lbl}>Email</label><input type="email" className={inputCls} value={form.email} onChange={set("email")} /></div>
              <div><label className={lbl}>Téléphone</label><input className={inputCls} value={form.phone} onChange={set("phone")} /></div>
              <div><label className={lbl}>Ville</label><input className={inputCls} value={form.ville} onChange={set("ville")} /></div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Statut</p>
            <select className={inputCls} value={form.statut} onChange={set("statut")}>
              <option value="actif">Actif</option>
              <option value="en_mission">En mission</option>
              <option value="inactif">Inactif</option>
              <option value="suspendu">Suspendu</option>
              <option value="en_conge">En congé</option>
            </select>
            {(form.statut === "inactif" || form.statut === "suspendu") && (
              <p className="text-xs text-amber-600 mt-1.5">⚠ Le compte mobile du chauffeur sera désactivé.</p>
            )}
            {form.statut === "actif" && chauffeur.statut !== "actif" && (
              <p className="text-xs text-green-600 mt-1.5">✓ Le compte mobile du chauffeur sera réactivé.</p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Documents VTC</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>N° Carte VTC</label><input className={inputCls} value={form.numero_carte_vtc} onChange={set("numero_carte_vtc")} /></div>
              <div><label className={lbl}>Expiration carte</label><input type="date" className={inputCls} value={form.date_expiry_carte_vtc} onChange={set("date_expiry_carte_vtc")} /></div>
              <div><label className={lbl}>N° Permis</label><input className={inputCls} value={form.numero_permis} onChange={set("numero_permis")} /></div>
              <div><label className={lbl}>Expiration permis</label><input type="date" className={inputCls} value={form.date_expiry_permis} onChange={set("date_expiry_permis")} /></div>
            </div>
          </div>

          <div>
            <label className={lbl}>Notes</label>
            <textarea className={inputCls} rows={3} value={form.notes} onChange={set("notes")} />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border gap-3">
            {confirmDel ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-600">Confirmer la suppression ?</span>
                <Button type="button" size="sm" variant="destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting ? <Loader2Icon className="w-4 h-4 animate-spin" /> : "Supprimer"}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setConfirmDel(false)}>Annuler</Button>
              </div>
            ) : (
              <Button type="button" size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" onClick={() => setConfirmDel(true)}>
                Supprimer le chauffeur
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>Annuler</Button>
              <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={saving}>
                {saving ? <Loader2Icon className="w-4 h-4 animate-spin" /> : "Enregistrer"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Chauffeur) => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [form, setForm]     = useState({
    first_name: "", last_name: "", email: "", phone: "",
    numero_carte_vtc: "", date_expiry_carte_vtc: "",
    numero_permis: "", date_expiry_permis: "",
    ville: "", notes: "",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError(null); setSaving(true);
    try {
      const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ""));
      // Fixer automatiquement le type_chauffeur à "interne" pour les chauffeurs ajoutés par le gestionnaire
      const chauffeurPayload = { ...payload, type_chauffeur: "interne" as const };
      onCreated(await chauffeurApi.create(chauffeurPayload));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de création");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-base">Nouveau chauffeur</h2>
          <button onClick={onClose}><XIcon className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Identité</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Prénom *</label><Input required value={form.first_name} onChange={set("first_name")} placeholder="Jean" /></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Nom *</label><Input required value={form.last_name} onChange={set("last_name")} placeholder="Dupont" /></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label><Input type="email" value={form.email} onChange={set("email")} placeholder="jean@vtc.fr" /></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Téléphone</label><Input value={form.phone} onChange={set("phone")} placeholder="+33 6 12 34 56 78" /></div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Documents VTC</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">N° Carte VTC</label><Input value={form.numero_carte_vtc} onChange={set("numero_carte_vtc")} placeholder="VTC-2024-XXXX" /></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Expiration carte</label><Input type="date" value={form.date_expiry_carte_vtc} onChange={set("date_expiry_carte_vtc")} /></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">N° Permis</label><Input value={form.numero_permis} onChange={set("numero_permis")} /></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Expiration permis</label><Input type="date" value={form.date_expiry_permis} onChange={set("date_expiry_permis")} /></div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Ville</label>
            <Input value={form.ville} onChange={set("ville")} placeholder="Paris" />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={set("notes")} rows={2} placeholder="Informations complémentaires..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Annuler</Button>
            <Button type="submit" size="sm" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
              {saving ? <><Loader2Icon className="w-4 h-4 animate-spin" /> Création…</> : <><CheckCircleIcon className="w-4 h-4" /> Créer</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Chauffeurs() {
  const router = useRouter();
  const [chauffeurs, setChauffeurs]     = useState<Chauffeur[]>([]);
  const [stats, setStats]               = useState<ChauffeurStats | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [search, setSearch]             = useState("");
  const [filterStatut, setFilterStatut] = useState("tous");
  const [showModal, setShowModal]       = useState(false);
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [editChauffeur, setEditChauffeur] = useState<Chauffeur | null>(null);
  const [copied, setCopied]             = useState(false);
  const [docsStatus, setDocsStatus]     = useState<Record<string, { complete: boolean; missing: number }>>({});
  const { result: mandatoryResult, loading: mandatoryLoading } = useMandatoryDocs();

  const load = async (statut: string) => {
    setLoading(true); setError(null);
    try {
      const [listRes, statsRes] = await Promise.all([
        chauffeurApi.list({ statut: statut === "tous" ? undefined : statut, limit: 100 }),
        chauffeurApi.stats(),
      ]);
      // Filtrer uniquement les chauffeurs internes (pas indépendants)
      const internesOnly = listRes.data.filter((c) => c.type_chauffeur !== 'independant');
      setChauffeurs(internesOnly);
      setStats(statsRes);
      
      // Charger le statut des documents obligatoires pour chaque chauffeur interne
      const docsStatusMap: Record<string, { complete: boolean; missing: number }> = {};
      await Promise.all(
        internesOnly.map(async (c) => {
          try {
            const check = await documentApi.mandatoryCheck("chauffeur", String(c.id));
            docsStatusMap[String(c.id)] = {
              complete: check.complete,
              missing: check.blocking?.length ?? 0,
            };
          } catch {
            docsStatusMap[String(c.id)] = { complete: true, missing: 0 };
          }
        })
      );
      setDocsStatus(docsStatusMap);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(filterStatut); }, [filterStatut]); // eslint-disable-line

  const filtered = chauffeurs.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q) ||
      (c.phone ?? "").toLowerCase().includes(q) ||
      (c.numero_carte_vtc ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <>
      {editChauffeur && (
        <EditModal
          chauffeur={editChauffeur}
          onClose={() => setEditChauffeur(null)}
          onSaved={(updated) => {
            setEditChauffeur(null);
            setChauffeurs((p) => p.map((c) => String(c.id) === String(updated.id) ? updated : c));
            load(filterStatut);
          }}
          onDeleted={(id) => {
            setEditChauffeur(null);
            setChauffeurs((p) => p.filter((c) => String(c.id) !== id));
            load(filterStatut);
          }}
        />
      )}

      {showModal && <AddModal onClose={() => setShowModal(false)} onCreated={(c) => {
        setShowModal(false);
        setChauffeurs((p) => [c, ...p]);
        load(filterStatut);
        if (c.invitation_token) setInvitationToken(c.invitation_token);
      }} />}

      {/* Modal token d'invitation */}
      {invitationToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <KeyRoundIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-base">Token d&apos;invitation</h2>
                <p className="text-xs text-muted-foreground">Valable 7 jours — à transmettre au chauffeur</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Le chauffeur devra saisir ce token sur l&apos;application mobile pour créer son compte.
            </p>
            <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-3 mb-4">
              <code className="flex-1 text-sm font-mono break-all text-neutral-800 dark:text-neutral-200">{invitationToken}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(invitationToken); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="flex-shrink-0 p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                {copied ? <CheckCircleIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4 text-muted-foreground" />}
              </button>
            </div>
            <Button className="w-full" onClick={() => setInvitationToken(null)}>Fermer</Button>
          </div>
        </div>
      )}

      <div className="w-full sticky top-0 z-40 bg-white dark:bg-neutral-950 flex-shrink-0 flex flex-row h-16 items-center px-6 border-b border-neutral-200 dark:border-neutral-800 justify-between">
        <div>
          <h1 className="text-lg font-bold">Chauffeurs</h1>
          <p className="text-xs text-muted-foreground">
            {loading ? "Chargement…" : `${stats?.total ?? 0} chauffeurs · ${stats?.disponibles ?? 0} disponibles`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => load(filterStatut)} disabled={loading}>
            <RefreshCwIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          {mandatoryResult && !mandatoryResult.complete ? (
            <div title="Complétez les documents obligatoires de l'agence avant d'ajouter un chauffeur">
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white gap-1 opacity-50 cursor-not-allowed"
                disabled
              >
                <PlusIcon className="w-4 h-4" /> Ajouter un chauffeur
              </Button>
            </div>
          ) : (
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1" onClick={() => setShowModal(true)}>
              <PlusIcon className="w-4 h-4" /> Ajouter un chauffeur
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-7xl w-full mx-auto p-6 space-y-4">

        {/* Documents obligatoires agence */}
        {!mandatoryLoading && mandatoryResult && !mandatoryResult.complete && (
          <MandatoryDocsBanner
            result={mandatoryResult}
            contextLabel="ajouter ou modifier des chauffeurs"
          />
        )}

        {/* Lien vers chauffeurs indépendants */}
        <div className="border border-blue-200 dark:border-blue-800 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Chauffeurs indépendants</h3>
                <p className="text-xs text-muted-foreground">Gérer et valider les chauffeurs indépendants</p>
              </div>
            </div>
            <button
              onClick={() => router.push("/chauffeurs-independants")}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              Accéder →
            </button>
          </div>
        </div>

        {/* Alerte documents manquants pour chauffeurs internes */}
        {!loading && Object.values(docsStatus).some((d) => !d.complete) && (
          <div className="border border-amber-200 dark:border-amber-800 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangleIcon className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-amber-800 dark:text-amber-200">Documents obligatoires manquants</h3>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  {Object.values(docsStatus).filter((d) => !d.complete).length} chauffeur(s) interne(s) n&apos;ont pas tous leurs documents obligatoires.
                  Vous devez uploader ces documents avant de pouvoir leur attribuer des missions.
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 italic">
                  Cliquez sur le bouton &quot;📄 Documents&quot; pour chaque chauffeur concerné pour gérer leurs documents.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* KPI Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
            {[
              { label: "Total",         value: stats.total,                 color: "text-foreground" },
              { label: "Actifs",        value: stats.actifs,                color: "text-green-600" },
              { label: "En mission",    value: stats.en_mission,            color: "text-blue-600" },
              { label: "Disponibles",   value: stats.disponibles,           color: "text-indigo-600" },
              { label: "⚠ Docs / 30j", value: stats.docs_expirant_bientot, color: "text-amber-600" },
            ].map((s) => (
              <Card key={s.label} className="border-none shadow-sm p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </Card>
            ))}
          </div>
        )}

        {/* Alerte globale */}
        {stats && (Number(stats.cartes_vtc_expirant_bientot) > 0 || Number(stats.permis_expirant_bientot) > 0) && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 text-sm">
            <AlertTriangleIcon className="w-4 h-4 flex-shrink-0" />
            <span>
              {Number(stats.cartes_vtc_expirant_bientot) > 0 && <><strong>{stats.cartes_vtc_expirant_bientot}</strong> carte(s) VTC expirent dans 30j. </>}
              {Number(stats.permis_expirant_bientot) > 0 && <><strong>{stats.permis_expirant_bientot}</strong> permis expire(nt) dans 30j.</>}
            </span>
          </div>
        )}

        {/* Filtre tabs */}
        <div className="flex gap-2 flex-wrap">
          {FILTER_TABS.map((key) => {
            const s = key === "tous" ? null : STATUT[key];
            const count = key === "tous" ? Number(stats?.total ?? 0) : chauffeurs.filter((c) => c.statut === key).length;
            return (
              <button key={key} onClick={() => setFilterStatut(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border flex items-center gap-1.5 ${filterStatut === key ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600" : "border-border text-muted-foreground hover:bg-neutral-50 dark:hover:bg-neutral-900"}`}>
                {s && <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: s.dot }} />}
                {key === "tous" ? "Tous" : (s?.label ?? key)}
                <span className="opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Recherche */}
        <div className="relative max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Nom, email, téléphone, carte VTC..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2Icon className="w-5 h-5 animate-spin" /> Chargement des chauffeurs…
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center py-16 gap-3">
            <p className="text-sm text-red-500">{error}</p>
            <Button size="sm" variant="outline" onClick={() => load(filterStatut)}>Réessayer</Button>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((c) => {
              const s = STATUT[c.statut] ?? { label: c.statut, color: "#888", bg: "#88888818", dot: "#888" };
              const initials = `${c.first_name[0] ?? ""}${c.last_name[0] ?? ""}`.toUpperCase();
              const docStatus = docsStatus[String(c.id)];
              return (
                <Card key={c.id} className="border-none shadow-sm p-5 space-y-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => setEditChauffeur(c)}>
                      {c.photo_url
                        ? <img src={c.photo_url} alt={initials} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                        : <div className="w-11 h-11 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">{initials || <UserIcon className="w-5 h-5" />}</div>
                      }
                      <div>
                        <p className="font-semibold">{c.first_name} {c.last_name}</p>
                        <p className="text-xs text-muted-foreground">{c.numero_carte_vtc ?? "Carte VTC non renseignée"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1" style={{ color: s.color, backgroundColor: s.bg }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />{s.label}
                      </span>
                      {docStatus && !docStatus.complete && (
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-800 flex items-center gap-1">
                          <AlertTriangleIcon className="w-3 h-3" />
                          {docStatus.missing} doc(s) manquant(s)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {c.phone && <span className="flex items-center gap-1"><PhoneIcon className="w-3 h-3" />{c.phone}</span>}
                    {c.email && <span className="flex items-center gap-1"><MailIcon className="w-3 h-3" />{c.email}</span>}
                    {c.ville && <span>{c.ville}</span>}
                  </div>

                  {c.role_association && (
                    <p className="text-xs text-muted-foreground">
                      Votre accès :{" "}
                      <span className={`font-medium ${c.role_association === "principal" ? "text-blue-600" : "text-neutral-500"}`}>
                        {c.role_association === "principal" ? "Responsable principal" : "Accès secondaire"}
                      </span>
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    <ExpiryBadge label="Carte VTC" dateStr={c.date_expiry_carte_vtc} />
                    <ExpiryBadge label="Permis"    dateStr={c.date_expiry_permis} />
                    <ExpiryBadge label="Pièce ID"  dateStr={c.date_expiry_piece_identite} />
                  </div>

                  {/* Bouton gérer documents */}
                  <div className="flex gap-2 pt-2 border-t border-border">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/documents?owner_id=${c.id}&owner_type=chauffeur`);
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                        docStatus && !docStatus.complete
                          ? "bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30"
                          : "bg-neutral-100 dark:bg-neutral-800 text-muted-foreground hover:bg-neutral-200 dark:hover:bg-neutral-700"
                      }`}
                    >
                      <FileTextIcon className="w-3.5 h-3.5" />
                      📄 Documents {docStatus && !docStatus.complete && `(${docStatus.missing} manquant${docStatus.missing > 1 ? 's' : ''})`}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditChauffeur(c);
                      }}
                      className="px-3 py-2 rounded-lg text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-muted-foreground hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                    >
                      Modifier
                    </button>
                  </div>

                  {(c.date_debut_contrat || c.notes) && (
                    <div className="text-xs text-muted-foreground border-t border-border pt-3">
                      {c.date_debut_contrat && <span>Contrat depuis le {new Date(c.date_debut_contrat).toLocaleDateString("fr-FR")}</span>}
                      {c.notes && <p className="mt-0.5 italic truncate">{c.notes}</p>}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            {search ? `Aucun résultat pour "${search}".` : "Aucun chauffeur dans cette catégorie."}
          </div>
        )}
      </div>
    </>
  );
}
