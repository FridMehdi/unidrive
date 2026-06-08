"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PlusIcon, SearchIcon, AlertTriangleIcon, CarIcon, GaugeIcon, PencilIcon, TrashIcon, RefreshCwIcon, FileTextIcon, UploadCloudIcon, DownloadIcon, Loader2Icon, XIcon, EyeIcon, CheckCircleIcon, ShieldAlertIcon } from "lucide-react";
import { vehicleApi, chauffeurApi, documentApi, type Vehicle, type Chauffeur, type VehicleStats, type VtcDocument, type MandatoryCheckResult } from "@/lib/api";
import { checkVehicleDocs } from "@/hooks/useMandatoryVehicleDocs";

const statutConfig: Record<string, { label: string; color: string; bg: string }> = {
  en_service:   { label: "En service",   color: "#22c55e", bg: "#22c55e18" },
  disponible:   { label: "Disponible",   color: "#3b82f6", bg: "#3b82f618" },
  en_revision:  { label: "En révision",  color: "#f59e0b", bg: "#f59e0b18" },
  hors_service: { label: "Hors service", color: "#ef4444", bg: "#ef444418" },
};

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Math.round((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return dateStr.split("T")[0];
}

const emptyForm: Partial<Vehicle> = {
  immat: "", marque: "", modele: "", annee: new Date().getFullYear(),
  couleur: "", statut: "disponible", kilometrage: 0,
  chauffeur_id: null, date_ct: null, date_assurance: null, notes: "",
};

const DOC_TYPES = [
  { value: "carte_grise",       label: "Carte grise" },
  { value: "assurance",         label: "Assurance" },
  { value: "controle_technique",label: "Contrôle technique" },
  { value: "vignette",          label: "Vignette" },
  { value: "autre",             label: "Autre" },
];

const VEHICLE_DOC_LABELS: Record<string, string> = {
  carte_grise:       "Carte grise",
  assurance:         "Assurance",
  controle_technique:"Contrôle technique",
  vignette:          "Vignette",
  autre:             "Autre",
};

function VehicleValidatedDocs({ vehicleId, onOpenModal }: { vehicleId: string; onOpenModal: () => void }) {
  const [docs, setDocs] = useState<VtcDocument[]>([]);

  useEffect(() => {
    documentApi.list({ owner_type: "vehicle", owner_id: vehicleId })
      .then((res) => setDocs((res.data ?? []).filter((d) => d.statut === "valide")))
      .catch(() => {});
  }, [vehicleId]); // eslint-disable-line

  const handleView = async (id: string) => {
    try {
      const { url } = await documentApi.getDownloadUrl(id);
      window.open(url, "_blank");
    } catch { alert("Erreur d'aperçu"); }
  };

  if (docs.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
        <CheckCircleIcon className="w-3 h-3 text-green-500" /> Documents validés
      </p>
      {docs.map((d) => (
        <div key={d.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/15 border border-green-100 dark:border-green-800/30">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-green-800 dark:text-green-300 truncate">{d.nom}</p>
            <p className="text-xs text-green-600 dark:text-green-500">
              {DOC_TYPES.find((t) => t.value === d.type_doc)?.label ?? d.type_doc}
              {d.date_expiration ? ` · Exp: ${d.date_expiration.slice(0, 10)}` : ""}
            </p>
          </div>
          <button
            onClick={() => handleView(d.id)}
            className="ml-2 flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400 hover:text-green-900 dark:hover:text-green-200 px-2 py-1 rounded-lg hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors flex-shrink-0"
          >
            <EyeIcon className="w-3.5 h-3.5" /> Voir
          </button>
        </div>
      ))}
    </div>
  );
}

function VehicleDocsModal({ vehicle, onClose }: { vehicle: Vehicle; onClose: () => void }) {
  const [docs, setDocs]           = useState<VtcDocument[]>([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [nom, setNom]             = useState("");
  const [typeDoc, setTypeDoc]     = useState("carte_grise");
  const [dateExp, setDateExp]     = useState("");
  const [file, setFile]           = useState<File | null>(null);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const res = await documentApi.list({ owner_type: "vehicle", owner_id: vehicle.id });
      setDocs(res.data ?? []);
    } catch { setDocs([]); } finally { setLoading(false); }
  };

  useEffect(() => { loadDocs(); }, []); // eslint-disable-line

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !nom) { setError("Fichier et nom requis"); return; }
    setUploading(true); setError(null);
    try {
      // Supprimer l'ancien doc du même type s'il existe
      const existing = docs.filter(d => d.type_doc === typeDoc);
      for (const old of existing) {
        await documentApi.remove(old.id).catch(() => {});
      }
      const fd = new FormData();
      fd.append("file",       file);
      fd.append("owner_type", "vehicle");
      fd.append("owner_id",   vehicle.id);
      fd.append("type_doc",   typeDoc);
      fd.append("nom",        nom);
      if (dateExp) fd.append("date_expiration", dateExp);
      await documentApi.upload(fd);
      setFile(null); setNom(""); setDateExp(""); setTypeDoc("carte_grise");
      await loadDocs();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur upload");
    } finally { setUploading(false); }
  };

  const handleDownload = async (id: string) => {
    try {
      const { url } = await documentApi.getDownloadUrl(id);
      window.open(url, "_blank");
    } catch { alert("Erreur de téléchargement"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce document ?")) return;
    await documentApi.remove(id).catch(() => {});
    await loadDocs();
  };

  const inputCls = "w-full px-3 py-2 rounded-xl border border-border bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const lbl = "text-xs font-medium text-muted-foreground mb-1 block";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-semibold text-base">{vehicle.marque} {vehicle.modele} — Documents</h2>
            <p className="text-xs text-muted-foreground">{vehicle.immat}</p>
          </div>
          <button onClick={onClose}><XIcon className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Liste des documents */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Documents enregistrés</p>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2Icon className="w-4 h-4 animate-spin" /> Chargement…
              </div>
            ) : docs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Aucun document enregistré.</p>
            ) : (
              <div className="space-y-2">
                {docs.map((d) => (
                  <div key={d.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-neutral-50 dark:bg-neutral-800 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileTextIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{d.nom}</p>
                        <p className="text-xs text-muted-foreground">
                          {DOC_TYPES.find((t) => t.value === d.type_doc)?.label ?? d.type_doc}
                          {d.date_expiration ? ` · Exp: ${d.date_expiration.slice(0,10)}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        d.statut === "valide"     ? "bg-green-50 text-green-700" :
                        d.statut === "refuse"     ? "bg-red-50 text-red-700" :
                        d.statut === "expire"     ? "bg-red-50 text-red-600" :
                        "bg-amber-50 text-amber-700"
                      }`}>
                        {{ valide: "Validé", refuse: "Refusé", expire: "Expiré", en_attente: "En attente" }[d.statut] ?? d.statut}
                      </span>
                      <button
                        onClick={() => handleDownload(d.id)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                          d.statut === "valide"
                            ? "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-800/30"
                            : "hover:bg-neutral-200 dark:hover:bg-neutral-700 text-muted-foreground"
                        }`}
                      >
                        {d.statut === "valide" ? <EyeIcon className="w-3.5 h-3.5" /> : <DownloadIcon className="w-3.5 h-3.5" />}
                        {d.statut === "valide" ? "Voir" : ""}
                      </button>
                      <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <TrashIcon className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload */}
          <form onSubmit={handleUpload} className="space-y-4 border-t border-border pt-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ajouter un document</p>
            {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={lbl}>Nom du document *</label>
                <input className={inputCls} value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex: Assurance 2026" />
              </div>
              <div>
                <label className={lbl}>Type</label>
                <select className={inputCls} value={typeDoc} onChange={(e) => setTypeDoc(e.target.value)}>
                  {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Date d&apos;expiration</label>
                <input type="date" className={inputCls} value={dateExp} onChange={(e) => setDateExp(e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Fichier (PDF, image) *</label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>Fermer</Button>
              <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1" disabled={uploading}>
                {uploading ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <UploadCloudIcon className="w-4 h-4" />}
                {uploading ? "Envoi…" : "Ajouter"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Voitures() {
  const [vehicles, setVehicles]     = useState<Vehicle[]>([]);
  const [stats, setStats]           = useState<VehicleStats | null>(null);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState("");
  const [filterStatut, setFilterStatut] = useState("tous");

  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState<Vehicle | null>(null);
  const [form, setForm]             = useState<Partial<Vehicle>>(emptyForm);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget]     = useState<Vehicle | null>(null);
  const [deleting, setDeleting]             = useState(false);
  const [vehicleDocsTarget, setVehicleDocsTarget] = useState<Vehicle | null>(null);
  const [vehicleDocsStatus, setVehicleDocsStatus] = useState<Map<string, MandatoryCheckResult>>(new Map());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [vRes, sRes, cRes] = await Promise.all([
        vehicleApi.list({ limit: 500 }),
        vehicleApi.stats(),
        chauffeurApi.list({ limit: 200 }),
      ]);
      setVehicles(vRes.data);
      setStats(sRes);
      setChauffeurs(cRes.data);
      
      // Vérifier les documents obligatoires pour chaque véhicule
      const docsMap = new Map<string, MandatoryCheckResult>();
      await Promise.all(
        vRes.data.map(async (v) => {
          const result = await checkVehicleDocs(v.id);
          docsMap.set(v.id, result);
        })
      );
      setVehicleDocsStatus(docsMap);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filtrer uniquement les véhicules de la flotte du gestionnaire (agency)
  // Exclure les véhicules des chauffeurs indépendants
  const agencyVehicles = vehicles.filter((v) => !v.owner_type || v.owner_type === "agency");

  const filtered = agencyVehicles.filter((v) => {
    const matchSearch =
      v.immat.toLowerCase().includes(search.toLowerCase()) ||
      v.marque.toLowerCase().includes(search.toLowerCase()) ||
      v.modele.toLowerCase().includes(search.toLowerCase());
    const matchStatut = filterStatut === "tous" || v.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const counts: Record<string, number> = {
    tous:         agencyVehicles.length,
    en_service:   agencyVehicles.filter((v) => v.statut === "en_service").length,
    disponible:   agencyVehicles.filter((v) => v.statut === "disponible").length,
    en_revision:  agencyVehicles.filter((v) => v.statut === "en_revision").length,
    hors_service: agencyVehicles.filter((v) => v.statut === "hors_service").length,
  };

  // Calculer les stats localement pour ne pas inclure les véhicules des chauffeurs indépendants
  const localStats = {
    total: agencyVehicles.length.toString(),
    en_service: agencyVehicles.filter((v) => v.statut === "en_service").length.toString(),
    disponible: agencyVehicles.filter((v) => v.statut === "disponible").length.toString(),
    en_revision: agencyVehicles.filter((v) => v.statut === "en_revision").length.toString(),
    hors_service: agencyVehicles.filter((v) => v.statut === "hors_service").length.toString(),
    ct_expirant: agencyVehicles.filter((v) => {
      const days = daysUntil(v.date_ct);
      return days !== null && days >= 0 && days <= 30;
    }).length.toString(),
    assurance_expirant: agencyVehicles.filter((v) => {
      const days = daysUntil(v.date_assurance);
      return days !== null && days >= 0 && days <= 30;
    }).length.toString(),
  };

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(v: Vehicle) {
    setEditing(v);
    setForm({
      immat: v.immat, marque: v.marque, modele: v.modele,
      annee: v.annee ?? undefined, couleur: v.couleur ?? "",
      statut: v.statut, kilometrage: v.kilometrage,
      chauffeur_id: v.chauffeur_id,
      date_ct: v.date_ct ? v.date_ct.split("T")[0] : null,
      date_assurance: v.date_assurance ? v.date_assurance.split("T")[0] : null,
      notes: v.notes ?? "",
    });
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.immat || !form.marque || !form.modele) {
      setFormError("Immatriculation, marque et modèle sont requis.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await vehicleApi.update(editing.id, form);
      } else {
        await vehicleApi.create(form);
      }
      setModalOpen(false);
      await load();
    } catch (e: unknown) {
      setFormError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await vehicleApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (e: unknown) {
      alert((e as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  function getChauffeurName(id: string | null): string {
    if (!id) return "—";
    const c = chauffeurs.find((c) => c.id === id);
    return c ? `${c.first_name} ${c.last_name}` : "—";
  }

  return (
    <>
      {/* Header */}
      <div className="w-full sticky top-0 z-50 bg-white dark:bg-neutral-950 flex-shrink-0 flex flex-row h-16 items-center px-6 border-b border-neutral-200 dark:border-neutral-800 justify-between">
        <div>
          <h1 className="text-lg font-bold">Voitures</h1>
          <p className="text-xs text-muted-foreground">
            {loading ? "Chargement…" : `${agencyVehicles.length} véhicule${agencyVehicles.length > 1 ? "s" : ""} enregistré${agencyVehicles.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCwIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1" onClick={openCreate}>
            <PlusIcon className="w-4 h-4" /> Ajouter un véhicule
          </Button>
        </div>
      </div>

      <div className="max-w-7xl w-full mx-auto p-6 space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
            <AlertTriangleIcon className="w-4 h-4 flex-shrink-0" /> {error}
            <button onClick={load} className="ml-auto underline">Réessayer</button>
          </div>
        )}

        {/* Stats KPIs */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total parc",    value: localStats.total,               color: "#6366f1" },
              { label: "En service",    value: localStats.en_service,          color: "#22c55e" },
              { label: "CT expirant",   value: localStats.ct_expirant,         color: "#f59e0b" },
              { label: "Assur. expir.", value: localStats.assurance_expirant,  color: "#f59e0b" },
            ].map((s) => (
              <Card key={s.label} className="border-none shadow-sm p-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
              </Card>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {(Object.entries(counts) as [string, number][]).map(([key, count]) => {
            const label = key === "tous" ? "Tous" : (statutConfig[key]?.label ?? key);
            return (
              <button
                key={key}
                onClick={() => setFilterStatut(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${filterStatut === key ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600" : "border-border text-muted-foreground hover:bg-neutral-50 dark:hover:bg-neutral-900"}`}
              >
                {label} <span className="opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher par immat, marque, modèle…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {/* Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map((i) => (
              <Card key={i} className="border-none shadow-sm p-5 space-y-4 animate-pulse">
                <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
                <div className="h-3 bg-neutral-100 dark:bg-neutral-700 rounded w-1/2" />
                <div className="h-3 bg-neutral-100 dark:bg-neutral-700 rounded w-2/3" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((v) => {
              const s        = statutConfig[v.statut] ?? { label: v.statut, color: "#888", bg: "#88888818" };
              const ctDays   = daysUntil(v.date_ct);
              const assDays  = daysUntil(v.date_assurance);
              const ctWarn   = ctDays !== null && ctDays < 60;
              const assWarn  = assDays !== null && assDays < 60;

              return (
                <Card key={v.id} className="border-none shadow-sm p-5 space-y-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                        <CarIcon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold">{v.marque} {v.modele}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {v.immat}{v.couleur ? ` · ${v.couleur}` : ""}{v.annee ? ` · ${v.annee}` : ""}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap" style={{ color: s.color, backgroundColor: s.bg }}>
                      {s.label}
                    </span>
                  </div>

                  <div className="text-sm">
                    <p className="text-xs text-muted-foreground">Chauffeur assigné</p>
                    <p className="font-medium">{getChauffeurName(v.chauffeur_id)}</p>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <GaugeIcon className="w-4 h-4" />
                    <span>{v.kilometrage.toLocaleString("fr-FR")} km</span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className={`flex justify-between items-center px-3 py-2 rounded-lg ${ctWarn ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700" : "bg-neutral-50 dark:bg-neutral-900 text-muted-foreground"}`}>
                      <span className="flex items-center gap-1">
                        {ctWarn && <AlertTriangleIcon className="w-3 h-3" />} Contrôle technique
                      </span>
                      <span className="font-medium">
                        {formatDate(v.date_ct)}{ctWarn && ctDays !== null ? ` (${ctDays}j)` : ""}
                      </span>
                    </div>
                    <div className={`flex justify-between items-center px-3 py-2 rounded-lg ${assWarn ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700" : "bg-neutral-50 dark:bg-neutral-900 text-muted-foreground"}`}>
                      <span className="flex items-center gap-1">
                        {assWarn && <AlertTriangleIcon className="w-3 h-3" />} Assurance
                      </span>
                      <span className="font-medium">
                        {formatDate(v.date_assurance)}{assWarn && assDays !== null ? ` (${assDays}j)` : ""}
                      </span>
                    </div>
                  </div>

                  {/* Indicateur documents obligatoires manquants */}
                  {(() => {
                    const docsCheck = vehicleDocsStatus.get(v.id);
                    if (docsCheck && !docsCheck.complete) {
                      return (
                        <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                            <ShieldAlertIcon className="w-4 h-4 flex-shrink-0" />
                            <div className="flex-1 text-xs">
                              <p className="font-semibold">Documents obligatoires manquants</p>
                              <p className="text-xs opacity-90 mt-0.5">
                                Ce véhicule ne peut pas être utilisé en mission
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {docsCheck.blocking.map((doc) => (
                              <span
                                key={doc.type}
                                className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                              >
                                {VEHICLE_DOC_LABELS[doc.type] ?? doc.type}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <VehicleValidatedDocs vehicleId={v.id} onOpenModal={() => setVehicleDocsTarget(v)} />

                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => openEdit(v)}>
                      <PencilIcon className="w-3 h-3" /> Modifier
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => setVehicleDocsTarget(v)}>
                      <FileTextIcon className="w-3 h-3" /> Docs
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:border-red-300" onClick={() => setDeleteTarget(v)}>
                      <TrashIcon className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">Aucun véhicule trouvé.</div>
        )}
      </div>

      {vehicleDocsTarget && (
        <VehicleDocsModal vehicle={vehicleDocsTarget} onClose={() => setVehicleDocsTarget(null)} />
      )}

      {/* Modal Create / Edit */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le véhicule" : "Ajouter un véhicule"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Immatriculation *</label>
              <Input value={form.immat ?? ""} onChange={(e) => setForm((f) => ({ ...f, immat: e.target.value }))} placeholder="AB-123-CD" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Marque *</label>
              <Input value={form.marque ?? ""} onChange={(e) => setForm((f) => ({ ...f, marque: e.target.value }))} placeholder="Mercedes" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Modèle *</label>
              <Input value={form.modele ?? ""} onChange={(e) => setForm((f) => ({ ...f, modele: e.target.value }))} placeholder="Classe E 220d" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Année</label>
              <Input type="number" value={form.annee ?? ""} onChange={(e) => setForm((f) => ({ ...f, annee: parseInt(e.target.value) || undefined }))} placeholder="2023" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Couleur</label>
              <Input value={form.couleur ?? ""} onChange={(e) => setForm((f) => ({ ...f, couleur: e.target.value }))} placeholder="Noir" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Statut</label>
              <Select value={form.statut ?? "disponible"} onValueChange={(v) => setForm((f) => ({ ...f, statut: v as Vehicle["statut"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent position="popper" className="z-[200]">
                  <SelectItem value="en_service">En service</SelectItem>
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="en_revision">En révision</SelectItem>
                  <SelectItem value="hors_service">Hors service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Kilométrage</label>
              <Input type="number" value={form.kilometrage ?? 0} onChange={(e) => setForm((f) => ({ ...f, kilometrage: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="col-span-2 space-y-2 border rounded-xl p-4 bg-neutral-50 dark:bg-neutral-900">
              <label className="text-sm font-semibold">Chauffeur assigné</label>
              <p className="text-xs text-muted-foreground mb-2">Un véhicule peut être assigné à un chauffeur interne. Plusieurs véhicules peuvent partager le même chauffeur.</p>
              <Select value={form.chauffeur_id ?? "none"} onValueChange={(v) => setForm((f) => ({ ...f, chauffeur_id: v === "none" ? null : v }))}>
                <SelectTrigger className="bg-white dark:bg-neutral-800">
                  <SelectValue placeholder="— Aucun chauffeur —" />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[200]">
                  <SelectItem value="none">— Aucun chauffeur —</SelectItem>
                  {chauffeurs.filter(c => c.statut !== 'suspendu' && c.type_chauffeur === 'interne').map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        <span>{c.first_name} {c.last_name}</span>
                        <span className="text-xs text-muted-foreground">· {c.statut}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date contrôle technique</label>
              <Input type="date" value={form.date_ct ?? ""} onChange={(e) => setForm((f) => ({ ...f, date_ct: e.target.value || null }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date assurance</label>
              <Input type="date" value={form.date_assurance ?? ""} onChange={(e) => setForm((f) => ({ ...f, date_assurance: e.target.value || null }))} />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Input value={form.notes ?? ""} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Notes optionnelles…" />
            </div>
          </div>
          {formError && <p className="text-sm text-red-500 mt-1">{formError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? "Enregistrement…" : (editing ? "Mettre à jour" : "Créer")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Delete */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer le véhicule</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Confirmer la suppression de <strong>{deleteTarget?.marque} {deleteTarget?.modele}</strong> ({deleteTarget?.immat}) ?
            Cette action est irréversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Suppression…" : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
