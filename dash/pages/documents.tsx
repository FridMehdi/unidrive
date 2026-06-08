"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  PlusIcon, DownloadIcon, Trash2Icon, PencilIcon, RefreshCwIcon,
  FileTextIcon, SearchIcon, BuildingIcon, UserIcon, CheckCircleIcon,
  XCircleIcon, ClockIcon, ShieldIcon, ChevronDownIcon, ChevronRightIcon, EyeIcon,
} from "lucide-react";
import { documentApi, chauffeurApi, type VtcDocument, type Chauffeur, type MandatoryCheckResult } from "@/lib/api";

// ── Labels ────────────────────────────────────────────────────────────────────
const TYPE_LABEL: Record<string, string> = {
  permis_conduire:     "Permis de conduire",
  carte_vtc:           "Carte VTC",
  assurance:           "Assurance",
  visite_medicale:     "Visite médicale",
  kbis:                "Kbis",
  piece_identite:      "Pièce d'identité",
  assurance_rc_pro:    "Assurance RC Pro",
  kbis_agence:         "Kbis Agence",
  licence_transport:   "Licence transport",
  contrat_chauffeur:   "Contrat chauffeur",
  autre:               "Autre",
};

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  valide:     { label: "Valide",      color: "#22c55e", bg: "#22c55e18" },
  en_attente: { label: "En attente",  color: "#f59e0b", bg: "#f59e0b18" },
  expire:     { label: "Expiré",      color: "#ef4444", bg: "#ef444418" },
  refuse:     { label: "Refusé",      color: "#8b5cf6", bg: "#8b5cf618" },
};

// Types d'onglets
type TabId = "chauffeur" | "agency";

const TABS: { id: TabId; label: string; icon?: React.ReactNode }[] = [
  { id: "chauffeur", label: "Chauffeurs", icon: <UserIcon className="w-3.5 h-3.5" /> },
  { id: "agency",    label: "Agence",    icon: <BuildingIcon className="w-3.5 h-3.5" /> },
];

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR");
}

function daysUntil(d: string | null): number | null {
  if (!d) return null;
  return Math.round((new Date(d).getTime() - Date.now()) / 86_400_000);
}

function ExpirationCell({ date }: { date: string | null }) {
  const days = daysUntil(date);
  if (!date || days === null) return <span className="text-muted-foreground">—</span>;
  const txt = formatDate(date);
  if (days < 0)  return <span className="text-red-500 font-medium">{txt} (expiré)</span>;
  if (days < 30) return <span className="text-red-400 font-medium">{txt} ({days}j)</span>;
  if (days < 60) return <span className="text-yellow-500 font-medium">{txt} ({days}j)</span>;
  return <span className="text-green-600">{txt}</span>;
}

