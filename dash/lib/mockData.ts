// ── VTC Gestionnaire — Mock Data ─────────────────────────────────────────────

// Dashboard KPIs
export const kpiCards = [
  { title: "Missions aujourd'hui", value: "15", change: "+3", trend: "up", sub: "vs hier" },
  { title: "CA du mois (TTC)", value: "18 520 €", change: "+12.4%", trend: "up", sub: "vs mois dernier" },
  { title: "Chauffeurs actifs", value: "8", change: "-1", trend: "down", sub: "sur 10 total" },
  { title: "Impayés", value: "2 340 €", change: "+420 €", trend: "down", sub: "3 factures" },
];

// Compatibilité (pages qui utilisent encore statsCards)
export const statsCards = kpiCards;

// CA mensuel (12 mois) – deux années pour comparaison
export const caMensuel = [
  { mois: "Avr",  ca2024: 74000, ca2025: 88000 },
  { mois: "Mai",  ca2024: 78000, ca2025: 95000 },
  { mois: "Juin", ca2024: 82000, ca2025: 102000 },
  { mois: "Juil", ca2024: 80000, ca2025: 99000 },
  { mois: "Août", ca2024: 76000, ca2025: 93000 },
  { mois: "Sep",  ca2024: 85000, ca2025: 110000 },
  { mois: "Oct",  ca2024: 90000, ca2025: 118000 },
  { mois: "Nov",  ca2024: 88000, ca2025: 115000 },
  { mois: "Déc",  ca2024: 95000, ca2025: 125000 },
  { mois: "Jan",  ca2024: 72000, ca2025: 91000 },
  { mois: "Fév",  ca2024: 79000, ca2025: 98000 },
  { mois: "Mar",  ca2024: 86000, ca2025: 108000 },
];

// Nb missions hebdo
export const missionsHebdo = [
  { jour: "Lun", count: 12 },
  { jour: "Mar", count: 18 },
  { jour: "Mer", count: 15 },
  { jour: "Jeu", count: 20 },
  { jour: "Ven", count: 24 },
  { jour: "Sam", count: 28 },
  { jour: "Dim", count: 10 },
];

// Missions récentes (dashboard)
export const missionsRecentes = [
  { id: "M-1092", client: "Mme Dupont",       chauffeur: "Alex Martin",  trajet: "CDG → Paris 8e",        heure: "08:30", tarif: 68,  statut: "terminée"  },
  { id: "M-1093", client: "Société Renault",   chauffeur: "Karim Tazi",   trajet: "Orly → La Défense",     heure: "09:15", tarif: 82,  statut: "en_route"  },
  { id: "M-1094", client: "M. Laurent",        chauffeur: "Sofia Benali", trajet: "Paris 15e → Versailles",heure: "10:00", tarif: 95,  statut: "en_attente"},
  { id: "M-1095", client: "Mme Chen",          chauffeur: "Yacine Ouf",   trajet: "Gare de Lyon → CDG",    heure: "11:30", tarif: 74,  statut: "terminée"  },
  { id: "M-1096", client: "Cabinet PMG",       chauffeur: "Alex Martin",  trajet: "Paris 16e → Beauvais",  heure: "13:00", tarif: 110, statut: "en_attente"},
];

