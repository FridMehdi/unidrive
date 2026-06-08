"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { BuildingIcon, Loader2Icon, SearchIcon, CheckIcon, XCircleIcon } from "lucide-react";

// Résultat normalisé de l'API gouvernementale
export interface EntrepriseResult {
  siret: string;         // SIRET du siège
  siren: string;
  raison_sociale: string;
  nom_commercial: string | null;
  numero_tva:     string | null;
  adresse:        string;
  code_postal:    string;
  ville:          string;
  activite:       string | null; // NAF libellé
  tranche:        string | null; // tranche effectif
}

interface Props {
  onSelect: (e: EntrepriseResult) => void;
  /** Valeur initiale affichée dans le champ (ex: raison_sociale en mode edit) */
  defaultValue?: string;
  className?: string;
}

const BASE_URL = "https://recherche-entreprises.api.gouv.fr/search";

async function searchEntreprises(q: string): Promise<EntrepriseResult[]> {
  const url = `${BASE_URL}?q=${encodeURIComponent(q)}&page=1&per_page=8&is_siege=true`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();

  return (data.results ?? []).map((r: {
    siren: string;
    siege: {
      siret: string;
      adresse?: string;
      code_postal?: string;
      libelle_commune?: string;
    };
    nom_raison_sociale?: string;
    nom_complet?: string;
    numero_tva_intra?: string;
    activite_principale_registre_metiers?: string;
    libelle_activite_principale?: string[];
    tranche_effectif_salarie?: string;
  }): EntrepriseResult => {
    const siege = r.siege ?? {};
    const tva   = r.numero_tva_intra ?? null;
    const activLabel = r.libelle_activite_principale?.[0] ?? null;

    return {
      siren:         r.siren,
      siret:         siege.siret ?? "",
      raison_sociale: r.nom_raison_sociale ?? r.nom_complet ?? "",
      nom_commercial: r.nom_complet !== r.nom_raison_sociale ? (r.nom_complet ?? null) : null,
      numero_tva:    tva ? `FR${tva}` : null,
      adresse:       siege.adresse ?? "",
      code_postal:   siege.code_postal ?? "",
      ville:         siege.libelle_commune ?? "",
      activite:      activLabel,
      tranche:       r.tranche_effectif_salarie ?? null,
    };
  });
}

const DEFAULT_CLS =
  "w-full h-9 rounded-lg border border-input bg-background pl-9 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export default function EntrepriseSearch({ onSelect, defaultValue = "", className }: Props) {
  const [query,       setQuery]       = useState(defaultValue);
  const [results,     setResults]     = useState<EntrepriseResult[]>([]);
  const [open,        setOpen]        = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [selected,    setSelected]    = useState<EntrepriseResult | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const list = await searchEntreprises(q);
      setResults(list);
      setOpen(list.length > 0);
    } catch {
      setResults([]);
    } finally { setLoading(false); }
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    setSelected(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(v), 350);
  };

  const handleSelect = (r: EntrepriseResult) => {
    setQuery(r.raison_sociale);
    setSelected(r);
    setResults([]);
    setOpen(false);
    onSelect(r);
  };

  const handleClear = () => {
    setQuery("");
    setSelected(null);
    setResults([]);
    setOpen(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />

        <input
          type="text"
          value={query}
          onChange={handleInput}
          placeholder="Rechercher par nom, SIRET, SIREN…"
          className={`${className ?? DEFAULT_CLS} ${selected ? "border-green-400 focus:ring-green-400" : ""}`}
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
          {loading && <Loader2Icon className="w-3.5 h-3.5 text-muted-foreground animate-spin" />}
          {!loading && selected && <CheckIcon className="w-3.5 h-3.5 text-green-500" />}
          {!loading && !selected && query && (
            <button type="button" onClick={handleClear} tabIndex={-1}>
              <XCircleIcon className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground transition-colors" />
            </button>
          )}
        </div>
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-neutral-900 border border-border rounded-xl shadow-xl overflow-hidden">
          {results.map((r) => (
            <button
              key={r.siret}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(r); }}
              className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-blue-50 dark:hover:bg-neutral-800 transition-colors border-b border-border/50 last:border-0"
            >
              <div className="mt-0.5 w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                <BuildingIcon className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{r.raison_sociale}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-muted-foreground font-mono">{r.siret}</span>
                  {r.ville && <span className="text-xs text-muted-foreground">· {r.ville}</span>}
                  {r.activite && <span className="text-xs text-muted-foreground truncate max-w-[180px]">· {r.activite}</span>}
                </div>
              </div>
            </button>
          ))}
          <div className="px-3 py-1.5 flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/50">
            <span className="text-[10px] text-muted-foreground">recherche-entreprises.api.gouv.fr</span>
            <span className="text-[10px] text-green-600 font-medium">✓ Données officielles</span>
          </div>
        </div>
      )}

      {selected && (
        <div className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1">
          <CheckIcon className="w-3 h-3 text-green-500" />
          Infos remplies automatiquement — vous pouvez les modifier ci-dessous
        </div>
      )}
    </div>
  );
}
