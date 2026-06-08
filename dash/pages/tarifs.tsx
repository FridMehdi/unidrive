"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon, PencilIcon, TrashIcon, RefreshCwIcon, Loader2Icon, DollarSignIcon, ClockIcon, RouteIcon, SunIcon, MoonIcon, PlaneIcon, TruckIcon } from "lucide-react";
import { tarificationApi, type Tarification } from "@/lib/api";

const TYPE_TARIF_CONFIG = {
  standard_jour:   { label: "Standard Jour",    icon: SunIcon,   color: "#f59e0b", bg: "#f59e0b18" },
  standard_nuit:   { label: "Standard Nuit",    icon: MoonIcon,  color: "#8b5cf6", bg: "#8b5cf618" },
  aeroport:        { label: "Aéroport",         icon: PlaneIcon, color: "#3b82f6", bg: "#3b82f618" },
  longue_distance: { label: "Longue Distance",  icon: RouteIcon, color: "#10b981", bg: "#10b98118" },
  van_groupe:      { label: "Van/Groupe",       icon: TruckIcon, color: "#ec4899", bg: "#ec489918" },
};

const emptyForm: Partial<Tarification> = {
  nom: "",
  type_tarif: "standard_jour",
  prise_en_charge: 0,
  prix_km: 0,
  prix_minute_attente: 0,
  minimum_garanti: 0,
  plage_horaire_debut: null,
  plage_horaire_fin: null,
  distance_min_km: null,
  distance_max_km: null,
  actif: true,
  description: null,
};

// Helper pour formater les prix (PostgreSQL NUMERIC revient comme string)
const formatPrice = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

// Helper pour normaliser un tarif (convertir strings en numbers)
const normalizeTarif = (tarif: Tarification): Tarification => ({
  ...tarif,
  prise_en_charge: typeof tarif.prise_en_charge === 'string' 
    ? parseFloat(tarif.prise_en_charge) 
    : tarif.prise_en_charge,
  prix_km: typeof tarif.prix_km === 'string' 
    ? parseFloat(tarif.prix_km) 
    : tarif.prix_km,
  prix_minute_attente: typeof tarif.prix_minute_attente === 'string' 
    ? parseFloat(tarif.prix_minute_attente) 
    : tarif.prix_minute_attente,
  minimum_garanti: typeof tarif.minimum_garanti === 'string' 
    ? parseFloat(tarif.minimum_garanti) 
    : tarif.minimum_garanti,
  distance_min_km: tarif.distance_min_km && typeof tarif.distance_min_km === 'string'
    ? parseFloat(tarif.distance_min_km)
    : tarif.distance_min_km,
  distance_max_km: tarif.distance_max_km && typeof tarif.distance_max_km === 'string'
    ? parseFloat(tarif.distance_max_km)
    : tarif.distance_max_km,
});