// Chauffeurs
export const chauffeurs = [
  { id: "C-01", prenom: "Alex",   nom: "Martin", phone: "06 12 34 56 78", email: "alex.martin@vtc.fr",  statut: "en_mission",  vehicule: "Mercedes Classe E", immat: "AB-123-CD", missions: 142, ca: 9800, note: 4.8, tauxRealisation: 96, licence: "VTC-2021-0421", licenceExp: "2026-04-20", assuranceExp: "2025-12-31", ctExp: "2025-05-10", avatar: "AM" },
  { id: "C-02", prenom: "Karim",  nom: "Tazi",   phone: "06 23 45 67 89", email: "karim.tazi@vtc.fr",   statut: "disponible",  vehicule: "BMW Série 5",       immat: "EF-456-GH", missions:  98, ca: 7200, note: 4.6, tauxRealisation: 91, licence: "VTC-2022-0155", licenceExp: "2026-10-15", assuranceExp: "2026-03-31", ctExp: "2026-01-20", avatar: "KT" },
  { id: "C-03", prenom: "Sofia",  nom: "Benali", phone: "06 34 56 78 90", email: "sofia.benali@vtc.fr",  statut: "en_mission",  vehicule: "Audi A6",           immat: "IJ-789-KL", missions: 115, ca: 8100, note: 4.9, tauxRealisation: 98, licence: "VTC-2020-0889", licenceExp: "2025-06-30", assuranceExp: "2026-06-30", ctExp: "2025-08-15", avatar: "SB" },
  { id: "C-04", prenom: "Yacine", nom: "Ouf",    phone: "06 45 67 89 01", email: "yacine.ouf@vtc.fr",   statut: "indisponible",vehicule: "Tesla Model 3",     immat: "MN-012-OP", missions:  64, ca: 4900, note: 4.5, tauxRealisation: 87, licence: "VTC-2023-0312", licenceExp: "2027-03-12", assuranceExp: "2026-09-30", ctExp: "2026-04-05", avatar: "YO" },
  { id: "C-05", prenom: "Laura",  nom: "Petit",  phone: "06 56 78 90 12", email: "laura.petit@vtc.fr",  statut: "disponible",  vehicule: "Peugeot 508",       immat: "QR-345-ST", missions:  78, ca: 5600, note: 4.7, tauxRealisation: 93, licence: "VTC-2022-0744", licenceExp: "2026-07-22", assuranceExp: "2026-01-31", ctExp: "2025-11-20", avatar: "LP" },
];

// Clients
export const clients = [
  { id: "CL-01", type: "particulier", nom: "Mme Isabelle Dupont",     email: "i.dupont@gmail.com",         phone: "06 71 23 45 67", ville: "Paris 8e",    missions:  28, ca:  1840, since: "Jan 2024" },
  { id: "CL-02", type: "entreprise",  nom: "Société Renault",          email: "transport@renault.fr",       phone: "01 55 44 33 22", ville: "Boulogne",     missions: 142, ca: 12800, since: "Mar 2023" },
  { id: "CL-03", type: "particulier", nom: "M. Jean-Pierre Laurent",   email: "jplaurent@me.com",           phone: "06 82 34 56 78", ville: "Paris 15e",   missions:  15, ca:  1050, since: "Jun 2024" },
  { id: "CL-04", type: "entreprise",  nom: "Cabinet PMG Avocats",      email: "assistante@pmg-avocats.fr",  phone: "01 44 55 66 77", ville: "Paris 16e",   missions:  67, ca:  8200, since: "Nov 2022" },
  { id: "CL-05", type: "particulier", nom: "Mme Jing Chen",            email: "jing.chen@outlook.com",      phone: "06 93 45 67 89", ville: "Paris 13e",   missions:   9, ca:   620, since: "Sep 2024" },
  { id: "CL-06", type: "entreprise",  nom: "BNP Paribas – DI",         email: "vtc-bnp@bnpparibas.com",     phone: "01 40 14 45 46", ville: "Paris 9e",    missions: 210, ca: 18500, since: "Jan 2022" },
  { id: "CL-07", type: "entreprise",  nom: "AXA France",               email: "deplacement@axa.fr",         phone: "01 55 77 89 00", ville: "Paris 17e",   missions:  88, ca:  7400, since: "May 2023" },
];

// Véhicules
export const voitures = [
  { id: "V-01", marque: "Mercedes", modele: "Classe E 220d", immat: "AB-123-CD", annee: 2022, couleur: "Noir",  chauffeur: "Alex Martin",  statut: "en_service",  assuranceExp: "2025-12-31", ctExp: "2025-05-10", km: 42000 },
  { id: "V-02", marque: "BMW",      modele: "Série 5 530d",  immat: "EF-456-GH", annee: 2021, couleur: "Gris",  chauffeur: "Karim Tazi",   statut: "en_service",  assuranceExp: "2026-03-31", ctExp: "2026-01-20", km: 58000 },
  { id: "V-03", marque: "Audi",     modele: "A6 40 TDI",     immat: "IJ-789-KL", annee: 2023, couleur: "Blanc", chauffeur: "Sofia Benali", statut: "en_service",  assuranceExp: "2026-06-30", ctExp: "2025-08-15", km: 28000 },
  { id: "V-04", marque: "Tesla",    modele: "Model 3 LR",    immat: "MN-012-OP", annee: 2023, couleur: "Blanc", chauffeur: "Yacine Ouf",   statut: "en_revision", assuranceExp: "2026-09-30", ctExp: "2026-04-05", km: 21000 },
  { id: "V-05", marque: "Peugeot",  modele: "508 SW GT",     immat: "QR-345-ST", annee: 2022, couleur: "Noir",  chauffeur: "Laura Petit",  statut: "en_service",  assuranceExp: "2026-01-31", ctExp: "2025-11-20", km: 35000 },
  { id: "V-06", marque: "Mercedes", modele: "Classe V 220d", immat: "UV-678-WX", annee: 2021, couleur: "Noir",  chauffeur: "—",             statut: "disponible",  assuranceExp: "2026-02-28", ctExp: "2026-02-10", km: 62000 },
];

