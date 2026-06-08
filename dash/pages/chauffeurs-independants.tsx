"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SearchIcon, AlertTriangleIcon, PhoneIcon, MailIcon,
  Loader2Icon, XIcon, UserIcon, CheckCircleIcon, CheckIcon,
  FileTextIcon, MapPinIcon, CalendarIcon, IdCardIcon, PlugIcon,
  TruckIcon, LockIcon, KeyIcon, ClockIcon, XCircleIcon, RefreshCwIcon,
} from "lucide-react";
import { chauffeurApi, documentApi, sharingApi, vehicleApi, vehicleSharingApi, type Chauffeur, type VtcDocument, type SharingRequest, type Vehicle, type VehicleSharingRequest } from "@/lib/api";

type TabKey = "tous" | "connectes" | "refuses";

type ChauffeurWithStatus = Chauffeur & {
  documentSharingStatus?: 'en_attente' | 'approuve' | 'refuse' | null;
  vehicleSharingStatus?: 'en_attente' | 'approuve' | 'refuse' | null;
  documentValidatedByGestionnaire?: boolean;
  vehicleValidatedByGestionnaire?: boolean;
};

const TABS: { key: TabKey; label: string; icon?: string }[] = [
  { key: "tous", label: "Tous", icon: "👥" },
  { key: "connectes", label: "Connectés", icon: "🔌" },
  { key: "refuses", label: "Ont refusé", icon: "✗" },
];

