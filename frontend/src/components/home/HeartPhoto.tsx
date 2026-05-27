import { useId } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Defs, ClipPath, Path, Image as SvgImage, G } from 'react-native-svg';
import { colors, shadows } from '../../config/theme';

const HEART_PATH =
  'M16 28.5 C16 28.5 3 18.5 3 11.5 C3 7.5 6 4.5 9.5 4.5 C11.8 4.5 13.8 5.8 16 8.2 C18.2 5.8 20.2 4.5 22.5 4.5 C26 4.5 29 7.5 29 11.5 C29 18.5 16 28.5 16 28.5 Z';

type Props = {
  uri?: string | null;
  size?: number;
  minimal?: boolean;
  /** Sin fondo circular ni sombra (p. ej. conteo de días) */
  bare?: boolean;
  /** Corazón vacío más visible en el árbol (sin foto) */
  emptyOnTree?: boolean;
};

export function HeartPhoto({
  uri,
  size = 140,
  minimal = false,
  bare = false,
  emptyOnTree = false,
}: Props) {
  const clipId = useId().replace(/:/g, '');
  const pad = minimal || bare ? 4 : 12;
  const total = size + pad * 2;
  const noChrome = minimal || bare;

  return (
    <View
      style={[
        styles.wrap,
        noChrome && styles.wrapMinimal,
        { width: total, height: total },
        !noChrome && shadows.soft,
      ]}
    >
      {!noChrome ? (
        <>
          <View style={styles.floatHeart1}>
            <Text style={styles.miniHeart}>♥</Text>
          </View>
          <View style={styles.floatHeart2}>
            <Text style={styles.miniHeart}>♥</Text>
          </View>
        </>
      ) : null}
      <Svg
        width={size}
        height={minimal ? size : size * 0.92}
        viewBox="0 0 32 30"
        preserveAspectRatio="xMidYMid meet"
      >
        <Defs>
          <ClipPath id={clipId}>
            <Path d={HEART_PATH} />
          </ClipPath>
        </Defs>
        <G>
          <Path
            d={HEART_PATH}
            fill={uri ? 'transparent' : emptyOnTree ? '#FFE8F4' : colors.primaryBlue}
            stroke={emptyOnTree ? colors.primaryPinkDark : colors.primaryPinkLight}
            strokeWidth={emptyOnTree ? 2.5 : 2}
          />
          {uri ? (
            <SvgImage
              href={{ uri }}
              width={32}
              height={30}
              preserveAspectRatio="xMidYMid slice"
              clipPath={`url(#${clipId})`}
            />
          ) : emptyOnTree ? (
            <Path d={HEART_PATH} fill="#FFE8F4" clipPath={`url(#${clipId})`} />
          ) : (
            <Path d={HEART_PATH} fill={colors.primaryBlue} clipPath={`url(#${clipId})`} />
          )}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 220, 238, 0.35)',
  },
  wrapMinimal: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  floatHeart1: {
    position: 'absolute',
    top: 8,
    left: 4,
    opacity: 0.45,
  },
  floatHeart2: {
    position: 'absolute',
    bottom: 16,
    right: 0,
    opacity: 0.35,
  },
  miniHeart: { fontSize: 14, color: colors.primaryPinkLight },
});
