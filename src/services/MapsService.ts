import { env } from '../config/env';

export type PlaceSuggestion = {
  name: string;
  placeId: string;
  latitude: number;
  longitude: number;
};

export class MapsService {
  async searchNearby(lat: number, lng: number, query = 'restaurant'): Promise<PlaceSuggestion[]> {
    if (!env.googleMapsApiKey) {
      return [
        { name: 'Café romántico (demo)', placeId: 'demo1', latitude: lat + 0.001, longitude: lng },
        { name: 'Parque cercano (demo)', placeId: 'demo2', latitude: lat - 0.001, longitude: lng + 0.001 },
      ];
    }

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1500&keyword=${encodeURIComponent(query)}&key=${env.googleMapsApiKey}`;
    const res = await fetch(url);
    const json = await res.json();
    return (json.results ?? []).slice(0, 5).map((p: { name: string; place_id: string; geometry: { location: { lat: number; lng: number } } }) => ({
      name: p.name,
      placeId: p.place_id,
      latitude: p.geometry.location.lat,
      longitude: p.geometry.location.lng,
    }));
  }

  async reverseGeocode(lat: number, lng: number): Promise<string> {
    if (!env.googleMapsApiKey) return `Ubicación ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${env.googleMapsApiKey}`;
    const res = await fetch(url);
    const json = await res.json();
    return json.results?.[0]?.formatted_address ?? 'Ubicación seleccionada';
  }
}

export const mapsService = new MapsService();
