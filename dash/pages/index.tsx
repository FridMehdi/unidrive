"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUpIcon, TrendingDownIcon, CarIcon, NavigationIcon, UsersIcon, AlertTriangleIcon, PlusIcon, BanknoteIcon, Loader2Icon, RefreshCwIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { missionApi, chauffeurApi, clientApi, billingApi, type Mission, type Chauffeur, type BillingStats } from "@/lib/api";

const statutConfig: Record<string, { label: string; color: string; bg: string }> = {
  terminée:   { label: "Terminée",   color: "#22c55e", bg: "#22c55e20" },
  facturée:   { label: "Facturée",   color: "#10b981", bg: "#10b98120" },
  validée:    { label: "Validée",    color: "#3b82f6", bg: "#3b82f620" },
  en_cours:   { label: "En cours",   color: "#6366f1", bg: "#6366f120" },
  planifiée:  { label: "Planifiée",  color: "#f59e0b", bg: "#f59e0b20" },
  acceptée:   { label: "Acceptée",   color: "#8b5cf6", bg: "#8b5cf620" },
  annulée:    { label: "Annulée",    color: "#ef4444", bg: "#ef444420" },
};

function mClientLabel(m: Mission): string {
  return (m as unknown as Record<string, string>).client_nom
    ?? (m as unknown as Record<string, string>).client_name
    ?? m.client_id ?? "—";
}
function mChauffeurLabel(m: Mission): string {
  return (m as unknown as Record<string, string>).chauffeur_nom
    ?? (m as unknown as Record<string, string>).chauffeur_name
    ?? (m.chauffeur_id ? "Chauffeur" : "Non assigné");
}
function mTrajet(m: Mission): string {
  const dep = m.adresse_depart ?? "";
  const arr = m.adresse_arrivee ?? "";
  if (!dep && !arr) return "—";
  return `${dep.split(",")[0]} → ${arr.split(",")[0]}`;
}

