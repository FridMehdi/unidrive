/**
 * lib/api.ts — Client centralisé pour tous les microservices VTC
 */

// URL de base de l'API (ALB qui route vers tous les services)
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

// ── Token ─────────────────────────────────────────────────────────────────────
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("vtc_token");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ── Generic fetch ─────────────────────────────────────────────────────────────
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    // Désactiver le cache du navigateur pour les données dynamiques
    cache: 'no-store',
    headers: { ...authHeaders(), ...(options.headers as Record<string, string> ?? {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    const base = err?.error ?? err?.message ?? "Erreur API";
    const detail = err?.fields?.map((f: {field: string; message: string}) => `${f.field}: ${f.message}`).join(" | ");
    throw Object.assign(new Error(detail ? `${base} — ${detail}` : base), { status: res.status });
  }
  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authApi = {
  login:      (email: string, password: string) => apiFetch<{ token: string; user: UserProfile }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register:   (data: { email: string; password: string; first_name: string; last_name: string; phone?: string }) => apiFetch<{ token: string; user: UserProfile }>("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),
  sendOtp:    (data: { email: string; password: string; first_name: string; last_name: string; phone: string; role?: string }) => apiFetch<{ message: string; phone: string; expires_in: number }>("/api/auth/send-otp", { method: "POST", body: JSON.stringify({ ...data, role: data.role ?? "gestionnaire" }) }),
  verifyOtp:  (phone: string, otp: string) => apiFetch<{ token: string; user: UserProfile }>("/api/auth/verify-otp", { method: "POST", body: JSON.stringify({ phone, otp }) }),
  me:         () => apiFetch<UserMe>("/api/auth/me"),
};

// ── User API ──────────────────────────────────────────────────────────────────
export const userApi = {
  me:            () => apiFetch<UserMe>("/api/auth/me"),
  updateMe:      (data: Partial<UserProfile>) => apiFetch("/api/users/me", { method: "PATCH", body: JSON.stringify(data) }),
  changePassword: (data: ChangePassword) => apiFetch("/api/users/me/password", { method: "PATCH", body: JSON.stringify(data) }),
  updateUser:    (id: string, data: { is_active?: boolean; role?: string }) => apiFetch(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  sendPhoneOtp:  () => apiFetch<{ message: string }>("/api/users/me/phone/send-otp", { method: "POST" }),
  verifyPhoneOtp: (otp: string) => apiFetch<{ message: string }>("/api/users/me/phone/verify-otp", { method: "POST", body: JSON.stringify({ otp }) }),
};

// ── Mission API ───────────────────────────────────────────────────────────────
export const missionApi = {
  list: (params?: MissionFilters) => apiFetch<MissionList>(`/api/missions?${qs(params)}`),
  stats: () => apiFetch<MissionStats>("/api/missions/stats"),
  create: (data: Partial<Mission>) => apiFetch<Mission>("/api/missions", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Mission>) => apiFetch<Mission>(`/api/missions/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  updateStatut: (id: string, statut: Mission["statut"], cancel_reason?: string) => apiFetch<Mission>(`/api/missions/${id}/statut`, { method: "PATCH", body: JSON.stringify({ statut, cancel_reason }) }),
  remove: (id: string) => apiFetch(`/api/missions/${id}`, { method: "DELETE" }),
};

// ── Tarification API ──────────────────────────────────────────────────────────
export const tarificationApi = {
  list: (params?: { actif?: boolean; type_tarif?: string }) => apiFetch<{ data: Tarification[]; total: number }>(`/api/missions/tarification?${qs(params)}`),
  create: (data: Partial<Tarification>) => apiFetch<Tarification>("/api/missions/tarification", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Tarification>) => apiFetch<Tarification>(`/api/missions/tarification/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<{ message: string; data: Tarification }>(`/api/missions/tarification/${id}`, { method: "DELETE" }),
  calculate: (tarif_id: string, distance_km: number, duree_minutes?: number) => 
    apiFetch<TarifCalculResult>("/api/missions/tarification/calculate", { 
      method: "POST", 
      body: JSON.stringify({ tarif_id, distance_km, duree_minutes }) 
    }),
  getApplicables: (distance_km: number, date_depart?: string) => 
    apiFetch<{ distance_km: number; date_depart: string; heure: string; tarifs: Tarification[] }>(
      `/api/missions/tarification/applicables?distance_km=${distance_km}${date_depart ? `&date_depart=${date_depart}` : ''}`
    ),
};

// ── Chauffeur API ─────────────────────────────────────────────────────────────
export const chauffeurApi = {
  list:            (params?: ChauffeurFilters) => apiFetch<ChauffeurList>(`/api/chauffeurs?${qs(params)}`),
  stats:           () => apiFetch<ChauffeurStats>("/api/chauffeurs/stats"),
  alertes:         () => apiFetch<Chauffeur[]>("/api/chauffeurs/alertes"),
  get:             (id: string) => apiFetch<Chauffeur>(`/api/chauffeurs/${id}`),
  create:          (data: Partial<Chauffeur>) => apiFetch<Chauffeur>("/api/chauffeurs", { method: "POST", body: JSON.stringify(data) }),
  update:          (id: string, data: Partial<Chauffeur>) => apiFetch<Chauffeur>(`/api/chauffeurs/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove:          (id: string) => apiFetch(`/api/chauffeurs/${id}`, { method: "DELETE" }),
  docs:            (id: string) => apiFetch<VtcDocument[]>(`/api/chauffeurs/${id}/documents`),
  absences:        (id: string) => apiFetch<Absence[]>(`/api/chauffeurs/${id}/absences`),
  registerAccount: (token: string, password: string) => apiFetch<{ message: string; chauffeur_id: string }>("/api/chauffeurs/register-account", { method: "POST", body: JSON.stringify({ token, password }) }),
  pending:         () => apiFetch<Chauffeur[]>("/api/chauffeurs/pending"),
  approve:         (id: string) => apiFetch<Chauffeur>(`/api/chauffeurs/${id}/approve`, { method: "POST" }),
  reject:          (id: string, reason?: string) => apiFetch<Chauffeur>(`/api/chauffeurs/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) }),
};

// ── Vehicle API ───────────────────────────────────────────────────────────────
export const vehicleApi = {
  list:     (params?: VehicleFilters) => apiFetch<VehicleList>(`/api/vehicles?${qs(params)}`),
  stats:    () => apiFetch<VehicleStats>("/api/vehicles/stats"),
  alertes:  () => apiFetch<{ data: Vehicle[] }>("/api/vehicles/alertes"),
  get:      (id: string) => apiFetch<{ data: Vehicle }>(`/api/vehicles/${id}`),
  create:   (data: Partial<Vehicle>) => apiFetch<{ data: Vehicle }>("/api/vehicles", { method: "POST", body: JSON.stringify(data) }),
  update:   (id: string, data: Partial<Vehicle>) => apiFetch<{ data: Vehicle }>(`/api/vehicles/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove:   (id: string) => apiFetch(`/api/vehicles/${id}`, { method: "DELETE" }),
  listByChauffeur: (chauffeurId: string) => apiFetch<{ data: Vehicle[] }>(`/api/vehicles/chauffeur/${chauffeurId}`),
  validate: (id: string, decision: "approuve" | "refuse", reason?: string) =>
    apiFetch<{ data: Vehicle }>(`/api/vehicles/${id}/validate`, { method: "PATCH", body: JSON.stringify({ decision, reason }) }),
};

export interface VehicleSharingRequest {
  id: string;
  gestionnaire_id: string;
  chauffeur_id: string;
  statut: "en_attente" | "approuve" | "refuse";
  message: string | null;
  motif_refus: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  validated_by_gestionnaire: boolean;
  validated_at: string | null;
  has_vehicles?: boolean;
  vehicle_count?: number;
}

// ── Vehicle Sharing API ───────────────────────────────────────────────────────
export const vehicleSharingApi = {
  requestAccess: (chauffeurId: string, chauffeurUserId: string | null = null, message?: string) =>
    apiFetch<{ data: VehicleSharingRequest }>("/api/vehicle-sharing/request", {
      method: "POST",
      body: JSON.stringify({ chauffeur_id: chauffeurId, chauffeur_user_id: chauffeurUserId, message }),
    }),
  getStatus: (chauffeurId: string) =>
    apiFetch<{ data: VehicleSharingRequest | null }>(`/api/vehicle-sharing/status/${chauffeurId}`),
  getSentRequests: (statut?: "en_attente" | "approuve" | "refuse") => {
    const q = statut ? `?statut=${statut}` : "";
    return apiFetch<{ data: VehicleSharingRequest[] }>(`/api/vehicle-sharing/sent-requests${q}`);
  },
  validate: (requestId: string) =>
    apiFetch<{ data: VehicleSharingRequest }>(`/api/vehicle-sharing/${requestId}/validate`, {
      method: "POST",
    }),
};

// ── Document API ─────────────────────────────────────────────────────────────
export const documentApi = {
  list: (params?: { owner_type?: string; owner_id?: string; type_doc?: string; statut?: string }) =>
    apiFetch<{ data: VtcDocument[]; total: number }>(`/api/documents?${qs(params)}`),
  upload: (formData: FormData) => {
    const token = getToken();
    const url = `${API_BASE}/api/documents`;
    return fetch(url, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err?.error ?? err?.message ?? "Erreur upload");
      }
      return res.json() as Promise<{ data: VtcDocument }>;
    });
  },
  getDownloadUrl: (id: string) =>
    apiFetch<{ url: string; expires_in: number; doc: VtcDocument }>(`/api/documents/${id}/download`),
  update: (id: string, data: Partial<Pick<VtcDocument, "statut" | "notes" | "date_expiration" | "nom">>) =>
    apiFetch<{ data: VtcDocument }>(`/api/documents/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) =>
    apiFetch<{ message: string }>(`/api/documents/${id}`, { method: "DELETE" }),
  stats: () =>
    apiFetch<Array<{ owner_type: string; statut: string; total: string }>>("/api/documents/stats"),
  types: () =>
    apiFetch<{ data: { chauffeur: string[]; agency: string[] } }>("/api/documents/types"),
  mandatoryCheck: (ownerType: "chauffeur" | "agency", ownerId?: string) => {
    const q = ownerId ? `?owner_type=${ownerType}&owner_id=${ownerId}` : `?owner_type=${ownerType}`;
    return apiFetch<MandatoryCheckResult>(`/api/documents/mandatory-check${q}`);
  },
  validate: (id: string, decision: "valide" | "refuse", reason?: string) =>
    apiFetch<VtcDocument>(`/api/documents/${id}/validate`, { method: "PATCH", body: JSON.stringify({ decision, reason }) }),
};

export interface SharingRequest {
  id: string;
  gestionnaire_id: string;
  chauffeur_id: string;
  statut: "en_attente" | "approuve" | "refuse";
  message: string | null;
  motif_refus: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  validated_by_gestionnaire: boolean;
  validated_at: string | null;
  has_documents?: boolean;
  document_count?: number;
}

// ── Document Sharing API ─────────────────────────────────────────────────────
export const sharingApi = {
  requestAccess: (chauffeurId: string, message?: string) =>
    apiFetch<SharingRequest>("/api/sharing/request", {
      method: "POST",
      body: JSON.stringify({ chauffeur_id: chauffeurId, message }),
    }),
  getStatus: (chauffeurId: string) =>
    apiFetch<{ data: SharingRequest | null }>(`/api/sharing/status/${chauffeurId}`),
  getSentRequests: (statut?: "en_attente" | "approuve" | "refuse") => {
    const q = statut ? `?statut=${statut}` : "";
    return apiFetch<{ data: SharingRequest[] }>(`/api/sharing/sent-requests${q}`);
  },
  validate: (requestId: string) =>
    apiFetch<{ data: SharingRequest }>(`/api/sharing/${requestId}/validate`, {
      method: "POST",
    }),
};

// ── Client API ────────────────────────────────────────────────────────────────
export const clientApi = {
  list:          (params?: ClientFilters) => apiFetch<ClientList>(`/api/clients?${qs(params)}`),
  stats:         () => apiFetch<{ data: ClientStats }>("/api/clients/stats"),
  get:           (id: string) => apiFetch<{ data: Client }>(`/api/clients/${id}`),
  create:        (data: Partial<Client>) => apiFetch<{ data: Client }>("/api/clients", { method: "POST", body: JSON.stringify(data) }),
  update:        (id: string, data: Partial<Client>) => apiFetch<{ data: Client }>(`/api/clients/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove:        (id: string) => apiFetch(`/api/clients/${id}`, { method: "DELETE" }),
  listAdresses:  (id: string) => apiFetch<{ data: ClientAdresse[] }>(`/api/clients/${id}/adresses`),
  addAdresse:    (id: string, data: Partial<ClientAdresse>) => apiFetch<{ data: ClientAdresse }>(`/api/clients/${id}/adresses`, { method: "POST", body: JSON.stringify(data) }),
  delAdresse:    (id: string, adrId: string) => apiFetch(`/api/clients/${id}/adresses/${adrId}`, { method: "DELETE" }),
};

// ── Billing API ──────────────────────────────────────────────────────────────
export const billingApi = {
  // Stats
  stats: () => apiFetch<BillingStats>("/api/billing/stats"),
  // Bons de mission
  createBon: (data: { mission_id: string; chauffeur_id: string; montant?: number; notes?: string }) =>
    apiFetch<{ data: BonMission }>("/api/billing/bons", { method: "POST", body: JSON.stringify(data) }),
  listBons: (params?: { statut?: string; chauffeur_id?: string; page?: number; limit?: number }) =>
    apiFetch<{ data: BonMission[]; total: number }>(`/api/billing/bons?${qs(params)}`),
  getBon: (id: string) => apiFetch<{ data: BonMission }>(`/api/billing/bons/${id}`),
  getBonByMission: (missionId: string) => apiFetch<{ data: BonMission }>(`/api/billing/missions/${missionId}/bon`),
  getBonDownload: (id: string) => apiFetch<{ url: string; expires_in: number }>(`/api/billing/bons/${id}/download`),
  // Factures
  createFacture: (data: { mission_id: string; client_id?: string; montant_ht: number; taux_tva?: number; date_echeance?: string; notes?: string; email_client?: string }) =>
    apiFetch<{ data: Facture }>("/api/billing/factures", { method: "POST", body: JSON.stringify(data) }),
  createFactureGroupee: (data: { client_id: string; mission_ids: string[]; taux_tva?: number; date_echeance?: string; notes?: string }) =>
    apiFetch<{ data: Facture }>("/api/billing/factures/grouped", { method: "POST", body: JSON.stringify(data) }),
  listFactures: (params?: { statut?: string; client_id?: string; page?: number; limit?: number }) =>
    apiFetch<{ data: Facture[]; total: number }>(`/api/billing/factures?${qs(params)}`),
  getFacture: (id: string) => apiFetch<{ data: Facture }>(`/api/billing/factures/${id}`),
  getFactureByMission: (missionId: string) => apiFetch<{ data: Facture }>(`/api/billing/missions/${missionId}/facture`),
  getFacturesByMission: (missionId: string) => apiFetch<{ data: Facture[] }>(`/api/billing/missions/${missionId}/factures`),
  getFactureDownload: (id: string) => apiFetch<{ url: string; expires_in: number; facture: Facture }>(`/api/billing/factures/${id}/download`),
  updateFacture: (id: string, data: Partial<Facture>) =>
    apiFetch<{ data: Facture }>(`/api/billing/factures/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  sendFacture: (id: string, email?: string) =>
    apiFetch<{ data: Facture; message: string }>(`/api/billing/factures/${id}/send`, { method: "POST", body: JSON.stringify({ email }) }),
  sendFactureEmail: (id: string, email: string) =>
    apiFetch<{ data: Facture; message: string }>(`/api/billing/factures/${id}/send`, { method: "POST", body: JSON.stringify({ email }) }),
  // Paiements
  addPaiement: (data: { facture_id: string; montant: number; methode?: string; reference?: string; date_paiement?: string; notes?: string }) =>
    apiFetch<{ data: Paiement }>("/api/billing/paiements", { method: "POST", body: JSON.stringify(data) }),
  listPaiements: (facture_id: string) =>
    apiFetch<{ data: Paiement[] }>(`/api/billing/paiements?facture_id=${facture_id}`),
  // Frais
  listFrais: (params?: { chauffeur_id?: string; statut?: string; mission_id?: string }) =>
    apiFetch<{ data: Frais[] }>(`/api/billing/frais?${qs(params)}`),
  updateFrais: (id: string, data: Partial<Frais>) =>
    apiFetch<{ data: Frais }>(`/api/billing/frais/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  // Export
  exportCsvUrl: (from?: string, to?: string) =>
    `${API_BASE}/api/billing/export/factures.csv?${qs({ from, to })}`,
};

// ── Geolocation API ───────────────────────────────────────────────────────────
export const geoApi = {
  // Positions
  latestPositions: () =>
    apiFetch<{ data: ChauffeurPosition[] }>("/api/geo/positions/latest"),
  history: (chauffeurId: string, missionId?: string, limit?: number) =>
    apiFetch<{ data: ChauffeurPosition[] }>(`/api/geo/positions/${chauffeurId}/history?${qs({ mission_id: missionId, limit })}`),
  // ETA
  eta: (origin: string, destination: string) =>
    apiFetch<{ data: EtaResult }>(`/api/geo/eta?${qs({ origin, destination })}`),
  // Route
  route: (origin: string, destination: string, waypoints?: string) =>
    apiFetch<{ data: RouteResult }>(`/api/geo/route?${qs({ origin, destination, waypoints })}`),
  // Service zones
  zones: () => apiFetch<{ data: ServiceZone[] }>("/api/geo/zones"),
  createZone: (data: Omit<ServiceZone, "id" | "created_at" | "updated_at">) =>
    apiFetch<{ data: ServiceZone }>("/api/geo/zones", { method: "POST", body: JSON.stringify(data) }),
  updateZone: (id: string, data: Partial<ServiceZone>) =>
    apiFetch<{ data: ServiceZone }>(`/api/geo/zones/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteZone: (id: string) => apiFetch(`/api/geo/zones/${id}`, { method: "DELETE" }),
};

// ── Notification API ──────────────────────────────────────────────────────────
export const notificationApi = {
  list: (params?: { limit?: number; offset?: number; unreadOnly?: boolean }) =>
    apiFetch<{ notifications: InAppNotification[]; total: number; unread: number }>(
      `/api/notifications?${qs(params)}`
    ),
  unreadCount: () =>
    apiFetch<{ count: number }>("/api/notifications/unread-count"),
  markAsRead: (id: string) =>
    apiFetch<InAppNotification>(`/api/notifications/${id}/read`, { method: "POST" }),
  markAllAsRead: () =>
    apiFetch("/api/notifications/read-all", { method: "POST" }),
  delete: (id: string) =>
    apiFetch(`/api/notifications/${id}`, { method: "DELETE" }),
};

// ── Query string helper ───────────────────────────────────────────────────────
function qs(params?: object): string {
  if (!params) return "";
  return new URLSearchParams(
    Object.entries(params as Record<string, unknown>)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => [k, String(v)])
  ).toString();
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface UserMe       { user: UserProfile }
export interface UserProfile  { id: string; email: string; first_name: string; last_name: string; phone: string | null; role: string }
export interface ChangePassword { current_password: string; new_password: string }

export type MissionStatut = "planifiée" | "acceptée" | "en_cours" | "terminée" | "validée" | "facturée" | "annulée";

export interface Mission {
  id: string; numero: string;
  statut: MissionStatut;
  client_id: string | null; chauffeur_id: string | null; voiture_id: string | null; tarif_id: string | null;
  adresse_depart: string; adresse_arrivee: string;
  date_depart: string; date_arrivee_prevue: string | null; date_arrivee_reelle: string | null;
  distance_km: number | null; duree_minutes: number | null; montant: number | null;
  prix_achat_chauffeur: number | null;
  nombre_passagers: number | null;
  notes: string | null;
  created_by: string | null;
  // timestamps workflow
  accepted_at: string | null; started_at: string | null; completed_at: string | null;
  validated_at: string | null; invoiced_at: string | null;
  cancelled_at: string | null; cancelled_by: string | null; cancel_reason: string | null;
  created_at: string; updated_at: string;
}
export interface MissionList    { data: Mission[]; total: number; limit: number; offset: number }
export interface MissionStats   {
  total: string; planifiees: string; acceptees: string; en_cours: string;
  terminees: string; validees: string; facturees: string; annulees: string; ca_total: string;
}
export interface MissionFilters { statut?: string; chauffeur_id?: string; client_id?: string; from?: string; to?: string; limit?: number; offset?: number }

// ── Tarification types ────────────────────────────────────────────────────────
export interface Tarification {
  id: string;
  nom: string;
  type_tarif: 'standard_jour' | 'standard_nuit' | 'aeroport' | 'longue_distance' | 'van_groupe';
  prise_en_charge: number;
  prix_km: number;
  prix_minute_attente: number;
  minimum_garanti: number;
  plage_horaire_debut: string | null;
  plage_horaire_fin: string | null;
  distance_min_km: number | null;
  distance_max_km: number | null;
  actif: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface TarifCalculResult {
  tarif: {
    id: string;
    nom: string;
    type_tarif: string;
  };
  distance_km: number;
  duree_minutes: number;
  calcul: {
    prise_en_charge: number;
    cout_distance: number;
    cout_attente: number;
    minimum_garanti: number;
  };
  montant_total: number;
}

export interface Chauffeur {
  id: string; first_name: string; last_name: string;
  email: string | null; phone: string | null;
  date_naissance: string | null; adresse: string | null; ville: string | null; code_postal: string | null; pays: string;
  photo_url: string | null;
  statut: "actif" | "inactif" | "suspendu" | "en_mission" | "en_conge";
  disponible: boolean;
  numero_carte_vtc: string | null; date_expiry_carte_vtc: string | null;
  numero_permis: string | null; categories_permis: string[]; date_expiry_permis: string | null;
  type_piece_identite: string | null; date_expiry_piece_identite: string | null;
  type_contrat: string | null; date_debut_contrat: string | null; date_fin_contrat: string | null;
  taux_commission: number | null; iban: string | null;
  contact_urgence_nom: string | null; contact_urgence_phone: string | null;
  notes: string | null; created_at: string; updated_at: string;
  role_association?: string; date_association?: string;
  user_id: string | null;
  invitation_token: string | null;
  invitation_expires_at: string | null;
  invitation_used_at: string | null;
  type_chauffeur?: "interne" | "independant";
  statut_approbation?: "en_attente" | "approuve" | "refuse";
  sharing_status?: "en_attente" | "approuve" | "refuse" | null;
}
export interface ChauffeurList    { data: Chauffeur[]; total: number; limit: number; offset: number }
export interface ChauffeurStats   { total: string; actifs: string; inactifs: string; suspendus: string; en_mission: string; disponibles: string; docs_expirant_bientot: string; cartes_vtc_expirant_bientot: string; permis_expirant_bientot: string }
export interface ChauffeurFilters { statut?: string; disponible?: string; search?: string; limit?: number; offset?: number }

export interface Client {
  id: string;
  type: "particulier" | "entreprise";
  first_name: string | null; last_name: string | null;
  raison_sociale: string | null; siret: string | null; numero_tva: string | null; nom_contact: string | null;
  email: string | null; phone: string | null; phone_secondaire: string | null;
  adresse: string | null; complement: string | null; ville: string | null; code_postal: string | null; pays: string;
  facturation_meme_adresse: boolean;
  facturation_nom: string | null; facturation_adresse: string | null; facturation_complement: string | null;
  facturation_ville: string | null; facturation_code_postal: string | null; facturation_pays: string;
  statut: "actif" | "inactif" | "bloque";
  tarif_special: number | null;
  mode_paiement: "carte" | "virement" | "especes" | "compte" | "autre";
  delai_paiement: number;
  plafond_credit: number | null;
  nombre_trajets: number;
  ca_total: number;
  notes: string | null;
  created_by: string;
  created_at: string; updated_at: string;
}
export interface ClientList    { data: Client[]; pagination: { page: number; limit: number; total: number; pages: number } }
export interface ClientStats   { total: number; actifs: number; inactifs: number; bloques: number; particuliers: number; entreprises: number; ca_total: number; trajets_total: number }
export interface ClientFilters { type?: string; statut?: string; search?: string; page?: number; limit?: number }
export interface ClientAdresse {
  id: string; client_id: string; libelle: string;
  adresse: string; ville: string | null; code_postal: string | null; pays: string;
  is_default: boolean; created_at: string;
}

export interface Vehicle {
  id: string;
  immat: string;
  marque: string;
  modele: string;
  annee: number | null;
  couleur: string | null;
  statut: "en_service" | "disponible" | "en_revision" | "hors_service";
  kilometrage: number;
  chauffeur_id: string | null;
  date_ct: string | null;
  date_assurance: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  owner_type?: "agency" | "chauffeur";
  owner_id?: string | null;
  created_by?: string | null;
  statut_validation?: "en_attente" | "approuve" | "refuse";
}
export interface VehicleList    { data: Vehicle[]; total: number; limit: number; offset: number }
export interface VehicleStats   { total: string; en_service: string; disponible: string; en_revision: string; hors_service: string; ct_expirant: string; assurance_expirant: string }
export interface VehicleFilters { statut?: string; search?: string; limit?: number; page?: number }

export interface Document {
  id: string; chauffeur_id: string; type: string; nom_fichier: string;
  url: string | null; date_emission: string | null; date_expiry: string | null;
  statut: "valide" | "expire" | "en_attente_validation"; notes: string | null; created_at: string;
}

export interface VtcDocument {
  id: string;
  owner_type: "chauffeur" | "agency" | "vehicle";
  owner_id: string | null;
  type_doc: string;
  nom: string;
  fichier_cle: string;
  taille_octets: number | null;
  mime_type: string | null;
  statut: "valide" | "en_attente" | "expire" | "refuse";
  date_expiration: string | null;
  notes: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MandatoryDocItem {
  type: string;
  status: "valide" | "en_attente" | "manquant" | "expire" | "refuse";
}

export interface MandatoryCheckResult {
  complete: boolean;
  mandatory: MandatoryDocItem[];
  blocking: MandatoryDocItem[];
}
export interface Absence {
  id: string; chauffeur_id: string; type: string;
  date_debut: string; date_fin: string | null; notes: string | null; created_at: string;
}

// ── Geolocation types ─────────────────────────────────────────────────────────
export interface ChauffeurPosition {
  chauffeur_id: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  mission_id: string | null;
  recorded_at: string;
}

export interface EtaResult {
  distance_m: number;
  distance_text: string;
  duration_s: number;
  duration_text: string;
  eta_iso: string;
}

export interface RouteResult {
  polyline: string; // encoded polyline
  distance_m: number;
  duration_s: number;
  distance_text: string;
  duration_text: string;
  bounds: { northeast: { lat: number; lng: number }; southwest: { lat: number; lng: number } };
}

// ── Billing types ────────────────────────────────────────────────────────────
export interface BonMission {
  id: string; mission_id: string; chauffeur_id: string;
  numero: string; statut: "genere" | "envoye" | "signe" | "annule";
  pdf_key: string | null; montant: number; notes: string | null;
  genere_at: string; signe_at: string | null;
  created_at: string; updated_at: string;
}

export interface Facture {
  id: string; mission_id: string; client_id: string | null; chauffeur_id?: string | null;
  numero: string; statut: "draft" | "envoyee" | "payee" | "annulee";
  type_facture: "client" | "chauffeur";
  montant_ht: number; taux_tva: number; montant_tva: number; montant_ttc: number;
  pdf_key: string | null;
  date_emission: string; date_echeance: string;
  date_paiement?: string | null;
  email_client: string | null; email_envoye_at: string | null;
  notes: string | null; created_by: string | null;
  created_at: string; updated_at: string;
  // Champs enrichis (JOIN)
  mission_numero?: string | null;
  client_nom?: string | null;
  client_email?: string | null;
}

export interface Paiement {
  id: string; facture_id: string; montant: number;
  methode: "virement" | "carte" | "especes" | "cheque" | "autre";
  reference: string | null; date_paiement: string; notes: string | null;
  created_by: string | null; created_at: string;
}

export interface Frais {
  id: string; chauffeur_id: string; mission_id: string | null;
  type_frais: string; montant: number; description: string | null;
  justificatif_key: string | null; statut: "declare" | "valide" | "refuse" | "rembourse";
  date_frais: string; created_at: string; updated_at: string;
}

export interface BillingStats {
  total_ttc: number;
  total_paye: number;
  total_impaye: number;
  nb_factures: number;
  bons_de_mission: Array<{ statut: string; total: string }>;
  factures: Array<{ statut: string; total: string; montant: string }>;
  paiements_mois: { total_encaisse: string };
  frais: Array<{ statut: string; total: string }>;
}

export interface ServiceZone {
  id: string;
  name: string;
  description: string | null;
  color: string;
  coordinates: [number, number][];
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InAppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  icon: string | null;
  data: Record<string, any>;
  action_url: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

