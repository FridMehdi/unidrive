"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2Icon, RefreshCwIcon } from "lucide-react";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { TrendingUpIcon, UsersIcon, CarIcon, BanknoteIcon } from "lucide-react";
import { missionApi, chauffeurApi, clientApi, billingApi, type Mission, type Chauffeur, type Client, type BillingStats } from "@/lib/api";

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899"];

export default function Statistiques() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [billingStats, setBillingStats] = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ms, ch, cl, bs] = await Promise.allSettled([
        missionApi.list({ limit: 1000 }),
        chauffeurApi.list({ limit: 500 }),
        clientApi.list({ limit: 500 }),
        billingApi.stats(),
      ]);
      if (ms.status === "fulfilled") setMissions(ms.value.data ?? []);
      if (ch.status === "fulfilled") setChauffeurs(ch.value.data ?? []);
      if (cl.status === "fulfilled") setClients(cl.value.data ?? []);
      if (bs.status === "fulfilled") setBillingStats(bs.value);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const now = new Date();
  const caTotal = billingStats?.total_ttc ?? 0;
  const caCeMois = billingStats ? Number(billingStats.paiements_mois?.total_encaisse ?? 0) : 0;
  const missionsTerminees = missions.filter((m) => m.statut === "terminée" || m.statut === "facturée" || m.statut === "validée").length;
  const chActifs = chauffeurs.filter((c) => c.statut === "actif" || c.statut === "en_mission").length;

  const kpis = [
    { label: "CA total", value: `${Number(caTotal).toLocaleString("fr-FR")} €`, icon: BanknoteIcon, color: "#3b82f6", bg: "#3b82f618" },
    { label: "CA ce mois", value: `${Number(caCeMois).toLocaleString("fr-FR")} €`, icon: TrendingUpIcon, color: "#22c55e", bg: "#22c55e18" },
    { label: "Missions terminées", value: missionsTerminees.toString(), icon: CarIcon, color: "#8b5cf6", bg: "#8b5cf618" },
    { label: "Chauffeurs actifs", value: chActifs.toString(), icon: UsersIcon, color: "#f59e0b", bg: "#f59e0b18" },
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

  // Stats par chauffeur (top 8)
  const statsParChauffeur = chauffeurs
    .map((c) => {
      const ms = missions.filter((m) => m.chauffeur_id === c.id);
      const ca = ms.reduce((s, m) => s + Number(m.montant ?? 0), 0);
      return { chauffeur: `${c.first_name} ${c.last_name}`.trim() || c.email || c.id, missions: ms.length, ca: Math.round(ca) };
    })
    .filter((x) => x.missions > 0)
    .sort((a, b) => b.ca - a.ca)
    .slice(0, 8);

  // Stats par client (top 8)
  const statsParClient = clients
    .map((c) => {
      const ms = missions.filter((m) => m.client_id === c.id);
      const ca = ms.reduce((s, m) => s + Number(m.montant ?? 0), 0);
      const label = c.type === "entreprise"
        ? (c.raison_sociale ?? c.nom_contact ?? c.email ?? c.id)
        : `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || c.email || c.id;
      return { client: label, missions: ms.length, ca: Math.round(ca) };
    })
    .filter((x) => x.missions > 0)
    .sort((a, b) => b.ca - a.ca)
    .slice(0, 8);

  // Répartition par statut
  const statutCounts = missions.reduce<Record<string, number>>((acc, m) => {
    acc[m.statut] = (acc[m.statut] ?? 0) + 1;
    return acc;
  }, {});
  const statutPie = Object.entries(statutCounts).map(([name, value]) => ({ name, value }));

  const statutLabels: Record<string, string> = {
    terminée: "Terminée", facturée: "Facturée", validée: "Validée",
    en_cours: "En cours", planifiée: "Planifiée", acceptée: "Acceptée", annulée: "Annulée",
  };

  return (
    <>
      <div className="w-full sticky top-0 z-50 bg-white dark:bg-neutral-950 flex-shrink-0 flex flex-row h-16 items-center px-6 border-b border-neutral-200 dark:border-neutral-800 justify-between">
        <div>
          <h1 className="text-lg font-bold">Statistiques</h1>
          <p className="text-xs text-muted-foreground">Analyse de performance — données réelles</p>
        </div>
        <Button variant="ghost" size="icon" onClick={load} disabled={loading}>
          <RefreshCwIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1 h-64">
          <Loader2Icon className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="max-w-7xl w-full mx-auto p-6 space-y-6">

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((k) => (
              <Card key={k.label} className="border-none shadow-sm p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: k.bg }}>
                  <k.icon className="w-5 h-5" style={{ color: k.color }} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <p className="text-xl font-bold">{k.value}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* CA mensuel */}
          <Card className="border-none shadow-sm p-6">
            <h2 className="font-semibold mb-4">Chiffre d'affaires mensuel (12 derniers mois)</h2>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={caMensuel}>
                <defs>
                  <linearGradient id="gCA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => v >= 1000 ? `${v / 1000}k€` : `${v}€`} />
                <Tooltip formatter={(v: number | undefined) => [`${(v ?? 0).toLocaleString("fr-FR")} €`, "CA"]} />
                <Area type="monotone" dataKey="ca" name="CA" stroke="#3b82f6" fill="url(#gCA)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Stats par chauffeur */}
            <Card className="border-none shadow-sm p-6">
              <h2 className="font-semibold mb-4">Performance par chauffeur (top 8)</h2>
              {statsParChauffeur.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune donnée</p>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(180, statsParChauffeur.length * 38)}>
                  <BarChart data={statsParChauffeur} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="chauffeur" tick={{ fontSize: 11 }} width={100} />
                    <Tooltip formatter={(v: number | undefined, name: string | undefined) => [name === "ca" ? `${(v ?? 0).toLocaleString("fr-FR")} €` : (v ?? 0), name === "ca" ? "CA (€)" : "Missions"]} />
                    <Legend />
                    <Bar dataKey="missions" name="Missions" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="ca" name="CA (€)" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Stats par client */}
            <Card className="border-none shadow-sm p-6">
              <h2 className="font-semibold mb-4">Top clients par CA (top 8)</h2>
              {statsParClient.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune donnée</p>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(180, statsParClient.length * 38)}>
                  <BarChart data={statsParClient} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}€`} />
                    <YAxis type="category" dataKey="client" tick={{ fontSize: 11 }} width={110} />
                    <Tooltip formatter={(v: number | undefined) => [`${(v ?? 0).toLocaleString("fr-FR")} €`, "CA"]} />
                    <Bar dataKey="ca" name="CA" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {/* Répartition statuts */}
          {statutPie.length > 0 && (
            <Card className="border-none shadow-sm p-6">
              <h2 className="font-semibold mb-4">Répartition des missions par statut</h2>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <ResponsiveContainer width={220} height={220}>
                  <PieChart>
                    <Pie data={statutPie} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                      {statutPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number | undefined, name: string | undefined) => [(v ?? 0), statutLabels[name ?? ""] ?? (name ?? "")]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3">
                  {statutPie.map((s, i) => (
                    <div key={s.name} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground">{statutLabels[s.name] ?? s.name}</span>
                      <span className="font-semibold">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

        </div>
      )}
    </>
  );
}