// Missions complètes
export const missions = [
  { id: "M-1092", client: "Mme Dupont",      chauffeur: "Alex Martin",  depart: "CDG Terminal 2E",       arrivee: "Paris 8e – 14 rue du Faubourg",  date: "2025-04-15", heure: "08:30", tarif:  68, statut: "terminée",   paiement: "CB",       facture: "F-2025-0412" },
  { id: "M-1093", client: "Société Renault", chauffeur: "Karim Tazi",   depart: "Orly T3",               arrivee: "La Défense – Tour First",        date: "2025-04-15", heure: "09:15", tarif:  82, statut: "en_route",   paiement: "virement", facture: null },
  { id: "M-1094", client: "M. Laurent",      chauffeur: "Sofia Benali", depart: "Paris 15e – Balard",    arrivee: "Château de Versailles",          date: "2025-04-15", heure: "10:00", tarif:  95, statut: "en_attente", paiement: "CB",       facture: null },
  { id: "M-1095", client: "Mme Chen",        chauffeur: "Yacine Ouf",   depart: "Gare de Lyon",          arrivee: "CDG Terminal 2F",                date: "2025-04-15", heure: "11:30", tarif:  74, statut: "terminée",   paiement: "CB",       facture: "F-2025-0413" },
  { id: "M-1096", client: "Cabinet PMG",     chauffeur: "Alex Martin",  depart: "Paris 16e – Trocadéro", arrivee: "Beauvais – Palais de Justice",   date: "2025-04-15", heure: "13:00", tarif: 110, statut: "en_attente", paiement: "virement", facture: null },
  { id: "M-1089", client: "BNP Paribas",     chauffeur: "Laura Petit",  depart: "Paris 9e – BNP HQ",     arrivee: "CDG T1",                         date: "2025-04-14", heure: "16:00", tarif:  88, statut: "terminée",   paiement: "virement", facture: "F-2025-0411" },
  { id: "M-1090", client: "AXA France",      chauffeur: "Karim Tazi",   depart: "Paris 17e – AXA Siège", arrivee: "Orly T4",                        date: "2025-04-14", heure: "14:30", tarif:  76, statut: "terminée",   paiement: "virement", facture: "F-2025-0410" },
  { id: "M-1091", client: "Mme Dupont",      chauffeur: "Sofia Benali", depart: "Paris 8e – CElysées",   arrivee: "Versailles – Le Grand Trianon",  date: "2025-04-13", heure: "10:30", tarif:  89, statut: "annulée",    paiement: "CB",       facture: null },
];

// Factures
export const factures = [
  { id: "F-2025-0413", client: "Mme Chen",         date: "2025-04-15", montantHT:  66.6, tva:  7.4, montantTTC:   74, statut: "payée",   mission: "M-1095" },
  { id: "F-2025-0412", client: "Mme Dupont",        date: "2025-04-15", montantHT:  61.2, tva:  6.8, montantTTC:   68, statut: "payée",   mission: "M-1092" },
  { id: "F-2025-0411", client: "BNP Paribas",       date: "2025-04-14", montantHT:  79.2, tva:  8.8, montantTTC:   88, statut: "payée",   mission: "M-1089" },
  { id: "F-2025-0410", client: "AXA France",        date: "2025-04-14", montantHT:  68.4, tva:  7.6, montantTTC:   76, statut: "payée",   mission: "M-1090" },
  { id: "F-2025-0409", client: "Société Renault",   date: "2025-04-10", montantHT: 1160,  tva: 116,  montantTTC: 1280, statut: "impayée", mission: "multiple" },
  { id: "F-2025-0408", client: "Cabinet PMG",       date: "2025-04-08", montantHT:  960,  tva:  96,  montantTTC: 1060, statut: "impayée", mission: "multiple" },
  { id: "F-2025-0407", client: "BNP Paribas",       date: "2025-04-05", montantHT: 1620,  tva: 162,  montantTTC: 1782, statut: "payée",   mission: "multiple" },
];

