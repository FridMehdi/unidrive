"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BellIcon, AlertTriangleIcon, CarIcon, BanknoteIcon, UserIcon, 
  SettingsIcon, CheckCheck, FileTextIcon, TruckIcon, CheckCircleIcon,
  XCircleIcon, MapPinIcon, Loader2Icon
} from "lucide-react";
import { notificationApi, InAppNotification } from "@/lib/api";

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  sharing_request:         { icon: FileTextIcon,     color: "#3b82f6", bg: "#3b82f618", label: "Demande d'accès" },
  sharing_approved:        { icon: CheckCircleIcon,  color: "#22c55e", bg: "#22c55e18", label: "Accès approuvé" },
  sharing_rejected:        { icon: XCircleIcon,      color: "#ef4444", bg: "#ef444418", label: "Accès refusé" },
  profile_approved:        { icon: CheckCircleIcon,  color: "#22c55e", bg: "#22c55e18", label: "Profil validé" },
  profile_rejected:        { icon: XCircleIcon,      color: "#ef4444", bg: "#ef444418", label: "Profil refusé" },
  vehicle_sharing_request: { icon: TruckIcon,        color: "#3b82f6", bg: "#3b82f618", label: "Demande véhicule" },
  vehicle_sharing_approved:{ icon: CheckCircleIcon,  color: "#22c55e", bg: "#22c55e18", label: "Véhicule approuvé" },
  vehicle_sharing_rejected:{ icon: XCircleIcon,      color: "#ef4444", bg: "#ef444418", label: "Véhicule refusé" },
  vehicle_approved:        { icon: CheckCircleIcon,  color: "#22c55e", bg: "#22c55e18", label: "Véhicule validé" },
  vehicle_rejected:        { icon: XCircleIcon,      color: "#ef4444", bg: "#ef444418", label: "Véhicule refusé" },
  mission_assigned:        { icon: MapPinIcon,       color: "#3b82f6", bg: "#3b82f618", label: "Mission" },
  document_expired:        { icon: AlertTriangleIcon,color: "#ef4444", bg: "#ef444418", label: "Document expiré" },
  document_expiring_soon:  { icon: AlertTriangleIcon,color: "#f59e0b", bg: "#f59e0b18", label: "Expiration proche" },
  alerte:                  { icon: AlertTriangleIcon,color: "#f59e0b", bg: "#f59e0b18", label: "Alerte" },
  mission:                 { icon: CarIcon,          color: "#3b82f6", bg: "#3b82f618", label: "Mission" },
  paiement:                { icon: BanknoteIcon,     color: "#22c55e", bg: "#22c55e18", label: "Paiement" },
  chauffeur:               { icon: UserIcon,         color: "#8b5cf6", bg: "#8b5cf618", label: "Chauffeur" },
  systeme:                 { icon: SettingsIcon,     color: "#64748b", bg: "#64748b18", label: "Système" },
};

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function Notifications() {
  const router = useRouter();
  const [items, setItems] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationApi.list({ limit: 100 });
      setItems(response.notifications);
    } catch (error) {
      console.error("Erreur chargement notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const unread = items.filter((n) => !n.is_read);
  const read = items.filter((n) => n.is_read);

  const markAllRead = async () => {
    try {
      setMarkingAll(true);
      await notificationApi.markAllAsRead();
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
    } catch (error) {
      console.error("Erreur marquage notifications:", error);
    } finally {
      setMarkingAll(false);
    }
  };

  const markRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setItems((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n));
    } catch (error) {
      console.error("Erreur marquage notification:", error);
    }
  };

  const handleClick = (notification: InAppNotification) => {
    markRead(notification.id);
    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  const NotifItem = ({ n }: { n: InAppNotification }) => {
    const tc = typeConfig[n.type] ?? typeConfig.systeme;
    const Icon = tc.icon;
    
    // Utiliser l'icône custom si présente dans data (pour les emojis)
    const customIcon = n.data?.icon || n.icon;
    const showCustomIcon = customIcon && (customIcon.length <= 2); // Emoji

    return (
      <div
        onClick={() => handleClick(n)}
        className={`flex items-start gap-4 px-5 py-4 border-b border-border transition-colors cursor-pointer ${!n.is_read ? "bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20" : "hover:bg-neutral-50 dark:hover:bg-neutral-900"}`}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: tc.bg }}>
          {showCustomIcon ? (
            <span className="text-lg">{customIcon}</span>
          ) : (
            <Icon className="w-4 h-4" style={{ color: tc.color }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm ${!n.is_read ? "font-semibold" : "font-medium"}`}>{n.title}</p>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-muted-foreground">{getRelativeTime(n.created_at)}</span>
              {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 leading-snug">{n.message}</p>
          <span className="text-xs px-2 py-0.5 rounded-full mt-1.5 inline-block font-medium" style={{ color: tc.color, backgroundColor: tc.bg }}>{tc.label}</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <div className="w-full sticky top-0 z-50 bg-white dark:bg-neutral-950 flex-shrink-0 flex flex-row h-16 items-center px-6 border-b border-neutral-200 dark:border-neutral-800">
          <h1 className="text-lg font-bold">Notifications</h1>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2Icon className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="w-full sticky top-0 z-50 bg-white dark:bg-neutral-950 flex-shrink-0 flex flex-row h-16 items-center px-6 border-b border-neutral-200 dark:border-neutral-800 justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold">Notifications</h1>
          {unread.length > 0 && (
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unread.length}</span>
          )}
        </div>
        {unread.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={markAllRead} 
            disabled={markingAll}
            className="gap-1.5 text-xs"
          >
            {markingAll ? (
              <Loader2Icon className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCheck className="w-3.5 h-3.5" />
            )}
            Tout marquer comme lu
          </Button>
        )}
      </div>

      <div className="max-w-3xl w-full mx-auto p-6 space-y-4">
        {unread.length > 0 && (
          <Card className="border-none shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-neutral-50 dark:bg-neutral-900 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Non lues ({unread.length})</p>
            </div>
            {unread.map((n) => <NotifItem key={n.id} n={n} />)}
          </Card>
        )}

        {read.length > 0 && (
          <Card className="border-none shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-neutral-50 dark:bg-neutral-900 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Précédentes ({read.length})</p>
            </div>
            {read.map((n) => <NotifItem key={n.id} n={n} />)}
          </Card>
        )}

        {items.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <BellIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucune notification</p>
          </div>
        )}
      </div>
    </>
  );
}
