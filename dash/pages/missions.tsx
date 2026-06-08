"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { GoogleMap, useJsApiLoader, DirectionsService, DirectionsRenderer, Marker } from "@react-google-maps/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PlusIcon, SearchIcon, CarIcon, MapPinIcon, ClockIcon, Loader2Icon,
  RefreshCwIcon, XIcon, CheckCircleIcon, PencilIcon, CopyIcon, TrashIcon,
  MoreVerticalIcon, ChevronDownIcon, AlertTriangleIcon, ArrowLeftRightIcon,
  UserIcon, RouteIcon, BanknoteIcon, NavigationIcon, FileTextIcon, DownloadIcon,
} from "lucide-react";
import { missionApi, chauffeurApi, clientApi, geoApi, billingApi, documentApi, vehicleApi, tarificationApi, type Mission, type MissionStats, type Chauffeur, type Client, type ChauffeurPosition, type EtaResult, type Vehicle, type Tarification } from "@/lib/api";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { useMandatoryDocs } from "@/hooks/useMandatoryDocs";
import { checkVehicleDocs } from "@/hooks/useMandatoryVehicleDocs";
import { MandatoryDocsBanner } from "@/components/MandatoryDocsBanner";

const GMAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const GMAPS_LIBRARIES: ("places" | "geometry")[] = ["places"];

