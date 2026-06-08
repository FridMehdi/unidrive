import type { NextApiRequest, NextApiResponse } from "next";

// Proxy server-side Google Places Autocomplete — France uniquement
// La clé reste côté serveur, jamais exposée au client
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { input } = req.query;
  if (!input || typeof input !== "string" || input.length < 3) {
    return res.status(400).json({ suggestions: [] });
  }

  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "GOOGLE_MAPS_API_KEY manquant" });
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
  url.searchParams.set("input",      input);
  url.searchParams.set("key",        key);
  url.searchParams.set("language",   "fr");
  url.searchParams.set("components", "country:fr");  // France uniquement
  // Pas de restriction "types" → retourne adresses + aéroports + gares + hôtels + établissements

  try {
    const gRes = await fetch(url.toString());
    const data = await gRes.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      // Fallback BAN si Google retourne une erreur
      const banUrl = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(input)}&limit=7&autocomplete=1`;
      const banRes = await fetch(banUrl);
      const ban    = await banRes.json();
      const suggestions = (ban.features ?? []).map((f: {
        properties: { id: string; label: string; name: string; postcode: string; city: string };
      }) => ({
        placeId:     f.properties.id,
        description: f.properties.label,
        main:        f.properties.name,
        secondary:   `${f.properties.postcode} ${f.properties.city}`,
      }));
      return res.json({ suggestions, source: "ban" });
    }

    const suggestions = (data.predictions ?? []).map((p: {
      place_id: string;
      description: string;
      structured_formatting: { main_text: string; secondary_text: string };
    }) => ({
      placeId:     p.place_id,
      description: p.description,
      main:        p.structured_formatting.main_text,
      secondary:   p.structured_formatting.secondary_text,
    }));

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");
    return res.json({ suggestions, source: "google" });
  } catch {
    return res.status(502).json({ suggestions: [] });
  }
}


