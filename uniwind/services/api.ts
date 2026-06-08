const BASE_URL             = process.env.EXPO_PUBLIC_API_URL                ?? 'http://localhost:3000';
const CHAUFFEUR_SERVICE    = process.env.EXPO_PUBLIC_CHAUFFEUR_SERVICE_URL  ?? 'http://localhost:3002';
const MISSION_SERVICE      = process.env.EXPO_PUBLIC_MISSION_SERVICE_URL    ?? 'http://localhost:3001';
const CLIENT_SERVICE       = process.env.EXPO_PUBLIC_CLIENT_SERVICE_URL     ?? 'http://localhost:3004';
const VEHICLE_SERVICE      = process.env.EXPO_PUBLIC_VEHICLE_SERVICE_URL    ?? 'http://localhost:3005';
const DOCUMENT_SERVICE     = process.env.EXPO_PUBLIC_DOCUMENT_SERVICE_URL   ?? 'http://localhost:3006';
const GEO_SERVICE          = process.env.EXPO_PUBLIC_GEO_SERVICE_URL        ?? 'http://localhost:3007';
const BILLING_SERVICE      = process.env.EXPO_PUBLIC_BILLING_SERVICE_URL    ?? 'http://localhost:3008';
const NOTIFICATION_SERVICE = process.env.EXPO_PUBLIC_NOTIFICATION_SERVICE_URL ?? 'http://localhost:3009';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string; baseUrl?: string } = {}
): Promise<T> {
  const { token, baseUrl, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${baseUrl ?? BASE_URL}${path}`, { ...fetchOptions, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(data?.error ?? 'Une erreur est survenue', res.status);
  }
  return data as T;
}

// ── Auth ────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  phone?: string;
  first_name: string;
  last_name: string;
  role: 'chauffeur' | 'gestionnaire';
  is_active: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'chauffeur' | 'gestionnaire';
}

export const authApi = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: RegisterPayload) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  me: (token: string) =>
    request<{ user: AuthUser }>('/api/auth/me', { token }),

  // OTP registration (2 steps)
  sendOtp: (payload: RegisterPayload & { phone: string }) =>
    request<{ message: string; phone: string }>('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifyOtp: (phone: string, otp: string) =>
    request<AuthResponse>('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    }),

  // Password reset via email
  forgotPassword: (email: string) =>
    request<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
};

// ── Chauffeur account activation ─────────────────────────────────────────────
export const chauffeurAccountApi = {
  activate: (token: string, password: string) =>
    request<{ message: string; chauffeur_id: string }>(
      '/api/chauffeurs/register-account',
      { method: 'POST', baseUrl: CHAUFFEUR_SERVICE, body: JSON.stringify({ token, password }) },
    ),
};

// ── Chauffeur profile (own) ───────────────────────────────────────────────────
export interface ChauffeurProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  statut: string;
  disponible: boolean;
  user_id: string | null;
  type_chauffeur?: 'interne' | 'independant';
  [key: string]: unknown;
}

export const chauffeurProfileApi = {
  me: (token: string) =>
    request<ChauffeurProfile>('/api/chauffeurs/me', { token, baseUrl: CHAUFFEUR_SERVICE }),
  
  myGestionnaires: (token: string) =>
    request<{ gestionnaire_id: string; docs_validated: boolean; vehicles_validated: boolean; connected_since: string }[]>(
      '/api/chauffeurs/me/gestionnaires',
      { token, baseUrl: CHAUFFEUR_SERVICE }
    ),
};

// ── Missions ──────────────────────────────────────────────────────────────────
export interface Mission {
  id: string;
  numero: string;
  statut: 'planifiée' | 'acceptée' | 'en_cours' | 'terminée' | 'validée' | 'facturée' | 'annulée';
  adresse_depart: string;
  adresse_arrivee: string;
  date_depart: string;
  date_arrivee_prevue: string | null;
  date_arrivee_reelle: string | null;
  distance_km: number | null;
  duree_minutes: number | null;
  montant: number | null;
  nombre_passagers: number | null;
  prix_achat_chauffeur: number | null;
  chauffeur_id: string | null;
  client_id: string | null;
  voiture_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export const missionApi = {
  listByChauffeur: (
    chauffeurId: string,
    token: string,
    opts?: { from?: string; to?: string; limit?: number },
  ) => {
    const params = new URLSearchParams({ chauffeur_id: chauffeurId, limit: String(opts?.limit ?? 100) });
    if (opts?.from) params.set('from', opts.from);
    if (opts?.to)   params.set('to',   opts.to);
    return request<{ data: Mission[]; total: number }>(
      `/api/missions?${params.toString()}`,
      { token, baseUrl: MISSION_SERVICE },
    );
  },
  getOne: (id: string, token: string) =>
    request<Mission>(`/api/missions/${id}`, { token, baseUrl: MISSION_SERVICE }),
  updateStatut: (id: string, statut: string, token: string) =>
    request<Mission>(`/api/missions/${id}/statut`, {
      method: 'PATCH', token, baseUrl: MISSION_SERVICE,
      body: JSON.stringify({ statut }),
    }),
};

// ── Client ─────────────────────────────────────────────────────
export interface Client {
  id: string;
  type?: string;
  first_name: string | null;
  last_name: string | null;
  raison_sociale: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  [key: string]: unknown;
}

export const clientApi = {
  getOne: (id: string, token: string) =>
    request<{ data: Client }>(`/api/clients/${id}`, { token, baseUrl: CLIENT_SERVICE }),
};



// ── Vehicles ──────────────────────────────────────────────────────────────────
export interface Vehicle {
  id: string;
  immat: string;
  marque: string;
  modele: string;
  annee: number | null;
  couleur: string | null;
  statut: 'en_service' | 'disponible' | 'en_revision' | 'hors_service';
  kilometrage: number;
  chauffeur_id: string | null;
  date_ct: string | null;
  date_assurance: string | null;
  notes: string | null;
  owner_type?: 'agency' | 'chauffeur';
  owner_id?: string;
  created_by?: string;
  statut_validation?: 'en_attente' | 'approuve' | 'refuse';
  created_at: string;
  updated_at: string;
}

export const vehicleApi = {
  // Liste des véhicules d'un chauffeur
  listByChauffeur: (chauffeurId: string, token: string) =>
    request<{ data: Vehicle[]; total: number }>(
      `/api/vehicles/chauffeur/${chauffeurId}`,
      { token, baseUrl: VEHICLE_SERVICE },
    ),
  
  // Créer un véhicule (chauffeur indépendant)
  create: (data: Partial<Vehicle>, token: string) =>
    request<{ data: Vehicle }>('/api/vehicles', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
      baseUrl: VEHICLE_SERVICE,
    }),
  
  // Mettre à jour un véhicule
  update: (id: string, data: Partial<Vehicle>, token: string) =>
    request<{ data: Vehicle }>(`/api/vehicles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
      baseUrl: VEHICLE_SERVICE,
    }),
  
  // Supprimer un véhicule
  delete: (id: string, token: string) =>
    request<void>(`/api/vehicles/${id}`, {
      method: 'DELETE',
      token,
      baseUrl: VEHICLE_SERVICE,
    }),
};

