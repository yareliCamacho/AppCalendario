import * as Location from 'expo-location';

/**
 * Mapas y búsqueda 100% gratis: OpenStreetMap (Nominatim) + geocodificador del dispositivo.
 * No requiere EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ni tarjeta en Google Cloud.
 */
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const NOMINATIM_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'NosotrosCoupleApp/1.0 (expo; ubicacion)',
};

export type PlaceSuggestion = {
  name: string;
  subtitle?: string;
  placeId: string;
  latitude: number;
  longitude: number;
};

type NominatimResult = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    country?: string;
  };
};

function dedupePlaces(items: PlaceSuggestion[]): PlaceSuggestion[] {
  const seen = new Set<string>();
  return items.filter((p) => {
    const key = `${p.latitude.toFixed(5)}:${p.longitude.toFixed(5)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function looksLikeCoordinates(text: string): boolean {
  const t = text.trim();
  return /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/.test(t) || /^-?\d+\.\d{3,}/.test(t);
}

function labelFromNominatim(r: NominatimResult, fallback: string): { name: string; subtitle?: string } {
  const addr = r.address;
  const name =
    addr?.city ??
    addr?.town ??
    addr?.village ??
    addr?.municipality ??
    r.display_name.split(',')[0]?.trim() ??
    fallback;
  const subtitle = [addr?.state, addr?.country].filter(Boolean).join(', ') || undefined;
  if (subtitle && !looksLikeCoordinates(subtitle)) {
    return { name, subtitle };
  }
  const parts = r.display_name.split(',').slice(1, 3).join(',').trim();
  return { name, subtitle: parts || undefined };
}

async function searchNominatim(
  query: string,
  nearLat?: number,
  nearLng?: number,
): Promise<PlaceSuggestion[]> {
  const searchText = query.length < 24 && !query.includes(',') ? `${query}, México` : query;
  const viewbox =
    nearLat != null && nearLng != null
      ? `&viewbox=${nearLng - 0.8},${nearLat + 0.8},${nearLng + 0.8},${nearLat - 0.8}&bounded=1`
      : '&countrycodes=mx';
  const url =
    `${NOMINATIM_BASE}/search?` +
    `q=${encodeURIComponent(searchText)}&format=json&addressdetails=1&limit=8&accept-language=es${viewbox}`;

  const res = await fetch(url, { headers: NOMINATIM_HEADERS });
  if (!res.ok) return [];
  const json = (await res.json()) as NominatimResult[];
  return json.map((r) => {
    const { name, subtitle } = labelFromNominatim(r, query);
    return {
      name,
      subtitle,
      placeId: `osm-${r.place_id}`,
      latitude: parseFloat(r.lat),
      longitude: parseFloat(r.lon),
    };
  });
}

async function reverseNominatim(lat: number, lng: number): Promise<string | null> {
  const url = `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`;
  const res = await fetch(url, { headers: NOMINATIM_HEADERS });
  if (!res.ok) return null;
  const json = (await res.json()) as { display_name?: string };
  return json.display_name ?? null;
}

async function placeFromCoords(
  latitude: number,
  longitude: number,
  fallbackName: string,
): Promise<PlaceSuggestion> {
  try {
    const rev = await Location.reverseGeocodeAsync({ latitude, longitude });
    const a = rev[0];
    if (a) {
      const name = a.city ?? a.name ?? a.district ?? a.subregion ?? fallbackName;
      const subtitle = [a.city, a.region, a.country]
        .filter((v): v is string => Boolean(v))
        .filter((v, i, arr) => arr.indexOf(v) === i)
        .filter((v) => v !== name)
        .join(', ');
      return {
        name,
        subtitle: subtitle && !looksLikeCoordinates(subtitle) ? subtitle : a.region ?? undefined,
        placeId: `device-${latitude}-${longitude}`,
        latitude,
        longitude,
      };
    }
  } catch {
    // sin reverse local
  }
  return {
    name: fallbackName,
    placeId: `device-${latitude}-${longitude}`,
    latitude,
    longitude,
  };
}

export class MapsService {
  async searchPlaces(query: string, nearLat?: number, nearLng?: number): Promise<PlaceSuggestion[]> {
    const q = query.trim();
    if (q.length < 2) return [];

    const found: PlaceSuggestion[] = [];

    try {
      found.push(...(await searchNominatim(q, nearLat, nearLng)));
    } catch {
      // sin red
    }

    const searchText = q.length < 24 && !q.includes(',') ? `${q}, México` : q;
    try {
      const geo = await Location.geocodeAsync(searchText);
      const fromDevice = await Promise.all(
        geo.slice(0, 4).map((g) => placeFromCoords(g.latitude, g.longitude, q)),
      );
      found.push(...fromDevice);
    } catch {
      // geocoder del dispositivo no disponible
    }

    return dedupePlaces(found).slice(0, 8);
  }

  async searchNearby(lat: number, lng: number): Promise<PlaceSuggestion[]> {
    return this.searchPlaces('lugar', lat, lng);
  }

  async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      const first = geo[0];
      if (first) {
        const parts = [first.name, first.street, first.city, first.region, first.country].filter(
          Boolean,
        );
        if (parts.length) return parts.join(', ');
      }
    } catch {
      // fallback OSM
    }

    try {
      const osm = await reverseNominatim(lat, lng);
      if (osm) return osm;
    } catch {
      // sin red
    }

    return 'Ubicación seleccionada';
  }
}

export const mapsService = new MapsService();
