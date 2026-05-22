import { FlatList, Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { spacing } from '../../config/theme';

type Item = { id: string; uri: string };

type Props = {
  items: Item[];
  onLoadMore?: () => void;
  onPressItem?: (id: string) => void;
};

export function PhotoGallery({ items, onLoadMore, onPressItem }: Props) {
  const { width } = useWindowDimensions();
  const colWidth = (width - spacing.md * 3) / 2;

  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id}
      numColumns={2}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.4}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => (
        <Pressable onPress={() => onPressItem?.(item.id)} style={{ width: colWidth }}>
          <Image source={{ uri: item.uri }} style={[styles.thumb, { width: colWidth, height: colWidth }]} />
        </Pressable>
      )}
      ListFooterComponent={<View style={{ height: spacing.lg }} />}
    />
  );
}

const styles = StyleSheet.create({
  row: { justifyContent: 'space-between', marginBottom: spacing.sm },
  thumb: { borderRadius: 12 },
});