// ── Vehicle Sharing (partage véhicules chauffeur indépendant) ─────────────────
export interface VehicleSharingRequest {
  id: string;
  gestionnaire_id: string;
  chauffeur_id: string;
  statut: 'en_attente' | 'approuve' | 'refuse';
  message: string | null;
  motif_refus: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  rejected_at: string | null;
}

export const vehicleSharingApi = {
  // Mes demandes reçues (chauffeur)
  myRequests: (token: string, statut?: 'en_attente' | 'approuve' | 'refuse') => {
    const q = statut ? `?statut=${statut}` : '';
    return request<{ data: VehicleSharingRequest[] }>(
      `/api/vehicle-sharing/my-requests${q}`,
      { token, baseUrl: VEHICLE_SERVICE }
    );
  },

  // Approuver une demande (chauffeur)
  approveRequest: (requestId: string, token: string) =>
    request<{ data: VehicleSharingRequest }>(
      `/api/vehicle-sharing/${requestId}/approve`,
      { method: 'POST', token, baseUrl: VEHICLE_SERVICE }
    ),

  // Refuser une demande (chauffeur)
  rejectRequest: (requestId: string, motif: string, token: string) =>
    request<{ data: VehicleSharingRequest }>(
      `/api/vehicle-sharing/${requestId}/reject`,
      { method: 'POST', body: JSON.stringify({ motif }), token, baseUrl: VEHICLE_SERVICE }
    ),
};

