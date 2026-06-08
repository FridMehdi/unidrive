"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PlusIcon, SearchIcon, Loader2Icon, RefreshCwIcon, XIcon,
  ChevronDownIcon, ChevronRightIcon, BanknoteIcon, CheckIcon,
  CalendarIcon, FileTextIcon,
} from "lucide-react";
import {
  missionApi, clientApi, chauffeurApi, vehicleApi, billingApi,
  type Mission, type Client, type Chauffeur, type Vehicle,
} from "@/lib/api";
import { MissionModal, loadDocsStatus } from "@/components/MissionModal";

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUT_CFG: Record<string, { label: string; color: string; bg: string }> = {
  planifiée: { label: "Planifiée",  color: "#f59e0b", bg: "#f59e0b18" },
  acceptée:  { label: "Acceptée",   color: "#3b82f6", bg: "#3b82f618" },
  en_cours:  { label: "En cours",   color: "#6366f1", bg: "#6366f118" },
  terminée:  { label: "Terminée",   color: "#22c55e", bg: "#22c55e18" },
  validée:   { label: "Validée",    color: "#10b981", bg: "#10b98118" },
  facturée:  { label: "Facturée",   color: "#8b5cf6", bg: "#8b5cf618" },
  annulée:   { label: "Annulée",    color: "#ef4444", bg: "#ef444418" },
};

const BILLABLE = ["terminée", "validée", "facturée"] as const;
// Pour la facturation mensuelle : même liste
const MONTHLY_BILLABLE = BILLABLE;

