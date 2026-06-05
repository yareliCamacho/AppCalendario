import { createElement, useMemo } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../config/theme';
import type { CoupleMapProps, MapMarker } from './coupleMapTypes';

export type { MapMarker } from './coupleMapTypes';

function buildEmbedSrc(markers: MapMarker[]): string {
  const lats = markers.map((m) => m.latitude);
  const lngs = markers.map((m) => m.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const pad = markers.length > 1 ? 0.01 : 0.02;
  const bbox = [minLng - pad, minLat - pad, maxLng + pad, maxLat + pad].join(',');
  const center = markers[0];
  const marker = `${center.latitude},${center.longitude}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(marker)}`;
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
  const allMarkers: MapMarker[] = markers?.length
    ? markers
    : [{ latitude, longitude, title }];

  const embedSrc = useMemo(() => buildEmbedSrc(allMarkers), [allMarkers]);

  const openExternal = () => {
    const m = allMarkers[0];
    void Linking.openURL(
      `https://www.openstreetmap.org/?mlat=${m.latitude}&mlon=${m.longitude}#map=15/${m.latitude}/${m.longitude}`,
    );
  };

  return (
    <View style={[styles.wrap, { height }]}>
      {createElement('iframe', {
        title: title ?? 'Mapa',
        src: embedSrc,
        loading: 'lazy',
        style: {
          border: 0,
          width: '100%',
          height: '100%',
          borderRadius: 16,
        },
      })}
      {heartPin ? (
        <View style={styles.heartOverlay} pointerEvents="none">
          <Text style={styles.heartPin}>♥</Text>
        </View>
      ) : null}
      <Text style={styles.attribution}>© OpenStreetMap</Text>
      {onCoordinateChange && !fixed ? (
        <Text style={styles.webHint}>
          En la web usa la búsqueda de lugar arriba; el mapa es solo vista previa.
        </Text>
      ) : null}
      <Pressable style={styles.openLink} onPress={openExternal} accessibilityRole="link">
        <Text style={styles.openLinkText}>Abrir en mapa</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  heartOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartPin: {
    fontSize: 36,
    color: colors.primaryPinkDark,
    textShadowColor: 'rgba(255, 79, 162, 0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  attribution: {
    position: 'absolute',
    bottom: 4,
    right: 6,
    fontSize: 9,
    color: colors.textMuted,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  webHint: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    fontSize: 11,
    color: colors.text,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: spacing.xs,
    borderRadius: 8,
    overflow: 'hidden',
  },
  openLink: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  openLinkText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryPinkDark,
  },
});
