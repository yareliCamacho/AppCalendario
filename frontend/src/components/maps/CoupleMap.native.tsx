import { useEffect, useMemo, useRef } from 'react';
import MapView, { Marker, UrlTile, type MapPressEvent } from 'react-native-maps';
import { StyleSheet, View, Text } from 'react-native';
import { colors } from '../../config/theme';
import type { CoupleMapProps, MapMarker } from './coupleMapTypes';

export type { MapMarker } from './coupleMapTypes';

/** Tiles OpenStreetMap — sin API key de Google */
const OSM_TILE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

function HeartPinMarker({ marker }: { marker: MapMarker }) {
  return (
    <Marker
      coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
      title={marker.title}
      description={marker.description}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={false}
    >
      <View style={styles.heartPinWrap}>
        <Text style={styles.heartPinShadow}>♥</Text>
        <Text style={styles.heartPin}>♥</Text>
      </View>
    </Marker>
  );
}

export function CoupleMap({
  latitude,
  longitude,
  title,
  height = 200,
  markers,
  onCoordinateChange,
  fixed = false,
  heartPin = false,
}: CoupleMapProps) {
  const mapRef = useRef<MapView>(null);

  const allMarkers: MapMarker[] = markers?.length
    ? markers
    : [{ latitude, longitude, title }];

  const region = useMemo(() => {
    if (allMarkers.length > 1) {
      const lats = allMarkers.map((m) => m.latitude);
      const lngs = allMarkers.map((m) => m.longitude);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      return {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.04),
        longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.04),
      };
    }
    return {
      latitude,
      longitude,
      latitudeDelta: 0.06,
      longitudeDelta: 0.06,
    };
  }, [allMarkers, latitude, longitude]);

  const interactive = !fixed && Boolean(onCoordinateChange);

  useEffect(() => {
    if (!fixed || allMarkers.length <= 1) return;
    const coords = allMarkers.map((m) => ({
      latitude: m.latitude,
      longitude: m.longitude,
    }));
    const t = setTimeout(() => {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 48, right: 48, bottom: 48, left: 48 },
        animated: false,
      });
    }, 80);
    return () => clearTimeout(t);
  }, [fixed, allMarkers]);

  const handlePress = (e: MapPressEvent) => {
    if (!interactive) return;
    const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
    onCoordinateChange?.(lat, lng);
  };

  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        mapType="none"
        {...(fixed ? { initialRegion: region } : { region })}
        scrollEnabled={!fixed}
        zoomEnabled={!fixed}
        rotateEnabled={!fixed}
        pitchEnabled={!fixed}
        onPress={interactive ? handlePress : undefined}
      >
        <UrlTile urlTemplate={OSM_TILE} maximumZ={19} tileSize={256} zIndex={-1} />
        {heartPin ? (
          allMarkers.map((m, i) => (
            <HeartPinMarker key={`heart-${i}-${m.latitude}-${m.longitude}`} marker={m} />
          ))
        ) : (
          <>
            <Marker
              coordinate={{ latitude, longitude }}
              title={title}
              draggable={interactive}
              onDragEnd={(e) => {
                const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
                onCoordinateChange?.(lat, lng);
              }}
            />
            {allMarkers
              .filter(
                (m) =>
                  Math.abs(m.latitude - latitude) > 0.00001 ||
                  Math.abs(m.longitude - longitude) > 0.00001,
              )
              .map((m, i) => (
                <Marker
                  key={`extra-${m.latitude}-${m.longitude}-${i}`}
                  coordinate={{ latitude: m.latitude, longitude: m.longitude }}
                  title={m.title}
                  description={m.description}
                />
              ))}
          </>
        )}
      </MapView>
      <Text style={styles.attribution}>© OpenStreetMap</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  heartPinWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  heartPinShadow: {
    position: 'absolute',
    fontSize: 34,
    color: 'rgba(255, 79, 162, 0.35)',
    top: 2,
    includeFontPadding: false,
  },
  heartPin: {
    fontSize: 32,
    color: colors.primaryPinkDark,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  attribution: {
    position: 'absolute',
    bottom: 4,
    right: 6,
    fontSize: 9,
    color: colors.textMuted,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
});
