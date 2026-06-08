"use client";

import { useState, useEffect } from "react";
import {
  Loader2Icon, XIcon, CheckCircleIcon, AlertTriangleIcon,
} from "lucide-react";
import {
  missionApi, documentApi, tarificationApi,
  type Mission, type Chauffeur, type Client, type Vehicle, type Tarification,
} from "@/lib/api";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { checkVehicleDocs } from "@/hooks/useMandatoryVehicleDocs";

// ── MissionModal — Créer / Éditer une mission (partagé missions + dossiers) ──

export function MissionModal({
  mode,
  initial,
  chauffeurs,
  clients,
  vehicles,
  chauffeurDocsStatus,
  vehicleDocsStatus,
  defaultClientId,
  onClose,
  onSaved,
}: {
  mode: "add" | "edit";
  initial?: Mission;
  chauffeurs: Chauffeur[];
  clients: Client[];
  vehicles: Vehicle[];
  chauffeurDocsStatus: Record<string, boolean>;
  vehicleDocsStatus: Record<string, boolean>;
  defaultClientId?: string;
  onClose: () => void;
  onSaved: (m: Mission) => void;
}) {
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [autoCalc, setAutoCalc]   = useState(false);
  const [filterTypeChauffeur, setFilterTypeChauffeur] = useState<"tous" | "interne" | "independant">("tous");
  const [tarifs, setTarifs]       = useState<Tarification[]>([]);

  useEffect(() => {
    tarificationApi.list().then((res) => setTarifs(res.data.filter((t) => t.actif))).catch(() => {});
  }, []);

  const toLocal = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [form, setForm] = useState({
    adresse_depart:       initial?.adresse_depart      ?? "",
    adresse_arrivee:      initial?.adresse_arrivee     ?? "",
    date_depart:          toLocal(initial?.date_depart),
    date_arrivee_prevue:  toLocal(initial?.date_arrivee_prevue),
    client_id:            initial?.client_id ?? defaultClientId ?? "",
    nombre_passagers:     initial?.nombre_passagers != null ? String(initial.nombre_passagers) : "1",
    chauffeur_id:         initial?.chauffeur_id        ?? "",
    voiture_id:           initial?.voiture_id          ?? "",
    tarif_id:             initial?.tarif_id            ?? "",
    montant:              initial?.montant != null ? String(initial.montant) : "",
    prix_achat_chauffeur: initial?.prix_achat_chauffeur != null ? String(initial.prix_achat_chauffeur) : "",
    distance_km:          initial?.distance_km != null ? String(initial.distance_km) : "",
    duree_minutes:        initial?.duree_minutes != null ? String(initial.duree_minutes) : "",
    statut:               initial?.statut              ?? "planifiée",
    notes:                initial?.notes               ?? "",
  });

  // Auto-calculate distance + montant when addresses change
  useEffect(() => {
    if (!form.adresse_depart || !form.adresse_arrivee) return;
    const t = setTimeout(async () => {
      setCalcLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? "https://api.u-drive.ai"}/api/geo/distance?origin=${encodeURIComponent(form.adresse_depart)}&destination=${encodeURIComponent(form.adresse_arrivee)}`,
          {
            headers: {
              Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("vtc_token") : ""}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!res.ok) return;
        const data = await res.json();
        let montantCalc = "0.00";
        if (form.tarif_id) {
          try {
            const calcRes = await tarificationApi.calculate(form.tarif_id, data.distance_km, data.duree_minutes);
            montantCalc = String(calcRes.montant_total.toFixed(2));
          } catch {
            const selectedClient = clients.find((c) => String(c.id) === String(form.client_id));
            const tarifKm = selectedClient?.tarif_special && selectedClient.tarif_special > 0 ? selectedClient.tarif_special : 5;
            montantCalc = String((Math.round(data.distance_km * tarifKm * 100) / 100).toFixed(2));
          }
        } else {
          const selectedClient = clients.find((c) => String(c.id) === String(form.client_id));
          const tarifKm = selectedClient?.tarif_special && selectedClient.tarif_special > 0 ? selectedClient.tarif_special : 5;
          montantCalc = String((Math.round(data.distance_km * tarifKm * 100) / 100).toFixed(2));
        }
        setForm((p) => ({
          ...p,
          distance_km:   String(data.distance_km),
          duree_minutes: String(data.duree_minutes),
          montant:       montantCalc,
        }));
        setAutoCalc(true);
      } catch { /* ignore */ } finally { setCalcLoading(false); }
    }, 800);
    return () => clearTimeout(t);
  }, [form.adresse_depart, form.adresse_arrivee, form.tarif_id, form.client_id, clients]);

  // Reset vehicle when chauffeur changes
  useEffect(() => {
    setForm((p) => ({ ...p, voiture_id: "" }));
  }, [form.chauffeur_id]);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        adresse_depart:  form.adresse_depart,
        adresse_arrivee: form.adresse_arrivee,
        date_depart:     new Date(form.date_depart).toISOString(),
        statut:          form.statut,
      };
      if (form.client_id)           payload.client_id           = form.client_id;
      if (form.nombre_passagers)    payload.nombre_passagers    = parseInt(form.nombre_passagers);
      if (form.chauffeur_id)        payload.chauffeur_id        = form.chauffeur_id;
      if (form.voiture_id)          payload.voiture_id          = form.voiture_id;
      if (form.tarif_id)            payload.tarif_id            = form.tarif_id;
      if (form.date_arrivee_prevue) payload.date_arrivee_prevue = new Date(form.date_arrivee_prevue).toISOString();
      if (form.montant)             payload.montant             = parseFloat(form.montant);
      if (form.prix_achat_chauffeur) payload.prix_achat_chauffeur = parseFloat(form.prix_achat_chauffeur);
      if (form.distance_km)         payload.distance_km         = parseFloat(form.distance_km);
      if (form.duree_minutes)       payload.duree_minutes       = parseInt(form.duree_minutes);
      if (form.notes)               payload.notes               = form.notes;

      const saved = mode === "edit"
        ? await missionApi.update(initial!.id, payload)
        : await missionApi.create(payload);
      onSaved(saved);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally { setSaving(false); }
  };

  const inputCls = "w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-base">{mode === "add" ? "Nouvelle mission" : "Modifier la mission"}</h2>
          <button onClick={onClose}><XIcon className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
          )}

          {/* Adresses */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Trajet</p>
            <div className="space-y-3">
              <AddressAutocomplete
                label="Adresse de départ *"
                required
                value={form.adresse_depart}
                onChange={(v) => setForm((p) => ({ ...p, adresse_depart: v }))}
                placeholder="15 rue de Rivoli, Paris"
              />
              <AddressAutocomplete
                label="Adresse d'arrivée *"
                required
                value={form.adresse_arrivee}
                onChange={(v) => setForm((p) => ({ ...p, adresse_arrivee: v }))}
                placeholder="Aéroport CDG Terminal 2"
              />
            </div>
          </div>

          {/* Dates */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Dates</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Date / heure de départ *</label>
                <input required type="datetime-local" className={inputCls} value={form.date_depart} onChange={set("date_depart")} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Arrivée prévue</label>
                <input
                  type="datetime-local" className={inputCls} value={form.date_arrivee_prevue}
                  min={form.date_depart || undefined}
                  onChange={(e) => {
                    if (form.date_depart && e.target.value && e.target.value < form.date_depart) return;
                    setForm((p) => ({ ...p, date_arrivee_prevue: e.target.value }));
                  }}
                />
              </div>
            </div>
          </div>

          {/* Client + nb passagers */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Client</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Client</label>
                <select
                  className={
                    defaultClientId
                      ? `${inputCls} border-green-400 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300 cursor-not-allowed opacity-90`
                      : inputCls
                  }
                  value={form.client_id}
                  onChange={set("client_id")}
                  disabled={!!defaultClientId}
                >
                  <option value="">— Non associé —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.type === "entreprise"
                        ? (c.raison_sociale ?? c.nom_contact ?? c.email ?? c.id)
                        : `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || c.email || c.id}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Nb passagers</label>
                <input type="number" min="1" max="99" className={inputCls} value={form.nombre_passagers} onChange={set("nombre_passagers")} placeholder="1" />
              </div>
            </div>
          </div>

          {/* Filtre type chauffeur */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Type de chauffeur</label>
            <select className={inputCls} value={filterTypeChauffeur}
              onChange={(e) => setFilterTypeChauffeur(e.target.value as "tous" | "interne" | "independant")}>
              <option value="tous">Tous les chauffeurs</option>
              <option value="interne">Chauffeurs internes</option>
              <option value="independant">Chauffeurs indépendants (Connectés)</option>
            </select>
          </div>

          {/* Chauffeur + Véhicule */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Chauffeur</label>
              <select className={inputCls} value={form.chauffeur_id} onChange={set("chauffeur_id")}>
                <option value="">— Non assigné —</option>
                {[...chauffeurs]
                  .filter((c) => {
                    if (filterTypeChauffeur === "interne" && c.type_chauffeur !== "interne") return false;
                    if (filterTypeChauffeur === "independant" && c.type_chauffeur !== "independant") return false;
                    if (c.type_chauffeur === "independant" && c.statut_approbation !== "approuve") return false;
                    return true;
                  })
                  .sort((a, b) => {
                    const score = (c: Chauffeur) => c.disponible ? 0 : c.statut === "en_mission" ? 1 : 2;
                    return score(a) - score(b);
                  })
                  .map((c) => {
                    const badge = c.disponible ? "🟢" : c.statut === "en_mission" ? "🔵" : c.statut === "suspendu" ? "🔴" : "⚪";
                    const isInterne = c.type_chauffeur === "interne";
                    const hasDocuments = chauffeurDocsStatus[c.id] !== false;
                    const vehicle = vehicles.find((v) => v.chauffeur_id === c.id);
                    const hasVehicleDocs = vehicle ? vehicleDocsStatus[vehicle.id] !== false : true;
                    const isDisabled = isInterne && (!hasDocuments || !hasVehicleDocs);
                    const warningMsg = !hasDocuments ? " ⚠ DOCS CHAUFFEUR MANQUANTS" : !hasVehicleDocs ? " ⚠ DOCS VEHICULE MANQUANTS" : "";
                    return (
                      <option key={c.id} value={c.id} disabled={isDisabled}>
                        {badge} {c.first_name} {c.last_name}{c.type_chauffeur === "independant" ? " (indépendant)" : ""}{isDisabled ? warningMsg : ""}{c.phone ? ` · ${c.phone}` : ""}
                      </option>
                    );
                  })}
              </select>
              {form.chauffeur_id && (() => {
                const chauffeur = chauffeurs.find((c) => c.id === form.chauffeur_id);
                if (!chauffeur || chauffeur.type_chauffeur !== "interne") return null;
                const hasDocuments = chauffeurDocsStatus[form.chauffeur_id] !== false;
                const vehicle = vehicles.find((v) => v.chauffeur_id === form.chauffeur_id);
                const hasVehicleDocs = vehicle ? vehicleDocsStatus[vehicle.id] !== false : true;
                if (!hasDocuments) return (
                  <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                    <AlertTriangleIcon className="w-3 h-3" /> Ce chauffeur n&apos;a pas tous ses documents obligatoires
                  </p>
                );
                if (!hasVehicleDocs) return (
                  <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                    <AlertTriangleIcon className="w-3 h-3" /> Le véhicule assigné n&apos;a pas tous ses documents obligatoires
                  </p>
                );
                return null;
              })()}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Véhicule</label>
              <select className={inputCls} value={form.voiture_id} onChange={set("voiture_id")} disabled={!form.chauffeur_id}>
                <option value="">— Non assigné —</option>
                {form.chauffeur_id && (() => {
                  const selectedChauffeur = chauffeurs.find((c) => c.id === form.chauffeur_id);
                  if (!selectedChauffeur) return null;
                  const availableVehicles = vehicles.filter((v) => {
                    if (selectedChauffeur.type_chauffeur === "interne") return v.owner_type === "agency" || !v.owner_type;
                    return v.owner_type === "chauffeur" && v.owner_id === selectedChauffeur.id;
                  });
                  return availableVehicles.map((v) => {
                    const hasVehicleDocs = vehicleDocsStatus[v.id] !== false;
                    return (
                      <option key={v.id} value={v.id} disabled={!hasVehicleDocs}>
                        {v.marque} {v.modele} · {v.immat}{!hasVehicleDocs ? " ⚠ DOCS MANQUANTS" : ""}
                      </option>
                    );
                  });
                })()}
              </select>
              {!form.chauffeur_id && (
                <p className="text-xs text-muted-foreground mt-1.5">Sélectionnez d&apos;abord un chauffeur</p>
              )}
              {form.voiture_id && vehicleDocsStatus[form.voiture_id] === false && (
                <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                  <AlertTriangleIcon className="w-3 h-3" /> Ce véhicule n&apos;a pas tous ses documents obligatoires
                </p>
              )}
            </div>
          </div>

          {/* Statut */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Statut</label>
            <select className={inputCls} value={form.statut} onChange={set("statut")}>
              <option value="planifiée">Planifiée</option>
              <option value="en_cours">En cours</option>
              <option value="terminée">Terminée</option>
              <option value="annulée">Annulée</option>
            </select>
          </div>

          {/* Tarification */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tarification</p>
              {calcLoading && <span className="text-xs text-blue-500 animate-pulse">Calcul en cours…</span>}
              {autoCalc && !calcLoading && <span className="text-xs text-green-600 bg-green-50 rounded px-2 py-0.5">✓ Calculé auto</span>}
            </div>
            <div className="mb-3">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Grille tarifaire</label>
              <select className={inputCls} value={form.tarif_id}
                onChange={(e) => { setAutoCalc(false); setForm((p) => ({ ...p, tarif_id: e.target.value })); }}>
                <option value="">Tarif manuel (client)</option>
                {tarifs.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nom} — {t.prise_en_charge}€ + {t.prix_km}€/km
                    {t.prix_minute_attente > 0 && ` + ${t.prix_minute_attente}€/min`}
                    {t.minimum_garanti > 0 && ` (min ${t.minimum_garanti}€)`}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Montant client (€)</label>
                <input type="number" min="0" step="0.01" className={inputCls} value={form.montant} onChange={set("montant")} placeholder="75.00" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Prix achat chauffeur (€)</label>
                <input
                  type="number" min="0" step="0.01" className={inputCls}
                  value={form.prix_achat_chauffeur}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    const max = parseFloat(form.montant);
                    if (!isNaN(max) && v > max) return;
                    setForm((p) => ({ ...p, prix_achat_chauffeur: e.target.value }));
                  }}
                  placeholder="50.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Distance (km)</label>
                <input type="number" min="0" step="0.1" className={inputCls} value={form.distance_km}
                  onChange={(e) => { setAutoCalc(false); setForm((p) => ({ ...p, distance_km: e.target.value })); }} placeholder="32.5" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Durée (min)</label>
                <input type="number" min="0" className={inputCls} value={form.duree_minutes} onChange={set("duree_minutes")} placeholder="45" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={set("notes")} rows={2} placeholder="Instructions particulières…"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="h-9 px-4 rounded-lg border border-input text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={saving}
              className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center gap-1.5 disabled:opacity-60 transition-colors">
              {saving
                ? <><Loader2Icon className="w-4 h-4 animate-spin" /> {mode === "add" ? "Création…" : "Enregistrement…"}</>
                : <><CheckCircleIcon className="w-4 h-4" /> {mode === "add" ? "Créer la mission" : "Enregistrer"}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Hook pour charger chauffeurDocsStatus + vehicleDocsStatus ─────────────────
export async function loadDocsStatus(
  chauffeurs: { id: string; type_chauffeur?: string }[],
  vehicles: { id: string }[]
): Promise<{ chauffeurDocsStatus: Record<string, boolean>; vehicleDocsStatus: Record<string, boolean> }> {
  const chauffeurDocsStatus: Record<string, boolean> = {};
  const vehicleDocsStatus: Record<string, boolean> = {};

  await Promise.all([
    ...chauffeurs
      .filter((c) => c.type_chauffeur === "interne")
      .map(async (c) => {
        try {
          const check = await documentApi.mandatoryCheck("chauffeur", String(c.id));
          chauffeurDocsStatus[String(c.id)] = check.complete;
        } catch {
          chauffeurDocsStatus[String(c.id)] = true;
        }
      }),
    ...vehicles.map(async (v) => {
      try {
        const check = await checkVehicleDocs(v.id);
        vehicleDocsStatus[v.id] = check.complete;
      } catch {
        vehicleDocsStatus[v.id] = true;
      }
    }),
  ]);

  return { chauffeurDocsStatus, vehicleDocsStatus };
}