// ── Helpers ───────────────────────────────────────────────────────────────────
function clientLabel(c: Client): string {
  if (c.type === "entreprise") return c.raison_sociale ?? c.nom_contact ?? c.email ?? c.id;
  return `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || c.email || c.id;
}

function clientInitials(c: Client): string {
  return clientLabel(c)
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function fmtAmt(n?: number | string | null): string {
  if (n == null || n === "") return "—";
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(num)) return "—";
  return `${num.toFixed(2)} €`;
}

function toNum(n?: number | string | null): number {
  if (n == null || n === "") return 0;
  const v = typeof n === "string" ? parseFloat(n) : n;
  return isNaN(v) ? 0 : v;
}

function mKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function isBillable(statut: string): boolean {
  return (BILLABLE as readonly string[]).includes(statut);
}

// ── Billing Confirm Modal ─────────────────────────────────────────────────────
function BillingModal({
  missions,
  label,
  onClose,
  onConfirm,
}: {
  missions: Mission[];
  label: string;
  onClose: () => void;
  onConfirm: () => Promise<string | null>;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [factureId, setFactureId] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const total = missions.reduce((s, m) => s + toNum(m.montant), 0);

  const handleConfirm = async () => {
    setLoading(true);
    setErr(null);
    try {
      const id = await onConfirm();
      setFactureId(id);
      setDone(true);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erreur lors de la génération");
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async () => {
    if (!factureId) return;
    setPdfLoading(true);
    try {
      const res = await billingApi.getFactureDownload(factureId);
      window.open(res.url, "_blank");
    } catch (e) {
      console.error("download error", e);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-lg p-6">
        {done ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckIcon className="w-7 h-7 text-green-600" />
            </div>
            <p className="font-semibold text-base text-green-700 dark:text-green-400">
              Facture générée !
            </p>
            <p className="text-sm text-muted-foreground mt-1 mb-5">
              {missions.length} mission{missions.length > 1 ? "s" : ""} — un seul PDF groupé disponible ci-dessous.
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              {factureId ? (
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={downloadPdf}
                  disabled={pdfLoading}
                >
                  {pdfLoading ? (
                    <Loader2Icon className="w-4 h-4 animate-spin mr-1.5" />
                  ) : (
                    <FileTextIcon className="w-4 h-4 mr-1.5" />
                  )}
                  Télécharger la facture PDF
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => { window.location.href = "/factures"; }}
                >
                  <FileTextIcon className="w-4 h-4 mr-1.5" />
                  Voir mes factures
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={onClose}>
                Fermer
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-base">Confirmer la facturation</h2>
              <button onClick={onClose}>
                <XIcon className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{label}</p>

            {/* Summary table */}
            <div className="rounded-xl border border-border overflow-hidden mb-5">
              <div className="overflow-y-auto max-h-60">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted/40">
                    <tr className="text-xs text-muted-foreground border-b border-border">
                      <th className="px-3 py-2 text-left font-medium">Mission</th>
                      <th className="px-3 py-2 text-left font-medium">Date</th>
                      <th className="px-3 py-2 text-left font-medium max-w-[160px]">Trajet</th>
                      <th className="px-3 py-2 text-right font-medium">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {missions.map((m, i) => (
                      <tr
                        key={m.id}
                        className={i > 0 ? "border-t border-border" : ""}
                      >
                        <td className="px-3 py-2 font-mono text-xs">{m.numero}</td>
                        <td className="px-3 py-2 text-xs whitespace-nowrap">{fmtDate(m.date_depart)}</td>
                        <td className="px-3 py-2 text-xs max-w-[160px] truncate text-muted-foreground">
                          {m.adresse_depart} → {m.adresse_arrivee}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">{fmtAmt(m.montant)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border bg-muted/20">
                      <td colSpan={3} className="px-3 py-2.5 font-semibold text-sm">
                        Total ({missions.length} mission{missions.length > 1 ? "s" : ""})
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-blue-600 text-sm">
                        {fmtAmt(total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2 flex-col items-end">
              {err && (
                <p className="text-xs text-red-600 w-full text-right">{err}</p>
              )}
              <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Annuler
              </Button>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2Icon className="w-4 h-4 animate-spin mr-1.5" />
                    Génération…
                  </>
                ) : (
                  <>
                    <BanknoteIcon className="w-4 h-4 mr-1.5" />
                    Générer {missions.length} facture{missions.length > 1 ? "s" : ""}
                  </>
                )}
              </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DossiersPage() {
  const [clients, setClients]     = useState<Client[]>([]);
  const [missions, setMissions]   = useState<Mission[]>([]);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [vehicles, setVehicles]   = useState<Vehicle[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const [search, setSearch]       = useState("");
  const [filterMonth, setFilterMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [createFor, setCreateFor] = useState<Client | null>(null);
  const [billing, setBilling]     = useState<{ missions: Mission[]; label: string; client_id?: string } | null>(null);
  const [chauffeurDocsStatus, setChauffeurDocsStatus] = useState<Record<string, boolean>>({});
  const [vehicleDocsStatus, setVehicleDocsStatus]     = useState<Record<string, boolean>>({});

  // ── Load ────────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cl, ms, ch, veh] = await Promise.all([
        clientApi.list({ limit: 500 }),
        missionApi.list({ limit: 1000 }),
        chauffeurApi.list({ limit: 500 }),
        vehicleApi.list({ limit: 500 }),
      ]);
      setClients(cl.data ?? []);
      setMissions(ms.data ?? []);
      setChauffeurs(ch.data ?? []);
      setVehicles(veh.data ?? []);
      loadDocsStatus(ch.data ?? [], veh.data ?? []).then(({ chauffeurDocsStatus: cds, vehicleDocsStatus: vds }) => {
        setChauffeurDocsStatus(cds);
        setVehicleDocsStatus(vds);
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Grouping ─────────────────────────────────────────────────────────────────
  // All missions by client (no month filter)
  const byClient = useMemo(() => {
    const map: Record<string, Mission[]> = {};
    for (const m of missions) {
      if (!m.client_id) continue;
      (map[m.client_id] ??= []).push(m);
    }
    return map;
  }, [missions]);

  // Missions filtered by month per client
  const byClientMonth = useMemo(() => {
    const map: Record<string, Mission[]> = {};
    for (const [cid, ms] of Object.entries(byClient)) {
      map[cid] = filterMonth ? ms.filter((m) => mKey(m.date_depart) === filterMonth) : ms;
    }
    return map;
  }, [byClient, filterMonth]);

  // Sorted clients (by total missions desc)
  const filteredClients = useMemo(() => {
    return clients
      .filter((c) => {
        if (!search) return true;
        return clientLabel(c).toLowerCase().includes(search.toLowerCase());
      })
      .sort((a, b) => (byClient[b.id]?.length ?? 0) - (byClient[a.id]?.length ?? 0));
  }, [clients, search, byClient]);

  // ── Month options ─────────────────────────────────────────────────────────────
  const monthOpts = useMemo(() => {
    const now = new Date();
    const opts: { key: string; label: string }[] = [{ key: "", label: "Tous les mois" }];
    // current + 12 past months (most recent first), then 3 future months at end
    for (let i = 0; i >= -12; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const lbl = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
      opts.push({ key: k, label: lbl.charAt(0).toUpperCase() + lbl.slice(1) });
    }
    for (let i = 1; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const lbl = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
      opts.push({ key: k, label: lbl.charAt(0).toUpperCase() + lbl.slice(1) });
    }
    return opts;
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const chauffeurName = (id?: string | null) => {
    if (!id) return null;
    const c = chauffeurs.find((x) => x.id === id);
    return c ? `${c.first_name} ${c.last_name}` : null;
  };

  const toggleExpand = (id: string) =>
    setExpanded((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const toggleSelect = (id: string) =>
    setSelected((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const toggleAllClient = (clientId: string) => {
    const billable = (byClientMonth[clientId] ?? []).filter((m) => isBillable(m.statut));
    const allSel = billable.length > 0 && billable.every((m) => selected.has(m.id));
    setSelected((p) => {
      const n = new Set(p);
      if (allSel) billable.forEach((m) => n.delete(m.id));
      else billable.forEach((m) => n.add(m.id));
      return n;
    });
  };

  // ── Billing ───────────────────────────────────────────────────────────────────
  const generateBilling = async (missionIds: string[], clientId?: string): Promise<string | null> => {
    let factureId: string | null = null;
    try {
      if (clientId) {
        // Une seule facture groupée pour ce client
        const res = await billingApi.createFactureGroupee({ client_id: clientId, mission_ids: missionIds });
        factureId = res.data?.id ?? null;
      } else {
        // Plusieurs clients : grouper par client_id et créer une facture par groupe
        const byClientId: Record<string, string[]> = {};
        for (const id of missionIds) {
          const m = missions.find((x) => x.id === id);
          const cid = m?.client_id ?? "__unknown__";
          (byClientId[cid] ??= []).push(id);
        }
        for (const [cid, ids] of Object.entries(byClientId)) {
          if (cid === "__unknown__") {
            for (const id of ids) {
              await missionApi.updateStatut(id, "facturée").catch(() => {});
            }
          } else {
            const r = await billingApi.createFactureGroupee({ client_id: cid, mission_ids: ids }).catch((e) => {
              console.error("[dossiers] grouped billing error", cid, e);
              return null;
            });
            if (!factureId && r?.data?.id) factureId = r.data.id;
          }
        }
      }
    } catch (e) {
      console.error("[dossiers] billing error", e);
    }
    try {
      const res = await missionApi.list({ limit: 1000 });
      setMissions(res.data ?? []);
    } catch { /* silent */ }
    setSelected(new Set());
    return factureId;
  };

  const startMonthBilling = (clientId: string) => {
    // Inclut terminée + validée + facturée pour un récap complet du mois
    const ms = (byClientMonth[clientId] ?? []).filter(
      (m) => (MONTHLY_BILLABLE as readonly string[]).includes(m.statut)
    );
    if (!ms.length) return;
    const c = clients.find((x) => x.id === clientId)!;
    const mo = filterMonth
      ? new Date(`${filterMonth}-01`).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
      : "toutes périodes";
    setBilling({
      missions: ms,
      label: `Facturation ${mo} — ${clientLabel(c)} · ${ms.length} mission${ms.length > 1 ? "s" : ""}`,
      client_id: clientId,
    });
  };

  const startSelectionBilling = (clientId: string) => {
    const ms = (byClientMonth[clientId] ?? []).filter(
      (m) => selected.has(m.id) && isBillable(m.statut),
    );
    if (!ms.length) return;
    const c = clients.find((x) => x.id === clientId)!;
    setBilling({
      missions: ms,
      label: `Facturer ${ms.length} mission${ms.length > 1 ? "s" : ""} — ${clientLabel(c)}`,
      client_id: clientId,
    });
  };

  const globalBillable = missions.filter((m) => selected.has(m.id) && isBillable(m.statut));

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Modals */}
      {createFor && (
        <MissionModal
          mode="add"
          clients={clients}
          chauffeurs={chauffeurs}
          vehicles={vehicles}
          chauffeurDocsStatus={chauffeurDocsStatus}
          vehicleDocsStatus={vehicleDocsStatus}
          defaultClientId={createFor.id}
          onClose={() => setCreateFor(null)}
          onSaved={(m) => {
            setMissions((p) => [m, ...p]);
            setCreateFor(null);
          }}
        />
      )}
      {billing && (
        <BillingModal
          missions={billing.missions}
          label={billing.label}
          onClose={() => setBilling(null)}
          onConfirm={() => generateBilling(billing.missions.map((m) => m.id), billing.client_id)}
        />
      )}

      {/* Top bar */}
      <div className="w-full sticky top-0 z-40 bg-white dark:bg-neutral-950 flex-shrink-0 flex flex-row h-16 items-center px-6 border-b border-neutral-200 dark:border-neutral-800 justify-between">
        <div>
          <h1 className="text-lg font-bold">Dossiers clients</h1>
          <p className="text-xs text-muted-foreground">
            {loading
              ? "Chargement…"
              : `${filteredClients.length} client(s) · missions groupées par client`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {globalBillable.length > 0 && (
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() =>
                setBilling({
                  missions: globalBillable,
                  label: `Facturer ${globalBillable.length} mission${globalBillable.length > 1 ? "s" : ""} sélectionnée${globalBillable.length > 1 ? "s" : ""}`,
                  // Pas de client_id : missions potentiellement multi-clients, groupées par client dans generateBilling
                })
              }
            >
              <BanknoteIcon className="w-4 h-4 mr-1.5" />
              Facturer la sélection ({globalBillable.length})
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCwIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl w-full mx-auto p-6 space-y-3">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un client…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <select
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            >
              {monthOpts.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl text-sm border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24 gap-3 text-muted-foreground">
            <Loader2Icon className="w-5 h-5 animate-spin" />
            Chargement des dossiers…
          </div>
        )}

        {/* Client cards */}
        {!loading &&
          filteredClients.map((client) => {
            const allMs   = byClient[client.id] ?? [];
            const monthMs = byClientMonth[client.id] ?? [];
            const billableMs  = monthMs.filter((m) => isBillable(m.statut));
            const isExp       = expanded.has(client.id);
            const monthTotal  = monthMs.reduce((s, m) => s + toNum(m.montant), 0);
            const selForClient = monthMs.filter((m) => selected.has(m.id) && isBillable(m.statut));
            const allSel  = billableMs.length > 0 && billableMs.every((m) => selected.has(m.id));
            const someSel = billableMs.some((m) => selected.has(m.id));

            return (
              <Card key={client.id} className="border-none shadow-sm overflow-hidden">
                {/* ── Client header row ───────────────────────────────── */}
                <div
                  className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-muted/20 transition-colors select-none"
                  onClick={() => toggleExpand(client.id)}
                >
                  {/* Chevron */}
                  <div className="flex-shrink-0 text-muted-foreground">
                    {isExp ? (
                      <ChevronDownIcon className="w-4 h-4" />
                    ) : (
                      <ChevronRightIcon className="w-4 h-4" />
                    )}
                  </div>

                  {/* Avatar */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      client.type === "entreprise"
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700"
                        : "bg-violet-100 dark:bg-violet-900/30 text-violet-700"
                    }`}
                  >
                    {clientInitials(client)}
                  </div>

                  {/* Name + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-sm">{clientLabel(client)}</span>
                      {client.type === "entreprise" && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-medium">
                          Entreprise
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {allMs.length} mission{allMs.length > 1 ? "s" : ""} au total
                      {filterMonth && monthMs.length !== allMs.length && (
                        <> · {monthMs.length} ce mois</>
                      )}
                      {client.email && ` · ${client.email}`}
                    </p>
                  </div>

                  {/* Month total */}
                  {monthMs.length > 0 && (
                    <div className="text-right flex-shrink-0 mr-2">
                      <p className="text-sm font-bold text-blue-600">{fmtAmt(monthTotal)}</p>
                      <p className="text-xs text-muted-foreground">
                        {filterMonth ? "ce mois" : "total"}
                      </p>
                    </div>
                  )}

                  {/* To-bill badge */}
                  {billableMs.length > 0 && (
                    <span className="flex-shrink-0 text-xs px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 border border-amber-200 dark:border-amber-700 font-medium whitespace-nowrap">
                      {billableMs.length} à facturer
                    </span>
                  )}

                  {/* Action buttons */}
                  <div
                    className="flex items-center gap-2 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {billableMs.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => startMonthBilling(client.id)}
                      >
                        <BanknoteIcon className="w-3 h-3 mr-1" />
                        {filterMonth ? "Facturer le mois" : "Tout facturer"}
                      </Button>
                    )}
                    {selForClient.length > 0 && (
                      <Button
                        size="sm"
                        className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => startSelectionBilling(client.id)}
                      >
                        <BanknoteIcon className="w-3 h-3 mr-1" />
                        Facturer ({selForClient.length})
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => { setCreateFor(client); if (!isExp) toggleExpand(client.id); }}
                    >
                      <PlusIcon className="w-3 h-3 mr-1" />
                      Mission
                    </Button>
                  </div>
                </div>

                {/* ── Expanded: missions list ─────────────────────────── */}
                {isExp && (
                  <div className="border-t border-border">
                    {monthMs.length === 0 ? (
                      <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                        {filterMonth
                          ? "Aucune mission ce mois-ci."
                          : "Aucune mission enregistrée."}
                        <button
                          className="ml-2 text-blue-600 underline underline-offset-2"
                          onClick={() => setCreateFor(client)}
                        >
                          Créer une mission
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Toolbar: select-all + summary */}
                        <div className="flex items-center gap-3 px-5 py-2.5 bg-muted/10 border-b border-border text-xs text-muted-foreground">
                          {billableMs.length > 0 ? (
                            <button
                              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                              onClick={() => toggleAllClient(client.id)}
                            >
                              <div
                                className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                  allSel
                                    ? "bg-blue-600 border-blue-600"
                                    : someSel
                                    ? "bg-blue-200 border-blue-400"
                                    : "border-muted-foreground/40"
                                }`}
                              >
                                {(allSel || someSel) && (
                                  <CheckIcon className="w-2.5 h-2.5 text-white" />
                                )}
                              </div>
                              {allSel
                                ? "Tout désélectionner"
                                : `Sélectionner tout (${billableMs.length} facturable${billableMs.length > 1 ? "s" : ""})`}
                            </button>
                          ) : (
                            <span className="text-muted-foreground/60 italic">Aucune mission facturable</span>
                          )}
                          <span className="ml-auto font-medium text-foreground/70">
                            {monthMs.length} mission{monthMs.length > 1 ? "s" : ""} ·{" "}
                            {fmtAmt(monthTotal)}
                          </span>
                        </div>

                        {/* Missions table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-xs text-muted-foreground border-b border-border bg-muted/10">
                                <th className="w-10 px-4 py-2.5" />
                                <th className="px-4 py-2.5 text-left font-medium">N°</th>
                                <th className="px-4 py-2.5 text-left font-medium">Date</th>
                                <th className="px-4 py-2.5 text-left font-medium">Trajet</th>
                                <th className="px-4 py-2.5 text-left font-medium">Chauffeur</th>
                                <th className="px-4 py-2.5 text-right font-medium">Montant</th>
                                <th className="px-4 py-2.5 text-left font-medium">Statut</th>
                                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[...monthMs]
                                .sort(
                                  (a, b) =>
                                    new Date(b.date_depart).getTime() -
                                    new Date(a.date_depart).getTime(),
                                )
                                .map((m, idx) => {
                                  const cfg = STATUT_CFG[m.statut] ?? {
                                    label: m.statut,
                                    color: "#888",
                                    bg: "#88888818",
                                  };
                                  const canBill = isBillable(m.statut);
                                  const isSel   = selected.has(m.id);

                                  return (
                                    <tr
                                      key={m.id}
                                      className={`border-b border-border last:border-0 transition-colors ${
                                        isSel
                                          ? "bg-blue-50 dark:bg-blue-900/10"
                                          : idx % 2 !== 0
                                          ? "bg-muted/5"
                                          : ""
                                      }`}
                                    >
                                      {/* Checkbox */}
                                      <td className="px-4 py-3">
                                        {canBill ? (
                                          <button
                                            onClick={() => toggleSelect(m.id)}
                                            className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                              isSel
                                                ? "bg-blue-600 border-blue-600"
                                                : "border-muted-foreground/40 hover:border-blue-400"
                                            }`}
                                          >
                                            {isSel && (
                                              <CheckIcon className="w-2.5 h-2.5 text-white" />
                                            )}
                                          </button>
                                        ) : (
                                          <div className="w-4 h-4 rounded border-2 border-muted-foreground/20 opacity-30" />
                                        )}
                                      </td>

                                      {/* N° */}
                                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                        {m.numero}
                                      </td>

                                      {/* Date */}
                                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                                        {fmtDate(m.date_depart)}
                                      </td>

                                      {/* Trajet */}
                                      <td className="px-4 py-3 max-w-[200px]">
                                        <p className="text-xs font-medium truncate">
                                          {m.adresse_depart}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                          → {m.adresse_arrivee}
                                        </p>
                                      </td>

                                      {/* Chauffeur */}
                                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                        {chauffeurName(m.chauffeur_id) ?? "—"}
                                      </td>

                                      {/* Montant */}
                                      <td className="px-4 py-3 text-right font-semibold text-sm">
                                        {fmtAmt(m.montant)}
                                      </td>

                                      {/* Statut */}
                                      <td className="px-4 py-3">
                                        <span
                                          className="inline-block text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                                          style={{ color: cfg.color, backgroundColor: cfg.bg }}
                                        >
                                          {cfg.label}
                                        </span>
                                      </td>

                                      {/* Actions */}
                                      <td className="px-4 py-3 text-right">
                                        {canBill && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                                            onClick={() =>
                                              setBilling({
                                                missions: [m],
                                                label: `Facturation mission ${m.numero} — ${clientLabel(client)}`,
                                                client_id: m.client_id ?? undefined,
                                              })
                                            }
                                          >
                                            <BanknoteIcon className="w-3 h-3 mr-1" />
                                            Facturer
                                          </Button>
                                        )}
                                        {m.statut === "facturée" && (
                                          <span className="text-xs text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1 justify-end">
                                            <FileTextIcon className="w-3 h-3" />
                                            Facturée
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </Card>
            );
          })}

        {/* Empty state */}
        {!loading && filteredClients.length === 0 && (
          <div className="text-center py-24 text-muted-foreground text-sm">
            {search ? `Aucun client pour « ${search} ».` : "Aucun client trouvé."}
          </div>
        )}
      </div>
    </>
  );
}