export default function TarifsPage() {
  const [tarifs, setTarifs]       = useState<Tarification[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode]   = useState(false);
  const [form, setForm]           = useState<Partial<Tarification>>(emptyForm);
  const [saving, setSaving]       = useState(false);

  const loadTarifs = async () => {
    setLoading(true);
    try {
      const { data } = await tarificationApi.list();
      // Normaliser les tarifs (convertir strings en numbers)
      setTarifs(data.map(normalizeTarif));
    } catch (err) {
      console.error("Erreur chargement tarifs:", err);
      alert("Erreur lors du chargement des tarifs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTarifs(); }, []);

  const handleCreate = () => {
    setForm(emptyForm);
    setEditMode(false);
    setShowModal(true);
  };

  const handleEdit = (tarif: Tarification) => {
    // Normaliser le tarif avant de le mettre dans le formulaire
    setForm(normalizeTarif(tarif));
    setEditMode(true);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nom || !form.type_tarif) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setSaving(true);
    try {
      // Convertir les strings en numbers (PostgreSQL NUMERIC revient comme string)
      const payload = {
        ...form,
        prise_en_charge: typeof form.prise_en_charge === 'string' 
          ? parseFloat(form.prise_en_charge) 
          : form.prise_en_charge,
        prix_km: typeof form.prix_km === 'string' 
          ? parseFloat(form.prix_km) 
          : form.prix_km,
        prix_minute_attente: typeof form.prix_minute_attente === 'string' 
          ? parseFloat(form.prix_minute_attente) 
          : form.prix_minute_attente,
        minimum_garanti: typeof form.minimum_garanti === 'string' 
          ? parseFloat(form.minimum_garanti) 
          : form.minimum_garanti,
        distance_min_km: form.distance_min_km && typeof form.distance_min_km === 'string'
          ? parseFloat(form.distance_min_km)
          : form.distance_min_km,
        distance_max_km: form.distance_max_km && typeof form.distance_max_km === 'string'
          ? parseFloat(form.distance_max_km)
          : form.distance_max_km,
      };

      if (editMode && form.id) {
        await tarificationApi.update(form.id, payload);
      } else {
        await tarificationApi.create(payload);
      } 
      setShowModal(false);
      await loadTarifs();
    } catch (err: any) {
      console.error("Erreur sauvegarde:", err);
      alert(err.message || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce tarif ?")) return;
    
    try {
      await tarificationApi.remove(id);
      await loadTarifs();
    } catch (err) {
      console.error("Erreur suppression:", err);
      alert("Erreur lors de la suppression");
    }
  };

  const handleToggleActif = async (tarif: Tarification) => {
    try {
      await tarificationApi.update(tarif.id, { actif: !tarif.actif });
      await loadTarifs();
    } catch (err) {
      console.error("Erreur toggle actif:", err);
      alert("Erreur lors de la mise à jour");
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tarification</h1>
          <p className="text-muted-foreground mt-1">Gérez les tarifs de vos courses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadTarifs}>
            <RefreshCwIcon className="w-4 h-4 mr-2" /> Actualiser
          </Button>
          <Button onClick={handleCreate}>
            <PlusIcon className="w-4 h-4 mr-2" /> Nouveau tarif
          </Button>
        </div>
      </div>

      {/* Tarifs Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2Icon className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : tarifs.length === 0 ? (
        <Card className="p-12 text-center">
          <DollarSignIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Aucun tarif configuré</p>
          <Button className="mt-4" onClick={handleCreate}>
            <PlusIcon className="w-4 h-4 mr-2" /> Créer un tarif
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tarifs.map((tarif) => {
            const config = TYPE_TARIF_CONFIG[tarif.type_tarif];
            const Icon = config?.icon || DollarSignIcon;
            
            return (
              <Card key={tarif.id} className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: config?.bg || "#f3f4f6" }}
                    >
                      <Icon className="w-5 h-5" style={{ color: config?.color || "#6b7280" }} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{tarif.nom}</h3>
                      <p className="text-xs text-muted-foreground">{config?.label || tarif.type_tarif}</p>
                    </div>
                  </div>
                  <Switch 
                    checked={tarif.actif}
                    onCheckedChange={() => handleToggleActif(tarif)}
                  />
                </div>

                {/* Prix */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prise en charge</span>
                    <span className="font-medium">{formatPrice(tarif.prise_en_charge)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prix / km</span>
                    <span className="font-medium">{formatPrice(tarif.prix_km)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prix / min attente</span>
                    <span className="font-medium">{formatPrice(tarif.prix_minute_attente)} €</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-muted-foreground font-semibold">Minimum garanti</span>
                    <span className="font-bold">{formatPrice(tarif.minimum_garanti)} €</span>
                  </div>
                </div>

                {/* Conditions */}
                {(tarif.plage_horaire_debut || tarif.distance_min_km) && (
                  <div className="space-y-1 text-xs text-muted-foreground border-t pt-3">
                    {tarif.plage_horaire_debut && tarif.plage_horaire_fin && (
                      <div className="flex items-center gap-2">
                        <ClockIcon className="w-3 h-3" />
                        <span>{tarif.plage_horaire_debut} - {tarif.plage_horaire_fin}</span>
                      </div>
                    )}
                    {(tarif.distance_min_km || tarif.distance_max_km) && (
                      <div className="flex items-center gap-2">
                        <RouteIcon className="w-3 h-3" />
                        <span>
                          {tarif.distance_min_km && `≥ ${tarif.distance_min_km} km`}
                          {tarif.distance_min_km && tarif.distance_max_km && " · "}
                          {tarif.distance_max_km && `≤ ${tarif.distance_max_km} km`}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEdit(tarif)}
                  >
                    <PencilIcon className="w-3 h-3 mr-1" /> Modifier
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDelete(tarif.id)}
                  >
                    <TrashIcon className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Création/Edition */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editMode ? "Modifier le tarif" : "Nouveau tarif"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nom */}
            <div className="space-y-2">
              <Label htmlFor="nom">Nom du tarif *</Label>
              <Input
                id="nom"
                value={form.nom || ""}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder="Ex: Standard Jour"
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type_tarif">Type de tarif *</Label>
              <Select
                value={form.type_tarif}
                onValueChange={(val) => setForm({ ...form, type_tarif: val as Tarification['type_tarif'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_TARIF_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prix */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prise_en_charge">Prise en charge (€)</Label>
                <Input
                  id="prise_en_charge"
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.prise_en_charge || 0}
                  onChange={(e) => setForm({ ...form, prise_en_charge: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prix_km">Prix / km (€)</Label>
                <Input
                  id="prix_km"
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.prix_km || 0}
                  onChange={(e) => setForm({ ...form, prix_km: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prix_minute_attente">Prix / min attente (€)</Label>
                <Input
                  id="prix_minute_attente"
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.prix_minute_attente || 0}
                  onChange={(e) => setForm({ ...form, prix_minute_attente: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimum_garanti">Minimum garanti (€)</Label>
                <Input
                  id="minimum_garanti"
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.minimum_garanti || 0}
                  onChange={(e) => setForm({ ...form, minimum_garanti: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Plage horaire */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plage_horaire_debut">Heure début</Label>
                <Input
                  id="plage_horaire_debut"
                  type="time"
                  value={form.plage_horaire_debut || ""}
                  onChange={(e) => setForm({ ...form, plage_horaire_debut: e.target.value || null })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plage_horaire_fin">Heure fin</Label>
                <Input
                  id="plage_horaire_fin"
                  type="time"
                  value={form.plage_horaire_fin || ""}
                  onChange={(e) => setForm({ ...form, plage_horaire_fin: e.target.value || null })}
                />
              </div>
            </div>

            {/* Distance */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="distance_min_km">Distance min (km)</Label>
                <Input
                  id="distance_min_km"
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.distance_min_km || ""}
                  onChange={(e) => setForm({ ...form, distance_min_km: e.target.value ? parseFloat(e.target.value) : null })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="distance_max_km">Distance max (km)</Label>
                <Input
                  id="distance_max_km"
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.distance_max_km || ""}
                  onChange={(e) => setForm({ ...form, distance_max_km: e.target.value ? parseFloat(e.target.value) : null })}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value || null })}
                placeholder="Description optionnelle du tarif"
                rows={3}
              />
            </div>

            {/* Actif */}
            <div className="flex items-center space-x-2">
              <Switch
                id="actif"
                checked={form.actif || false}
                onCheckedChange={(checked) => setForm({ ...form, actif: checked })}
              />
              <Label htmlFor="actif">Tarif actif</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />}
              {editMode ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
