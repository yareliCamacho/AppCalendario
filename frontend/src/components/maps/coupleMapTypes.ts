export type MapMarker = {
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
};

export type CoupleMapProps = {
  latitude: number;
  longitude: number;
  title?: string;
  height?: number;
  markers?: MapMarker[];
  onCoordinateChange?: (lat: number, lng: number) => void;
  /** Bloquea mover/zoom/tocar el mapa (p. ej. recuerdos del día) */
  fixed?: boolean;
  /** Pin en forma de corazón */
  heartPin?: boolean;
};
