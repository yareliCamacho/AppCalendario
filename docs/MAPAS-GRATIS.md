# Mapas y búsqueda de lugares (gratis)

La app **no usa Google Maps de pago**. No necesitas `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` ni tarjeta en Google Cloud.

## Qué usa la app

| Función | Servicio | Costo |
|---------|----------|--------|
| Buscar ciudad / dirección | [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org/) | Gratis |
| Ver mapa en pantalla | Tiles [OpenStreetMap](https://www.openstreetmap.org/) | Gratis |
| GPS y “mi ubicación” | `expo-location` (sistema) | Gratis |
| Datos y fotos | Supabase (plan free) | Gratis |

## Configuración `.env`

Solo Supabase:

```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Reinicia tras cambiar variables:

```bash
cd frontend
npx expo start -c
```

## Requisitos

- **Internet** en el teléfono para buscar lugares (Nominatim).
- Permiso de **ubicación** si usas el botón GPS.

## EAS Build

No hace falta secret de Google Maps. Los mapas OSM funcionan en APK/IPA sin clave adicional.

## Créditos

Mapas © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
