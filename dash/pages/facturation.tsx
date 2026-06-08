"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DownloadIcon, MailIcon, RefreshCwIcon, SearchIcon,
  FileTextIcon, CheckCircleIcon, ClockIcon, XCircleIcon,
  ChevronDownIcon, ChevronUpIcon,
} from "lucide-react";
import { billingApi, type Facture, type BillingStats } from "@/lib/api";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number | null | undefined) {
  return (n ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUT_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  draft:    { label: "Brouillon", color: "#94a3b8", bg: "#94a3b818", icon: <FileTextIcon className="w-3 h-3" /> },
  envoyee:  { label: "Envoy\u00e9e",   color: "#6366f1", bg: "#6366f118", icon: <MailIcon className="w-3 h-3" /> },
  payee:    { label: "Pay\u00e9e",     color: "#22c55e", bg: "#22c55e18", icon: <CheckCircleIcon className="w-3 h-3" /> },
  annulee:  { label: "Annul\u00e9e",   color: "#f59e0b", bg: "#f59e0b18", icon: <XCircleIcon className="w-3 h-3" /> },
};

function StatutBadge({ statut }: { statut: string }) {
  const cfg = STATUT_CFG[statut] ?? { label: statut, color: "#94a3b8", bg: "#94a3b818", icon: null };
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

const STATUTS = ["tous", "draft", "envoyee", "payee", "annulee"];

export default function Facturation() {
  const [stats, setStats]       = useState<BillingStats | null>(null);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]           = useState("");
  const [filterStatut, setFilterStatut] = useState("tous");
  const [expanded, setExpanded]       = useState<string | null>(null);
  const [emailTarget, setEmailTarget] = useState<Facture | null>(null);
  const [emailAddr, setEmailAddr]     = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailMsg, setEmailMsg]       = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [updatingStatut, setUpdatingStatut] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, facturesRes] = await Promise.all([
        billingApi.stats(),
        billingApi.listFactures({ limit: 200 }),
      ]);
      setStats(statsRes);
      setFactures(facturesRes.data ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = factures.filter(f => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || f.numero?.toLowerCase().includes(q)
      || f.client_nom?.toLowerCase().includes(q)
      || f.mission_numero?.toLowerCase().includes(q);
    const matchStatut = filterStatut === "tous" || f.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  async function handleDownload(id: string) {
    setDownloading(id);
    try {
      const res = await billingApi.getFactureDownload(id);
      window.open(res.url, "_blank");
    } catch (e: any) {
      alert("Erreur téléchargement : " + e.message);
    } finally {
      setDownloading(null);
    }
  }

  async function handleSendEmail() {
    if (!emailTarget || !emailAddr) return;
    setSendingEmail(true);
    setEmailMsg(null);
    try {
      await billingApi.sendFactureEmail(emailTarget.id, emailAddr);
      setEmailMsg("✅ Facture envoyée à " + emailAddr);
      setFactures(fs => fs.map(f => f.id === emailTarget.id ? { ...f, statut: "envoyee" as const } : f));
    } catch (e: any) {
      setEmailMsg("❌ " + e.message);
    } finally {
      setSendingEmail(false);
    }
  }

  async function handleStatutUpdate(id: string, statut: "draft" | "envoyee" | "payee" | "annulee") {
    setUpdatingStatut(id);
    try {
      await billingApi.updateFacture(id, { statut });
      setFactures(fs => fs.map(f => f.id === id ? { ...f, statut } : f));
      const statsRes = await billingApi.stats();
      setStats(statsRes);
    } catch (e: any) {
      alert("Erreur : " + e.message);
    } finally {
      setUpdatingStatut(null);
    }
  }

  return (
    <>
      {/* Email modal */}
      {emailTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEmailTarget(null)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">Envoyer {emailTarget.numero}</h2>
            <p className="text-sm text-muted-foreground">La facture PDF sera envoyée en pièce jointe.</p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email du client</label>
              <Input type="email" placeholder="client@example.com" value={emailAddr} onChange={e => setEmailAddr(e.target.value)} autoFocus />
            </div>
            {emailMsg && (
              <p className={`text-sm ${emailMsg.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>{emailMsg}</p>
            )}
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setEmailTarget(null)}>Annuler</Button>
              <Button onClick={handleSendEmail} disabled={sendingEmail || !emailAddr}>
                {sendingEmail ? "Envoi…" : "Envoyer"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header sticky */}
      <div className="w-full sticky top-0 z-40 bg-white dark:bg-neutral-950 flex-shrink-0 flex flex-row h-16 items-center px-6 border-b border-neutral-200 dark:border-neutral-800 justify-between">
        <div>
          <h1 className="text-lg font-bold">Facturation</h1>
          <p className="text-xs text-muted-foreground">
            {loading ? "Chargement…" : `${stats?.nb_factures ?? 0} factures · ${fmt(stats?.total_ttc)} € TTC`}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          <RefreshCwIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="max-w-7xl w-full mx-auto p-6 space-y-4">

        {/* KPI Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total TTC",   value: `${fmt(stats?.total_ttc)} €`,    color: "text-foreground" },
            { label: "Payé",        value: `${fmt(stats?.total_paye)} €`,   color: "text-green-600" },
            { label: "En attente",  value: `${fmt(stats?.total_impaye)} €`, color: "text-amber-500" },
            { label: "Nb factures", value: String(stats?.nb_factures ?? 0), color: "text-indigo-500" },
          ].map(s => (
            <Card key={s.label} className="border-none shadow-sm p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher n° facture, client, mission…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUTS.map(s => (
              <button
                key={s}
                onClick={() => setFilterStatut(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  filterStatut === s
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                    : "border-border text-muted-foreground hover:bg-neutral-50 dark:hover:bg-neutral-900"
                }`}
              >
                {s === "tous" ? "Toutes" : STATUT_CFG[s]?.label ?? s}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>
        )}

        {/* Table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-neutral-50 dark:bg-neutral-900">
                  {["Numéro", "Mission", "Client", "Montant HT", "TVA", "TTC", "Statut", "Date", "Actions"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">Chargement…</td></tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">Aucune facture trouvée.</td></tr>
                )}
                {filtered.map(f => (
                  <>
                    <tr
                      key={f.id}
                      className="border-b border-border hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
                      onClick={() => setExpanded(expanded === f.id ? null : f.id)}
                    >
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-indigo-600">{f.numero}</td>
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{f.mission_numero ?? "—"}</td>
                      <td className="px-5 py-3 font-medium">{f.client_nom ?? "—"}</td>
                      <td className="px-5 py-3 text-xs">{fmt(f.montant_ht)} €</td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{fmt(f.montant_tva)} €</td>
                      <td className="px-5 py-3 font-bold">{fmt(f.montant_ttc)} €</td>
                      <td className="px-5 py-3"><StatutBadge statut={f.statut} /></td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{fmtDate(f.created_at)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button
                            title="Télécharger PDF"
                            disabled={downloading === f.id}
                            onClick={() => handleDownload(f.id)}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <DownloadIcon className="w-4 h-4" />
                          </button>
                          <button
                            title="Envoyer par email"
                            onClick={() => { setEmailTarget(f); setEmailAddr(f.client_email ?? ""); setEmailMsg(null); }}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <MailIcon className="w-4 h-4" />
                          </button>
                          <span className="text-muted-foreground">
                            {expanded === f.id ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {expanded === f.id && (
                      <tr key={`${f.id}-detail`} className="bg-neutral-50 dark:bg-neutral-900">
                        <td colSpan={9} className="px-8 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Détails</p>
                              <div className="text-sm space-y-1">
                                <div className="flex justify-between"><span className="text-muted-foreground">TVA</span><span>{f.taux_tva ?? 20}%</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Échéance</span><span>{fmtDate(f.date_echeance)}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Paiement</span><span>{fmtDate(f.date_paiement)}</span></div>
                                {f.notes && <p className="text-xs text-muted-foreground italic mt-2">« {f.notes} »</p>}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Changer le statut</p>
                              <div className="flex flex-wrap gap-2">
                                {(["envoyee", "payee", "annulee"] as const).map(s => (
                                  <button
                                    key={s}
                                    disabled={f.statut === s || updatingStatut === f.id}
                                    onClick={() => handleStatutUpdate(f.id, s)}
                                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                      f.statut === s ? "opacity-40 cursor-default border-border" : "hover:bg-muted border-border"
                                    }`}
                                  >
                                    {STATUT_CFG[s]?.label ?? s}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</p>
                              <div className="flex flex-col gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleDownload(f.id)} disabled={downloading === f.id}>
                                  <DownloadIcon className="w-4 h-4 mr-2" />Télécharger PDF
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => { setEmailTarget(f); setEmailAddr(f.client_email ?? ""); setEmailMsg(null); }}>
                                  <MailIcon className="w-4 h-4 mr-2" />Envoyer au client
                                </Button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
