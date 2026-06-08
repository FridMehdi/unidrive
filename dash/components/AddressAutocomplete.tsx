"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MapPinIcon, Loader2Icon, XCircleIcon } from "lucide-react";

interface Suggestion {
  placeId: string;
  description: string;
  main: string;
  secondary: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  label?: string;
}

const DEFAULT_CLS =
  "w-full h-9 rounded-lg border border-input bg-background px-9 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Tapez une adresse…",
  required,
  className,
  label,
}: Props) {
  const [query,       setQuery]       = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open,        setOpen]        = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [focused,     setFocused]     = useState(false);
  const containerRef  = useRef<HTMLDivElement>(null);
  const debounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync value → query quand le parent change (ex: swap d'adresse)
  useEffect(() => { setQuery(value); }, [value]);

  const search = useCallback(async (q: string) => {
    if (q.length < 3) { setSuggestions([]); setOpen(false); return; }
    setLoading(true);
    try {
      // Appel au backend geolocation-service qui proxy Google Places API
      const geoServiceUrl = process.env.NEXT_PUBLIC_GEOLOCATION_SERVICE_URL || 'https://api.u-drive.ai';
      const res = await fetch(`${geoServiceUrl}/api/geo/places/autocomplete?input=${encodeURIComponent(q)}`);
      const data = await res.json();
      
      setSuggestions(data.suggestions ?? []);
      setOpen((data.suggestions ?? []).length > 0);
    } catch (err) {
      console.error("Erreur autocomplétion adresse:", err);
      setSuggestions([]);
    } finally { setLoading(false); }
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    onChange(v); // met à jour parent immédiatement pour garder le champ contrôlé

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(v), 300);
  };

  const handleSelect = (s: Suggestion) => {
    setQuery(s.description);
    onChange(s.description);
    setSuggestions([]);
    setOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    onChange("");
    setSuggestions([]);
    setOpen(false);
  };

  // Fermeture au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const lbl = "block text-xs font-medium text-muted-foreground mb-1";

  return (
    <div ref={containerRef} className="relative">
      {label && <label className={lbl}>{label}</label>}
      <div className="relative">
        {/* Icône gauche */}
        <MapPinIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />

        <input
          type="text"
          required={required}
          value={query}
          onChange={handleInput}
          onFocus={() => { setFocused(true); if (suggestions.length > 0) setOpen(true); }}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className={className ?? DEFAULT_CLS}
        />

        {/* Loader / Clear */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
          {loading && <Loader2Icon className="w-3.5 h-3.5 text-muted-foreground animate-spin" />}
          {!loading && query && (
            <button type="button" onClick={handleClear} tabIndex={-1}>
              <XCircleIcon className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground transition-colors" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown suggestions */}
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-neutral-900 border border-border rounded-xl shadow-xl overflow-hidden">
          {suggestions.map((s) => (
            <button
              key={s.placeId}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
              className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-blue-50 dark:hover:bg-neutral-800 transition-colors group"
            >
              <MapPinIcon className="w-3.5 h-3.5 mt-0.5 text-blue-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{s.main}</p>
                <p className="text-xs text-muted-foreground truncate">{s.secondary}</p>
              </div>
            </button>
          ))}
          <div className="px-3 py-1.5 border-t border-border flex items-center justify-end gap-1">
            <span className="text-[10px] text-muted-foreground">propulsé par</span>
            <span className="text-[10px] font-medium text-blue-500">Google Maps</span>
          </div>
        </div>
      )}

      {/* Fallback discret si aucun résultat */}
      {focused && query.length >= 3 && !loading && suggestions.length === 0 && !open && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-neutral-900 border border-border rounded-xl shadow px-3 py-2">
          <p className="text-xs text-muted-foreground">Aucune adresse trouvée — vous pouvez continuer en saisie libre</p>
        </div>
      )}
    </div>
  );
}
