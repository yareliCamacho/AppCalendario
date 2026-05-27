import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  View,
  Image,
  StyleSheet,
  Text,
  Pressable,
  PanResponder,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radii } from '../../config/theme';
import { getMemoryPhotoFrameSize } from '../../utils/memoryPhotoFrame';
import { optimizeImage } from '../../utils/imageOptimize';
import { GradientButton } from '../ui/GradientButton';

type Props = {
  visible: boolean;
  imageUri: string | null;
  onCancel: () => void;
  onComplete: (uri: string) => void;
};

type Size = { width: number; height: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function PhotoCropModal({ visible, imageUri, onCancel, onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const frame = useMemo(
    () => getMemoryPhotoFrameSize(screenW, screenH),
    [screenW, screenH],
  );
  const cropW = frame.width;
  const cropH = frame.height;
  const cropAspect = cropH / cropW;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<Size | null>(null);
  const [zoom, setZoom] = useState(1);
  const pan = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const [, forcePanRender] = useState(0);

  const displayScale = useMemo(() => {
    if (!imageSize) return 1;
    return Math.max(cropW / imageSize.width, cropH / imageSize.height);
  }, [imageSize, cropW, cropH]);

  const scaledW = imageSize ? imageSize.width * displayScale * zoom : cropW;
  const scaledH = imageSize ? imageSize.height * displayScale * zoom : cropH;

  const clampPan = useCallback(
    (x: number, y: number) => {
      const minX = cropW - scaledW;
      const minY = cropH - scaledH;
      return {
        x: clamp(x, minX, 0),
        y: clamp(y, minY, 0),
      };
    },
    [cropW, cropH, scaledW, scaledH],
  );

  const centerPan = useCallback(() => {
    const c = clampPan((cropW - scaledW) / 2, (cropH - scaledH) / 2);
    pan.current = c;
    forcePanRender((n) => n + 1);
  }, [clampPan, cropW, cropH, scaledW, scaledH]);

  useEffect(() => {
    if (!visible || !imageUri) {
      setLocalUri(null);
      setImageSize(null);
      setZoom(1);
      pan.current = { x: 0, y: 0 };
      return;
    }

    let alive = true;
    setLoading(true);
    void (async () => {
      try {
        let uri = imageUri;
        if (uri.startsWith('http://') || uri.startsWith('https://')) {
          const dest = `${FileSystem.cacheDirectory}crop-${Date.now()}.jpg`;
          const dl = await FileSystem.downloadAsync(uri, dest);
          uri = dl.uri;
        }
        if (!alive) return;
        setLocalUri(uri);
        const size = await new Promise<Size>((resolve, reject) => {
          Image.getSize(uri, (w, h) => resolve({ width: w, height: h }), reject);
        });
        if (!alive) return;
        setImageSize(size);
      } catch {
        if (alive) onCancel();
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [visible, imageUri, onCancel]);

  useEffect(() => {
    if (imageSize) centerPan();
  }, [imageSize, zoom, centerPan]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          panStart.current = { ...pan.current };
        },
        onPanResponderMove: (_, gesture) => {
          pan.current = clampPan(
            panStart.current.x + gesture.dx,
            panStart.current.y + gesture.dy,
          );
          forcePanRender((n) => n + 1);
        },
      }),
    [clampPan],
  );

  const applyCrop = async () => {
    if (!localUri || !imageSize) return;
    setSaving(true);
    try {
      const scale = displayScale * zoom;
      const originX = clamp(Math.round(-pan.current.x / scale), 0, imageSize.width - 1);
      const originY = clamp(Math.round(-pan.current.y / scale), 0, imageSize.height - 1);
      let cropWidth = Math.max(1, Math.round(cropW / scale));
      let cropHeight = Math.max(1, Math.round(cropWidth * cropAspect));
      if (originY + cropHeight > imageSize.height) {
        cropHeight = imageSize.height - originY;
        cropWidth = Math.max(1, Math.round(cropHeight / cropAspect));
      }
      if (originX + cropWidth > imageSize.width) {
        cropWidth = imageSize.width - originX;
        cropHeight = Math.max(1, Math.round(cropWidth * cropAspect));
      }
      if (originY + cropHeight > imageSize.height) {
        cropHeight = imageSize.height - originY;
      }

      const cropped = await ImageManipulator.manipulateAsync(
        localUri,
        [{ crop: { originX, originY, width: cropWidth, height: cropHeight } }],
        { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG },
      );
      const optimized = await optimizeImage(cropped.uri);
      onComplete(optimized);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <View style={[styles.screen, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title}>Recortar o ajustar</Text>
        <Text style={styles.sub}>
          Mismo tamaño que verás en el recuerdo. Arrastra y usa + / − para acercar.
        </Text>

        <View style={[styles.cropFrame, { width: cropW, height: cropH }]} {...panResponder.panHandlers}>
          {loading || !localUri || !imageSize ? (
            <ActivityIndicator color={colors.primaryPinkDark} style={styles.loader} />
          ) : (
            <View
              style={{
                width: scaledW,
                height: scaledH,
                transform: [{ translateX: pan.current.x }, { translateY: pan.current.y }],
              }}
            >
              <Image
                source={{ uri: localUri }}
                style={{ width: scaledW, height: scaledH }}
                resizeMode="cover"
              />
            </View>
          )}
          <View style={styles.cropBorder} pointerEvents="none" />
        </View>

        <View style={styles.zoomRow}>
          <Pressable
            style={styles.zoomBtn}
            onPress={() => setZoom((z) => Math.max(1, Math.round((z - 0.15) * 100) / 100))}
          >
            <Text style={styles.zoomBtnText}>−</Text>
          </Pressable>
          <Text style={styles.zoomLabel}>Zoom</Text>
          <Pressable
            style={styles.zoomBtn}
            onPress={() => setZoom((z) => Math.min(3, Math.round((z + 0.15) * 100) / 100))}
          >
            <Text style={styles.zoomBtnText}>+</Text>
          </Pressable>
        </View>

        <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.md }]}>
          <Pressable style={styles.cancelBtn} onPress={onCancel} disabled={saving}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
          <GradientButton
            title={saving ? 'Guardando...' : 'Aplicar recorte'}
            onPress={() => void applyCrop()}
            disabled={loading || saving || !imageSize}
            icon="✦"
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.appShellBg,
    paddingHorizontal: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  sub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  cropFrame: {
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: radii.lg,
    backgroundColor: '#1a1a1a',
  },
  cropBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: colors.primaryPinkDark,
    borderRadius: radii.lg,
  },
  loader: { marginTop: spacing.xxl },
  zoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  zoomBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  zoomBtnText: { fontSize: 22, fontWeight: '700', color: colors.primaryPinkDark },
  zoomLabel: { fontWeight: '600', color: colors.text },
  actions: { marginTop: spacing.lg, gap: spacing.sm },
  cancelBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  cancelText: { color: colors.textMuted, fontWeight: '600' },
});
