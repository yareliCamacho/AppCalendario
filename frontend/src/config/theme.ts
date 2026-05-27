import { Dimensions, Platform, type ViewStyle } from 'react-native';

/** Paleta alineada al diseño de referencia (rosa/lavanda suave) */
export const colors = {
  primaryBlue: '#CFE8FF',
  primaryPink: '#FFA7D1',
  primaryBlueDark: '#78B7F5',
  primaryPinkDark: '#FF4FA2',
  primaryPinkLight: '#FFB8DC',
  softLavender: '#F3ECFF',
  softRose: '#FFF1F7',
  softPinkBg: '#FFF5FA',
  gradientPink: '#FF8EC8',
  gradientPurple: '#C9A0FF',
  fulfilledGreen: '#6BCB8B',
  statPurple: '#9B7FE8',
  statMint: '#6BCB8B',
  statGold: '#F5B942',
  text: '#1E2230',
  textMuted: '#8A90A3',
  /** Fondo de app: lavanda-rosa (nunca blanco puro) */
  appShellBg: '#F0E4FF',
  background: '#F0E4FF',
  white: '#FFFFFF',
  error: '#D64545',
  border: '#F2DDEB',
  shadow: '#E8B4D0',
  bellMuted: '#B8BECF',
} as const;

/** Paneles tipo vidrio sobre el fondo degradado */
export const glass: {
  panel: ViewStyle;
  mapRow: ViewStyle;
  surface: ViewStyle;
  input: ViewStyle;
} = {
  panel: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  mapRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.5)',
  },
  surface: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

/** Altura base de la barra de tabs (ver también `useTabScrollInsets`) */
export const TAB_BAR_HEIGHT = 72;

const { width } = Dimensions.get('window');
export const isTablet = width >= 768;
export const contentMaxWidth = isTablet ? 600 : width;

export const typography = {
  title: { fontSize: isTablet ? 32 : 28, fontWeight: '700' as const },
  subtitle: { fontSize: isTablet ? 20 : 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
};

export const radii = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: '#C9A0B8',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 14,
    },
    android: { elevation: 4 },
    default: {},
  }),
  soft: Platform.select({
    ios: {
      shadowColor: '#FFB8DC',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
    },
    android: { elevation: 6 },
    default: {},
  }),
};