// Tarifs
export const tarifs = [
  { id: "T-01", nom: "Standard jour",   base: 3.5, km: 1.8, attente: 0.5, minGarantie: 18, applicable: "06h–20h",     actif: true  },
  { id: "T-02", nom: "Standard nuit",   base: 4.5, km: 2.2, attente: 0.7, minGarantie: 22, applicable: "20h–06h",     actif: true  },
  { id: "T-03", nom: "Aéroport CDG",    base: 5.0, km: 2.0, attente: 0.6, minGarantie: 55, applicable: "Forfait",      actif: true  },
  { id: "T-04", nom: "Aéroport Orly",   base: 5.0, km: 2.0, attente: 0.6, minGarantie: 45, applicable: "Forfait",      actif: true  },
  { id: "T-05", nom: "Longue distance", base: 4.0, km: 1.6, attente: 0.5, minGarantie: 80, applicable: "> 80 km",      actif: true  },
  { id: "T-06", nom: "Van / Groupe",    base: 6.0, km: 2.5, attente: 0.9, minGarantie: 35, applicable: "Tout horaire", actif: false },
];

// Notifications
export const notifications = [
  { id: 1, type: "alerte",   titre: "Contrôle technique expiré",      message: "Le CT du véhicule AB-123-CD (Alex Martin) a expiré le 10/05/2025.",                      date: "Il y a 2h",    lu: false },
  { id: 2, type: "mission",  titre: "Nouvelle mission assignée",       message: "Mission M-1096 assignée à Alex Martin – Paris 16e → Beauvais.",                          date: "Il y a 3h",    lu: false },
  { id: 3, type: "paiement", titre: "Impayé – Société Renault",        message: "La facture F-2025-0409 (1 280 €) est en attente de règlement depuis 5 jours.",            date: "Il y a 5h",    lu: false },
  { id: 4, type: "chauffeur",titre: "Karim Tazi – Disponible",         message: "Karim Tazi est maintenant disponible (fin de mission M-1090).",                           date: "Il y a 6h",    lu: true  },
  { id: 5, type: "alerte",   titre: "Licence VTC – Expiration proche", message: "La licence de Sofia Benali expire le 30/06/2025. Renouvellement à prévoir.",               date: "Hier",         lu: true  },
  { id: 6, type: "systeme",  titre: "Export comptable disponible",     message: "L'export comptable du mois de mars 2025 est disponible en téléchargement.",               date: "Hier",         lu: true  },
  { id: 7, type: "mission",  titre: "Mission annulée",                 message: "La mission M-1091 (Mme Dupont → Versailles) a été annulée par le client.",                date: "Il y a 2 jours", lu: true  },
];

// Stats par chauffeur
export const statsParChauffeur = [
  { chauffeur: "Alex Martin",  missions: 142, ca: 9800, note: 4.8 },
  { chauffeur: "Sofia Benali", missions: 115, ca: 8100, note: 4.9 },
  { chauffeur: "Karim Tazi",   missions:  98, ca: 7200, note: 4.6 },
  { chauffeur: "Laura Petit",  missions:  78, ca: 5600, note: 4.7 },
  { chauffeur: "Yacine Ouf",   missions:  64, ca: 4900, note: 4.5 },
];

// Stats par client
export const statsParClient = [
  { client: "BNP Paribas",      missions: 210, ca: 18500 },
  { client: "Société Renault",  missions: 142, ca: 12800 },
  { client: "AXA France",       missions:  88, ca:  7400 },
  { client: "Cabinet PMG",      missions:  67, ca:  8200 },
  { client: "Mme Dupont",       missions:  28, ca:  1840 },
];

// Compat legacy
export const revenueData = caMensuel.map((d) => ({ date: d.mois, mrr: d.ca2025 }));
