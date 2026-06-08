"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PlusIcon, SearchIcon, BuildingIcon, UserIcon, PhoneIcon,
  MailIcon, MapPinIcon, Loader2Icon, XIcon, RefreshCwIcon,
  CheckCircleIcon, AlertTriangleIcon, PencilIcon, TrashIcon,
} from "lucide-react";
import { clientApi, type Client, type ClientStats } from "@/lib/api";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import EntrepriseSearch, { type EntrepriseResult } from "@/components/EntrepriseSearch";

const STATUT: Record<string, { label: string; color: string; bg: string }> = {
  actif:   { label: "Actif",   color: "#22c55e", bg: "#22c55e18" },
  inactif: { label: "Inactif", color: "#94a3b8", bg: "#94a3b818" },
  bloque:  { label: "Bloqué",  color: "#ef4444", bg: "#ef444418" },
};

const MODE_PAIEMENT: Record<string, string> = {
  carte: "Carte", virement: "Virement", especes: "Espèces", compte: "Compte", autre: "Autre",
};

function StatutBadge({ statut }: { statut: string }) {
  const s = STATUT[statut] ?? { label: statut, color: "#94a3b8", bg: "#94a3b818" };
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ color: s.color, background: s.bg }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

function fmtEur(n: number | string | null) {
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

function displayName(c: Client) {
  if (c.type === "entreprise") return c.raison_sociale ?? "—";
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "—";
}

const EMPTY_FORM = {
  type: "particulier" as "particulier" | "entreprise",
  first_name: "", last_name: "",
  raison_sociale: "", siret: "", numero_tva: "", nom_contact: "",
  email: "", phone: "", phone_secondaire: "",
  adresse: "", complement: "", ville: "", code_postal: "", pays: "France",
  facturation_meme_adresse: true,
  facturation_nom: "", facturation_adresse: "", facturation_complement: "",
  facturation_ville: "", facturation_code_postal: "", facturation_pays: "France",
  statut: "actif" as "actif" | "inactif" | "bloque",
  mode_paiement: "carte" as string,
  delai_paiement: 0,
  tarif_special: "" as string | number,
  plafond_credit: "" as string | number,
  notes: "",
};
type FormState = typeof EMPTY_FORM;

function ClientModal({ mode, initial, onClose, onSaved }: {
  mode: "add" | "edit"; initial?: Client;
  onClose: () => void; onSaved: (c: Client) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [tab, setTab]       = useState<"info" | "adresse" | "prefs">("info");
  const [form, setForm]     = useState<FormState>(() => {
    if (!initial) return EMPTY_FORM;
    return { ...EMPTY_FORM, ...initial, tarif_special: initial.tarif_special ?? "", plafond_credit: initial.plafond_credit ?? "" } as FormState;
  });

  const set = (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));
  const setCheck = (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.checked }));

  // Auto-fill depuis l'API gouvernementale
  const handleEntrepriseSelect = (e: EntrepriseResult) => {
    setForm((p) => ({
      ...p,
      raison_sociale: e.raison_sociale,
      siret:          e.siret,
      numero_tva:     e.numero_tva ?? p.numero_tva,
      adresse:        e.adresse,
      code_postal:    e.code_postal,
      ville:          e.ville,
      pays:           "France",
    }));
    // Basculer sur l'onglet adresse pour montrer les champs remplis
    setTab("adresse");
    setTimeout(() => setTab("info"), 80); // flash pour signaler le remplissage
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError(null); setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      (Object.keys(form) as Array<keyof FormState>).forEach((k) => {
        const v = form[k];
        if (v === "" || v === null || v === undefined) return;
        if (k === "tarif_special" || k === "plafond_credit" || k === "delai_paiement") payload[k] = Number(v);
        else payload[k] = v;
      });
      payload.facturation_meme_adresse = form.facturation_meme_adresse;
      let saved: Client;
      if (mode === "add") { const res = await clientApi.create(payload); saved = (res as { data: Client }).data; }
      else { const res = await clientApi.update(initial!.id, payload); saved = (res as { data: Client }).data; }
      onSaved(saved);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally { setSaving(false); }
  };

  const inp = "w-full border border-border rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-800 outline-none focus:ring-2 focus:ring-blue-500";
  const lbl = "block text-xs font-medium text-muted-foreground mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold">{mode === "add" ? "Nouveau client" : "Modifier le client"}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {mode === "add" ? "Remplissez les informations" : `Modification de ${displayName(initial!)}`}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><XIcon className="w-4 h-4" /></button>
        </div>

        {mode === "add" && (
          <div className="px-6 pt-4 pb-2 flex gap-3">
            {(["particulier", "entreprise"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setForm((p) => ({ ...p, type: t }))}
                className={`flex-1 flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${form.type === t ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600" : "border-border text-muted-foreground hover:border-neutral-300"}`}>
                {t === "entreprise" ? <BuildingIcon className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                {t === "entreprise" ? "Entreprise" : "Particulier"}
              </button>
            ))}
          </div>
        )}

        <div className="px-6 flex gap-1 border-b border-border">
          {([["info", "Informations"], ["adresse", "Adresse & Facturation"], ["prefs", "Préférences"]] as const).map(([k, l]) => (
            <button key={k} type="button" onClick={() => setTab(k as "info" | "adresse" | "prefs")}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all ${tab === k ? "border-blue-500 text-blue-600" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {l}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {tab === "info" && (
              <>
                {form.type === "particulier" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={lbl}>Prénom *</label><input className={inp} value={form.first_name} onChange={set("first_name")} placeholder="Jean" required={mode === "add"} /></div>
                    <div><label className={lbl}>Nom *</label><input className={inp} value={form.last_name} onChange={set("last_name")} placeholder="Dupont" required={mode === "add"} /></div>
                  </div>
                ) : (
                  <>
                    {/* Recherche automatique entreprise */}
                    <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800 p-3 space-y-2">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                        <BuildingIcon className="w-3.5 h-3.5" /> Recherche automatique
                      </p>
                      <EntrepriseSearch
                        onSelect={handleEntrepriseSelect}
                        defaultValue={form.raison_sociale}
                        className="w-full h-9 rounded-lg border border-input bg-white dark:bg-neutral-800 pl-9 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-[11px] text-muted-foreground">Remplissage automatique SIRET, TVA, adresse — modifiable ensuite</p>
                    </div>
                    <div><label className={lbl}>Raison sociale *</label><input className={inp} value={form.raison_sociale} onChange={set("raison_sociale")} placeholder="ACME SAS" required={mode === "add"} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className={lbl}>SIRET</label><input className={inp} value={form.siret} onChange={set("siret")} placeholder="12345678901234" /></div>
                      <div><label className={lbl}>N° TVA</label><input className={inp} value={form.numero_tva} onChange={set("numero_tva")} placeholder="FR12345678901" /></div>
                    </div>
                    <div><label className={lbl}>Nom du contact</label><input className={inp} value={form.nom_contact} onChange={set("nom_contact")} placeholder="Marie Martin" /></div>
                  </>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lbl}>Email</label><input type="email" className={inp} value={form.email} onChange={set("email")} placeholder="contact@example.com" /></div>
                  <div><label className={lbl}>Téléphone</label><input className={inp} value={form.phone} onChange={set("phone")} placeholder="+33 6 12 34 56 78" /></div>
                </div>
                <div><label className={lbl}>Téléphone secondaire</label><input className={inp} value={form.phone_secondaire} onChange={set("phone_secondaire")} /></div>
                <div><label className={lbl}>Statut</label>
                  <select className={inp} value={form.statut} onChange={set("statut")}>
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                    <option value="bloque">Bloqué</option>
                  </select>
                </div>
                <div><label className={lbl}>Notes</label><textarea className={`${inp} resize-none`} rows={3} value={form.notes} onChange={set("notes")} placeholder="Remarques..." /></div>
              </>
            )}
            {tab === "adresse" && (
              <>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Adresse principale</p>
                <AddressAutocomplete
                  label="Adresse"
                  value={form.adresse}
                  onChange={(v) => setForm((p) => ({ ...p, adresse: v }))}
                  placeholder="12 rue de la Paix, Paris"
                  className="w-full h-9 rounded-lg border border-input bg-white dark:bg-neutral-800 pl-9 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div><label className={lbl}>Complément</label><input className={inp} value={form.complement} onChange={set("complement")} placeholder="Bât A, Apt 42" /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className={lbl}>Code postal</label><input className={inp} value={form.code_postal} onChange={set("code_postal")} placeholder="75001" /></div>
                  <div className="col-span-2"><label className={lbl}>Ville</label><input className={inp} value={form.ville} onChange={set("ville")} placeholder="Paris" /></div>
                </div>
                <div><label className={lbl}>Pays</label><input className={inp} value={form.pays} onChange={set("pays")} /></div>
                <label className="flex items-center gap-2 text-sm cursor-pointer pt-1">
                  <input type="checkbox" checked={form.facturation_meme_adresse} onChange={setCheck("facturation_meme_adresse")} className="rounded" />
                  Adresse de facturation identique
                </label>
                {!form.facturation_meme_adresse && (
                  <>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">Adresse de facturation</p>
                    <div><label className={lbl}>Nom / Raison sociale</label><input className={inp} value={form.facturation_nom} onChange={set("facturation_nom")} /></div>
                    <AddressAutocomplete
                      label="Adresse de facturation"
                      value={form.facturation_adresse}
                      onChange={(v) => setForm((p) => ({ ...p, facturation_adresse: v }))}
                      placeholder="Adresse de facturation"
                      className="w-full h-9 rounded-lg border border-input bg-white dark:bg-neutral-800 pl-9 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <div><label className={lbl}>Code postal</label><input className={inp} value={form.facturation_code_postal} onChange={set("facturation_code_postal")} /></div>
                      <div className="col-span-2"><label className={lbl}>Ville</label><input className={inp} value={form.facturation_ville} onChange={set("facturation_ville")} /></div>
                    </div>
                    <div><label className={lbl}>Pays</label><input className={inp} value={form.facturation_pays} onChange={set("facturation_pays")} /></div>
                  </>
                )}
              </>
            )}
            {tab === "prefs" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lbl}>Mode de paiement</label>
                    <select className={inp} value={form.mode_paiement} onChange={set("mode_paiement")}>
                      <option value="carte">Carte</option>
                      <option value="virement">Virement bancaire</option>
                      <option value="especes">Espèces</option>
                      <option value="compte">Compte client</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  <div><label className={lbl}>Délai de paiement (jours)</label><input type="number" min={0} className={inp} value={form.delai_paiement} onChange={set("delai_paiement")} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lbl}>Tarif spécial (€/km)</label><input type="number" min={0} step="0.01" className={inp} value={form.tarif_special} onChange={set("tarif_special")} placeholder="—" /></div>
                  <div><label className={lbl}>Plafond crédit (€)</label><input type="number" min={0} className={inp} value={form.plafond_credit} onChange={set("plafond_credit")} placeholder="—" /></div>
                </div>
              </>
            )}
          </div>
          <div className="px-6 py-4 border-t border-border flex items-center gap-3 flex-shrink-0">
            {error && <p className="text-xs text-red-500 flex-1">{error}</p>}
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>Annuler</Button>
              <Button type="submit" size="sm" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                {saving ? <Loader2Icon className="w-4 h-4 animate-spin" /> : mode === "add" ? "Créer le client" : "Enregistrer"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmDelete({ client, onClose, onDeleted }: {
  client: Client; onClose: () => void; onDeleted: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const go = async () => {
    setLoading(true);
    try { await clientApi.remove(client.id); onDeleted(client.id); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Erreur"); setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <TrashIcon className="w-5 h-5 text-red-500" />
          </div>
          <div><h3 className="font-semibold text-sm">Supprimer le client</h3><p className="text-xs text-muted-foreground">Cette action est irréversible.</p></div>
        </div>
        <p className="text-sm">Voulez-vous vraiment supprimer <strong>{displayName(client)}</strong>&nbsp;?</p>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>Annuler</Button>
          <Button size="sm" onClick={go} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
            {loading ? <Loader2Icon className="w-4 h-4 animate-spin" /> : "Supprimer"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Clients() {
  const [clients, setClients]           = useState<Client[]>([]);
  const [stats, setStats]               = useState<ClientStats | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [search, setSearch]             = useState("");
  const [filterType, setFilterType]     = useState("tous");
  const [filterStatut, setFilterStatut] = useState("tous");
  const [page, setPage]                 = useState(1);
  const [total, setTotal]               = useState(0);
  const LIMIT = 50;

  const [modal, setModal]       = useState<null | "add" | "edit">(null);
  const [editing, setEditing]   = useState<Client | null>(null);
  const [deleting, setDeleting] = useState<Client | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params: Record<string, unknown> = { page, limit: LIMIT };
      if (filterType !== "tous")   params.type   = filterType;
      if (filterStatut !== "tous") params.statut = filterStatut;
      if (search.trim())           params.search = search.trim();
      const [res, sRes] = await Promise.all([clientApi.list(params), clientApi.stats()]);
      setClients((res as { data: Client[]; pagination: { total: number } }).data);
      setTotal((res  as { data: Client[]; pagination: { total: number } }).pagination.total);
      setStats((sRes as { data: ClientStats }).data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally { setLoading(false); }
  }, [page, filterType, filterStatut, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, filterType, filterStatut]);

  const refreshStats = () =>
    clientApi.stats().then((r) => setStats((r as { data: ClientStats }).data)).catch(() => null);

  const handleSaved = (c: Client) => {
    setModal(null); setEditing(null);
    if (modal === "add") { setClients((p) => [c, ...p]); setTotal((p) => p + 1); }
    else { setClients((p) => p.map((x) => x.id === c.id ? c : x)); }
    refreshStats();
  };

  const handleDeleted = (id: string) => {
    setDeleting(null);
    setClients((p) => p.filter((x) => x.id !== id));
    setTotal((p) => p - 1);
    refreshStats();
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <>
      <div className="w-full sticky top-0 z-40 bg-white dark:bg-neutral-950 flex-shrink-0 flex flex-row h-16 items-center px-6 border-b border-neutral-200 dark:border-neutral-800 justify-between">
        <div>
          <h1 className="text-lg font-bold">Clients</h1>
          <p className="text-xs text-muted-foreground">
            {stats ? `${stats.total} clients · CA total ${fmtEur(stats.ca_total)}` : "Chargement..."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} title="Rafraîchir" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <RefreshCwIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1" onClick={() => setModal("add")}>
            <PlusIcon className="w-4 h-4" /> Ajouter un client
          </Button>
        </div>
      </div>

      <div className="max-w-7xl w-full mx-auto p-6 space-y-5">
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total",        value: stats.total,        icon: <UserIcon className="w-4 h-4" />,             color: "text-blue-500",   bg: "bg-blue-50 dark:bg-blue-900/20" },
              { label: "Particuliers", value: stats.particuliers, icon: <UserIcon className="w-4 h-4" />,             color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-900/20" },
              { label: "Entreprises",  value: stats.entreprises,  icon: <BuildingIcon className="w-4 h-4" />,         color: "text-amber-500",  bg: "bg-amber-50 dark:bg-amber-900/20" },
              { label: "CA total",     value: fmtEur(stats.ca_total), icon: <CheckCircleIcon className="w-4 h-4" />, color: "text-green-500",  bg: "bg-green-50 dark:bg-green-900/20" },
            ].map((s) => (
              <Card key={s.label} className="border-none shadow-sm p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg} ${s.color}`}>{s.icon}</div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold leading-none mt-0.5">{s.value}</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-1">
            {[["tous","Tous"],["particulier","Particuliers"],["entreprise","Entreprises"]].map(([k,l]) => (
              <button key={k} onClick={() => setFilterType(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${filterType === k ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600" : "border-border text-muted-foreground hover:bg-neutral-50 dark:hover:bg-neutral-900"}`}>
                {l}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-border mx-1" />
          <div className="flex gap-1">
            {[["tous","Tous statuts"],["actif","Actifs"],["inactif","Inactifs"],["bloque","Bloqués"]].map(([k,l]) => (
              <button key={k} onClick={() => setFilterStatut(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${filterStatut === k ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600" : "border-border text-muted-foreground hover:bg-neutral-50 dark:hover:bg-neutral-900"}`}>
                {l}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <div className="relative w-64">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Rechercher..." className="pl-9 h-8 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/10 rounded-xl text-sm text-red-600 border border-red-200 dark:border-red-800">
            <AlertTriangleIcon className="w-4 h-4" /> {error}
            <button onClick={load} className="ml-auto underline text-xs">Réessayer</button>
          </div>
        )}

        <Card className="border-none shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-neutral-50 dark:bg-neutral-900">
                  {["Client","Type","Contact","Ville","Statut","Trajets","CA TTC","Paiement",""].map((h, i) => (
                    <th key={i} className={`px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide ${i >= 5 ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="py-16 text-center"><Loader2Icon className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></td></tr>
                ) : clients.length === 0 ? (
                  <tr><td colSpan={9} className="py-16 text-center text-muted-foreground text-sm">
                    {search || filterType !== "tous" || filterStatut !== "tous" ? "Aucun client ne correspond aux filtres." : "Aucun client. Commencez par en ajouter un."}
                  </td></tr>
                ) : clients.map((c) => {
                  const name = displayName(c);
                  const isEntreprise = c.type === "entreprise";
                  return (
                    <tr key={c.id} className="border-b border-border hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${isEntreprise ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600" : "bg-blue-100 dark:bg-blue-900/30 text-blue-600"}`}>
                            {name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm leading-tight">{name}</p>
                            {isEntreprise && c.nom_contact && <p className="text-xs text-muted-foreground">{c.nom_contact}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${isEntreprise ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600" : "bg-blue-50 dark:bg-blue-900/20 text-blue-600"}`}>
                          {isEntreprise ? <BuildingIcon className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                          {isEntreprise ? "Entreprise" : "Particulier"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="space-y-0.5">
                          {c.email && <div className="flex items-center gap-1 text-xs text-muted-foreground"><MailIcon className="w-3 h-3" />{c.email}</div>}
                          {c.phone && <div className="flex items-center gap-1 text-xs text-muted-foreground"><PhoneIcon className="w-3 h-3" />{c.phone}</div>}
                          {!c.email && !c.phone && <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {c.ville
                          ? <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPinIcon className="w-3 h-3" />{c.ville}</span>
                          : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="px-5 py-3"><StatutBadge statut={c.statut} /></td>
                      <td className="px-5 py-3 text-right font-medium">{c.nombre_trajets}</td>
                      <td className="px-5 py-3 text-right font-medium">{fmtEur(c.ca_total)}</td>
                      <td className="px-5 py-3 text-right text-xs text-muted-foreground">
                        {MODE_PAIEMENT[c.mode_paiement] ?? c.mode_paiement}
                        {c.delai_paiement > 0 && <span className="ml-1 text-amber-500">{c.delai_paiement}j</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => { setEditing(c); setModal("edit"); }}
                            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-muted-foreground hover:text-foreground transition-colors" title="Modifier">
                            <PencilIcon className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleting(c)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500 transition-colors" title="Supprimer">
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border text-xs text-muted-foreground">
              <span>{total} clients au total</span>
              <div className="flex items-center gap-1">
                <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-2 py-1 rounded border border-border hover:bg-neutral-50 disabled:opacity-40">←</button>
                <span className="px-3">Page {page} / {pages}</span>
                <button disabled={page === pages} onClick={() => setPage((p) => p + 1)} className="px-2 py-1 rounded border border-border hover:bg-neutral-50 disabled:opacity-40">→</button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {modal === "add" && <ClientModal mode="add" onClose={() => setModal(null)} onSaved={handleSaved} />}
      {modal === "edit" && editing && <ClientModal mode="edit" initial={editing} onClose={() => { setModal(null); setEditing(null); }} onSaved={handleSaved} />}
      {deleting && <ConfirmDelete client={deleting} onClose={() => setDeleting(null)} onDeleted={handleDeleted} />}
    </>
  );
}
