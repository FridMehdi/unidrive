import type { NextApiRequest, NextApiResponse } from "next";

export interface DistanceResult {
  distance_km:   number;
  duree_minutes: number;
  distance_text: string;
  duree_text:    string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { origin, destination } = req.query;
  if (!origin || !destination || typeof origin !== "string" || typeof destination !== "string") {
    return res.status(400).json({ error: "origin et destination requis" });
  }

  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return res.status(500).json({ error: "GOOGLE_MAPS_API_KEY manquant" });

  const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
  url.searchParams.set("origins",      origin);
  url.searchParams.set("destinations", destination);
  url.searchParams.set("key",          key);
  url.searchParams.set("language",     "fr");
  url.searchParams.set("region",       "fr");
  url.searchParams.set("units",        "metric");

  try {
    const gRes = await fetch(url.toString());
    const data = await gRes.json();

    const element = data.rows?.[0]?.elements?.[0];
    if (!element || element.status !== "OK") {
      return res.status(422).json({ error: "Impossible de calculer la distance entre ces adresses" });
    }

    const result: DistanceResult = {
      distance_km:   Math.round((element.distance.value / 1000) * 10) / 10,
      duree_minutes: Math.round(element.duration.value / 60),
      distance_text: element.distance.text,
      duree_text:    element.duration.text,
    };

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    return res.json(result);
  } catch {
    return res.status(502).json({ error: "Erreur Google Distance Matrix" });
  }
}