export default function Dashboard() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [clientCount, setClientCount] = useState(0);
  const [billingStats, setBillingStats] = useState<BillingStats | null>(null);
  const [chauffeurAlerts, setChauffeurAlerts] = useState<Chauffeur[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ms, ch, cl, bs, alerts] = await Promise.allSettled([
        missionApi.list({ limit: 500 }),
        chauffeurApi.list({ limit: 200 }),
        clientApi.list({ limit: 1 }),
        billingApi.stats(),
        chauffeurApi.alertes(),
      ]);
      if (ms.status === "fulfilled") setMissions(ms.value.data ?? []);
      if (ch.status === "fulfilled") setChauffeurs(ch.value.data ?? []);
      if (cl.status === "fulfilled") setClientCount(cl.value.pagination?.total ?? cl.value.data?.length ?? 0);
      if (bs.status === "fulfilled") setBillingStats(bs.value);
      if (alerts.status === "fulfilled") setChauffeurAlerts(alerts.value ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const now = new Date();
  const missionsDuJour = missions.filter((m) => {
    if (!m.date_depart) return false;
    const d = new Date(m.date_depart);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  });
  const missionsCeMois = missions.filter((m) => {
    if (!m.date_depart) return false;
    const d = new Date(m.date_depart);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const chActifs = chauffeurs.filter((c) => c.statut === "actif" || c.statut === "en_mission").length;
  const caTotal = billingStats?.total_ttc ?? 0;
  const caCeMois = billingStats ? Number(billingStats.paiements_mois?.total_encaisse ?? 0) : 0;
  const facturesAttente = billingStats?.factures?.filter((f) => f.statut === "en_attente").length ?? 0;

  const kpis = [
    { title: "CA total", value: `${Number(caTotal).toLocaleString("fr-FR")} €`, icon: BanknoteIcon, color: "#3b82f6", sub: `${Number(caCeMois).toLocaleString("fr-FR")} € ce mois`, trend: "up" as const },
    { title: "Missions totales", value: missions.length.toString(), icon: NavigationIcon, color: "#6366f1", sub: `${missionsDuJour.length} aujourd'hui`, trend: "up" as const },
    { title: "Chauffeurs actifs", value: chActifs.toString(), icon: CarIcon, color: "#f59e0b", sub: `${chauffeurs.length} au total`, trend: chActifs > 0 ? "up" as const : "down" as const },
    { title: "Clients", value: clientCount.toString(), icon: UsersIcon, color: "#22c55e", sub: `${facturesAttente} factures en attente`, trend: "up" as const },
  ];

  // CA par mois — 12 derniers mois
  const caMensuel = (() => {
    const map: Record<string, number> = {};
    for (const m of missions) {
      if (!m.date_depart || !m.montant) continue;
      const d = new Date(m.date_depart);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[k] = (map[k] ?? 0) + Number(m.montant);
    }
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return { mois: k.slice(5) + "/" + k.slice(2, 4), ca: Math.round(map[k] ?? 0) };
    });
  })();

  // Missions 7 derniers jours
  const missionsHebdo = (() => {
    const jours = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    for (const m of missions) {
      if (!m.date_depart) continue;
      const d = new Date(m.date_depart);
      const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
      if (diff >= 0 && diff < 7) counts[(d.getDay() + 6) % 7]++;
    }
    return jours.map((j, i) => ({ jour: j, count: counts[i] }));
  })();

  const missionsRecentes = [...missions]
    .sort((a, b) => new Date(b.date_depart ?? 0).getTime() - new Date(a.date_depart ?? 0).getTime())
    .slice(0, 8);

  return (
    <>
      <div className="w-full sticky top-0 z-50 bg-white dark:bg-neutral-950 flex-shrink-0 flex flex-row h-16 items-center px-6 border-b border-neutral-200 dark:border-neutral-800 justify-between">
        <div>
          <h1 className="text-lg font-bold">Tableau de bord</h1>
          <p className="text-xs text-muted-foreground capitalize">{todayStr}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={load} disabled={loading}>
            <RefreshCwIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Link href="/missions">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1">
              <PlusIcon className="w-4 h-4" /> Nouvelle mission
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1 h-64">
          <Loader2Icon className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="max-w-7xl w-full mx-auto flex-1 p-6 space-y-4">

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {kpis.map((kpi) => (
              <Card key={kpi.title} className="p-5 border-none shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${kpi.color}18` }}>
                    <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{kpi.title}</p>
                </div>
                <p className="text-2xl font-bold mb-1">{kpi.value}</p>
                <div className="flex items-center gap-1 text-xs">
                  {kpi.trend === "up" ? <TrendingUpIcon className="w-3 h-3 text-green-500" /> : <TrendingDownIcon className="w-3 h-3 text-red-500" />}
                  <span className="text-muted-foreground">{kpi.sub}</span>
                </div>
              </Card>
            ))}
          </div>

          {/* Compteurs */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Aujourd'hui", value: missionsDuJour.length, color: "#22c55e" },
              { label: "Ce mois", value: missionsCeMois.length, color: "#3b82f6" },
              { label: "Total", value: missions.length, color: "#8b5cf6" },
            ].map((item) => (
              <Card key={item.label} className="p-4 border-none shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${item.color}20` }}>
                    <NavigationIcon className="w-4 h-4" style={{ color: item.color }} />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                </div>
                <span className="text-xl font-bold" style={{ color: item.color }}>{item.value}</span>
              </Card>
            ))}
          </div>

          {/* Graphiques */}
          <div className="grid md:grid-cols-2 gap-3">
            <Card className="p-5 border-none shadow-sm">
              <div className="mb-4">
                <h2 className="text-sm font-semibold">CA mensuel (€)</h2>
                <p className="text-xs text-muted-foreground">12 derniers mois</p>
              </div>
              <div className="w-full h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={caMensuel} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                    <XAxis dataKey="mois" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <Tooltip formatter={(v: number | undefined) => [`${(v ?? 0).toLocaleString("fr-FR")} €`, "CA"]} />
                    <Area type="monotone" dataKey="ca" stroke="#3b82f6" strokeWidth={2} fill="url(#colorCA)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5 border-none shadow-sm">
              <div className="mb-4">
                <h2 className="text-sm font-semibold">Missions cette semaine</h2>
                <p className="text-xs text-muted-foreground">Par jour</p>
              </div>
              <div className="w-full h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={missionsHebdo} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                    <XAxis dataKey="jour" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis hide allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="Missions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Missions récentes + Chauffeurs */}
          <div className="grid md:grid-cols-2 gap-3">
            <Card className="border-none shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <h2 className="text-sm font-semibold">Missions récentes</h2>
                <Link href="/missions" className="text-xs text-blue-500 hover:underline">Voir tout →</Link>
              </div>
              <div>
                {missionsRecentes.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-5 py-4">Aucune mission</p>
                ) : missionsRecentes.map((m) => {
                  const s = statutConfig[m.statut] ?? { label: m.statut, color: "#888", bg: "#88888820" };
                  return (
                    <div key={m.id} className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-mono text-muted-foreground">{String(m.numero ?? m.id).slice(0, 10)}</span>
                          <span className="text-sm font-medium truncate">{mClientLabel(m)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CarIcon className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{mChauffeurLabel(m)} · {mTrajet(m)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-sm font-semibold">{m.montant ? `${Number(m.montant).toLocaleString("fr-FR")} €` : "—"}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: s.color, backgroundColor: s.bg }}>{s.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <h2 className="text-sm font-semibold">Chauffeurs</h2>
                <Link href="/chauffeurs" className="text-xs text-blue-500 hover:underline">Gérer →</Link>
              </div>
              <div>
                {chauffeurs.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-5 py-4">Aucun chauffeur</p>
                ) : chauffeurs.slice(0, 8).map((c) => {
                  const nbMissions = missions.filter((m) => m.chauffeur_id === c.id).length;
                  const nbTerminees = missions.filter((m) => m.chauffeur_id === c.id && (m.statut === "terminée" || m.statut === "facturée")).length;
                  const pct = nbMissions > 0 ? Math.round((nbTerminees / nbMissions) * 100) : 0;
                  const statutColor = c.statut === "actif" ? "#22c55e" : c.statut === "en_mission" ? "#3b82f6" : "#9ca3af";
                  return (
                    <div key={c.id} className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 font-semibold text-sm flex-shrink-0">
                        {(c.first_name?.[0] ?? "") + (c.last_name?.[0] ?? "")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{c.first_name} {c.last_name}</span>
                          <span className="text-xs font-medium" style={{ color: statutColor }}>{c.statut ?? "—"}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-neutral-200 dark:bg-neutral-700 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground flex-shrink-0">{nbMissions} missions</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Alertes documents */}
          {chauffeurAlerts.length > 0 && (
            <Card className="border-none shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangleIcon className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold">Alertes documents ({chauffeurAlerts.length})</h2>
                <Link href="/documents" className="ml-auto text-xs text-blue-500 hover:underline">Voir tout →</Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {chauffeurAlerts.slice(0, 6).map((c) => (
                  <div key={c.id} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                    <AlertTriangleIcon className="w-3.5 h-3.5 flex-shrink-0" />
                    {c.first_name} {c.last_name} — documents à vérifier
                  </div>
                ))}
              </div>
            </Card>
          )}

        </div>
      )}
    </>
  );
}