function ProfileModal({ chauffeur: initialChauffeur, onClose, onApproved, onRejected }: {
  chauffeur: Chauffeur;
  onClose: () => void;
  onApproved: () => void;
  onRejected: () => void;
}) {
  const [chauffeur, setChauffeur] = useState<Chauffeur>(initialChauffeur);
  const [documents, setDocuments] = useState<VtcDocument[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleDocuments, setVehicleDocuments] = useState<Record<string, VtcDocument[]>>({});
  const [loading, setLoading] = useState(true);
  const [sharingRequest, setSharingRequest] = useState<SharingRequest | null>(null);
  const [vehicleSharingRequest, setVehicleSharingRequest] = useState<VehicleSharingRequest | null>(null);
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [requestingVehicleAccess, setRequestingVehicleAccess] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profil' | 'documents' | 'vehicules' | 'validation'>('profil');
  
  // États pour vérifier la disponibilité des documents/véhicules
  const [hasAvailableDocuments, setHasAvailableDocuments] = useState(false);
  const [hasAvailableVehicles, setHasAvailableVehicles] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // D'abord charger le chauffeur et les statuts de partage
      const [freshChauffeur, sharingStatus, vehicleSharingStatus] = await Promise.all([
        chauffeurApi.get(String(initialChauffeur.id)),
        sharingApi.getStatus(String(initialChauffeur.id)).catch(() => null),
        vehicleSharingApi.getStatus(String(initialChauffeur.id)).catch(() => null),
      ]);
      
      // Extraire les données de partage
      const docSharingData = sharingStatus?.data ?? null;
      const vehicleSharingData = vehicleSharingStatus?.data ?? null;
      
      // Mettre à jour le chauffeur avec les flags de validation (comme dans la liste)
      const updatedChauffeur = {
        ...freshChauffeur,
        documentValidatedByGestionnaire: docSharingData?.validated_by_gestionnaire === true,
        vehicleValidatedByGestionnaire: vehicleSharingData?.validated_by_gestionnaire === true,
      };
      
      setChauffeur(updatedChauffeur as any);
      
      // Utiliser les flags has_documents et has_vehicles retournés par l'API
      setHasAvailableDocuments(docSharingData?.has_documents ?? false);
      setHasAvailableVehicles(vehicleSharingData?.has_vehicles ?? false);
      
      setSharingRequest(docSharingData);
      setVehicleSharingRequest(vehicleSharingData);
      
      // Charger les documents seulement si le partage est approuvé
      if (docSharingData?.statut === 'approuve') {
        try {
          const docsResponse = await documentApi.list({ owner_type: 'chauffeur', owner_id: String(initialChauffeur.id) });
          setDocuments(docsResponse.data || []);
        } catch (err) {
          console.error('Erreur chargement documents:', err);
          setDocuments([]);
        }
      } else {
        setDocuments([]);
      }
      
      // Charger les véhicules seulement si le partage véhicules est approuvé
      if (vehicleSharingData?.statut === 'approuve') {
        try {
          const vehiclesResponse = await vehicleApi.listByChauffeur(String(initialChauffeur.id));
          const vehiclesList = vehiclesResponse.data || [];
          setVehicles(vehiclesList);
          
          // Charger les documents pour chaque véhicule
          if (vehiclesList.length > 0) {
            const docsMap: Record<string, VtcDocument[]> = {};
            await Promise.all(
              vehiclesList.map(async (vehicle) => {
                try {
                  const vehicleDocs = await documentApi.list({ 
                    owner_type: 'vehicle', 
                    owner_id: vehicle.id 
                  });
                  docsMap[vehicle.id] = vehicleDocs.data || [];
                } catch (err) {
                  console.error(`Erreur chargement documents véhicule ${vehicle.id}:`, err);
                  docsMap[vehicle.id] = [];
                }
              })
            );
            setVehicleDocuments(docsMap);
          }
        } catch (err) {
          console.error('Erreur chargement véhicules:', err);
          setVehicles([]);
        }
      } else {
        setVehicles([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [initialChauffeur.id]);

  // Effacer les messages quand on change d'onglet
  useEffect(() => {
    setSuccessMessage(null);
    setErrorMessage(null);
  }, [activeTab]);

  // Rafraîchir les données quand on passe sur l'onglet véhicules ou documents
  const prevTabRef = useRef<string>('profil');
  useEffect(() => {
    if (
      prevTabRef.current !== activeTab &&
      (activeTab === 'vehicules' || activeTab === 'documents')
    ) {
      loadData();
    }
    prevTabRef.current = activeTab;
  }, [activeTab]);

  const initials = `${chauffeur.first_name[0] ?? ""}${chauffeur.last_name[0] ?? ""}`.toUpperCase();

  // Vérifier si le chauffeur est complètement "Connecté"
  // Un doc personnel expiré OU un doc véhicule expiré → Déconnecté
  const hasExpiredPersonalDoc = documents.some(doc => doc.statut === 'expire');
  const hasExpiredVehicleDoc = Object.values(vehicleDocuments).flat().some(doc => doc.statut === 'expire');
  const isFullyConnected = 
    !hasExpiredPersonalDoc &&
    !hasExpiredVehicleDoc &&
    chauffeur.statut_approbation === "approuve" && 
    (chauffeur as ChauffeurWithStatus).documentValidatedByGestionnaire === true && 
    (chauffeur as ChauffeurWithStatus).vehicleValidatedByGestionnaire === true;

  const tabs = [
    { key: 'profil', label: 'Profil', icon: UserIcon },
    { key: 'documents', label: 'Documents', icon: FileTextIcon, count: documents.length },
    { key: 'vehicules', label: 'Véhicules', icon: TruckIcon, count: vehicles.length },
    { key: 'validation', label: 'Validation', icon: CheckCircleIcon },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-border p-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            {chauffeur.photo_url ? (
              <img src={chauffeur.photo_url} alt={initials} className="w-16 h-16 rounded-full object-cover shadow-md" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {initials || <UserIcon className="w-7 h-7" />}
              </div>
            )}
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{chauffeur.first_name} {chauffeur.last_name}</h2>
                {isFullyConnected ? (
                  <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium text-white bg-gradient-to-r from-green-500 to-green-600 shadow-sm">
                    <PlugIcon className="w-4 h-4" />
                    Connecté
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-300">
                    <ClockIcon className="w-4 h-4" />
                    Déconnecté
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Chauffeur indépendant
                </span>
                {chauffeur.email && (
                  <span className="flex items-center gap-1.5">
                    <MailIcon className="w-3.5 h-3.5" />
                    {chauffeur.email}
                  </span>
                )}
                {chauffeur.phone && (
                  <span className="flex items-center gap-1.5">
                    <PhoneIcon className="w-3.5 h-3.5" />
                    {chauffeur.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData()}
              className="p-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Rafraîchir les données"
              disabled={loading}
            >
              <RefreshCwIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages de succès/erreur */}
        {(successMessage || errorMessage) && (
          <div className="px-6 pt-4">
            {successMessage && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">{successMessage}</p>
                </div>
                <button
                  onClick={() => setSuccessMessage(null)}
                  className="text-green-600 hover:text-green-800 transition-colors"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            )}
            {errorMessage && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900 dark:text-red-100">{errorMessage}</p>
                </div>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-border bg-neutral-50 dark:bg-neutral-900/50 flex-shrink-0">
          <div className="flex gap-1 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-all relative ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2Icon className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-muted-foreground">Chargement...</span>
            </div>
          ) : (
            <div className="p-6">
              {activeTab === 'profil' && (
                <div className="space-y-6">
                  {/* Statut de connexion */}
                  <div className={`rounded-xl p-5 border-2 ${isFullyConnected ? 'bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10 border-green-200 dark:border-green-800' : 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-amber-200 dark:border-amber-800'}`}>
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      {isFullyConnected ? (
                        <>
                          <CheckCircleIcon className="w-5 h-5 text-green-600" />
                          <span>Profil complet et connecté</span>
                        </>
                      ) : (
                        <>
                          <ClockIcon className="w-5 h-5 text-amber-600" />
                          <span>Profil en attente</span>
                        </>
                      )}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex items-center gap-2 p-3 bg-white/50 dark:bg-black/10 rounded-lg">
                        {chauffeur.statut_approbation === "approuve" ? (
                          <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircleIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium">Profil validé</span>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-white/50 dark:bg-black/10 rounded-lg">
                        {sharingRequest?.validated_by_gestionnaire === true ? (
                          <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircleIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium">Documents approuvés</span>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-white/50 dark:bg-black/10 rounded-lg">
                        {vehicleSharingRequest?.validated_by_gestionnaire === true ? (
                          <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircleIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium">Véhicules approuvés</span>
                      </div>
                    </div>
                  </div>

                  {/* Informations personnelles */}
                  <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-xl p-5">
                    <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      Informations personnelles
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-start gap-2">
                        <UserIcon className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Nom complet</p>
                          <p className="font-medium">{chauffeur.first_name} {chauffeur.last_name}</p>
                        </div>
                      </div>
                      {chauffeur.date_naissance && (
                        <div className="flex items-start gap-2">
                          <CalendarIcon className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">Date de naissance</p>
                            <p className="font-medium">{new Date(chauffeur.date_naissance).toLocaleDateString("fr-FR")}</p>
                          </div>
                        </div>
                      )}
                      {(chauffeur.adresse || chauffeur.ville) && (
                        <div className="flex items-start gap-2 md:col-span-2">
                          <MapPinIcon className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">Adresse</p>
                            <p className="font-medium">{chauffeur.adresse ?? ""} {chauffeur.ville ?? ""}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informations professionnelles */}
                  <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-xl p-5">
                    <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
                      <IdCardIcon className="w-4 h-4" />
                      Informations professionnelles
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {chauffeur.numero_carte_vtc && (
                        <div>
                          <p className="text-xs text-muted-foreground">Carte VTC</p>
                          <p className="font-medium">{chauffeur.numero_carte_vtc}</p>
                          {chauffeur.date_expiry_carte_vtc && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Expire le {new Date(chauffeur.date_expiry_carte_vtc).toLocaleDateString("fr-FR")}
                            </p>
                          )}
                        </div>
                      )}
                      {chauffeur.numero_permis && (
                        <div>
                          <p className="text-xs text-muted-foreground">Permis de conduire</p>
                          <p className="font-medium">{chauffeur.numero_permis}</p>
                          {chauffeur.date_expiry_permis && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Expire le {new Date(chauffeur.date_expiry_permis).toLocaleDateString("fr-FR")}
                            </p>
                          )}
                        </div>
                      )}
                      {chauffeur.iban && (
                        <div className="md:col-span-2">
                          <p className="text-xs text-muted-foreground">IBAN</p>
                          <p className="font-medium font-mono">{chauffeur.iban}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {chauffeur.notes && (
                    <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-xl p-5">
                      <h3 className="font-semibold text-base mb-2">Notes</h3>
                      <p className="text-sm text-muted-foreground">{chauffeur.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="space-y-6">
          {/* Documents */}
          <div>
            <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
              <FileTextIcon className="w-4 h-4" />
              Documents ({sharingRequest?.statut === 'approuve' ? documents.length : (sharingRequest?.document_count ?? 0)})
            </h3>
            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2Icon className="w-5 h-5 animate-spin mr-2" />
                Chargement des documents...
              </div>
            ) : !sharingRequest?.id ? (
              // Aucune demande d'accès n'a été faite
              <div className="text-center py-8">
                <LockIcon className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  {hasAvailableDocuments
                    ? "Vous n'avez pas encore demandé l'accès aux documents de ce chauffeur."
                    : "Ce chauffeur n'a pas encore uploadé de documents."}
                </p>
                <Button
                  onClick={async () => {
                    if (requestingAccess) return;
                    setRequestingAccess(true);
                    try {
                      const response = await sharingApi.requestAccess(String(chauffeur.id), "Demande d'accès aux documents pour attribution de missions");
                      setSharingRequest(response);
                      setSuccessMessage('✅ Demande d\'accès envoyée au chauffeur');
                      setTimeout(() => setSuccessMessage(null), 5000);
                    } catch (err) {
                      setErrorMessage(err instanceof Error ? err.message : "Erreur lors de la demande");
                      setTimeout(() => setErrorMessage(null), 5000);
                    } finally {
                      setRequestingAccess(false);
                    }
                  }}
                  disabled={requestingAccess || !hasAvailableDocuments}
                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {requestingAccess ? <Loader2Icon className="w-4 h-4 animate-spin mr-2" /> : <KeyIcon className="w-4 h-4 mr-2" />}
                  Demander l'accès aux documents
                </Button>
              </div>
            ) : sharingRequest?.statut === "en_attente" ? (
              // Demande en attente de réponse du chauffeur
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <ClockIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">Demande en attente</h4>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Votre demande d'accès a été envoyée le {new Date(sharingRequest.created_at).toLocaleDateString("fr-FR")}. Le chauffeur doit l'approuver pour que vous puissiez voir ses documents.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 border-yellow-500 text-yellow-700 hover:bg-yellow-100"
                      onClick={async () => {
                        if (requestingAccess) return;
                        setRequestingAccess(true);
                        try {
                          const response = await sharingApi.requestAccess(String(chauffeur.id), "Relance : Demande d'accès aux documents pour attribution de missions");
                          setSharingRequest(response);
                          setSuccessMessage('✅ Demande réitérée avec succès');
                          setTimeout(() => setSuccessMessage(null), 5000);
                        } catch (err) {
                          setErrorMessage(err instanceof Error ? err.message : "Erreur lors de la relance");
                          setTimeout(() => setErrorMessage(null), 5000);
                        } finally {
                          setRequestingAccess(false);
                        }
                      }}
                      disabled={requestingAccess}
                    >
                      Renvoyer la demande
                    </Button>
                  </div>
                </div>
              </div>
            ) : sharingRequest?.statut === "refuse" ? (
              // Demande refusée par le chauffeur
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-red-900 dark:text-red-100 mb-1">Demande refusée</h4>
                    <p className="text-sm text-red-800 dark:text-red-200 mb-2">
                      Le chauffeur a refusé votre demande d'accès le {new Date(sharingRequest.rejected_at || sharingRequest.updated_at).toLocaleDateString("fr-FR")}.
                    </p>
                    {sharingRequest.motif_refus && (
                      <p className="text-xs text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 p-2 rounded mb-3">
                        Motif : {sharingRequest.motif_refus}
                      </p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500 text-red-700 hover:bg-red-100"
                      onClick={async () => {
                        if (requestingAccess) return;
                        setRequestingAccess(true);
                        try {
                          const response = await sharingApi.requestAccess(String(chauffeur.id), "Nouvelle demande d'accès aux documents pour attribution de missions");
                          setSharingRequest(response);
                          setSuccessMessage('✅ Nouvelle demande envoyée au chauffeur');
                          setTimeout(() => setSuccessMessage(null), 5000);
                        } catch (err) {
                          setErrorMessage(err instanceof Error ? err.message : "Erreur lors de la nouvelle demande");
                          setTimeout(() => setErrorMessage(null), 5000);
                        } finally {
                          setRequestingAccess(false);
                        }
                      }}
                      disabled={requestingAccess}
                    >
                      Faire une nouvelle demande
                    </Button>
                  </div>
                </div>
              </div>
            ) : documents.length === 0 ? (
              // Demande approuvée mais pas de documents
              <div className="text-center py-8 text-muted-foreground text-sm">
                Aucun document uploadé par le chauffeur
              </div>
            ) : (
              <>
                {/* Bouton de validation si documents non validés */}
                {!sharingRequest.validated_by_gestionnaire && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                          Documents à valider
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          Vérifiez les documents et validez pour finaliser la connexion avec ce chauffeur.
                        </p>
                      </div>
                      <Button
                        className="bg-green-600 hover:bg-green-700 ml-4"
                        onClick={async () => {
                          if (requestingAccess) return;
                          setRequestingAccess(true);
                          setSuccessMessage(null);
                          setErrorMessage(null);
                          try {
                            await sharingApi.validate(sharingRequest.id);
                            await loadData(); // Recharger les données
                            setSuccessMessage('Documents validés avec succès !');
                          } catch (err) {
                            setErrorMessage(err instanceof Error ? err.message : "Erreur lors de la validation");
                          } finally {
                            setRequestingAccess(false);
                          }
                        }}
                        disabled={requestingAccess}
                      >
                        {requestingAccess ? (
                          <><Loader2Icon className="w-4 h-4 animate-spin mr-2" /> Validation...</>
                        ) : (
                          <><CheckCircleIcon className="w-4 h-4 mr-2" /> Valider les documents</>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Badge de validation */}
                {sharingRequest.validated_by_gestionnaire && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 mb-4">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <CheckCircleIcon className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        Documents validés le {new Date(sharingRequest.validated_at!).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Liste des documents */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {documents.map((doc) => {
                  const handleDocumentClick = async (e: React.MouseEvent) => {
                    e.preventDefault();
                    try {
                      const { url } = await documentApi.getDownloadUrl(doc.id);
                      window.open(url, "_blank");
                    } catch (err) {
                      setErrorMessage("❌ Erreur lors du téléchargement du document");
                      setTimeout(() => setErrorMessage(null), 5000);
                      console.error(err);
                    }
                  };
                  
                  const isExpired  = doc.statut === 'expire';
                  const isRefused  = doc.statut === 'refuse';
                  const isWaiting  = doc.statut === 'en_attente';
                  const isValid    = doc.statut === 'valide';

                  const statutLabel: Record<string, string> = {
                    expire:     'Expiré',
                    valide:     'Valide',
                    en_attente: 'En attente',
                    refuse:     'Refusé',
                  };

                  const statutClass: Record<string, string> = {
                    expire:     'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                    valide:     'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                    en_attente: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                    refuse:     'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                  };

                  return (
                    <button
                      key={doc.id}
                      onClick={handleDocumentClick}
                      className={`p-3 rounded-xl border transition-colors cursor-pointer text-left w-full ${
                        isExpired || isRefused
                          ? 'border-red-300 dark:border-red-800 bg-red-50/40 dark:bg-red-900/10 hover:border-red-400'
                          : isWaiting
                          ? 'border-yellow-300 dark:border-yellow-800 bg-yellow-50/30 dark:bg-yellow-900/10 hover:border-yellow-400'
                          : 'border-border hover:border-blue-500'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <FileTextIcon className={`w-5 h-5 ${isExpired || isRefused ? 'text-red-500' : isWaiting ? 'text-yellow-500' : 'text-blue-500'}`} />
                        {doc.statut && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statutClass[doc.statut] ?? 'bg-gray-100 text-gray-600'}` }>
                            {statutLabel[doc.statut] ?? doc.statut}
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-sm truncate">{doc.nom}</p>
                      <p className="text-xs text-muted-foreground mt-1">{doc.type_doc}</p>
                      {doc.date_expiration && (
                        <p className={`text-xs mt-1 ${
                          isExpired ? 'text-red-500 font-medium' : 'text-muted-foreground'
                        }`}>
                          Expire: {new Date(doc.date_expiration).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
              </>
            )}
          </div>
                </div>
              )}

              {activeTab === 'vehicules' && (
                <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <TruckIcon className="w-5 h-5" />
              Véhicules ({
                vehicleSharingRequest?.statut === 'approuve' 
                  ? vehicles.length 
                  : (vehicleSharingRequest?.vehicle_count || 0)
              }/2)
            </h3>

            {!vehicleSharingRequest?.id ? (
              <div className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6 text-center">
                <LockIcon className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  {hasAvailableVehicles
                    ? "Vous n'avez pas encore demandé l'accès aux véhicules de ce chauffeur."
                    : "Ce chauffeur n'a pas encore ajouté de véhicules avec documents."}
                </p>
                <Button
                  onClick={async () => {
                    setRequestingVehicleAccess(true);
                    try {
                      const response = await vehicleSharingApi.requestAccess(String(chauffeur.id), chauffeur.user_id, 'Demande d\'accès pour validation des véhicules');
                      setVehicleSharingRequest(response.data);
                      setSuccessMessage('✅ Demande d\'accès envoyée au chauffeur');
                      setTimeout(() => setSuccessMessage(null), 5000);
                    } catch (err) {
                      setErrorMessage(err instanceof Error ? err.message : 'Erreur lors de la demande');
                      setTimeout(() => setErrorMessage(null), 5000);
                    } finally {
                      setRequestingVehicleAccess(false);
                    }
                  }}
                  disabled={requestingVehicleAccess || !hasAvailableVehicles}
                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {requestingVehicleAccess ? <Loader2Icon className="w-4 h-4 animate-spin mr-2" /> : <KeyIcon className="w-4 h-4 mr-2" />}
                  Demander l'accès aux véhicules
                </Button>
              </div>
            ) : vehicleSharingRequest?.statut === "en_attente" ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <ClockIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">Demande en attente</h4>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Votre demande d'accès a été envoyée le {new Date(vehicleSharingRequest.created_at).toLocaleDateString("fr-FR")}. Le chauffeur doit l'approuver pour que vous puissiez voir ses véhicules.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 border-yellow-500 text-yellow-700 hover:bg-yellow-100"
                      onClick={async () => {
                        setRequestingVehicleAccess(true);
                        try {
                          const response = await vehicleSharingApi.requestAccess(String(chauffeur.id), chauffeur.user_id, 'Nouvelle demande d\'accès');
                          setVehicleSharingRequest(response.data);
                          setSuccessMessage('✅ Nouvelle demande envoyée');
                          setTimeout(() => setSuccessMessage(null), 5000);
                        } catch (err) {
                          setErrorMessage(err instanceof Error ? err.message : 'Erreur');
                          setTimeout(() => setErrorMessage(null), 5000);
                        } finally {
                          setRequestingVehicleAccess(false);
                        }
                      }}
                      disabled={requestingVehicleAccess}
                    >
                      Renvoyer la demande
                    </Button>
                  </div>
                </div>
              </div>
            ) : vehicleSharingRequest?.statut === "refuse" ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-red-900 dark:text-red-100 mb-1">Demande refusée</h4>
                    <p className="text-sm text-red-800 dark:text-red-200 mb-2">
                      Le chauffeur a refusé votre demande d'accès le {new Date(vehicleSharingRequest.rejected_at || vehicleSharingRequest.updated_at).toLocaleDateString("fr-FR")}.
                    </p>
                    {vehicleSharingRequest.motif_refus && (
                      <p className="text-xs text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 p-2 rounded mb-3">
                        Motif : {vehicleSharingRequest.motif_refus}
                      </p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500 text-red-700 hover:bg-red-100"
                      onClick={async () => {
                        setRequestingVehicleAccess(true);
                        try {
                          const response = await vehicleSharingApi.requestAccess(String(chauffeur.id), chauffeur.user_id, 'Nouvelle demande d\'accès');
                          setVehicleSharingRequest(response.data);
                          setSuccessMessage('✅ Nouvelle demande envoyée');
                          setTimeout(() => setSuccessMessage(null), 5000);
                        } catch (err) {
                          setErrorMessage(err instanceof Error ? err.message : 'Erreur');
                          setTimeout(() => setErrorMessage(null), 5000);
                        } finally {
                          setRequestingVehicleAccess(false);
                        }
                      }}
                      disabled={requestingVehicleAccess}
                    >
                      Faire une nouvelle demande
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Bouton de validation global si véhicules non validés */}
                {!vehicleSharingRequest.validated_by_gestionnaire && vehicles.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                          Véhicules à valider
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          {(() => {
                            const vehiclesWithoutDocs = vehicles.filter(v => 
                              !vehicleDocuments[v.id] || vehicleDocuments[v.id].length === 0
                            );
                            if (vehiclesWithoutDocs.length > 0) {
                              return `⚠️ ${vehiclesWithoutDocs.length} véhicule(s) sans documents. Le chauffeur doit fournir les documents avant validation.`;
                            }
                            return "Vérifiez les véhicules et validez pour finaliser la connexion avec ce chauffeur.";
                          })()}
                        </p>
                      </div>
                      <Button
                        className="bg-green-600 hover:bg-green-700 ml-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={
                          requestingVehicleAccess || 
                          vehicles.some(v => !vehicleDocuments[v.id] || vehicleDocuments[v.id].length === 0)
                        }
                        onClick={async () => {
                          if (requestingVehicleAccess) return;
                          setRequestingVehicleAccess(true);
                          setSuccessMessage(null);
                          setErrorMessage(null);
                          try {
                            await vehicleSharingApi.validate(vehicleSharingRequest.id);
                            await loadData(); // Recharger les données
                            setSuccessMessage('Véhicules validés avec succès !');
                          } catch (err) {
                            setErrorMessage(err instanceof Error ? err.message : "Erreur lors de la validation");
                          } finally {
                            setRequestingVehicleAccess(false);
                          }
                        }}
                      >
                        {requestingVehicleAccess ? (
                          <><Loader2Icon className="w-4 h-4 animate-spin mr-2" /> Validation...</>
                        ) : (
                          <><CheckCircleIcon className="w-4 h-4 mr-2" /> Valider les véhicules</>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Badge de validation */}
                {vehicleSharingRequest.validated_by_gestionnaire && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 mb-4">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <CheckCircleIcon className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        Véhicules validés le {new Date(vehicleSharingRequest.validated_at!).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Liste des véhicules */}
                <div className="space-y-3">
                {vehicles.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucun véhicule ajouté par ce chauffeur
                  </p>
                ) : (
                  vehicles.map((vehicle) => {
                    const statusColor = vehicle.statut_validation === 'approuve' ? 'green' : vehicle.statut_validation === 'refuse' ? 'red' : 'yellow';
                    const statusLabel = vehicle.statut_validation === 'approuve' ? 'Validé' : vehicle.statut_validation === 'refuse' ? 'Refusé' : 'En attente';
                    
                    return (
                      <div key={vehicle.id} className={`border-2 rounded-xl p-4 ${statusColor === 'green' ? 'border-green-200 bg-green-50/50 dark:bg-green-900/10' : statusColor === 'red' ? 'border-red-200 bg-red-50/50' : 'border-yellow-200 bg-yellow-50/50'}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-base">
                              {vehicle.marque} {vehicle.modele}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {vehicle.immat} • {vehicle.annee} • {vehicle.couleur}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${statusColor === 'green' ? 'bg-green-100 text-green-800' : statusColor === 'red' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {statusLabel}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                          <div>📅 CT: {vehicle.date_ct ? new Date(vehicle.date_ct).toLocaleDateString('fr-FR') : 'Non renseigné'}</div>
                          <div>🛡️ Assurance: {vehicle.date_assurance ? new Date(vehicle.date_assurance).toLocaleDateString('fr-FR') : 'Non renseigné'}</div>
                        </div>

                        {/* Section Documents - toujours affichée */}
                        <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                          <h5 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-1">
                            <FileTextIcon className="w-3.5 h-3.5" />
                            Documents ({vehicleDocuments[vehicle.id]?.length || 0})
                          </h5>
                          
                          {vehicleDocuments[vehicle.id] && vehicleDocuments[vehicle.id].length > 0 ? (
                            <div className="grid grid-cols-3 gap-2">
                              {vehicleDocuments[vehicle.id].map((doc) => {
                                const handleDocumentClick = async (e: React.MouseEvent) => {
                                  e.preventDefault();
                                  try {
                                    const { url } = await documentApi.getDownloadUrl(doc.id);
                                    window.open(url, "_blank");
                                  } catch (err) {
                                    setErrorMessage("❌ Erreur lors du téléchargement du document");
                                    setTimeout(() => setErrorMessage(null), 5000);
                                    console.error(err);
                                  }
                                };
                                
                                const docExpired = doc.statut === 'expire';
                                return (
                                  <button
                                    key={doc.id}
                                    onClick={handleDocumentClick}
                                    className={`p-2 rounded-lg border transition-colors cursor-pointer text-left w-full ${
                                      docExpired
                                        ? 'border-red-300 dark:border-red-800 bg-red-50/40 dark:bg-red-900/10 hover:border-red-400'
                                        : 'border-border hover:border-blue-500'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between mb-1">
                                      <FileTextIcon className={`w-4 h-4 ${docExpired ? 'text-red-500' : 'text-blue-500'}`} />
                                      {docExpired && (
                                        <span className="text-[9px] font-semibold px-1 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                          Expiré
                                        </span>
                                      )}
                                    </div>
                                    <p className="font-medium text-xs truncate">{doc.nom}</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">{doc.type_doc}</p>
                                    {doc.date_expiration && (
                                      <p className={`text-[10px] mt-0.5 ${docExpired ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                                        Expire: {new Date(doc.date_expiration).toLocaleDateString("fr-FR")}
                                      </p>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                              <p className="text-xs text-orange-700 dark:text-orange-300 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Aucun document fourni. Le chauffeur doit télécharger la carte grise, l'assurance et le contrôle technique depuis l'application mobile.
                              </p>
                            </div>
                          )}
                        </div>

                        {vehicle.statut_validation === 'en_attente' && (
                          <div className="flex gap-2 mt-3 pt-3 border-t">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 border-red-500 text-red-600 hover:bg-red-50"
                              onClick={async () => {
                                const reason = prompt('Motif du refus :');
                                if (!reason) return;
                                try {
                                  await vehicleApi.validate(vehicle.id, 'refuse', reason);
                                  setSuccessMessage('✅ Véhicule refusé');
                                  setTimeout(() => setSuccessMessage(null), 5000);
                                  await loadData();
                                } catch (err) {
                                  setErrorMessage(err instanceof Error ? err.message : 'Erreur');
                                  setTimeout(() => setErrorMessage(null), 5000);
                                }
                              }}
                            >
                              ✗ Refuser
                            </Button>
                            <Button
                              size="sm"
                              disabled={!vehicleDocuments[vehicle.id] || vehicleDocuments[vehicle.id].length === 0}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={async () => {
                                try {
                                  await vehicleApi.validate(vehicle.id, 'approuve');
                                  setSuccessMessage('✅ Véhicule validé !');
                                  setTimeout(() => setSuccessMessage(null), 5000);
                                  await loadData();
                                } catch (err) {
                                  setErrorMessage(err instanceof Error ? err.message : 'Erreur');
                                  setTimeout(() => setErrorMessage(null), 5000);
                                }
                              }}
                              title={!vehicleDocuments[vehicle.id] || vehicleDocuments[vehicle.id].length === 0 ? "Impossible de valider : aucun document fourni" : ""}
                            >
                              ✓ Valider
                            </Button>
                          </div>
                        )}

                        {vehicle.notes && (
                          <p className="text-xs text-muted-foreground mt-2 bg-neutral-100 dark:bg-neutral-800 p-2 rounded">
                            {vehicle.notes}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              </>
            )}
          </div>
                </div>
              )}

              {activeTab === 'validation' && (
                <div className="space-y-6">
                  
                  {/* Message explicatif du workflow */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">
                          Processus de validation
                        </h4>
                        <div className="text-xs text-blue-800 dark:text-blue-200 space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                            <p>
                              <strong>Documents légaux :</strong> Demandez l'accès aux documents, attendez l'approbation du chauffeur, puis vérifiez et validez les documents obligatoires.
                            </p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                            <p>
                              <strong>Véhicules :</strong> Demandez l'accès aux véhicules, attendez l'approbation, puis vérifiez les informations du véhicule et ses documents (carte grise, assurance, CT) avant de valider.
                            </p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">3</span>
                            <p>
                              <strong>Validation finale du profil :</strong> Une fois les documents et véhicules validés, vous pouvez approuver le profil du chauffeur pour qu'il puisse recevoir des missions.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

          {sharingRequest?.statut === 'approuve' && 
           sharingRequest?.validated_by_gestionnaire === true && 
           vehicleSharingRequest?.statut === 'approuve' && 
           vehicleSharingRequest?.validated_by_gestionnaire === true && 
           chauffeur.statut_approbation === 'en_attente' && 
           documents.length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                Validation du profil
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Les documents légaux et véhicules ont été validés. Vous pouvez maintenant approuver le profil pour que le chauffeur puisse recevoir des missions.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={async () => {
                    const reason = prompt('Motif du refus (optionnel) :');
                    if (reason === null) return;
                    setIsRejecting(true);
                    setSuccessMessage(null);
                    setErrorMessage(null);
                    try {
                      await chauffeurApi.reject(chauffeur.id, reason || undefined);
                      setSuccessMessage('Profil refusé');
                      onRejected();
                      setTimeout(() => onClose(), 1500);
                    } catch (err) {
                      setErrorMessage(err instanceof Error ? err.message : 'Erreur lors du refus');
                    } finally {
                      setIsRejecting(false);
                    }
                  }}
                  disabled={isRejecting || isApproving}
                >
                  {isRejecting ? (
                    <><Loader2Icon className="w-4 h-4 animate-spin mr-2" /> Refus en cours...</>
                  ) : (
                    <>✗ Refuser le profil</>
                  )}
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={async () => {
                    setIsApproving(true);
                    setSuccessMessage(null);
                    setErrorMessage(null);
                    try {
                      await chauffeurApi.approve(chauffeur.id);
                      // Recharger immédiatement les données pour synchroniser l'état
                      await loadData();
                      setSuccessMessage('Profil approuvé ! Le chauffeur est maintenant Connecté et peut recevoir des missions.');
                      onApproved(); // Notifier le parent pour rafraîchir la liste
                      // Fermer après 2 secondes pour voir le message
                      setTimeout(() => onClose(), 2000);
                    } catch (err) {
                      console.error('Erreur approbation:', err);
                      const errorMsg = err instanceof Error ? err.message : 'Erreur lors de l\'approbation';
                      // Ne pas afficher d'erreur si déjà approuvé
                      if (errorMsg.includes('déjà approuvé')) {
                        // Si déjà approuvé, recharger quand même les données
                        await loadData();
                        setSuccessMessage('Ce chauffeur est déjà approuvé et connecté.');
                        setTimeout(() => onClose(), 2000);
                      } else {
                        setErrorMessage(errorMsg);
                        // Recharger les données même en cas d'erreur pour resynchroniser
                        await loadData();
                      }
                    } finally {
                      setIsApproving(false);
                    }
                  }}
                  disabled={isApproving || isRejecting}
                >
                  {isApproving ? (
                    <><Loader2Icon className="w-4 h-4 animate-spin mr-2" /> Approbation en cours...</>
                  ) : (
                    <><CheckIcon className="w-4 h-4 mr-2" /> Approuver le profil</>
                  )}
                </Button>
              </div>
            </div>
          )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChauffeursIndependants() {
  const router = useRouter();
  const [chauffeurs, setChauffeurs] = useState<ChauffeurWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("tous");
  const [selectedChauffeur, setSelectedChauffeur] = useState<Chauffeur | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, pendingRes] = await Promise.all([
        chauffeurApi.list({ limit: 200 }),
        chauffeurApi.pending(),
      ]);
      
      // Filtrer uniquement les chauffeurs indépendants
      const independants = listRes.data.filter((c) => c.type_chauffeur === "independant");
      const allIndependants = [...pendingRes, ...independants];
      
      // Dédupliquer par ID
      const uniqueMap = new Map<string, Chauffeur>();
      allIndependants.forEach((c) => uniqueMap.set(c.id, c));
      const uniqueChauffeurs = Array.from(uniqueMap.values());
      
      // Charger les statuts de partage en parallèle pour tous les chauffeurs
      const chauffeursWithStatus = await Promise.all(
        uniqueChauffeurs.map(async (chauffeur) => {
          try {
            const [docSharing, vehicleSharing] = await Promise.all([
              sharingApi.getStatus(String(chauffeur.id)).catch(() => null),
              vehicleSharingApi.getStatus(String(chauffeur.id)).catch(() => null),
            ]);
            return {
              ...chauffeur,
              documentSharingStatus: docSharing?.data?.statut,
              vehicleSharingStatus: vehicleSharing?.data?.statut,
              documentValidatedByGestionnaire: docSharing?.data?.validated_by_gestionnaire === true,
              vehicleValidatedByGestionnaire: vehicleSharing?.data?.validated_by_gestionnaire === true,
            } as ChauffeurWithStatus;
          } catch {
            return {
              ...chauffeur,
              documentSharingStatus: null,
              vehicleSharingStatus: null,
              documentValidatedByGestionnaire: false,
              vehicleValidatedByGestionnaire: false,
            } as ChauffeurWithStatus;
          }
        })
      );
      
      setChauffeurs(chauffeursWithStatus);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []); // eslint-disable-line

  // Auto-ouvrir le modal si ?chauffeur=ID est dans l'URL (depuis notifications)
  useEffect(() => {
    if (!loading && chauffeurs.length > 0 && router.query.chauffeur) {
      const targetId = String(router.query.chauffeur);
      const found = chauffeurs.find((c) => String(c.id) === targetId);
      if (found) setSelectedChauffeur(found);
    }
  }, [loading, chauffeurs, router.query.chauffeur]);

  const filtered = chauffeurs.filter((c) => {
    // Filtre par onglet
    const isConnected = 
      c.statut_approbation === "approuve" && 
      c.documentValidatedByGestionnaire === true && 
      c.vehicleValidatedByGestionnaire === true;
    
    if (activeTab === "connectes" && !isConnected) return false;
    if (activeTab === "refuses" && c.sharing_status !== "refuse") return false;
    // activeTab === "tous" affiche tous les chauffeurs

    // Filtre recherche
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q) ||
      (c.phone ?? "").toLowerCase().includes(q) ||
      (c.numero_carte_vtc ?? "").toLowerCase().includes(q)
    );
  });

  const stats = {
    total: chauffeurs.length,
    connectes: chauffeurs.filter((c) => 
      c.statut_approbation === "approuve" && 
      c.documentValidatedByGestionnaire === true && 
      c.vehicleValidatedByGestionnaire === true
    ).length,
    refuses_partage: chauffeurs.filter((c) => c.sharing_status === "refuse").length,
  };

  return (
    <>
      {selectedChauffeur && (
        <ProfileModal
          chauffeur={selectedChauffeur}
          onClose={() => setSelectedChauffeur(null)}
          onApproved={() => {
            setSelectedChauffeur(null);
            // Petit délai pour s'assurer que la base de données est à jour
            setTimeout(() => load(), 500);
          }}
          onRejected={() => {
            setSelectedChauffeur(null);
            setTimeout(() => load(), 500);
          }}
        />
      )}

      <div className="w-full sticky top-0 z-40 bg-white dark:bg-neutral-950 flex-shrink-0 flex flex-row h-16 items-center px-6 border-b border-neutral-200 dark:border-neutral-800 justify-between">
        <div>
          <h1 className="text-lg font-bold">Chauffeurs indépendants</h1>
          <p className="text-xs text-muted-foreground">
            Validation et suivi des chauffeurs indépendants
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          <Loader2Icon className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Rafraîchir
        </Button>
      </div>

      <div className="max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* KPI Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-none shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Chauffeurs indépendants</p>
          </Card>
          <Card className="border-none shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.connectes}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Connectés avec vous</p>
          </Card>
          <Card className="border-none shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.refuses_partage}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Ont refusé le partage</p>
          </Card>
        </div>

        {/* Alerte */}
        {stats.connectes > 0 && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm">
            <PlugIcon className="w-4 h-4 flex-shrink-0" />
            <span>
              <strong>{stats.connectes}</strong> chauffeur(s) connecté(s) avec vous
            </span>
          </div>
        )}

        {/* Message explicatif des statuts */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
            <AlertTriangleIcon className="w-4 h-4" />
            Statuts de connexion
          </h3>
          <div className="text-xs text-blue-700 dark:text-blue-300 space-y-2">
            <div className="flex items-start gap-2">
              <PlugIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Connecté :</strong> Le profil du chauffeur a été validé, il a approuvé le partage de ses documents et véhicules, et vous avez validé ces éléments. Vous pouvez lui attribuer des missions.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <XIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Déconnecté :</strong> Le processus de validation n'est pas terminé. Validez le profil, demandez l'accès aux documents et véhicules, puis validez-les après vérification.
              </div>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex gap-2 flex-wrap">
          {TABS.map((tab) => {
            const count = tab.key === "tous" ? stats.total 
              : tab.key === "connectes" ? stats.connectes 
              : stats.refuses_partage;
            
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border flex items-center gap-2 ${
                  activeTab === tab.key
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                    : "border-border text-muted-foreground hover:bg-neutral-50 dark:hover:bg-neutral-900"
                }`}
              >
                {tab.icon && <span>{tab.icon}</span>}
                {tab.label}
                <span className="opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Recherche */}
        <div className="relative max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Nom, prénom, téléphone, email..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Liste */}
        {loading && (
          <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2Icon className="w-5 h-5 animate-spin" /> Chargement...
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center py-16 gap-3">
            <p className="text-sm text-red-500">{error}</p>
            <Button size="sm" variant="outline" onClick={load}>
              Réessayer
            </Button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-16">
            <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="font-medium text-green-700">
              {search 
                ? `Aucun résultat pour "${search}"`
                : activeTab === "tous"
                ? "Aucun chauffeur indépendant"
                : activeTab === "connectes"
                ? "Aucun chauffeur connecté"
                : "Aucun chauffeur n'a refusé"
              }
            </p>
            {!search && activeTab === "connectes" && (
              <p className="text-sm text-muted-foreground mt-1">
                Demandez l'accès aux documents des chauffeurs pour vous connecter.
              </p>
            )}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((c) => {
              const initials = `${c.first_name[0] ?? ""}${c.last_name[0] ?? ""}`.toUpperCase();
              const isConnected = 
                c.statut_approbation === "approuve" && 
                c.documentValidatedByGestionnaire === true && 
                c.vehicleValidatedByGestionnaire === true;
              const statutBadge = isConnected
                ? { label: "Connecté", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", icon: PlugIcon }
                : { label: "Déconnecté", color: "text-gray-600", bg: "bg-gray-50 dark:bg-gray-900/20", icon: XIcon };

              return (
                <Card
                  key={c.id}
                  className="border-none shadow-sm p-5 space-y-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedChauffeur(c)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {c.photo_url ? (
                        <img src={c.photo_url} alt={initials} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                          {initials || <UserIcon className="w-5 h-5" />}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold">
                          {c.first_name} {c.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Chauffeur indépendant
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 flex items-center gap-1 ${statutBadge.color} ${statutBadge.bg}`}>
                      <statutBadge.icon className="w-3 h-3" />
                      {statutBadge.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {c.phone && (
                      <span className="flex items-center gap-1">
                        <PhoneIcon className="w-3 h-3" />
                        {c.phone}
                      </span>
                    )}
                    {c.email && (
                      <span className="flex items-center gap-1">
                        <MailIcon className="w-3 h-3" />
                        {c.email}
                      </span>
                    )}
                    {c.ville && <span>{c.ville}</span>}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      Inscrit le {new Date(c.created_at).toLocaleDateString("fr-FR")}
                    </span>
                    <button className="text-xs text-blue-600 font-medium hover:underline">
                      Voir profil →
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