// ── MissionMap — DirectionsService + DirectionsRenderer ──────────────────────
function MissionMap({ mission, chauffeurId }: { mission: Mission; chauffeurId?: string }) {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: GMAPS_KEY, libraries: GMAPS_LIBRARIES });
  const mapRef = useRef<google.maps.Map | null>(null);

  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [dirRequested, setDirRequested] = useState(false);
  const [eta, setEta]     = useState<EtaResult | null>(null);
  const [livePos, setLivePos] = useState<ChauffeurPosition | null>(null);
  const isActive = mission.statut === "en_cours" || mission.statut === "acceptée";

  // Reset directions when mission changes
  useEffect(() => {
    setDirections(null);
    setDirRequested(false);
  }, [mission.id]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // DirectionsService callback
  const directionsCallback = useCallback(
    (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
      if (status === "OK" && result) {
        setDirections(result);
      }
      setDirRequested(true);
    },
    [],
  );

  // Fetch chauffeur position — always once, poll every 15s if active
  useEffect(() => {
    if (!chauffeurId) return;

    const fetchPos = async () => {
      try {
        // Try latest position for this mission first, fallback to any latest position
        let pos: ChauffeurPosition | null = null;
        try {
          const res = await geoApi.history(chauffeurId, mission.id, 1);
          pos = res.data?.[0] ?? null;
        } catch { /* ignore */ }

        // Fallback: get last known position regardless of mission
        if (!pos) {
          const res2 = await geoApi.history(chauffeurId, undefined, 1);
          pos = res2.data?.[0] ?? null;
        }

        if (pos) {
          setLivePos(pos);
          if (isActive && mission.adresse_arrivee) {
            try {
              const etaRes = await geoApi.eta(`${pos.lat},${pos.lng}`, mission.adresse_arrivee);
              setEta(etaRes.data);
            } catch { /* silent */ }
          }
        }
      } catch { /* silent */ }
    };

    fetchPos();
    if (!isActive) return;
    const id = setInterval(fetchPos, 15_000);
    return () => clearInterval(id);
  }, [isActive, chauffeurId, mission.id, mission.adresse_arrivee]);

  if (!GMAPS_KEY) {
    return (
      <div className="mt-1 h-40 rounded-xl border border-border bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-xs text-muted-foreground">
        NEXT_PUBLIC_GOOGLE_MAPS_API_KEY non configuré
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="mt-1 h-56 rounded-xl border border-border bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center">
        <Loader2Icon className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const canRoute = !!(mission.adresse_depart && mission.adresse_arrivee);

  return (
    <div className="mt-1 rounded-xl overflow-hidden border border-border">
      <GoogleMap
        onLoad={onMapLoad}
        mapContainerStyle={{ width: "100%", height: "240px" }}
        zoom={12}
        center={{ lat: 48.8566, lng: 2.3522 }}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          gestureHandling: "cooperative",
        }}
      >
        {/* Request directions once */}
        {canRoute && !dirRequested && (
          <DirectionsService
            options={{
              origin: mission.adresse_depart!,
              destination: mission.adresse_arrivee!,
              travelMode: google.maps.TravelMode.DRIVING,
            }}
            callback={directionsCallback}
          />
        )}

        {/* Render route + default A/B markers */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: false,
              polylineOptions: {
                strokeColor: "#6366f1",
                strokeWeight: 5,
                strokeOpacity: 0.9,
              },
            }}
          />
        )}

        {/* Live chauffeur marker */}
        {livePos && (
          <Marker
            position={{ lat: livePos.lat, lng: livePos.lng }}
            icon={{
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 7,
              fillColor: "#22c55e",
              fillOpacity: 1,
              strokeColor: "white",
              strokeWeight: 2,
              rotation: livePos.heading ?? 0,
            }}
            title="Chauffeur"
          />
        )}
      </GoogleMap>

      {/* Info bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <NavigationIcon className="w-3.5 h-3.5" />
          <span>
            {livePos
              ? isActive
                ? `🟢 Position live — ${new Date(livePos.recorded_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
                : `Dernière pos. connue — ${new Date(livePos.recorded_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
              : isActive ? "En attente position GPS…" : "Trajet de la mission"}
          </span>
        </div>
        {eta ? (
          <div className="flex items-center gap-3 text-xs">
            <span className="font-semibold text-green-600">{eta.duration_text}</span>
            <span className="text-muted-foreground">{eta.distance_text}</span>
            <span className="text-muted-foreground">
              ETA {new Date(eta.eta_iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ) : directions?.routes?.[0]?.legs?.[0] ? (
          <div className="flex items-center gap-3 text-xs">
            <span className="font-semibold text-indigo-600">{directions.routes[0].legs[0].duration?.text}</span>
            <span className="text-muted-foreground">{directions.routes[0].legs[0].distance?.text}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ── Modal Créer / Éditer Mission ─────────────────────────────────────────────
function MissionModal({
  mode, initial, chauffeurs, clients, chauffeurDocsStatus, vehicles, vehicleDocsStatus, onClose, onSaved,
}: {
  mode: "add" | "edit";
  initial?: Mission;
  chauffeurs: Chauffeur[];
  clients: Client[];
  chauffeurDocsStatus: Record<string, boolean>;
  vehicles: Vehicle[];
  vehicleDocsStatus: Record<string, boolean>;
  onClose: () => void;
  onSaved: (m: Mission) => void;
}) {
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [autoCalc, setAutoCalc]       = useState(false);
  const [filterTypeChauffeur, setFilterTypeChauffeur] = useState<"tous" | "interne" | "independant">("tous");
  const [tarifs, setTarifs]           = useState<Tarification[]>([]);

  // Charger les tarifs actifs au montage
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
    adresse_depart:      initial?.adresse_depart      ?? "",
    adresse_arrivee:     initial?.adresse_arrivee     ?? "",
    date_depart:         toLocal(initial?.date_depart),
    date_arrivee_prevue: toLocal(initial?.date_arrivee_prevue),
    client_id:           initial?.client_id           ?? "",
    nombre_passagers:    initial?.nombre_passagers != null ? String(initial.nombre_passagers) : "1",
    chauffeur_id:        initial?.chauffeur_id        ?? "",
    voiture_id:          initial?.voiture_id          ?? "",
    tarif_id:            initial?.tarif_id            ?? "",
    montant:             initial?.montant != null ? String(initial.montant) : "",
    prix_achat_chauffeur: initial?.prix_achat_chauffeur != null ? String(initial.prix_achat_chauffeur) : "",
    distance_km:         initial?.distance_km != null ? String(initial.distance_km) : "",
    duree_minutes:       initial?.duree_minutes != null ? String(initial.duree_minutes) : "",
    statut:              initial?.statut              ?? "planifiée",
    notes:               initial?.notes               ?? "",
  });

  // Auto-calculate distance + montant when both addresses are filled
  useEffect(() => {
    if (!form.adresse_depart || !form.adresse_arrivee) return;
    const t = setTimeout(async () => {
      setCalcLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'https://api.u-drive.ai'}/api/geo/distance?origin=${encodeURIComponent(form.adresse_depart)}&destination=${encodeURIComponent(form.adresse_arrivee)}`, {
          headers: {
            'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('vtc_token') : ''}`,
            'Content-Type': 'application/json'
          }
        });
        if (!res.ok) return;
        const data = await res.json();
        
        // Si un tarif est sélectionné, utiliser l'API de tarification pour calculer le montant
        let montantCalc = "0.00";
        if (form.tarif_id) {
          try {
            const calcRes = await tarificationApi.calculate(
              form.tarif_id,
              data.distance_km,
              data.duree_minutes
            );
            montantCalc = String(calcRes.montant_total.toFixed(2));
          } catch {
            // Fallback au calcul simple si erreur API
            const selectedClient = clients.find((c) => String(c.id) === String(form.client_id));
            const tarifKm = selectedClient?.tarif_special && selectedClient.tarif_special > 0
              ? selectedClient.tarif_special
              : 5;
            montantCalc = String((Math.round(data.distance_km * tarifKm * 100) / 100).toFixed(2));
          }
        } else {
          // Utiliser tarif_special du client si disponible, sinon 5 €/km par défaut
          const selectedClient = clients.find((c) => String(c.id) === String(form.client_id));
          const tarifKm = selectedClient?.tarif_special && selectedClient.tarif_special > 0
            ? selectedClient.tarif_special
            : 5;
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

  // Réinitialiser voiture_id quand on change de chauffeur
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
      if (form.nombre_passagers)     payload.nombre_passagers    = parseInt(form.nombre_passagers);
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
                  type="datetime-local"
                  className={inputCls}
                  value={form.date_arrivee_prevue}
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
                <select className={inputCls} value={form.client_id} onChange={set("client_id")}>
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

          {/* Filtre Type Chauffeur */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Type de chauffeur</label>
            <select 
              className={inputCls} 
              value={filterTypeChauffeur} 
              onChange={(e) => setFilterTypeChauffeur(e.target.value as "tous" | "interne" | "independant")}
            >
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
                    // Filtrer par type
                    if (filterTypeChauffeur === "interne" && c.type_chauffeur !== "interne") return false;
                    if (filterTypeChauffeur === "independant" && c.type_chauffeur !== "independant") return false;
                    // Pour les indépendants, ne montrer QUE ceux qui sont "Connectés" (approuvés)
                    if (c.type_chauffeur === "independant" && c.statut_approbation !== "approuve") return false;
                    return true;
                  })
                  .sort((a, b) => {
                    const score = (c: Chauffeur) => c.disponible ? 0 : c.statut === "en_mission" ? 1 : 2;
                    return score(a) - score(b);
                  })
                  .map((c) => {
                    const badge = c.disponible ? "🟢" : c.statut === "en_mission" ? "🔵" : c.statut === "suspendu" ? "🔴" : "⚪";
                    const isInterne = c.type_chauffeur === 'interne';
                    const hasDocuments = chauffeurDocsStatus[c.id] !== false;
                    // Vérifier si le véhicule assigné au chauffeur a tous ses documents
                    const vehicle = vehicles.find((v) => v.chauffeur_id === c.id);
                    const hasVehicleDocs = vehicle ? vehicleDocsStatus[vehicle.id] !== false : true;
                    const isDisabled = isInterne && (!hasDocuments || !hasVehicleDocs);
                    const warningMsg = !hasDocuments ? ' ⚠ DOCS CHAUFFEUR MANQUANTS' : !hasVehicleDocs ? ' ⚠ DOCS VEHICULE MANQUANTS' : '';
                    return (
                      <option key={c.id} value={c.id} disabled={isDisabled}>
                        {badge} {c.first_name} {c.last_name}{c.type_chauffeur === 'independant' ? ' (indépendant)' : ''}{isDisabled ? warningMsg : ''}{c.phone ? ` · ${c.phone}` : ""}
                      </option>
                    );
                  })}
              </select>
              {form.chauffeur_id && (() => {
                const chauffeur = chauffeurs.find((c) => c.id === form.chauffeur_id);
                if (!chauffeur || chauffeur.type_chauffeur !== 'interne') return null;
                const hasDocuments = chauffeurDocsStatus[form.chauffeur_id] !== false;
                const vehicle = vehicles.find((v) => v.chauffeur_id === form.chauffeur_id);
                const hasVehicleDocs = vehicle ? vehicleDocsStatus[vehicle.id] !== false : true;
                if (!hasDocuments) {
                  return (
                    <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                      <AlertTriangleIcon className="w-3 h-3" />
                      Ce chauffeur n&apos;a pas tous ses documents obligatoires
                    </p>
                  );
                }
                if (!hasVehicleDocs) {
                  return (
                    <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                      <AlertTriangleIcon className="w-3 h-3" />
                      Le véhicule assigné à ce chauffeur n&apos;a pas tous ses documents obligatoires
                    </p>
                  );
                }
                return null;
              })()}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Véhicule</label>
              <select 
                className={inputCls} 
                value={form.voiture_id} 
                onChange={set("voiture_id")}
                disabled={!form.chauffeur_id}
              >
                <option value="">— Non assigné —</option>
                {form.chauffeur_id && (() => {
                  const selectedChauffeur = chauffeurs.find((c) => c.id === form.chauffeur_id);
                  if (!selectedChauffeur) return null;
                  
                  // Filtrer les véhicules selon le type de chauffeur
                  const availableVehicles = vehicles.filter((v) => {
                    if (selectedChauffeur.type_chauffeur === 'interne') {
                      // Chauffeur interne : véhicules de la flotte (agency)
                      return v.owner_type === 'agency' || !v.owner_type;
                    } else {
                      // Chauffeur indépendant : ses propres véhicules
                      return v.owner_type === 'chauffeur' && v.owner_id === selectedChauffeur.id;
                    }
                  });
                  
                  return availableVehicles.map((v) => {
                    const hasVehicleDocs = vehicleDocsStatus[v.id] !== false;
                    const isDisabled = !hasVehicleDocs;
                    return (
                      <option key={v.id} value={v.id} disabled={isDisabled}>
                        {v.marque} {v.modele} · {v.immat}{isDisabled ? ' ⚠ DOCS MANQUANTS' : ''}
                      </option>
                    );
                  });
                })()}
              </select>
              {!form.chauffeur_id && (
                <p className="text-xs text-muted-foreground mt-1.5">Sélectionnez d'abord un chauffeur</p>
              )}
              {form.voiture_id && vehicleDocsStatus[form.voiture_id] === false && (
                <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                  <AlertTriangleIcon className="w-3 h-3" />
                  Ce véhicule n&apos;a pas tous ses documents obligatoires
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

          {/* Infos tarifaires */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tarification</p>
              {calcLoading && <span className="text-xs text-blue-500 animate-pulse">Calcul en cours…</span>}
              {autoCalc && !calcLoading && <span className="text-xs text-green-600 bg-green-50 rounded px-2 py-0.5">✓ Calculé auto</span>}
            </div>
            {/* Sélecteur de tarif */}
            <div className="mb-3">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Grille tarifaire</label>
              <select className={inputCls} value={form.tarif_id} onChange={(e) => { setAutoCalc(false); setForm((p) => ({ ...p, tarif_id: e.target.value })); }}>
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
                <input type="number" min="0" step="0.1" className={inputCls} value={form.distance_km} onChange={(e) => { setAutoCalc(false); setForm((p) => ({ ...p, distance_km: e.target.value })); }} placeholder="32.5" />
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
            <textarea value={form.notes} onChange={set("notes")} rows={2} placeholder="Instructions particulières..."
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

// ── Confirm Delete ────────────────────────────────────────────────────────────
function ConfirmDelete({ mission, onClose, onDeleted }: {
  mission: Mission; onClose: () => void; onDeleted: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const go = async () => {
    setLoading(true);
    try { await missionApi.remove(mission.id); onDeleted(mission.id); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Erreur"); setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangleIcon className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Supprimer la mission</h3>
            <p className="text-xs text-muted-foreground">N° {mission.numero ?? mission.id.slice(0, 8)} — cette action est irréversible.</p>
          </div>
        </div>
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

// ── Portal dropdown helper ────────────────────────────────────────────────────
function usePortalPos(open: boolean, btnRef: React.RefObject<HTMLButtonElement | null>) {
  const [pos, setPos] = useState({ top: 0, left: 0, right: 0 });
  useEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX, right: window.innerWidth - r.right - window.scrollX });
  }, [open, btnRef]);
  return pos;
}

// ── Actions Menu ──────────────────────────────────────────────────────────────
function ActionsMenu({ onEdit, onDuplicate, onDelete }: {
  onEdit: () => void; onDuplicate: () => void; onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef  = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pos = usePortalPos(open, btnRef);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      if (menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const menu = open ? createPortal(
    <div ref={menuRef}
      style={{ position: "fixed", top: pos.top, right: pos.right, zIndex: 9999 }}
      className="bg-white dark:bg-neutral-900 border border-border rounded-xl shadow-xl w-44 py-1"
    >
      <button onClick={() => { setOpen(false); onEdit(); }}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
        <PencilIcon className="w-4 h-4 text-muted-foreground" /> Modifier
      </button>
      <button onClick={() => { setOpen(false); onDuplicate(); }}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
        <CopyIcon className="w-4 h-4 text-muted-foreground" /> Dupliquer
      </button>
      <div className="border-t border-border my-1" />
      <button onClick={() => { setOpen(false); onDelete(); }}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
        <TrashIcon className="w-4 h-4" /> Supprimer
      </button>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button ref={btnRef} onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-muted-foreground transition-colors">
        <MoreVerticalIcon className="w-4 h-4" />
      </button>
      {menu}
    </>
  );
}

// ── Mission Detail Modal ─────────────────────────────────────────────────────
const STATUT_COLOR: Record<string, string> = {
  planifiée: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  acceptée:  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  en_cours:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  terminée:  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  validée:   "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  facturée:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  annulée:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};
const STATUT_LABEL: Record<string, string> = {
  planifiée: "Planifiée", acceptée: "Acceptée", en_cours: "En cours",
  terminée: "Terminée", validée: "Validée", facturée: "Facturée", annulée: "Annulée",
};

function MissionDetailModal({ mission, chauffeurMap, clientMap, onClose, onEdit }: {
  mission: Mission;
  chauffeurMap: Record<string, string>;
  clientMap: Record<string, string>;
  onClose: () => void;
  onEdit: () => void;
}) {
  const [bon, setBon] = useState<{ id: string; numero: string; statut: string; pdf_url?: string } | null>(null);
  const [bonLoading, setBonLoading] = useState(false);
  const [bonDownloading, setBonDownloading] = useState(false);
  const [factures, setFactures] = useState<{ id: string; numero: string; type_facture: string; montant_ttc: number; statut: string; pdf_url?: string }[]>([]);
  const [facturesLoading, setFacturesLoading] = useState(false);
  const [downloadingFacture, setDownloadingFacture] = useState<string | null>(null);

  const fmt = (iso?: string | null, opts?: Intl.DateTimeFormatOptions) =>
    iso ? new Date(iso).toLocaleString("fr-FR", opts ?? { dateStyle: "long", timeStyle: "short" }) : "—";

  const chauffeurName = mission.chauffeur_id ? (chauffeurMap[mission.chauffeur_id] ?? "—") : "—";
  const clientName    = mission.client_id    ? (clientMap[mission.client_id]    ?? "—") : "—";
  const statCls = STATUT_COLOR[mission.statut] ?? "bg-neutral-100 text-neutral-700";

  // Charger le bon de mission au montage
  useEffect(() => {
    setBonLoading(true);
    billingApi.getBonByMission(mission.id)
      .then((res) => setBon(res.data))
      .catch(() => setBon(null))
      .finally(() => setBonLoading(false));
  }, [mission.id]);

  // Charger les factures au montage
  useEffect(() => {
    setFacturesLoading(true);
    billingApi.getFacturesByMission(mission.id)
      .then((res) => setFactures(res.data || []))
      .catch(() => setFactures([]))
      .finally(() => setFacturesLoading(false));
  }, [mission.id]);

  const handleBonDownload = async () => {
    if (!bon) return;
    setBonDownloading(true);
    try {
      const { url } = await billingApi.getBonDownload(bon.id);
      window.open(url, "_blank");
    } catch {
      alert("Impossible de télécharger le bon de mission");
    } finally {
      setBonDownloading(false);
    }
  };

  const handleFactureDownload = async (factureId: string) => {
    setDownloadingFacture(factureId);
    try {
      const { url } = await billingApi.getFactureDownload(factureId);
      window.open(url, "_blank");
    } catch {
      alert("Impossible de télécharger la facture");
    } finally {
      setDownloadingFacture(null);
    }
  };

  const Row = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm font-medium break-words">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-semibold text-muted-foreground">{mission.numero ?? mission.id.slice(0, 8)}</span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statCls}`}>
              {STATUT_LABEL[mission.statut] ?? mission.statut}
            </span>
          </div>
          <button onClick={onClose}><XIcon className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="px-6 py-4 space-y-0">
          {/* Trajet */}
          <div className="py-3 border-b border-border">
            <div className="flex items-center gap-2 mb-3">
              <RouteIcon className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Trajet</p>
            </div>
            <div className="flex gap-3">
              <div className="flex flex-col items-center gap-1 pt-1">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
                <div className="w-px flex-1 min-h-[24px] bg-border" />
                <MapPinIcon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Départ</p>
                  <p className="text-sm font-medium">{mission.adresse_depart ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Arrivée</p>
                  <p className="text-sm font-medium">{mission.adresse_arrivee ?? "—"}</p>
                </div>
              </div>
            </div>
            {/* Map */}
            <div className="mt-4">
              <MissionMap mission={mission} chauffeurId={mission.chauffeur_id ?? undefined} />
            </div>
          </div>

          <Row icon={<ClockIcon className="w-4 h-4 text-muted-foreground" />} label="Date / heure de départ" value={fmt(mission.date_depart)} />
          {mission.date_arrivee_prevue && (
            <Row icon={<ClockIcon className="w-4 h-4 text-muted-foreground" />} label="Arrivée prévue" value={fmt(mission.date_arrivee_prevue)} />
          )}
          <Row icon={<CarIcon className="w-4 h-4 text-muted-foreground" />} label="Chauffeur" value={chauffeurName} />
          <Row icon={<UserIcon className="w-4 h-4 text-muted-foreground" />} label="Client" value={clientName} />
          {mission.nombre_passagers != null && (
            <Row icon={<UserIcon className="w-4 h-4 text-muted-foreground" />} label="Passagers" value={`${mission.nombre_passagers} passager(s)`} />
          )}

          {/* Tarification */}
          <div className="pt-3 border-b border-border pb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Tarification</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Montant client",    value: mission.montant             != null ? `${Number(mission.montant).toFixed(2)} €`             : "—" },
                { label: "Prix achat chauffeur", value: mission.prix_achat_chauffeur != null ? `${Number(mission.prix_achat_chauffeur).toFixed(2)} €` : "—" },
                { label: "Distance",          value: mission.distance_km         != null ? `${Number(mission.distance_km).toFixed(1)} km`         : "—" },
                { label: "Durée estimée",     value: mission.duree_minutes       != null ? `${mission.duree_minutes} min`                        : "—" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className="text-sm font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bon de mission */}
          <div className="pt-3 border-b border-border pb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Bon de mission</p>
            {bonLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2Icon className="w-4 h-4 animate-spin" />
                <span>Chargement...</span>
              </div>
            ) : bon ? (
              <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <FileTextIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">{bon.numero}</p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 capitalize">{bon.statut.replace('_', ' ')}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={handleBonDownload}
                  disabled={bonDownloading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                >
                  <DownloadIcon className="w-3.5 h-3.5" />
                  {bonDownloading ? 'Téléchargement...' : 'Télécharger PDF'}
                </Button>
              </div>
            ) : (
              <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 text-center text-sm text-muted-foreground">
                Aucun bon de mission généré pour cette mission
              </div>
            )}
          </div>

          {/* Factures */}
          <div className="pt-3 border-b border-border pb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Factures</p>
            {facturesLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2Icon className="w-4 h-4 animate-spin" />
                <span>Chargement...</span>
              </div>
            ) : factures.length > 0 ? (
              <div className="space-y-2">
                {factures.map((facture) => (
                  <div 
                    key={facture.id} 
                    className={`rounded-xl p-4 flex items-center justify-between ${
                      facture.type_facture === 'client' 
                        ? 'bg-emerald-50 dark:bg-emerald-950/30' 
                        : 'bg-amber-50 dark:bg-amber-950/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        facture.type_facture === 'client'
                          ? 'bg-emerald-500/10'
                          : 'bg-amber-500/10'
                      }`}>
                        <BanknoteIcon className={`w-5 h-5 ${
                          facture.type_facture === 'client'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`} />
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${
                          facture.type_facture === 'client'
                            ? 'text-emerald-900 dark:text-emerald-100'
                            : 'text-amber-900 dark:text-amber-100'
                        }`}>
                          {facture.numero}
                        </p>
                        <p className={`text-xs ${
                          facture.type_facture === 'client'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {facture.type_facture === 'client' ? 'Facture Client' : 'Facture Chauffeur'} • {Number(facture.montant_ttc).toFixed(2)} €
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleFactureDownload(facture.id)}
                      disabled={downloadingFacture === facture.id}
                      className={`gap-1.5 ${
                        facture.type_facture === 'client'
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : 'bg-amber-600 hover:bg-amber-700'
                      } text-white`}
                    >
                      <DownloadIcon className="w-3.5 h-3.5" />
                      {downloadingFacture === facture.id ? 'Téléchargement...' : 'PDF'}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 text-center text-sm text-muted-foreground">
                Aucune facture générée pour cette mission
              </div>
            )}
          </div>

          {mission.notes && (
            <Row icon={<PencilIcon className="w-4 h-4 text-muted-foreground" />} label="Notes" value={mission.notes} />
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose}>Fermer</Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { onClose(); onEdit(); }}>
            <PencilIcon className="w-4 h-4 mr-1.5" /> Modifier
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Duplicate Modal ───────────────────────────────────────────────────────────
function DuplicateModal({ source, chauffeurs, clients, vehicles, vehicleDocsStatus, chauffeurDocsStatus, onClose, onCreated }: {
  source: Mission; chauffeurs: Chauffeur[]; clients: Client[]; vehicles: Vehicle[]; vehicleDocsStatus: Record<string, boolean>; chauffeurDocsStatus: Record<string, boolean>; onClose: () => void; onCreated: (m: Mission) => void;
}) {
  const toLocal = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const [depart,   setDepart]   = useState(source.adresse_depart ?? "");
  const [arrivee,  setArrivee]  = useState(source.adresse_arrivee ?? "");
  const [date,     setDate]     = useState(toLocal(source.date_depart));
  const [dateArr,  setDateArr]  = useState(toLocal(source.date_arrivee_prevue));
  const [chauffeurId, setChauffeurId] = useState(source.chauffeur_id ?? "");
  const [voitureId, setVoitureId]     = useState(source.voiture_id ?? "");
  const [clientId, setClientId]       = useState(source.client_id ?? "");
  const [saving, setSaving]           = useState(false);
  const [error,  setError]      = useState<string | null>(null);

  const swap = () => { setDepart(arrivee); setArrivee(depart); };

  // Réinitialiser voitureId quand on change de chauffeur
  useEffect(() => {
    setVoitureId("");
  }, [chauffeurId]);

  const inputCls = "w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        adresse_depart: depart, adresse_arrivee: arrivee,
        date_depart: new Date(date).toISOString(), statut: "planifiée",
      };
      if (chauffeurId)  payload.chauffeur_id        = chauffeurId;
      if (voitureId)    payload.voiture_id          = voitureId;
      if (dateArr)      payload.date_arrivee_prevue = new Date(dateArr).toISOString();
      if (clientId)                             payload.client_id            = clientId;
      if (source.montant != null)              payload.montant              = parseFloat(String(source.montant));
      if (source.prix_achat_chauffeur != null) payload.prix_achat_chauffeur = parseFloat(String(source.prix_achat_chauffeur));
      if (source.distance_km != null)          payload.distance_km          = parseFloat(String(source.distance_km));
      if (source.duree_minutes != null)        payload.duree_minutes        = parseInt(String(source.duree_minutes), 10);
      if (source.nombre_passagers != null)     payload.nombre_passagers     = source.nombre_passagers;
      if (source.notes)                        payload.notes                = source.notes;
      const created = await missionApi.create(payload);
      onCreated(created);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur"); setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-semibold text-base">Dupliquer la mission</h2>
            <p className="text-xs text-muted-foreground">N° {source.numero ?? source.id.slice(0,8)}</p>
          </div>
          <button onClick={onClose}><XIcon className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}

          {/* Adresses + swap */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Trajet</p>
              <button type="button" onClick={swap}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                <ArrowLeftRightIcon className="w-3.5 h-3.5" /> Inverser les adresses
              </button>
            </div>
            <div className="space-y-2">
              <AddressAutocomplete
                label="Départ"
                required
                value={depart}
                onChange={setDepart}
                placeholder="Adresse de départ"
              />
              <AddressAutocomplete
                label="Arrivée"
                required
                value={arrivee}
                onChange={setArrivee}
                placeholder="Adresse d'arrivée"
              />
            </div>
          </div>

          {/* Dates */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Dates</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Date/heure de départ *</label>
                <input required type="datetime-local" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Arrivée prévue</label>
                <input type="datetime-local" className={inputCls} value={dateArr} onChange={(e) => setDateArr(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Chauffeur */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Chauffeur</label>
            <select className={inputCls} value={chauffeurId} onChange={(e) => setChauffeurId(e.target.value)}>
              <option value="">— Non assigné —</option>
              {[...chauffeurs]
                .sort((a, b) => (a.disponible ? 0 : 1) - (b.disponible ? 0 : 1))
                .map((c) => {
                  const badge = c.disponible ? "🟢" : c.statut === "en_mission" ? "🔵" : c.statut === "suspendu" ? "🔴" : "⚪";
                  const isInterne = c.type_chauffeur === 'interne';
                  const hasDocuments = chauffeurDocsStatus[c.id] !== false;
                  const vehicle = vehicles.find((v) => v.chauffeur_id === c.id);
                  const hasVehicleDocs = vehicle ? vehicleDocsStatus[vehicle.id] !== false : true;
                  const isDisabled = isInterne && (!hasDocuments || !hasVehicleDocs);
                  const warningMsg = !hasDocuments ? ' ⚠ DOCS CHAUFFEUR MANQUANTS' : !hasVehicleDocs ? ' ⚠ DOCS VEHICULE MANQUANTS' : '';
                  return (
                    <option key={c.id} value={c.id} disabled={isDisabled}>
                      {badge} {c.first_name} {c.last_name}{c.type_chauffeur === 'independant' ? ' (indépendant)' : ''}{isDisabled ? warningMsg : ''}
                    </option>
                  );
                })}
            </select>
          </div>

          {/* Client */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Client</label>
            <select className={inputCls} value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">— Sans client —</option>
              {clients.map((c) => {
                const label = c.raison_sociale || [c.first_name, c.last_name].filter(Boolean).join(" ") || c.id;
                return <option key={c.id} value={c.id}>{label}</option>;
              })}
            </select>
          </div>

          {/* Véhicule */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Véhicule</label>
            <select 
              className={inputCls} 
              value={voitureId} 
              onChange={(e) => setVoitureId(e.target.value)}
              disabled={!chauffeurId}
            >
              <option value="">— Non assigné —</option>
              {chauffeurId && (() => {
                const selectedChauffeur = chauffeurs.find((c) => c.id === chauffeurId);
                if (!selectedChauffeur) return null;
                
                // Filtrer les véhicules selon le type de chauffeur
                const availableVehicles = vehicles.filter((v) => {
                  if (selectedChauffeur.type_chauffeur === 'interne') {
                    // Chauffeur interne : véhicules de la flotte (agency)
                    return v.owner_type === 'agency' || !v.owner_type;
                  } else {
                    // Chauffeur indépendant : ses propres véhicules
                    return v.owner_type === 'chauffeur' && v.owner_id === selectedChauffeur.id;
                  }
                });
                
                return availableVehicles.map((v) => {
                  const hasVehicleDocs = vehicleDocsStatus[v.id] !== false;
                  const isDisabled = !hasVehicleDocs;
                  return (
                    <option key={v.id} value={v.id} disabled={isDisabled}>
                      {v.marque} {v.modele} · {v.immat}{isDisabled ? ' ⚠ DOCS MANQUANTS' : ''}
                    </option>
                  );
                });
              })()}
            </select>
            {!chauffeurId && (
              <p className="text-xs text-muted-foreground mt-1.5">Sélectionnez d'abord un chauffeur</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="h-9 px-4 rounded-lg border border-input text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Annuler</button>
            <button type="submit" disabled={saving}
              className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center gap-1.5 disabled:opacity-60 transition-colors">
              {saving ? <><Loader2Icon className="w-4 h-4 animate-spin" /> Création…</> : <><CopyIcon className="w-4 h-4" /> Créer le doublon</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Transitions autorisées par rôle (miroir du backend) ──────────────────────
const TRANSITIONS: Record<string, Record<string, string[]>> = {
  "planifiée": { chauffeur: ["acceptée"],               gestionnaire: ["annulée"] },
  "acceptée":  { chauffeur: ["en_cours"],               gestionnaire: ["annulée", "planifiée"] },
  "en_cours":  { chauffeur: ["terminée"],               gestionnaire: ["annulée"] },
  "terminée":  { gestionnaire: ["validée", "en_cours"] },
  "validée":   { gestionnaire: ["facturée"] },
  "facturée":  {},
  "annulée":   {},
};

function getRole(): string {
  if (typeof window === "undefined") return "gestionnaire";
  try {
    const token = localStorage.getItem("vtc_token") ?? "";
    const payload = JSON.parse(atob(token.split(".")[1] ?? ""));
    return payload?.role ?? "gestionnaire";
  } catch { return "gestionnaire"; }
}

// ── Inline Statut Selector (role-aware, portal) ───────────────────────────────
function StatutSelector({ mission, onChanged }: { mission: Mission; onChanged: (m: Mission) => void }) {
  const [open, setOpen]             = useState(false);
  const [loading, setLoading]       = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const btnRef = useRef<HTMLButtonElement>(null);
  const pos = usePortalPos(open || showCancel, btnRef);

  useEffect(() => {
    if (!open && !showCancel) return;
    const handler = (e: MouseEvent) => {
      if (btnRef.current && btnRef.current.contains(e.target as Node)) return;
      const portal = document.getElementById("statut-portal-" + mission.id);
      if (portal && portal.contains(e.target as Node)) return;
      setOpen(false); setShowCancel(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, showCancel, mission.id]);

  const role    = getRole();
  const allowed = TRANSITIONS[mission.statut]?.[role] ?? [];
  // Gestionnaire voit tous les statuts (cliquables ou non) ; chauffeur voit seulement les transitions autorisées
  const ALL_STATUTS_LIST = ["planifiée", "acceptée", "en_cours", "terminée", "validée", "facturée", "annulée"];
  const displayList = role === "gestionnaire" ? ALL_STATUTS_LIST : allowed;
  const s       = STATUT[mission.statut] ?? { label: mission.statut, color: "#888", bg: "#88888818" };
  // Le bouton s'ouvre si gestionnaire (toujours, pour voir) ou si chauffeur avec transitions dispo
  const canOpen = role === "gestionnaire" || allowed.length > 0;

  const change = async (next: string) => {
    if (next === "annulée") { setOpen(false); setShowCancel(true); return; }
    setOpen(false); setLoading(true);
    try { 
      const updated = await missionApi.updateStatut(mission.id, next as Mission["statut"]); 
      onChanged(updated);
      
      // Si le statut passe à "facturée", afficher un message de confirmation
      if (next === "facturée") {
        // Créer une notification temporaire
        const notif = document.createElement("div");
        notif.className = "fixed top-4 right-4 z-[10000] bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-xl p-4 shadow-xl animate-in slide-in-from-top-2 duration-300";
        notif.innerHTML = `
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="flex-1">
              <p class="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Factures en cours de génération</p>
              <p class="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                Les factures client et chauffeur sont automatiquement créées.
              </p>
            </div>
          </div>
        `;
        document.body.appendChild(notif);
        setTimeout(() => {
          notif.style.animation = "slide-out-to-top-2 300ms ease-out";
          setTimeout(() => document.body.removeChild(notif), 300);
        }, 5000);
      }
    }
    catch { /* silent */ } finally { setLoading(false); }
  };

  const confirmCancel = async () => {
    setShowCancel(false); setLoading(true);
    try { const updated = await missionApi.updateStatut(mission.id, "annulée", cancelReason || undefined); onChanged(updated); }
    catch { /* silent */ } finally { setLoading(false); setCancelReason(""); }
  };

  const portal = (open || showCancel) ? createPortal(
    <div id={"statut-portal-" + mission.id}
      style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999 }}
    >
      {open && !showCancel && (
        <div className="bg-white dark:bg-neutral-900 border border-border rounded-xl shadow-xl w-48 py-1">
          {displayList.map((st) => {
            const opt = STATUT[st] ?? { label: st, color: "#888" };
            const isCurrent  = st === mission.statut;
            const isAllowed  = allowed.includes(st);
            const isDisabled = !isAllowed && !isCurrent;
            return (
              <button key={st}
                onClick={() => { if (isAllowed) change(st); }}
                disabled={isDisabled}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors
                  ${isCurrent ? "font-semibold bg-neutral-50 dark:bg-neutral-800" : ""}
                  ${isAllowed ? "hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer" : ""}
                  ${isDisabled ? "opacity-35 cursor-not-allowed" : ""}`}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: opt.color }} />
                <span className="flex-1 text-left">{opt.label}</span>
                {isCurrent && <span className="text-[10px] text-muted-foreground">actuel</span>}
              </button>
            );
          })}
        </div>
      )}
      {showCancel && (
        <div className="bg-white dark:bg-neutral-900 border border-border rounded-xl shadow-xl w-64 p-3 space-y-2">
          <p className="text-xs font-semibold text-red-500">Motif d&apos;annulation</p>
          <input autoFocus value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Optionnel"
            className="w-full text-xs border border-border rounded-lg px-2 py-1.5 bg-background outline-none focus:ring-1 focus:ring-red-400"
          />
          <div className="flex gap-2">
            <button onClick={confirmCancel} className="flex-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded-lg py-1.5 font-medium">Confirmer</button>
            <button onClick={() => setShowCancel(false)} className="flex-1 text-xs border border-border rounded-lg py-1.5">Annuler</button>
          </div>
        </div>
      )}
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button ref={btnRef}
        onClick={() => { if (canOpen) setOpen((v) => !v); }}
        disabled={loading}
        className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium transition-all ${canOpen ? "hover:opacity-80 cursor-pointer" : "cursor-default"}`}
        style={{ color: s.color, backgroundColor: s.bg }}>
        {loading ? <Loader2Icon className="w-3 h-3 animate-spin" /> : s.label}
        {canOpen && <ChevronDownIcon className="w-3 h-3 opacity-60" />}
      </button>
      {portal}
    </>
  );
}

const STATUT: Record<string, { label: string; color: string; bg: string }> = {
  "planifiée": { label: "Planifiée",  color: "#f59e0b", bg: "#f59e0b18" },
  "acceptée":  { label: "Acceptée",   color: "#8b5cf6", bg: "#8b5cf618" },
  en_cours:    { label: "En cours",    color: "#3b82f6", bg: "#3b82f618" },
  "terminée":  { label: "Terminée",   color: "#22c55e", bg: "#22c55e18" },
  "validée":   { label: "Validée",     color: "#0ea5e9", bg: "#0ea5e918" },
  "facturée":  { label: "Facturée",   color: "#10b981", bg: "#10b98118" },
  "annulée":   { label: "Annulée",    color: "#ef4444", bg: "#ef444418" },
};

const FILTER_TABS = ["tous", "planifiée", "acceptée", "en_cours", "terminée", "validée", "facturée", "annulée"];

export default function Missions() {
  const [missions, setMissions]             = useState<Mission[]>([]);
  const [stats, setStats]                   = useState<MissionStats | null>(null);
  const [chauffeurs, setChauffeurs]         = useState<Chauffeur[]>([]);
  const [clients, setClients]               = useState<Client[]>([]);
  const [vehicles, setVehicles]             = useState<Vehicle[]>([]);
  const [chauffeurMap, setChauffeurMap]     = useState<Record<string, string>>({});
  const [chauffeurDocsStatus, setChauffeurDocsStatus] = useState<Record<string, boolean>>({});
  const [vehicleDocsStatus, setVehicleDocsStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [search, setSearch]                 = useState("");
  const [filterStatut, setFilterStatut]     = useState("tous");
  const [modal, setModal]                   = useState<"add" | "edit" | null>(null);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [deletingMission, setDeletingMission] = useState<Mission | null>(null);
  const [duplicatingMission, setDuplicatingMission] = useState<Mission | null>(null);
  const [detailMission, setDetailMission]   = useState<Mission | null>(null);
  const [clientMap, setClientMap]           = useState<Record<string, string>>({});
  const { result: mandatoryResult, loading: mandatoryLoading } = useMandatoryDocs();

  const load = async (statut: string) => {
    setLoading(true); setError(null);
    try {
      const [listRes, statsRes, chauffeursRes, clientsRes, vehiclesRes] = await Promise.all([
        missionApi.list({ statut: statut === "tous" ? undefined : statut, limit: 200 }),
        missionApi.stats(),
        chauffeurApi.list({ limit: 200 }),
        clientApi.list({ limit: 200 }),
        vehicleApi.list({ limit: 500 }),
      ]);
      setMissions(listRes.data);
      setStats(statsRes);
      setVehicles(vehiclesRes.data);
      const map: Record<string, string> = {};
      for (const c of chauffeursRes.data) map[c.id] = `${c.first_name} ${c.last_name}${c.type_chauffeur === 'independant' ? ' (indépendant)' : ''}`;
      setChauffeurs(chauffeursRes.data);
      setChauffeurMap(map);
      setClients(clientsRes.data);
      const cliMap: Record<string, string> = {};
      for (const c of clientsRes.data) {
        cliMap[c.id] = c.type === "entreprise"
          ? (c.raison_sociale ?? c.nom_contact ?? c.email ?? c.id)
          : `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || c.email || c.id;
      }
      setClientMap(cliMap);
      
      // Charger le statut des documents pour les chauffeurs internes
      const docsStatusMap: Record<string, boolean> = {};
      await Promise.all(
        chauffeursRes.data
          .filter((c) => c.type_chauffeur === 'interne')
          .map(async (c) => {
            try {
              const check = await documentApi.mandatoryCheck("chauffeur", String(c.id));
              docsStatusMap[String(c.id)] = check.complete;
            } catch {
              docsStatusMap[String(c.id)] = true; // En cas d'erreur, ne pas bloquer
            }
          })
      );
      setChauffeurDocsStatus(docsStatusMap);
      
      // Charger le statut des documents pour les véhicules
      const vehicleDocsStatusMap: Record<string, boolean> = {};
      await Promise.all(
        vehiclesRes.data.map(async (v) => {
          try {
            const check = await checkVehicleDocs(v.id);
            vehicleDocsStatusMap[v.id] = check.complete;
          } catch {
            vehicleDocsStatusMap[v.id] = true; // En cas d'erreur, ne pas bloquer
          }
        })
      );
      setVehicleDocsStatus(vehicleDocsStatusMap);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(filterStatut); }, [filterStatut]); // eslint-disable-line

  const filtered = missions.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const chauffeurName = (chauffeurMap[m.chauffeur_id ?? ""] ?? "").toLowerCase();
    return (
      (m.numero ?? "").toLowerCase().includes(q) ||
      (m.adresse_depart ?? "").toLowerCase().includes(q) ||
      (m.adresse_arrivee ?? "").toLowerCase().includes(q) ||
      chauffeurName.includes(q)
    );
  });

  const handleSaved = (saved: Mission) => {
    setModal(null); setEditingMission(null);
    setMissions((prev) => {
      const idx = prev.findIndex((m) => m.id === saved.id);
      return idx >= 0 ? prev.map((m) => m.id === saved.id ? saved : m) : [saved, ...prev];
    });
    load(filterStatut);
  };

  const handleDuplicateCreated = (created: Mission) => {
    setDuplicatingMission(null);
    setMissions((prev) => [created, ...prev]);
    load(filterStatut);
  };

  const handleDeleted = (id: string) => {
    setDeletingMission(null);
    setMissions((prev) => prev.filter((m) => m.id !== id));
    load(filterStatut);
  };

  const handleStatutChanged = (updated: Mission) => {
    setMissions((prev) => prev.map((m) => m.id === updated.id ? updated : m));
    load(filterStatut);
  };

  return (
    <>
      {detailMission && (
        <MissionDetailModal
          mission={detailMission}
          chauffeurMap={chauffeurMap}
          clientMap={clientMap}
          onClose={() => setDetailMission(null)}
          onEdit={() => { setEditingMission(detailMission); setModal("edit"); setDetailMission(null); }}
        />
      )}

      {modal && (
        <MissionModal
          mode={modal}
          initial={editingMission ?? undefined}
          chauffeurs={chauffeurs}
          clients={clients}
          chauffeurDocsStatus={chauffeurDocsStatus}
          vehicles={vehicles}
          vehicleDocsStatus={vehicleDocsStatus}
          onClose={() => { setModal(null); setEditingMission(null); }}
          onSaved={handleSaved}
        />
      )}
      {deletingMission && (
        <ConfirmDelete
          mission={deletingMission}
          onClose={() => setDeletingMission(null)}
          onDeleted={handleDeleted}
        />
      )}
      {duplicatingMission && (
        <DuplicateModal
          source={duplicatingMission}
          chauffeurs={chauffeurs}
          clients={clients}
          vehicles={vehicles}
          vehicleDocsStatus={vehicleDocsStatus}
          chauffeurDocsStatus={chauffeurDocsStatus}
          onClose={() => setDuplicatingMission(null)}
          onCreated={handleDuplicateCreated}
        />
      )}

      <div className="w-full sticky top-0 z-40 bg-white dark:bg-neutral-950 flex-shrink-0 flex flex-row h-16 items-center px-6 border-b border-neutral-200 dark:border-neutral-800 justify-between">
        <div>
          <h1 className="text-lg font-bold">Missions</h1>
          <p className="text-xs text-muted-foreground">
            {loading ? "Chargement…" : `${stats?.total ?? 0} missions · ${stats?.en_cours ?? 0} en cours`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => load(filterStatut)} disabled={loading}>
            <RefreshCwIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          {mandatoryResult && !mandatoryResult.complete ? (
            <div title="Complétez les documents obligatoires de l'agence avant de créer une mission">
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white gap-1 opacity-50 cursor-not-allowed"
                disabled
              >
                <PlusIcon className="w-4 h-4" /> Nouvelle mission
              </Button>
            </div>
          ) : (
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1" onClick={() => setModal("add")}>
              <PlusIcon className="w-4 h-4" /> Nouvelle mission
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-7xl w-full mx-auto p-6 space-y-4">

        {/* Documents obligatoires agence */}
        {!mandatoryLoading && mandatoryResult && !mandatoryResult.complete && (
          <MandatoryDocsBanner
            result={mandatoryResult}
            contextLabel="créer des missions"
          />
        )}

        {/* KPI Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: "Total",      value: stats.total,      color: "text-foreground" },
              { label: "Planifiées", value: stats.planifiees, color: "text-amber-500" },
              { label: "Acceptées",  value: stats.acceptees,  color: "text-violet-600" },
              { label: "En cours",   value: stats.en_cours,   color: "text-blue-600" },
              { label: "Terminées",  value: stats.terminees,  color: "text-green-600" },
              { label: "Validées",   value: stats.validees,   color: "text-sky-500" },
              { label: "Facturées",  value: stats.facturees,  color: "text-emerald-600" },
            ].map((s) => (
              <Card key={s.label} className="border-none shadow-sm p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </Card>
            ))}
          </div>
        )}

        {/* Filtre tabs */}
        <div className="flex gap-2 flex-wrap">
          {FILTER_TABS.map((key) => {
            const s = key === "tous" ? null : STATUT[key];
            const count = key === "tous" ? missions.length : missions.filter((m) => m.statut === key).length;
            return (
              <button key={key} onClick={() => setFilterStatut(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${filterStatut === key ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600" : "border-border text-muted-foreground hover:bg-neutral-50 dark:hover:bg-neutral-900"}`}>
                {key === "tous" ? "Toutes" : (s?.label ?? key)}
                <span className="ml-1 opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="N° mission, adresse, chauffeur..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2Icon className="w-5 h-5 animate-spin" /> Chargement des missions…
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center py-16 gap-3">
            <p className="text-sm text-red-500">{error}</p>
            <Button size="sm" variant="outline" onClick={() => load(filterStatut)}>Réessayer</Button>
          </div>
        )}

        {!loading && !error && (
          <Card className="border-none shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-neutral-50 dark:bg-neutral-900">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">N°</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Chauffeur</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Trajet</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Date départ</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Montant</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Statut</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => {
                    const chauffeurName = m.chauffeur_id ? (chauffeurMap[m.chauffeur_id] ?? m.chauffeur_id.slice(0, 8) + "…") : "—";
                    return (
                      <tr key={m.id}
                        className="border-b border-border hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
                        onClick={() => setDetailMission(m)}
                      >
                        <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{m.numero ?? m.id.slice(0, 8)}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5">
                            <CarIcon className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{chauffeurName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 min-w-[260px]">
                          <div className="flex gap-2">
                            <div className="flex flex-col items-center gap-0.5 mt-1 flex-shrink-0">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              <div className="w-px h-3 bg-border" />
                              <MapPinIcon className="w-2.5 h-2.5 text-muted-foreground" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-medium leading-snug">{m.adresse_depart ?? "—"}</p>
                              <p className="text-xs text-muted-foreground leading-snug">{m.adresse_arrivee ?? "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">
                          {m.date_depart ? (
                            <div className="flex items-center gap-1">
                              <ClockIcon className="w-3 h-3" />
                              {new Date(m.date_depart).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                            </div>
                          ) : "—"}
                        </td>
                        <td className="px-5 py-3 text-right font-semibold">
                          {m.montant != null ? `${Number(m.montant).toFixed(2)} €` : "—"}
                        </td>
                        <td className="px-5 py-3">
                          <StatutSelector mission={m} onChanged={handleStatutChanged} />
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <ActionsMenu
                            onEdit={() => { setEditingMission(m); setModal("edit"); }}
                            onDuplicate={() => setDuplicatingMission(m)}
                            onDelete={() => setDeletingMission(m)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  {search ? `Aucune mission pour "${search}".` : "Aucune mission dans cette catégorie."}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