function StatutBadge({ statut }: { statut: string }) {
  const cfg = STATUT_CONFIG[statut] ?? { label: statut, color: "#94a3b8", bg: "#94a3b818" };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

function formatSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

// ── Bloc de validation par chauffeur (onglet "À valider") ────────────────────
// ── Mandatory status card for one chauffeur ──────────────────────────────────
function MandatoryStatusCard({ chauffeurId, chauffeurName, mandatoryResult }: {
  chauffeurId: string;
  chauffeurName: string;
  mandatoryResult: MandatoryCheckResult | null;
}) {
  if (!mandatoryResult) return null;
  const { complete, mandatory } = mandatoryResult;

  return (
    <div className={`rounded-xl border p-3 ${complete ? "border-green-200 bg-green-50 dark:bg-green-900/10" : "border-red-200 bg-red-50 dark:bg-red-900/10"}`}>
      <div className="flex items-center gap-2 mb-2">
        <ShieldIcon className={`w-4 h-4 ${complete ? "text-green-600" : "text-red-500"}`} />
        <span className="text-sm font-medium">{chauffeurName}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${complete ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100"}`}>
          {complete ? "Complet" : "Incomplet"}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 ml-6">
        {mandatory.map(item => (
          <span key={item.type} className="text-xs px-2 py-0.5 rounded"
            style={{
              color: item.status === "valide" ? "#16a34a" : (item.status === "en_attente" ? "#d97706" : "#dc2626"),
              backgroundColor: item.status === "valide" ? "#f0fdf4" : (item.status === "en_attente" ? "#fffbeb" : "#fef2f2"),
            }}>
            {item.status === "valide" ? "✓" : "✗"} {TYPE_LABEL[item.type] ?? item.type}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Grouped by chauffeur (collapsible) ──────────────────────────────────────
function ChauffeurGroupedDocs({
  docs, chauffeurMap, onDownload, onEdit, onDelete,
}: {
  docs: VtcDocument[];
  chauffeurMap: Record<string, Chauffeur>;
  onDownload: (id: string) => void;
  onEdit: (doc: VtcDocument) => void;
  onDelete: (id: string) => void;
}) {
  // Group by owner_id
  const grouped: Record<string, VtcDocument[]> = {};
  for (const d of docs) {
    const key = d.owner_id ?? "__unknown__";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(d);
  }
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setOpen(p => ({ ...p, [id]: !p[id] }));

  return (
    <div className="space-y-2">
      {Object.entries(grouped).map(([ownerId, cDocs]) => {
        const c = chauffeurMap[ownerId];
        const name = c ? `${c.first_name} ${c.last_name}` : "Chauffeur inconnu";
        const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
        const expanded = !!open[ownerId];
        const valideCount = cDocs.filter(d => d.statut === "valide").length;
        const waitCount   = cDocs.filter(d => d.statut === "en_attente").length;
        const expireCount = cDocs.filter(d => d.statut === "expire" || d.statut === "refuse").length;

        return (
          <div key={ownerId} className="rounded-xl border border-border overflow-hidden">
            {/* Header row */}
            <button
              onClick={() => toggle(ownerId)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-neutral-900 hover:bg-muted/30 transition-colors text-left"
            >
              {expanded
                ? <ChevronDownIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                : <ChevronRightIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                {initials}
              </div>
              <span className="font-medium text-sm flex-1">{name}</span>
              <div className="flex items-center gap-2 text-xs flex-shrink-0">
                {valideCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 font-medium">
                    {valideCount} validé{valideCount > 1 ? "s" : ""}
                  </span>
                )}
                {waitCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 font-medium">
                    {waitCount} en attente
                  </span>
                )}
                {expireCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 font-medium">
                    {expireCount} expiré{expireCount > 1 ? "s" : ""}/refusé{expireCount > 1 ? "s" : ""}
                  </span>
                )}
                <span className="text-muted-foreground">{cDocs.length} doc{cDocs.length > 1 ? "s" : ""}</span>
              </div>
            </button>

            {/* Expanded rows */}
            {expanded && (
              <div className="border-t border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/40 text-xs text-muted-foreground">
                      <th className="px-4 py-2 text-left">Nom</th>
                      <th className="px-4 py-2 text-left">Type</th>
                      <th className="px-4 py-2 text-left">Taille</th>
                      <th className="px-4 py-2 text-left">Expiration</th>
                      <th className="px-4 py-2 text-left">Statut</th>
                      <th className="px-4 py-2 text-left">Ajouté le</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cDocs.map((doc, i) => (
                      <tr key={doc.id} className={`${i < cDocs.length - 1 ? "border-b border-border" : ""} hover:bg-muted/20 transition-colors`}>
                        <td className="px-4 py-2.5 font-medium">{doc.nom}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{TYPE_LABEL[doc.type_doc] ?? doc.type_doc}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{formatSize(doc.taille_octets)}</td>
                        <td className="px-4 py-2.5"><ExpirationCell date={doc.date_expiration} /></td>
                        <td className="px-4 py-2.5"><StatutBadge statut={doc.statut} /></td>
                        <td className="px-4 py-2.5 text-muted-foreground">{formatDate(doc.created_at)}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Voir / Télécharger"
                              onClick={() => onDownload(doc.id)}>
                              <DownloadIcon className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Modifier"
                              onClick={() => onEdit(doc)}>
                              <PencilIcon className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" title="Supprimer"
                              onClick={() => onDelete(doc.id)}>
                              <Trash2Icon className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Documents() {
  const [tab, setTab]               = useState<TabId>("chauffeur");
  const [allDocs, setAllDocs]       = useState<VtcDocument[]>([]);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [docTypes, setDocTypes]     = useState<{ chauffeur: string[]; agency: string[] }>({ chauffeur: [], agency: [] });
  const [stats, setStats]           = useState<{ total: number; valide: number; en_attente: number; expire: number; refuse: number }>({ total: 0, valide: 0, en_attente: 0, expire: 0, refuse: 0 });
  // Mandatory check results per chauffeur (lazy, populated on "chauffeur" tab)
  const [mandatoryMap, setMandatoryMap] = useState<Record<string, MandatoryCheckResult>>({});
  const [loadingMandatory, setLoadingMandatory] = useState(false);

  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState("");
  const [filterStatut, setFilterStatut] = useState("tous");

  // Upload modal
  const [uploadOpen, setUploadOpen]     = useState(false);
  const [uploadOwnerType, setUploadOwnerType] = useState<"chauffeur" | "agency">("chauffeur");
  const [uploadForm, setUploadForm]     = useState({ type_doc: "", nom: "", date_expiration: "", notes: "", owner_id: "" });
  const [uploadFile, setUploadFile]     = useState<File | null>(null);
  const [uploading, setUploading]       = useState(false);
  const [uploadError, setUploadError]   = useState<string | null>(null);
  const fileRef                         = useRef<HTMLInputElement>(null);

  // Edit modal
  const [editDoc, setEditDoc]           = useState<VtcDocument | null>(null);
  const [editForm, setEditForm]         = useState({ statut: "", notes: "", date_expiration: "" });
  const [saving, setSaving]             = useState(false);
  const [editError, setEditError]       = useState<string | null>(null);

  // Delete
  const [delTarget, setDelTarget]       = useState<string | null>(null);
  const [deleting, setDeleting]         = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Charger tous les docs (sans filtre d'owner_type) + chauffeurs + types
      const [allRes, chauffRes, typesRes] = await Promise.all([
        documentApi.list({}),
        chauffeurApi.list({ limit: 500 }),
        documentApi.types(),
      ]);
      setAllDocs(allRes.data ?? []);
      // Filtrer uniquement les chauffeurs internes (pas indépendants)
      const chauffeursInternes = (chauffRes.data ?? []).filter(c => c.type_chauffeur !== 'independant');
      setChauffeurs(chauffeursInternes);
      setDocTypes(typesRes.data ?? { chauffeur: [], agency: [] });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Charger mandatory check pour tous les chauffeurs (lazy, au clic sur l'onglet)
  useEffect(() => {
    if (tab !== "chauffeur" || chauffeurs.length === 0) return;
    setLoadingMandatory(true);
    Promise.allSettled(
      chauffeurs.map(c =>
        documentApi.mandatoryCheck("chauffeur", c.id).then(r => ({ id: c.id, r }))
      )
    ).then(results => {
      const map: Record<string, MandatoryCheckResult> = {};
      for (const res of results) {
        if (res.status === "fulfilled") map[res.value.id] = res.value.r;
      }
      setMandatoryMap(map);
    }).finally(() => setLoadingMandatory(false));
  }, [tab, chauffeurs]);

  // ── Computed ────────────────────────────────────────────────────────────────
  const chauffeurMap = Object.fromEntries(chauffeurs.map(c => [c.id, c]));
  const chauffeurIds = new Set(chauffeurs.map(c => c.id));

  // Calculer les stats uniquement pour les chauffeurs internes et l'agence
  useEffect(() => {
    const internalIds = new Set(chauffeurs.map(c => c.id));
    const relevantDocs = allDocs.filter(d => {
      if (d.owner_type === "agency") return true;
      if (d.owner_type === "chauffeur") return !d.owner_id || internalIds.has(d.owner_id);
      return false;
    });
    
    const agg = { total: 0, valide: 0, en_attente: 0, expire: 0, refuse: 0 };
    for (const doc of relevantDocs) {
      agg.total += 1;
      if (doc.statut === "valide") agg.valide += 1;
      if (doc.statut === "en_attente") agg.en_attente += 1;
      if (doc.statut === "expire") agg.expire += 1;
      if (doc.statut === "refuse") agg.refuse += 1;
    }
    setStats(agg);
  }, [allDocs, chauffeurs]);

  const tabDocs = allDocs.filter(d => {
    if (tab === "chauffeur") {
      // Ne montrer que les documents des chauffeurs internes (pas indépendants)
      return d.owner_type === "chauffeur" && (!d.owner_id || chauffeurIds.has(d.owner_id));
    }
    return d.owner_type === "agency";
  });

  const filtered = tabDocs.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || d.nom.toLowerCase().includes(q)
      || (TYPE_LABEL[d.type_doc] ?? d.type_doc).toLowerCase().includes(q)
      || (d.owner_id && chauffeurMap[d.owner_id] && `${chauffeurMap[d.owner_id].first_name} ${chauffeurMap[d.owner_id].last_name}`.toLowerCase().includes(q));
    const matchStatut = filterStatut === "tous" || d.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  // ── Actions Valider / Refuser ────────────────────────────────────────────────
  async function handleValidate(id: string, decision: "valide" | "refuse", reason?: string) {
    await documentApi.validate(id, decision, reason);
    await load();
  }

  // ── Upload ───────────────────────────────────────────────────────────────────
  function openUpload() {
    setUploadOwnerType(tab === "agency" ? "agency" : "chauffeur");
    setUploadError(null);
    setUploadForm({ type_doc: "", nom: "", date_expiration: "", notes: "", owner_id: "" });
    setUploadFile(null);
    setUploadOpen(true);
  }

  async function handleUpload() {
    setUploadError(null);
    if (!uploadFile) return setUploadError("Sélectionnez un fichier");
    if (!uploadForm.type_doc) return setUploadError("Choisissez un type de document");
    if (!uploadForm.nom) return setUploadError("Entrez un nom pour le document");
    if (uploadOwnerType === "chauffeur" && !uploadForm.owner_id) return setUploadError("Sélectionnez un chauffeur");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", uploadFile);
      fd.append("owner_type", uploadOwnerType);
      fd.append("type_doc", uploadForm.type_doc);
      fd.append("nom", uploadForm.nom);
      if (uploadOwnerType === "chauffeur") fd.append("owner_id", uploadForm.owner_id);
      if (uploadForm.date_expiration) fd.append("date_expiration", uploadForm.date_expiration);
      if (uploadForm.notes) fd.append("notes", uploadForm.notes);
      await documentApi.upload(fd);
      setUploadOpen(false);
      await load();
    } catch (e) {
      setUploadError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  // ── Edit ─────────────────────────────────────────────────────────────────────
  async function handleSaveEdit() {
    if (!editDoc) return;
    setSaving(true); setEditError(null);
    try {
      await documentApi.update(editDoc.id, {
        statut:          editForm.statut as VtcDocument["statut"],
        notes:           editForm.notes || undefined,
        date_expiration: editForm.date_expiration || undefined,
      });
      setEditDoc(null);
      await load();
    } catch (e) {
      setEditError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // ── Download ─────────────────────────────────────────────────────────────────
  async function handleDownload(id: string) {
    try {
      const res = await documentApi.getDownloadUrl(id);
      window.open(res.url, "_blank", "noopener,noreferrer");
    } catch (e) { alert((e as Error).message); }
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!delTarget) return;
    setDeleting(true);
    try {
      await documentApi.remove(delTarget);
      setDelTarget(null);
      await load();
    } catch (e) { alert((e as Error).message); }
    finally { setDeleting(false); }
  }

  const currentTypes = uploadOwnerType === "chauffeur" ? docTypes.chauffeur : docTypes.agency;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Documents</h1>
          <p className="text-sm text-muted-foreground">Coffre-fort documentaire — gestion et suivi</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCwIcon className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Rafraîchir
          </Button>
          <Button size="sm" onClick={openUpload}>
            <PlusIcon className="w-4 h-4 mr-1" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total",    value: stats.total,  color: "#6366f1" },
          { label: "Valides",  value: stats.valide, color: "#22c55e" },
          { label: "Refusés",  value: stats.refuse, color: "#8b5cf6" },
          { label: "Expirés",  value: stats.expire, color: "#ef4444" },
        ].map(k => (
          <Card key={k.label} className="p-4 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{k.label}</span>
            <span className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</span>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="p-3 bg-red-50 text-red-600 rounded text-sm">{error}</div>}

      {/* ── TAB : CHAUFFEURS ou AGENCE ─────────────────────────────────────── */}
      <>
        {/* Statuts obligatoires par chauffeur (onglet chauffeur seulement) */}
          {tab === "chauffeur" && chauffeurs.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                Statut docs obligatoires
              </h2>
              {loadingMandatory ? (
                <p className="text-xs text-muted-foreground">Vérification…</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-6">
                  {chauffeurs.map(c => (
                    <MandatoryStatusCard
                      key={c.id}
                      chauffeurId={c.id}
                      chauffeurName={`${c.first_name} ${c.last_name}`}
                      mandatoryResult={mandatoryMap[c.id] ?? null}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterStatut} onValueChange={setFilterStatut}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les statuts</SelectItem>
                <SelectItem value="valide">Valide</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="expire">Expiré</SelectItem>
                <SelectItem value="refuse">Refusé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Documents */}
          {tab === "chauffeur" ? (
            loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Chargement…</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                <FileTextIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
                Aucun document
              </div>
            ) : (
              <ChauffeurGroupedDocs
                docs={filtered}
                chauffeurMap={chauffeurMap}
                onDownload={handleDownload}
                onEdit={(doc) => { setEditDoc(doc); setEditForm({ statut: doc.statut, notes: doc.notes ?? "", date_expiration: doc.date_expiration?.split("T")[0] ?? "" }); }}
                onDelete={(id) => setDelTarget(id)}
              />
            )
          ) : (
          <Card className="overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Chargement…</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                <FileTextIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
                Aucun document
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                      <th className="px-4 py-3 text-left">Nom</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">Taille</th>
                      <th className="px-4 py-3 text-left">Expiration</th>
                      <th className="px-4 py-3 text-left">Statut</th>
                      <th className="px-4 py-3 text-left">Ajouté le</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(doc => (
                      <tr key={doc.id} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium">{doc.nom}</td>
                        <td className="px-4 py-3 text-muted-foreground">{TYPE_LABEL[doc.type_doc] ?? doc.type_doc}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatSize(doc.taille_octets)}</td>
                        <td className="px-4 py-3"><ExpirationCell date={doc.date_expiration} /></td>
                        <td className="px-4 py-3"><StatutBadge statut={doc.statut} /></td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(doc.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Télécharger"
                              onClick={() => handleDownload(doc.id)}>
                              <DownloadIcon className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Modifier"
                              onClick={() => { setEditDoc(doc); setEditForm({ statut: doc.statut, notes: doc.notes ?? "", date_expiration: doc.date_expiration?.split("T")[0] ?? "" }); }}>
                              <PencilIcon className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" title="Supprimer"
                              onClick={() => setDelTarget(doc.id)}>
                              <Trash2Icon className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          )}
        </>

      {/* ── Upload Modal ─────────────────────────────────────────────────────── */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un document</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {uploadError && <div className="p-2 bg-red-50 text-red-600 rounded text-sm">{uploadError}</div>}

            <div>
              <label className="text-xs font-medium mb-1 block">Propriétaire *</label>
              <Select value={uploadOwnerType} onValueChange={v => setUploadOwnerType(v as "chauffeur" | "agency")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="chauffeur">Chauffeur</SelectItem>
                  <SelectItem value="agency">Agence</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {uploadOwnerType === "chauffeur" && (
              <div>
                <label className="text-xs font-medium mb-1 block">Chauffeur *</label>
                <Select value={uploadForm.owner_id} onValueChange={v => setUploadForm(f => ({ ...f, owner_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un chauffeur" /></SelectTrigger>
                  <SelectContent>
                    {chauffeurs.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-xs font-medium mb-1 block">Type de document *</label>
              <Select value={uploadForm.type_doc} onValueChange={v => setUploadForm(f => ({ ...f, type_doc: v }))}>
                <SelectTrigger><SelectValue placeholder="Type de document" /></SelectTrigger>
                <SelectContent>
                  {(currentTypes.length ? currentTypes : Object.keys(TYPE_LABEL)).map(t => (
                    <SelectItem key={t} value={t}>{TYPE_LABEL[t] ?? t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">Nom du document *</label>
              <Input value={uploadForm.nom} onChange={e => setUploadForm(f => ({ ...f, nom: e.target.value }))}
                placeholder="Ex: Permis Jean Dupont" />
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">Fichier *</label>
              <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf"
                className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-border file:text-sm file:font-medium file:cursor-pointer"
                onChange={e => setUploadFile(e.target.files?.[0] ?? null)} />
              {uploadFile && <p className="text-xs text-muted-foreground mt-1">{uploadFile.name} ({formatSize(uploadFile.size)})</p>}
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">Date d'expiration</label>
              <Input type="date" value={uploadForm.date_expiration}
                onChange={e => setUploadForm(f => ({ ...f, date_expiration: e.target.value }))} />
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">Notes</label>
              <Input value={uploadForm.notes} onChange={e => setUploadForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Remarques optionnelles…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Annuler</Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? "Envoi…" : "Uploader"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit / Refus Modal ───────────────────────────────────────────────── */}
      <Dialog open={!!editDoc} onOpenChange={open => { if (!open) setEditDoc(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le document</DialogTitle>
          </DialogHeader>
          {editDoc && (
            <div className="space-y-3 py-2">
              {editError && <div className="p-2 bg-red-50 text-red-600 rounded text-sm">{editError}</div>}
              <p className="text-sm font-medium">{editDoc.nom}</p>

              <div>
                <label className="text-xs font-medium mb-1 block">Statut manuel</label>
                <Select value={editForm.statut} onValueChange={v => setEditForm(f => ({ ...f, statut: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="valide">Valide</SelectItem>
                    <SelectItem value="en_attente">En attente</SelectItem>
                    <SelectItem value="expire">Expiré</SelectItem>
                    <SelectItem value="refuse">Refusé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Date d'expiration</label>
                <Input type="date" value={editForm.date_expiration}
                  onChange={e => setEditForm(f => ({ ...f, date_expiration: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Notes / Motif</label>
                <Input value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Motif de refus, remarques…" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDoc(null)}>Annuler</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ───────────────────────────────────────────────────── */}
      <Dialog open={!!delTarget} onOpenChange={open => { if (!open) setDelTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Supprimer le document ?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">Cette action est irréversible. Le fichier sera supprimé du stockage.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelTarget(null)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Suppression…" : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