// ── Documents (chauffeur upload ses propres docs) ────────────────────────────
export interface VtcDocument {
  id: string;
  owner_type: 'chauffeur' | 'agency';
  owner_id: string | null;
  type_doc: string;
  nom: string;
  taille_octets: number | null;
  mime_type: string | null;
  statut: 'valide' | 'en_attente' | 'expire' | 'refuse';
  date_expiration: string | null;
  notes: string | null;
  created_at: string;
}

export interface MandatoryItem {
  type: string;
  status: 'valide' | 'manquant' | 'en_attente' | 'expire' | 'refuse';
}

export interface MandatoryCheckResult {
  complete: boolean;
  mandatory: MandatoryItem[];
  blocking: MandatoryItem[];
}

// ── Document Sharing ──────────────────────────────────────────────────────────
export interface SharingRequest {
  id: string;  // UUID
  gestionnaire_id: string;
  chauffeur_id: string;
  statut: 'en_attente' | 'approuve' | 'refuse';
  message: string | null;
  motif_refus: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  gestionnaire_first_name?: string;
  gestionnaire_last_name?: string;
  gestionnaire_email?: string;
}

export const MANDATORY_TYPES: Record<string, string> = {
  permis_conduire:  'Permis de conduire',
  carte_vtc:        'Carte VTC',
  assurance:        'Assurance',
  visite_medicale:  'Visite médicale',
  kbis:             'Kbis',
  piece_identite:   'Pièce d’identité',
};

