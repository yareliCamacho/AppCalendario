import MapView, { Marker } from 'react-native-maps';
import { StyleSheet, View } from 'react-native';
import { spacing } from '../../config/theme';

type Props = {
  latitude: number;
  longitude: number;
  title?: string;
  height?: number;
};

export function CoupleMap({ latitude, longitude, title, height = 200 }: Props) {
  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        <Marker coordinate={{ latitude, longitude }} title={title} />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: spacing.md,
  },
});
