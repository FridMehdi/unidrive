import { router } from 'expo-router';

/**
 * Navigue vers le bon écran en fonction d'une action_url ou d'une data.screen
 * provenant d'une notification in-app ou push.
 */
export function navigateFromNotification(actionUrl?: string | null, screen?: string | null) {
  const url = actionUrl ?? '';

  if (url) {
    // Véhicule précis : /chauffeur/vehicules?vehicle_id=UUID
    const vehicleWithIdMatch = url.match(/\/chauffeur\/vehicules\?vehicle_id=([^&]+)/);
    if (vehicleWithIdMatch) {
      router.push(`/chauffeur/screens/mon-vehicule?id=${vehicleWithIdMatch[1]}` as any);
      return;
    }

    // Liste véhicules
    if (url === '/chauffeur/vehicules') {
      router.push('/chauffeur/screens/mes-vehicules' as any);
      return;
    }

    // Documents légaux
    if (url.includes('documents-legaux')) {
      router.push('/chauffeur/screens/documents-legaux' as any);
      return;
    }

    // Profil / demandes
    if (
      url.includes('/chauffeur/profile') ||
      url.includes('demandes-partage') ||
      url.includes('demandes-vehicules')
    ) {
      router.push('/chauffeur/(tabs)/profil' as any);
      return;
    }

    // Mission précise
    const missionMatch = url.match(/\/missions\/([^?&/]+)/);
    if (missionMatch) {
      router.push(`/chauffeur/screens/mission-detail?id=${missionMatch[1]}` as any);
      return;
    }
  }

  // Fallback sur le champ screen de la data push
  if (screen) {
    const screenMap: Record<string, string> = {
      DocumentsLegaux:  '/chauffeur/screens/documents-legaux',
      MesVehicules:     '/chauffeur/screens/mes-vehicules',
      MonVehicule:      '/chauffeur/screens/mon-vehicule',
      Profil:           '/chauffeur/(tabs)/profil',
      Notifications:    '/screens/notifications',
    };
    const route = screenMap[screen];
    if (route) router.push(route as any);
  }
}
