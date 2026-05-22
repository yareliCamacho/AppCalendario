import { Image, View, StyleSheet } from 'react-native';
import { colors } from '../../config/theme';

type Props = { uri?: string | null; size?: number };

export function HeartPhoto({ uri, size = 120 }: Props) {
  return (
    <View style={[styles.heart, { width: size, height: size }]}>
      {uri ? (
        <Image source={{ uri }} style={styles.image} />
      ) : (
        <View style={[styles.placeholder, { width: size, height: size }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  heart: {
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.primaryPink,
    transform: [{ rotate: '-45deg' }],
  },
  image: { width: '100%', height: '100%', transform: [{ rotate: '45deg' }] },
  placeholder: {
    backgroundColor: colors.primaryBlue,
    transform: [{ rotate: '45deg' }],
  },
});
