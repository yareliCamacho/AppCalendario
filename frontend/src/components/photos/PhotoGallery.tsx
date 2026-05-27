import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing } from '../../config/theme';

type Item = { id: string; uri: string };

type Props = {
  items: Item[];
  onLoadMore?: () => void;
  loadingMore?: boolean;
  onPressItem?: (id: string) => void;
};

/** Cuadrícula estática (sin FlatList) para poder ir dentro de ScrollView. */
export function PhotoGallery({ items, onLoadMore, loadingMore, onPressItem }: Props) {
  const { width } = useWindowDimensions();
  const colWidth = (width - spacing.md * 3) / 2;

  const rows: Item[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }

  return (
    <View style={styles.wrap}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => onPressItem?.(item.id)}
              style={{ width: colWidth }}
            >
              <Image
                source={{ uri: item.uri }}
                style={[styles.thumb, { width: colWidth, height: colWidth }]}
              />
            </Pressable>
          ))}
          {row.length === 1 ? <View style={{ width: colWidth }} /> : null}
        </View>
      ))}

      {onLoadMore ? (
        <Pressable
          style={styles.loadMoreBtn}
          onPress={onLoadMore}
          disabled={loadingMore}
        >
          {loadingMore ? (
            <ActivityIndicator color={colors.primaryPinkDark} />
          ) : (
            <Text style={styles.loadMoreText}>Cargar más fotos</Text>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  thumb: { borderRadius: 12 },
  loadMoreBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  loadMoreText: {
    color: colors.primaryPinkDark,
    fontWeight: '700',
    fontSize: 14,
  },
});
