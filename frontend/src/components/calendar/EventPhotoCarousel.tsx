import { useRef, useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
  Text,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { colors, spacing, radii, contentMaxWidth } from '../../config/theme';
import { getMemoryPhotoFrameSize } from '../../utils/memoryPhotoFrame';

export type CarouselPhoto = {
  id: string;
  uri: string;
  isFavorite?: boolean;
};

type Props = {
  items: CarouselPhoto[];
  /** Si no se pasa, se calcula según ancho de pantalla (proporción ~3:4) */
  height?: number;
  resizeMode?: 'cover' | 'contain';
  onFavorite?: (id: string) => void;
  onEdit?: (id: string) => void;
  onMoreOptions?: (id: string) => void;
};

/** Altura del visor (compacto, proporcional al ancho) */
export function getPhotoGalleryHeight(screenWidth: number, screenHeight: number): number {
  return getMemoryPhotoFrameSize(screenWidth, screenHeight).height;
}

/** Visor más alto para hitos; `contain` muestra más contenido de cada foto */
export function getMilestonePhotoGalleryHeight(screenWidth: number, screenHeight: number): number {
  const slideWidth = Math.min(screenWidth - spacing.md * 2, contentMaxWidth);
  const byRatio = Math.round(slideWidth * 1.12);
  const maxH = Math.round(screenHeight * 0.5);
  return Math.min(byRatio, maxH, 400);
}

export function EventPhotoCarousel({
  items,
  height: heightProp,
  resizeMode = 'cover',
  onFavorite,
  onEdit,
  onMoreOptions,
}: Props) {
  const { width, height: windowHeight } = useWindowDimensions();
  const slideWidth = Math.min(width - spacing.md * 2, contentMaxWidth);
  const photoHeight = heightProp ?? getPhotoGalleryHeight(width, windowHeight);
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  if (!items.length) return null;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / slideWidth);
    if (i !== index) setIndex(i);
  };

  return (
    <View style={[styles.wrap, { height: photoHeight }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={slideWidth}
        snapToAlignment="start"
        contentContainerStyle={{ width: slideWidth * items.length }}
      >
        {items.map((item) => (
          <View key={item.id} style={[styles.slide, { width: slideWidth, height: photoHeight }]}>
            <Image
              source={{ uri: item.uri }}
              style={styles.image}
              resizeMode={resizeMode}
            />
            <View style={styles.slideActions}>
              {onEdit ? (
                <Pressable
                  style={styles.actionBtn}
                  onPress={() => onEdit(item.id)}
                  accessibilityLabel="Recortar o ajustar foto"
                >
                  <Text style={styles.actionIcon}>✎</Text>
                </Pressable>
              ) : null}
              {onMoreOptions ? (
                <Pressable
                  style={styles.actionBtn}
                  onPress={() => onMoreOptions(item.id)}
                  accessibilityLabel="Más opciones"
                >
                  <Text style={styles.actionIcon}>⋯</Text>
                </Pressable>
              ) : null}
              {onFavorite ? (
                <Pressable
                  style={styles.actionBtn}
                  onPress={() => onFavorite(item.id)}
                  accessibilityLabel="Marcar como favorita"
                >
                  <Text style={styles.favIcon}>{item.isFavorite ? '♥' : '♡'}</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ))}
      </ScrollView>

      {items.length > 1 ? (
        <View style={styles.dots}>
          {items.map((item, i) => (
            <View
              key={item.id}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}

      {items.length > 1 ? (
        <View style={styles.hintRow}>
          <Text style={styles.hint}>‹ Desliza para ver más ›</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  slide: {
    overflow: 'hidden',
    backgroundColor: colors.softRose,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  slideActions: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  actionIcon: {
    fontSize: 18,
    color: colors.primaryPinkDark,
    fontWeight: '700',
  },
  favIcon: {
    fontSize: 24,
    color: colors.primaryPinkDark,
  },
  dots: {
    position: 'absolute',
    bottom: spacing.lg + 4,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  dotActive: {
    backgroundColor: colors.primaryPinkDark,
    width: 20,
  },
  hintRow: {
    position: 'absolute',
    bottom: spacing.sm,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hint: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
