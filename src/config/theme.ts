import { Dimensions } from 'react-native';

export const colors = {
  primaryBlue: '#B3D9FF',
  primaryPink: '#FFB3D9',
  primaryBlueDark: '#7EB8F0',
  primaryPinkDark: '#FF8FBF',
  fulfilledGreen: '#7CB88A',
  text: '#2D2A32',
  textMuted: '#6B6570',
  background: '#FAF8FC',
  white: '#FFFFFF',
  error: '#D64545',
  border: '#E8E0EE',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

const { width } = Dimensions.get('window');
export const isTablet = width >= 768;
export const contentMaxWidth = isTablet ? 600 : width;

export const typography = {
  title: { fontSize: isTablet ? 32 : 28, fontWeight: '700' as const },
  subtitle: { fontSize: isTablet ? 20 : 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
};