export const documentApi = {
  // Docs du chauffeur connecté
  listMine: (chauffeurId: string, token: string) =>
    request<{ data: VtcDocument[]; total: number }>(
      `/api/documents?owner_type=chauffeur&owner_id=${chauffeurId}`,
      { token, baseUrl: DOCUMENT_SERVICE },
    ),

  // Vérifier les docs obligatoires
  mandatoryCheck: (chauffeurId: string, token: string) =>
    request<MandatoryCheckResult>(
      `/api/documents/mandatory-check?owner_type=chauffeur&owner_id=${chauffeurId}`,
      { token, baseUrl: DOCUMENT_SERVICE },
    ),

  // Upload un doc (multipart/form-data)
  upload: async (params: {
    chauffeurId: string;
    typeDoc: string;
    nom: string;
    fileUri: string;
    fileName: string;
    mimeType: string;
    dateExpiration?: string;
    token: string;
  }): Promise<VtcDocument> => {
    const fd = new FormData();
    fd.append('file', { uri: params.fileUri, name: params.fileName, type: params.mimeType } as unknown as Blob);
    fd.append('owner_type', 'chauffeur');
    fd.append('owner_id',   params.chauffeurId);
    fd.append('type_doc',   params.typeDoc);
    fd.append('nom',        params.nom);
    if (params.dateExpiration) fd.append('date_expiration', params.dateExpiration);

    const res = await fetch(`${DOCUMENT_SERVICE}/api/documents`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${params.token}` },
      body:    fd,
    });
    const data = await res.json();
    if (!res.ok) throw new ApiError(data?.error ?? 'Erreur upload', res.status);
    return data as VtcDocument;
  },

  // Docs d'un véhicule
  listByVehicle: (vehicleId: string, token: string) =>
    request<{ data: VtcDocument[]; total: number }>(
      `/api/documents?owner_type=vehicle&owner_id=${vehicleId}`,
      { token, baseUrl: DOCUMENT_SERVICE },
    ),

  // Upload un doc véhicule (multipart/form-data)
  uploadVehicle: async (params: {
    vehicleId: string;
    typeDoc: string;
    nom: string;
    fileUri: string;
    fileName: string;
    mimeType: string;
    dateExpiration?: string;
    token: string;
  }): Promise<VtcDocument> => {
    const fd = new FormData();
    fd.append('file', { uri: params.fileUri, name: params.fileName, type: params.mimeType } as unknown as Blob);
    fd.append('owner_type', 'vehicle');
    fd.append('owner_id',   params.vehicleId);
    fd.append('type_doc',   params.typeDoc);
    fd.append('nom',        params.nom);
    if (params.dateExpiration) fd.append('date_expiration', params.dateExpiration);

    const res = await fetch(`${DOCUMENT_SERVICE}/api/documents`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${params.token}` },
      body:    fd,
    });
    const data = await res.json();
    if (!res.ok) throw new ApiError(data?.error ?? 'Erreur upload', res.status);
    return data as VtcDocument;
  },

  // Supprimer un doc
  delete: (id: string, token: string) =>
    request<void>(`/api/documents/${id}`, {
      method: 'DELETE',
      token,
      baseUrl: DOCUMENT_SERVICE,
    }),

  // URL présignée pour voir/télécharger
  getDownloadUrl: (id: string, token: string) =>
    request<{ url: string; doc: VtcDocument }>(
      `/api/documents/${id}/download`,
      { token, baseUrl: DOCUMENT_SERVICE },
    ),

  // ── Partage de documents ────────────────────────────────────────────────────
  // Chauffeur : liste ses demandes de partage reçues
  myRequests: (token: string, statut?: 'en_attente' | 'approuve' | 'refuse') => {
    const query = statut ? `?statut=${statut}` : '';
    return request<{ data: SharingRequest[] }>(
      `/api/sharing/my-requests${query}`,
      { token, baseUrl: DOCUMENT_SERVICE }
    );
  },

  // Chauffeur : approuver une demande
  approveRequest: (requestId: string, token: string) =>
    request<{ data: SharingRequest }>(`/api/sharing/${requestId}/approve`, {
      method: 'POST',
      token,
      baseUrl: DOCUMENT_SERVICE,
    }),

  // Chauffeur : refuser une demande
  rejectRequest: (requestId: string, motif: string, token: string) =>
    request<{ data: SharingRequest }>(`/api/sharing/${requestId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ motif }),
      token,
      baseUrl: DOCUMENT_SERVICE,
    }),
};

// ── Users ───────────────────────────────────────────────────────────────────
export const userApi = {
  getOne: (id: string, token: string) =>
    request<AuthUser>(`/api/users/${id}`, { token }),

  updateProfile: (token: string, data: { first_name?: string; last_name?: string; phone?: string }) =>
    request<AuthUser>('/api/users/me', {
      method: 'PATCH',
      token,
      body: JSON.stringify(data),
    }),

  updatePassword: (token: string, current_password: string, new_password: string) =>
    request<{ message: string }>(`/api/users/me/password`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ current_password, new_password }),
    }),

  sendPhoneChangeOtp: (token: string, phone: string) =>
    request<{ message: string; phone: string }>('/api/users/me/phone/send-otp', {
      method: 'POST',
      token,
      body: JSON.stringify({ phone }),
    }),

  verifyPhoneChangeOtp: (token: string, otp: string) =>
    request<AuthUser>('/api/users/me/phone/verify-otp', {
      method: 'POST',
      token,
      body: JSON.stringify({ otp }),
    }),
};

// ── Geolocation types ─────────────────────────────────────────────────────────
export interface GeoPosition {
  id: number;
  chauffeur_id: string;
  mission_id: string | null;
  lat: number;
  lng: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
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
  polyline: string;
  distance_m: number;
  duration_s: number;
  distance_text: string;
  duration_text: string;
}

export const geoApi = {
  // Chauffeur pushes his GPS position
  pushPosition: (token: string, data: {
    lat: number; lng: number;
    accuracy?: number; speed?: number; heading?: number;
    mission_id?: string;
  }) =>
    request<{ data: GeoPosition }>('/api/geo/position', {
      method: 'POST', token, body: JSON.stringify(data), baseUrl: GEO_SERVICE,
    }),

  // Get route polyline for a mission
  getRoute: (token: string, origin: string, destination: string) =>
    request<{ data: RouteResult }>(
      `/api/geo/route?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`,
      { token, baseUrl: GEO_SERVICE },
    ),

  // ETA from current position to destination
  getEta: (token: string, origin: string, destination: string) =>
    request<{ data: EtaResult }>(
      `/api/geo/eta?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`,
      { token, baseUrl: GEO_SERVICE },
    ),
};

// ── Billing ───────────────────────────────────────────────────────────────────
export interface BonDeMission {
  id: string;
  mission_id: string;
  chauffeur_id: string;
  numero: string;
  statut: string;
  montant: number;
  pdf_key: string | null;
  notes: string | null;
  created_at: string;
}

export const billingApi = {
  getBonByMission: (missionId: string, token: string) =>
    request<{ data: BonDeMission }>(`/api/billing/missions/${missionId}/bon`, {
      token, baseUrl: BILLING_SERVICE,
    }),

  getBonDownload: (bonId: string, token: string) =>
    request<{ url: string }>(`/api/billing/bons/${bonId}/download`, {
      token, baseUrl: BILLING_SERVICE,
    }),
};

// ── Notifications ───────────────────────────────────────────────────────────
export interface InAppNotification {
  id: number;
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

export interface NotificationPreferences {
  user_id: string;
  push_enabled: boolean;
  sms_enabled: boolean;
  email_enabled: boolean;
  in_app_enabled: boolean;
}

export const notificationApi = {
  // Récupérer les notifications in-app de l'utilisateur
  getNotifications: (token: string, params?: { limit?: number; offset?: number; unreadOnly?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.offset) query.append('offset', String(params.offset));
    if (params?.unreadOnly) query.append('unreadOnly', 'true');
    const queryString = query.toString();
    return request<{ notifications: InAppNotification[]; total: number }>(
      `/api/notifications${queryString ? `?${queryString}` : ''}`,
      { token, baseUrl: NOTIFICATION_SERVICE }
    );
  },

  // Nombre de notifications non lues
  getUnreadCount: (token: string) =>
    request<{ count: number }>('/api/notifications/unread-count', {
      token, baseUrl: NOTIFICATION_SERVICE,
    }),

  // Marquer une notification comme lue
  markAsRead: (id: number, token: string) =>
    request<InAppNotification>(`/api/notifications/${id}/read`, {
      method: 'POST',
      token,
      baseUrl: NOTIFICATION_SERVICE,
    }),

  // Marquer toutes les notifications comme lues
  markAllAsRead: (token: string) =>
    request<{ success: boolean }>('/api/notifications/read-all', {
      method: 'POST',
      token,
      baseUrl: NOTIFICATION_SERVICE,
    }),

  // Supprimer une notification
  deleteNotification: (id: number, token: string) =>
    request<void>(`/api/notifications/${id}`, {
      method: 'DELETE',
      token,
      baseUrl: NOTIFICATION_SERVICE,
    }),

  // Obtenir les préférences de l'utilisateur
  getPreferences: (token: string) =>
    request<NotificationPreferences>('/api/notifications/preferences', {
      token, baseUrl: NOTIFICATION_SERVICE,
    }),

  // Mettre à jour les préférences
  updatePreferences: (preferences: Partial<NotificationPreferences>, token: string) =>
    request<NotificationPreferences>('/api/notifications/preferences', {
      method: 'PATCH',
      body: JSON.stringify(preferences),
      token,
      baseUrl: NOTIFICATION_SERVICE,
    }),

  // Enregistrer un device token pour les push notifications
  registerDeviceToken: (deviceToken: string, platform: 'ios' | 'android' | 'web', token: string) =>
    request<{ success: boolean }>('/api/notifications/device-token', {
      method: 'POST',
      body: JSON.stringify({ token: deviceToken, platform }),
      token,
      baseUrl: NOTIFICATION_SERVICE,
    }),

  // Désinscrire un device token
  unregisterDeviceToken: (deviceToken: string, token: string) =>
    request<{ success: boolean }>('/api/notifications/device-token', {
      method: 'DELETE',
      body: JSON.stringify({ token: deviceToken }),
      token,
      baseUrl: NOTIFICATION_SERVICE,
    }),
};
