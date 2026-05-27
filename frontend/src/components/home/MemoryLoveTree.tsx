import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { router } from 'expo-router';
import { HeartPhoto } from './HeartPhoto';
import { colors, spacing, radii } from '../../config/theme';
import { MEMORY_TREE_LEAF_COUNT, type MemoryTreeLeaf } from '../../types/memoryTree';

const TRUNK_COLOR = '#7A4E32';
const TRUNK_SHADOW = '#5C3D28';
const TRUNK_HIGHLIGHT = '#9B7048';
const TRUNK_BARK = '#4A3224';
const BRANCH_COLOR = '#5A3D2E';
const BRANCH_OPACITY = 0.82;
const TRUNK_OPACITY = 0.92;

const PINK_TONES = ['#E23A62', '#E94A76', '#D93A84', '#F0558A', '#D6326B', '#EC5A96'] as const;
const RED_TONES = ['#C41E3A', '#D62839', '#B91C34', '#E63946', '#A41623'] as const;

type BranchCurve = {
  x0: number;
  y0: number;
  cx: number;
  cy: number;
  x2: number;
  y2: number;
};

/** Tronco curvo: misma lógica que las ramas, de base ancha a copa fina */
const TRUNK_CURVE: BranchCurve = {
  x0: 140,
  y0: 298,
  cx: 136,
  cy: 232,
  x2: 140,
  y2: 172,
};

/** Ramas principales: ángulos y curvas distintas, salida escalonada del tronco */
const MAIN_BRANCHES: BranchCurve[] = [
  { x0: 140, y0: 174, cx: 125, cy: 108, x2: 118, y2: 48 },
  { x0: 128, y0: 176, cx: 62, cy: 128, x2: 22, y2: 78 },
  { x0: 152, y0: 175, cx: 224, cy: 118, x2: 258, y2: 72 },
  { x0: 134, y0: 178, cx: 78, cy: 152, x2: 58, y2: 108 },
  { x0: 148, y0: 177, cx: 202, cy: 138, x2: 218, y2: 94 },
  { x0: 130, y0: 180, cx: 38, cy: 162, x2: 8, y2: 132 },
  { x0: 150, y0: 179, cx: 242, cy: 158, x2: 272, y2: 122 },
  { x0: 136, y0: 182, cx: 58, cy: 198, x2: 38, y2: 172 },
  { x0: 146, y0: 181, cx: 218, cy: 192, x2: 242, y2: 158 },
  /** Centro-derecha: rellena el hueco entre las ramas superiores */
  { x0: 141, y0: 175, cx: 168, cy: 115, x2: 186, y2: 62 },
];

/** Ramitas: índice de rama padre, punto de unión (0–1), ángulo y longitud */
type TwigSpec = { parentIndex: number; attachT: number; angleDeg: number; length: number };

const TWIG_SPECS: TwigSpec[] = [
  { parentIndex: 0, attachT: 0.52, angleDeg: -42, length: 34 },
  { parentIndex: 0, attachT: 0.52, angleDeg: 38, length: 32 },
  { parentIndex: 1, attachT: 0.5, angleDeg: -32, length: 40 },
  { parentIndex: 1, attachT: 0.65, angleDeg: 18, length: 34 },
  { parentIndex: 2, attachT: 0.48, angleDeg: 35, length: 38 },
  { parentIndex: 2, attachT: 0.62, angleDeg: -22, length: 32 },
  { parentIndex: 3, attachT: 0.55, angleDeg: -28, length: 28 },
  { parentIndex: 5, attachT: 0.45, angleDeg: -38, length: 36 },
  { parentIndex: 6, attachT: 0.5, angleDeg: 32, length: 30 },
  { parentIndex: 9, attachT: 0.48, angleDeg: -48, length: 32 },
  { parentIndex: 9, attachT: 0.58, angleDeg: 42, length: 28 },
  { parentIndex: 4, attachT: 0.52, angleDeg: 55, length: 26 },
];

const SMOOTH_SAMPLES = 16;
const TRUNK_BASE_WIDTH = 36;
const TRUNK_TOP_WIDTH = 20;
const MAIN_MAX_WIDTH = 7;
const MAIN_MIN_WIDTH = 1;
const TWIG_MAX_WIDTH = 4.2;
const TWIG_MIN_WIDTH = 0.8;

/** Tonos más oscuros para hojas al fondo (profundidad) */
const PINK_DEEP = ['#C42D6A', '#D43D7A', '#B82858', '#CC4A82'] as const;

type LeafDepth = 'back' | 'mid' | 'front';

type LeafLayout = {
  left: `${number}%`;
  top: `${number}%`;
  size: number;
  rotate: number;
  depth: LeafDepth;
};

const LEAF_LAYOUT: LeafLayout[] = [
  { left: '44%', top: '10%', size: 58, rotate: -12, depth: 'front' },
  { left: '10%', top: '22%', size: 54, rotate: 22, depth: 'mid' },
  { left: '49%', top: '36%', size: 54, rotate: -18, depth: 'mid' },
  { left: '2%', top: '36%', size: 50, rotate: 28, depth: 'back' },
  { left: '26%', top: '28%', size: 56, rotate: -8, depth: 'front' },
  { left: '58%', top: '18%', size: 56, rotate: 14, depth: 'front' },
  { left: '75%', top: '36%', size: 50, rotate: -24, depth: 'back' },
  { left: '14%', top: '50%', size: 52, rotate: 16, depth: 'mid' },
  { left: '62%', top: '45%', size: 52, rotate: -20, depth: 'mid' },
];

type DecorHeart = {
  left: `${number}%`;
  top: `${number}%`;
  size: number;
  opacity: number;
  color: string;
  rotate: number;
  depth: LeafDepth;
  /** Mantiene el color definido (p. ej. rojo) sin normalizar a rosa */
  preserveColor?: boolean;
};

/** Mini corazones decorativos: solo zona media-baja (top ≥ 22%), huecos entre hojas grandes */
const DECOR_HEARTS: DecorHeart[] = [
  { left: '22%', top: '32%', size: 11, opacity: 0.45, color: PINK_TONES[5], rotate: 32, depth: 'mid' },
  { left: '48%', top: '22%', size: 13, opacity: 0.5, color: PINK_TONES[1], rotate: -14, depth: 'mid' },
  { left: '38%', top: '38%', size: 15, opacity: 0.6, color: PINK_TONES[6], rotate: 12, depth: 'front' },
  { left: '55%', top: '35%', size: 11, opacity: 0.4, color: PINK_TONES[5], rotate: -28, depth: 'mid' },
  { left: '8%', top: '28%', size: 10, opacity: 0.35, color: PINK_DEEP[2], rotate: -35, depth: 'back' },
  { left: '86%', top: '30%', size: 13, opacity: 0.5, color: PINK_TONES[0], rotate: 20, depth: 'mid' },
  { left: '44%', top: '42%', size: 12, opacity: 0.45, color: PINK_TONES[3], rotate: -16, depth: 'mid' },
  { left: '60%', top: '44%', size: 14, opacity: 0.55, color: PINK_TONES[4], rotate: 8, depth: 'front' },
  { left: '28%', top: '46%', size: 10, opacity: 0.3, color: PINK_DEEP[1], rotate: 24, depth: 'back' },
  { left: '76%', top: '42%', size: 11, opacity: 0.4, color: PINK_TONES[1], rotate: -30, depth: 'back' },
  { left: '52%', top: '30%', size: 13, opacity: 0.5, color: PINK_TONES[2], rotate: 6, depth: 'mid' },
  { left: '62%', top: '26%', size: 11, opacity: 0.38, color: PINK_TONES[5], rotate: -20, depth: 'mid' },
  { left: '56%', top: '40%', size: 12, opacity: 0.45, color: PINK_TONES[6], rotate: 15, depth: 'mid' },
  { left: '4%', top: '44%', size: 9, opacity: 0.32, color: PINK_DEEP[0], rotate: 34, depth: 'back' },
  { left: '92%', top: '44%', size: 9, opacity: 0.32, color: PINK_DEEP[2], rotate: -32, depth: 'back' },
  { left: '40%', top: '48%', size: 10, opacity: 0.36, color: PINK_TONES[2], rotate: -10, depth: 'back' },
  { left: '68%', top: '48%', size: 10, opacity: 0.36, color: PINK_TONES[5], rotate: 18, depth: 'back' },
  { left: '30%', top: '24%', size: 9, opacity: 0.34, color: PINK_DEEP[1], rotate: -26, depth: 'back' },
  { left: '74%', top: '24%', size: 9, opacity: 0.34, color: PINK_DEEP[3], rotate: 30, depth: 'back' },
  { left: '42%', top: '32%', size: 11, opacity: 0.44, color: PINK_TONES[6], rotate: -6, depth: 'mid' },
  { left: '64%', top: '34%', size: 11, opacity: 0.44, color: PINK_TONES[1], rotate: 10, depth: 'mid' },
  { left: '20%', top: '40%', size: 12, opacity: 0.5, color: PINK_TONES[4], rotate: -14, depth: 'front' },
  { left: '80%', top: '36%', size: 12, opacity: 0.5, color: PINK_TONES[0], rotate: 16, depth: 'front' },
  { left: '54%', top: '52%', size: 9, opacity: 0.28, color: PINK_DEEP[2], rotate: -22, depth: 'back' },
  { left: '46%', top: '26%', size: 10, opacity: 0.4, color: PINK_TONES[7], rotate: 20, depth: 'mid' },
  { left: '12%', top: '34%', size: 8, opacity: 0.38, color: PINK_TONES[6], rotate: -20, depth: 'mid' },
  { left: '90%', top: '34%', size: 8, opacity: 0.38, color: PINK_TONES[2], rotate: 18, depth: 'mid' },
  { left: '34%', top: '20%', size: 9, opacity: 0.42, color: PINK_TONES[0], rotate: -8, depth: 'mid' },
  { left: '72%', top: '20%', size: 9, opacity: 0.42, color: PINK_TONES[7], rotate: 12, depth: 'mid' },
  { left: '16%', top: '26%', size: 8, opacity: 0.34, color: PINK_DEEP[1], rotate: -32, depth: 'back' },
  { left: '88%', top: '26%', size: 8, opacity: 0.34, color: PINK_DEEP[0], rotate: 30, depth: 'back' },
  { left: '34%', top: '28%', size: 8, opacity: 0.4, color: PINK_TONES[3], rotate: 26, depth: 'mid' },
  { left: '68%', top: '28%', size: 8, opacity: 0.4, color: PINK_TONES[6], rotate: -24, depth: 'mid' },
  { left: '44%', top: '34%', size: 8, opacity: 0.38, color: PINK_TONES[2], rotate: -18, depth: 'mid' },
  { left: '58%', top: '34%', size: 8, opacity: 0.38, color: PINK_TONES[4], rotate: 14, depth: 'mid' },
  { left: '50%', top: '38%', size: 9, opacity: 0.46, color: PINK_TONES[0], rotate: -4, depth: 'front' },
  { left: '32%', top: '42%', size: 8, opacity: 0.36, color: PINK_DEEP[3], rotate: 20, depth: 'back' },
  { left: '72%', top: '42%', size: 8, opacity: 0.36, color: PINK_DEEP[2], rotate: -22, depth: 'back' },
  { left: '24%', top: '52%', size: 7, opacity: 0.3, color: PINK_DEEP[1], rotate: 28, depth: 'back' },
  { left: '80%', top: '52%', size: 7, opacity: 0.3, color: PINK_DEEP[0], rotate: -26, depth: 'back' },
  { left: '46%', top: '46%', size: 8, opacity: 0.34, color: PINK_TONES[7], rotate: 10, depth: 'back' },
  { left: '58%', top: '46%', size: 8, opacity: 0.34, color: PINK_TONES[5], rotate: -12, depth: 'back' },
  { left: '38%', top: '52%', size: 7, opacity: 0.28, color: PINK_DEEP[3], rotate: -18, depth: 'back' },
  { left: '66%', top: '52%', size: 7, opacity: 0.28, color: PINK_DEEP[2], rotate: 16, depth: 'back' },
  { left: '50%', top: '48%', size: 8, opacity: 0.32, color: PINK_TONES[1], rotate: 8, depth: 'back' },
  { left: '10%', top: '42%', size: 8, opacity: 0.35, color: PINK_TONES[3], rotate: -24, depth: 'mid' },
  { left: '92%', top: '42%', size: 8, opacity: 0.35, color: PINK_TONES[6], rotate: 22, depth: 'mid' },
  { left: '18%', top: '48%', size: 7, opacity: 0.3, color: PINK_DEEP[0], rotate: 32, depth: 'back' },
  { left: '86%', top: '48%', size: 7, opacity: 0.3, color: PINK_DEEP[1], rotate: -30, depth: 'back' },
  { left: '28%', top: '36%', size: 7, opacity: 0.32, color: PINK_DEEP[2], rotate: 18, depth: 'back' },
  { left: '76%', top: '36%', size: 7, opacity: 0.32, color: PINK_DEEP[3], rotate: -16, depth: 'back' },
  { left: '36%', top: '24%', size: 7, opacity: 0.33, color: PINK_DEEP[1], rotate: -12, depth: 'back' },
  { left: '70%', top: '24%', size: 7, opacity: 0.33, color: PINK_DEEP[0], rotate: 14, depth: 'back' },
  { left: '56%', top: '24%', size: 7, opacity: 0.33, color: PINK_TONES[1], rotate: 8, depth: 'back' },
  { left: '44%', top: '24%', size: 7, opacity: 0.33, color: PINK_TONES[3], rotate: -8, depth: 'back' },
  { left: '20%', top: '20%', size: 8, opacity: 0.4, color: PINK_TONES[0], rotate: 16, depth: 'mid' },
  { left: '84%', top: '20%', size: 8, opacity: 0.4, color: PINK_TONES[4], rotate: -18, depth: 'mid' },
  { left: '2%', top: '32%', size: 7, opacity: 0.28, color: PINK_DEEP[2], rotate: 38, depth: 'back' },
  { left: '98%', top: '32%', size: 7, opacity: 0.28, color: PINK_DEEP[3], rotate: -36, depth: 'back' },
  { left: '48%', top: '52%', size: 7, opacity: 0.26, color: PINK_DEEP[0], rotate: 4, depth: 'back' },
  { left: '54%', top: '56%', size: 7, opacity: 0.26, color: PINK_DEEP[1], rotate: -6, depth: 'back' },
  { left: '46%', top: '56%', size: 7, opacity: 0.26, color: PINK_TONES[6], rotate: 12, depth: 'back' },
  { left: '58%', top: '56%', size: 7, opacity: 0.26, color: PINK_TONES[2], rotate: -14, depth: 'back' },
  { left: '52%', top: '42%', size: 7, opacity: 0.32, color: PINK_TONES[4], rotate: 20, depth: 'mid' },
  { left: '48%', top: '40%', size: 7, opacity: 0.32, color: PINK_TONES[1], rotate: -18, depth: 'mid' },
  /* Relleno en huecos medios (entre hojas grandes) */
  { left: '14%', top: '30%', size: 8, opacity: 0.38, color: PINK_TONES[3], rotate: -22, depth: 'mid' },
  { left: '92%', top: '30%', size: 8, opacity: 0.38, color: PINK_TONES[5], rotate: 24, depth: 'mid' },
  { left: '36%', top: '30%', size: 8, opacity: 0.4, color: PINK_DEEP[1], rotate: 14, depth: 'back' },
  { left: '68%', top: '30%', size: 8, opacity: 0.4, color: PINK_DEEP[0], rotate: -16, depth: 'back' },
  { left: '50%', top: '28%', size: 9, opacity: 0.44, color: PINK_TONES[2], rotate: 6, depth: 'mid' },
  { left: '22%', top: '36%', size: 7, opacity: 0.34, color: PINK_TONES[7], rotate: 28, depth: 'back' },
  { left: '82%', top: '36%', size: 7, opacity: 0.34, color: PINK_TONES[4], rotate: -26, depth: 'back' },
  { left: '6%', top: '38%', size: 7, opacity: 0.32, color: PINK_DEEP[2], rotate: 34, depth: 'back' },
  { left: '96%', top: '38%', size: 7, opacity: 0.32, color: PINK_DEEP[3], rotate: -32, depth: 'back' },
  { left: '30%', top: '44%', size: 8, opacity: 0.36, color: PINK_TONES[1], rotate: -10, depth: 'mid' },
  { left: '74%', top: '44%', size: 8, opacity: 0.36, color: PINK_TONES[6], rotate: 12, depth: 'mid' },
  { left: '42%', top: '46%', size: 7, opacity: 0.33, color: PINK_TONES[0], rotate: 18, depth: 'back' },
  { left: '62%', top: '46%', size: 7, opacity: 0.33, color: PINK_TONES[3], rotate: -14, depth: 'back' },
  { left: '50%', top: '44%', size: 8, opacity: 0.4, color: PINK_TONES[5], rotate: 4, depth: 'mid' },
  { left: '16%', top: '46%', size: 7, opacity: 0.3, color: PINK_DEEP[0], rotate: 22, depth: 'back' },
  { left: '88%', top: '46%', size: 7, opacity: 0.3, color: PINK_DEEP[1], rotate: -20, depth: 'back' },
  { left: '34%', top: '50%', size: 7, opacity: 0.28, color: PINK_TONES[2], rotate: 16, depth: 'back' },
  { left: '66%', top: '50%', size: 7, opacity: 0.28, color: PINK_TONES[4], rotate: -12, depth: 'back' },
  { left: '50%', top: '50%', size: 8, opacity: 0.35, color: PINK_TONES[7], rotate: 8, depth: 'mid' },
  { left: '12%', top: '52%', size: 7, opacity: 0.28, color: PINK_DEEP[2], rotate: 30, depth: 'back' },
  { left: '90%', top: '52%', size: 7, opacity: 0.28, color: PINK_DEEP[3], rotate: -28, depth: 'back' },
  { left: '40%', top: '54%', size: 7, opacity: 0.26, color: PINK_TONES[6], rotate: -8, depth: 'back' },
  { left: '60%', top: '54%', size: 7, opacity: 0.26, color: PINK_TONES[1], rotate: 10, depth: 'back' },
  { left: '26%', top: '48%', size: 7, opacity: 0.3, color: PINK_TONES[5], rotate: 24, depth: 'back' },
  { left: '78%', top: '48%', size: 7, opacity: 0.3, color: PINK_TONES[0], rotate: -22, depth: 'back' },
  { left: '44%', top: '36%', size: 7, opacity: 0.34, color: PINK_TONES[4], rotate: -6, depth: 'mid' },
  { left: '56%', top: '36%', size: 7, opacity: 0.34, color: PINK_TONES[2], rotate: 8, depth: 'mid' },
  { left: '38%', top: '32%', size: 7, opacity: 0.36, color: PINK_DEEP[1], rotate: 20, depth: 'back' },
  { left: '62%', top: '32%', size: 7, opacity: 0.36, color: PINK_DEEP[0], rotate: -18, depth: 'back' },
  { left: '18%', top: '34%', size: 7, opacity: 0.32, color: PINK_TONES[3], rotate: -24, depth: 'mid' },
  { left: '86%', top: '34%', size: 7, opacity: 0.32, color: PINK_TONES[6], rotate: 26, depth: 'mid' },
  { left: '52%', top: '46%', size: 7, opacity: 0.3, color: PINK_DEEP[2], rotate: 14, depth: 'back' },
  { left: '48%', top: '48%', size: 7, opacity: 0.3, color: PINK_DEEP[3], rotate: -10, depth: 'back' },
  { left: '32%', top: '38%', size: 7, opacity: 0.35, color: PINK_TONES[7], rotate: 12, depth: 'mid' },
  { left: '72%', top: '38%', size: 7, opacity: 0.35, color: PINK_TONES[1], rotate: -14, depth: 'mid' },
  { left: '24%', top: '42%', size: 7, opacity: 0.33, color: PINK_TONES[0], rotate: -16, depth: 'back' },
  { left: '80%', top: '42%', size: 7, opacity: 0.33, color: PINK_TONES[4], rotate: 18, depth: 'back' },
  { left: '54%', top: '38%', size: 7, opacity: 0.34, color: PINK_TONES[5], rotate: 22, depth: 'mid' },
  { left: '46%', top: '38%', size: 7, opacity: 0.34, color: PINK_TONES[3], rotate: -20, depth: 'mid' },
  { left: '14%', top: '42%', size: 7, opacity: 0.31, color: PINK_DEEP[0], rotate: 36, depth: 'back' },
  { left: '90%', top: '42%', size: 7, opacity: 0.31, color: PINK_DEEP[1], rotate: -34, depth: 'back' },
  { left: '36%', top: '46%', size: 7, opacity: 0.29, color: PINK_TONES[2], rotate: 6, depth: 'back' },
  { left: '64%', top: '46%', size: 7, opacity: 0.29, color: PINK_TONES[6], rotate: -8, depth: 'back' },
  { left: '42%', top: '52%', size: 7, opacity: 0.27, color: PINK_DEEP[3], rotate: 12, depth: 'back' },
  { left: '62%', top: '52%', size: 7, opacity: 0.27, color: PINK_DEEP[2], rotate: -14, depth: 'back' },
  { left: '52%', top: '54%', size: 7, opacity: 0.26, color: PINK_TONES[4], rotate: 4, depth: 'back' },
  { left: '48%', top: '54%', size: 7, opacity: 0.26, color: PINK_TONES[1], rotate: -6, depth: 'back' },
  { left: '10%', top: '28%', size: 7, opacity: 0.33, color: PINK_TONES[3], rotate: -18, depth: 'back' },
  { left: '94%', top: '28%', size: 7, opacity: 0.33, color: PINK_TONES[5], rotate: 20, depth: 'back' },
  { left: '18%', top: '38%', size: 6, opacity: 0.3, color: PINK_DEEP[2], rotate: 26, depth: 'back' },
  { left: '86%', top: '38%', size: 6, opacity: 0.3, color: PINK_DEEP[3], rotate: -24, depth: 'back' },
  { left: '40%', top: '28%', size: 7, opacity: 0.36, color: PINK_TONES[1], rotate: 10, depth: 'mid' },
  { left: '60%', top: '28%', size: 7, opacity: 0.36, color: PINK_TONES[4], rotate: -12, depth: 'mid' },
  { left: '50%', top: '32%', size: 7, opacity: 0.37, color: PINK_TONES[6], rotate: 4, depth: 'mid' },
  { left: '32%', top: '26%', size: 6, opacity: 0.32, color: PINK_DEEP[0], rotate: -14, depth: 'back' },
  { left: '68%', top: '26%', size: 6, opacity: 0.32, color: PINK_DEEP[1], rotate: 16, depth: 'back' },
  { left: '8%', top: '46%', size: 6, opacity: 0.28, color: PINK_DEEP[2], rotate: 32, depth: 'back' },
  { left: '96%', top: '46%', size: 6, opacity: 0.28, color: PINK_DEEP[3], rotate: -30, depth: 'back' },
  { left: '22%', top: '44%', size: 6, opacity: 0.31, color: PINK_TONES[7], rotate: -8, depth: 'back' },
  { left: '82%', top: '44%', size: 6, opacity: 0.31, color: PINK_TONES[0], rotate: 10, depth: 'back' },
  { left: '44%', top: '44%', size: 6, opacity: 0.32, color: PINK_TONES[2], rotate: 14, depth: 'mid' },
  { left: '58%', top: '44%', size: 6, opacity: 0.32, color: PINK_TONES[5], rotate: -16, depth: 'mid' },
  { left: '28%', top: '32%', size: 6, opacity: 0.34, color: PINK_TONES[4], rotate: 22, depth: 'mid' },
  { left: '76%', top: '32%', size: 6, opacity: 0.34, color: PINK_TONES[3], rotate: -20, depth: 'mid' },
  { left: '14%', top: '50%', size: 6, opacity: 0.27, color: PINK_DEEP[0], rotate: 28, depth: 'back' },
  { left: '88%', top: '50%', size: 6, opacity: 0.27, color: PINK_DEEP[1], rotate: -26, depth: 'back' },
  { left: '34%', top: '42%', size: 6, opacity: 0.3, color: PINK_TONES[1], rotate: 6, depth: 'back' },
  { left: '66%', top: '42%', size: 6, opacity: 0.3, color: PINK_TONES[6], rotate: -8, depth: 'back' },
  { left: '46%', top: '50%', size: 6, opacity: 0.29, color: PINK_TONES[0], rotate: 12, depth: 'back' },
  { left: '54%', top: '50%', size: 6, opacity: 0.29, color: PINK_TONES[3], rotate: -10, depth: 'back' },
  { left: '38%', top: '48%', size: 6, opacity: 0.28, color: PINK_DEEP[2], rotate: 18, depth: 'back' },
  { left: '62%', top: '48%', size: 6, opacity: 0.28, color: PINK_DEEP[3], rotate: -16, depth: 'back' },
  { left: '20%', top: '52%', size: 6, opacity: 0.26, color: PINK_TONES[5], rotate: 24, depth: 'back' },
  { left: '84%', top: '52%', size: 6, opacity: 0.26, color: PINK_TONES[2], rotate: -22, depth: 'back' },
  { left: '52%', top: '58%', size: 6, opacity: 0.24, color: PINK_DEEP[0], rotate: 6, depth: 'back' },
  { left: '46%', top: '58%', size: 6, opacity: 0.24, color: PINK_DEEP[1], rotate: -8, depth: 'back' },
  { left: '54%', top: '58%', size: 6, opacity: 0.24, color: PINK_TONES[7], rotate: 10, depth: 'back' },
  { left: '30%', top: '54%', size: 6, opacity: 0.25, color: PINK_TONES[4], rotate: -12, depth: 'back' },
  { left: '74%', top: '54%', size: 6, opacity: 0.25, color: PINK_TONES[1], rotate: 14, depth: 'back' },
  { left: '8%', top: '52%', size: 6, opacity: 0.25, color: PINK_DEEP[2], rotate: 34, depth: 'back' },
  { left: '96%', top: '52%', size: 6, opacity: 0.25, color: PINK_DEEP[3], rotate: -32, depth: 'back' },
  { left: '42%', top: '40%', size: 6, opacity: 0.33, color: PINK_TONES[3], rotate: -4, depth: 'mid' },
  { left: '62%', top: '40%', size: 6, opacity: 0.33, color: PINK_TONES[5], rotate: 6, depth: 'mid' },
  { left: '48%', top: '34%', size: 6, opacity: 0.34, color: PINK_TONES[2], rotate: 16, depth: 'mid' },
  { left: '54%', top: '32%', size: 6, opacity: 0.35, color: PINK_TONES[0], rotate: -18, depth: 'mid' },
  { left: '46%', top: '30%', size: 6, opacity: 0.35, color: PINK_TONES[6], rotate: 20, depth: 'mid' },
  { left: '26%', top: '30%', size: 6, opacity: 0.32, color: PINK_DEEP[1], rotate: -22, depth: 'back' },
  { left: '78%', top: '30%', size: 6, opacity: 0.32, color: PINK_DEEP[0], rotate: 24, depth: 'back' },
  { left: '52%', top: '26%', size: 7, opacity: 0.38, color: PINK_TONES[4], rotate: -6, depth: 'mid' },
  { left: '48%', top: '24%', size: 7, opacity: 0.38, color: PINK_TONES[1], rotate: 8, depth: 'mid' },
  { left: '38%', top: '44%', size: 6, opacity: 0.3, color: PINK_TONES[7], rotate: -14, depth: 'back' },
  { left: '62%', top: '44%', size: 6, opacity: 0.3, color: PINK_TONES[4], rotate: 12, depth: 'back' },
  { left: '56%', top: '48%', size: 6, opacity: 0.28, color: PINK_DEEP[3], rotate: 8, depth: 'back' },
  { left: '44%', top: '48%', size: 6, opacity: 0.28, color: PINK_DEEP[2], rotate: -10, depth: 'back' },
  { left: '32%', top: '46%', size: 6, opacity: 0.29, color: PINK_TONES[5], rotate: 18, depth: 'back' },
  { left: '72%', top: '46%', size: 6, opacity: 0.29, color: PINK_TONES[3], rotate: -16, depth: 'back' },
  { left: '16%', top: '40%', size: 6, opacity: 0.31, color: PINK_TONES[0], rotate: 30, depth: 'mid' },
  { left: '90%', top: '40%', size: 6, opacity: 0.31, color: PINK_TONES[6], rotate: -28, depth: 'mid' },
  { left: '50%', top: '42%', size: 6, opacity: 0.32, color: PINK_TONES[7], rotate: 2, depth: 'mid' },
  { left: '40%', top: '50%', size: 6, opacity: 0.27, color: PINK_TONES[1], rotate: -20, depth: 'back' },
  { left: '60%', top: '50%', size: 6, opacity: 0.27, color: PINK_TONES[2], rotate: 18, depth: 'back' },
  { left: '14%', top: '34%', size: 18, opacity: 0.52, color: PINK_TONES[0], rotate: -16, depth: 'front' },
  { left: '88%', top: '34%', size: 17, opacity: 0.5, color: PINK_TONES[4], rotate: 20, depth: 'front' },
  { left: '24%', top: '38%', size: 16, opacity: 0.48, color: PINK_TONES[2], rotate: 24, depth: 'mid' },
  { left: '78%', top: '38%', size: 16, opacity: 0.48, color: PINK_TONES[5], rotate: -22, depth: 'mid' },
  { left: '50%', top: '36%', size: 19, opacity: 0.55, color: PINK_TONES[6], rotate: 8, depth: 'front' },
  { left: '6%', top: '40%', size: 15, opacity: 0.42, color: PINK_DEEP[1], rotate: 32, depth: 'mid' },
  { left: '94%', top: '40%', size: 15, opacity: 0.42, color: PINK_DEEP[0], rotate: -30, depth: 'mid' },
  { left: '32%', top: '48%', size: 17, opacity: 0.5, color: PINK_TONES[1], rotate: -12, depth: 'front' },
  { left: '72%', top: '48%', size: 17, opacity: 0.5, color: PINK_TONES[3], rotate: 14, depth: 'front' },
  { left: '48%', top: '52%', size: 16, opacity: 0.46, color: PINK_TONES[4], rotate: 6, depth: 'mid' },
  { left: '18%', top: '28%', size: 15, opacity: 0.44, color: PINK_TONES[7], rotate: 18, depth: 'mid' },
  { left: '84%', top: '28%', size: 15, opacity: 0.44, color: PINK_TONES[0], rotate: -20, depth: 'mid' },
  { left: '40%', top: '26%', size: 14, opacity: 0.46, color: PINK_TONES[5], rotate: -10, depth: 'mid' },
  { left: '64%', top: '26%', size: 14, opacity: 0.46, color: PINK_TONES[2], rotate: 12, depth: 'mid' },
  { left: '52%', top: '32%', size: 13, opacity: 0.42, color: PINK_TONES[3], rotate: 4, depth: 'mid' },
  { left: '46%', top: '32%', size: 13, opacity: 0.42, color: PINK_TONES[1], rotate: -6, depth: 'mid' },
  { left: '28%', top: '34%', size: 12, opacity: 0.4, color: PINK_DEEP[2], rotate: 26, depth: 'back' },
  { left: '76%', top: '34%', size: 12, opacity: 0.4, color: PINK_DEEP[3], rotate: -24, depth: 'back' },
  { left: '36%', top: '40%', size: 14, opacity: 0.48, color: PINK_TONES[6], rotate: 16, depth: 'mid' },
  { left: '66%', top: '40%', size: 14, opacity: 0.48, color: PINK_TONES[4], rotate: -14, depth: 'mid' },
  { left: '54%', top: '44%', size: 13, opacity: 0.44, color: PINK_TONES[0], rotate: 10, depth: 'mid' },
  { left: '44%', top: '44%', size: 13, opacity: 0.44, color: PINK_TONES[7], rotate: -8, depth: 'mid' },
  { left: '22%', top: '46%', size: 12, opacity: 0.38, color: PINK_TONES[5], rotate: 22, depth: 'back' },
  { left: '82%', top: '46%', size: 12, opacity: 0.38, color: PINK_TONES[2], rotate: -20, depth: 'back' },
  { left: '56%', top: '50%', size: 14, opacity: 0.45, color: PINK_TONES[1], rotate: -18, depth: 'mid' },
  { left: '42%', top: '50%', size: 14, opacity: 0.45, color: PINK_TONES[3], rotate: 20, depth: 'mid' },
  { left: '12%', top: '44%', size: 11, opacity: 0.4, color: PINK_DEEP[0], rotate: 28, depth: 'back' },
  { left: '90%', top: '44%', size: 11, opacity: 0.4, color: PINK_DEEP[1], rotate: -26, depth: 'back' },
  { left: '50%', top: '46%', size: 15, opacity: 0.5, color: PINK_TONES[4], rotate: 2, depth: 'front' },
  { left: '38%', top: '52%', size: 13, opacity: 0.42, color: PINK_TONES[6], rotate: -16, depth: 'mid' },
  { left: '64%', top: '52%', size: 13, opacity: 0.42, color: PINK_TONES[5], rotate: 14, depth: 'mid' },
  { left: '26%', top: '42%', size: 11, opacity: 0.4, color: PINK_TONES[0], rotate: 12, depth: 'mid' },
  { left: '80%', top: '42%', size: 11, opacity: 0.4, color: PINK_TONES[7], rotate: -10, depth: 'mid' },
  { left: '58%', top: '38%', size: 12, opacity: 0.43, color: PINK_TONES[2], rotate: 18, depth: 'mid' },
  { left: '44%', top: '38%', size: 12, opacity: 0.43, color: PINK_TONES[1], rotate: -16, depth: 'mid' },
  { left: '20%', top: '32%', size: 13, opacity: 0.44, color: PINK_TONES[3], rotate: -22, depth: 'mid' },
  { left: '86%', top: '32%', size: 13, opacity: 0.44, color: PINK_TONES[6], rotate: 24, depth: 'mid' },
  { left: '52%', top: '40%', size: 16, opacity: 0.48, color: PINK_TONES[5], rotate: 6, depth: 'front' },
  { left: '46%', top: '42%', size: 15, opacity: 0.47, color: PINK_TONES[0], rotate: -4, depth: 'front' },
  { left: '50%', top: '54%', size: 18, opacity: 0.55, color: PINK_TONES[4], rotate: 4, depth: 'front' },
  { left: '44%', top: '56%', size: 16, opacity: 0.5, color: PINK_TONES[1], rotate: -14, depth: 'mid' },
  { left: '56%', top: '56%', size: 16, opacity: 0.5, color: PINK_TONES[2], rotate: 12, depth: 'mid' },
  { left: '48%', top: '58%', size: 17, opacity: 0.52, color: PINK_TONES[6], rotate: 8, depth: 'front' },
  { left: '54%', top: '58%', size: 15, opacity: 0.48, color: PINK_TONES[0], rotate: -10, depth: 'mid' },
  { left: '38%', top: '54%', size: 14, opacity: 0.46, color: PINK_TONES[5], rotate: 22, depth: 'mid' },
  { left: '62%', top: '54%', size: 14, opacity: 0.46, color: PINK_TONES[3], rotate: -20, depth: 'mid' },
  { left: '42%', top: '58%', size: 13, opacity: 0.44, color: PINK_DEEP[1], rotate: 18, depth: 'back' },
  { left: '58%', top: '58%', size: 13, opacity: 0.44, color: PINK_DEEP[0], rotate: -16, depth: 'back' },
  { left: '36%', top: '56%', size: 12, opacity: 0.4, color: PINK_TONES[7], rotate: 26, depth: 'back' },
  { left: '64%', top: '56%', size: 12, opacity: 0.4, color: PINK_TONES[4], rotate: -24, depth: 'back' },
  { left: '50%', top: '52%', size: 14, opacity: 0.48, color: PINK_TONES[2], rotate: 6, depth: 'mid' },
  { left: '46%', top: '54%', size: 11, opacity: 0.38, color: PINK_DEEP[2], rotate: -8, depth: 'back' },
  { left: '54%', top: '54%', size: 11, opacity: 0.38, color: PINK_DEEP[3], rotate: 10, depth: 'back' },
  { left: '40%', top: '52%', size: 13, opacity: 0.42, color: PINK_TONES[1], rotate: 16, depth: 'mid' },
  { left: '60%', top: '52%', size: 13, opacity: 0.42, color: PINK_TONES[6], rotate: -14, depth: 'mid' },
  { left: '34%', top: '52%', size: 11, opacity: 0.36, color: PINK_DEEP[0], rotate: 28, depth: 'back' },
  { left: '66%', top: '52%', size: 11, opacity: 0.36, color: PINK_DEEP[1], rotate: -26, depth: 'back' },
  { left: '52%', top: '60%', size: 12, opacity: 0.4, color: PINK_TONES[3], rotate: -6, depth: 'mid' },
  { left: '46%', top: '60%', size: 12, opacity: 0.4, color: PINK_TONES[5], rotate: 8, depth: 'mid' },
  { left: '50%', top: '56%', size: 10, opacity: 0.35, color: PINK_TONES[7], rotate: 4, depth: 'back' },
  { left: '44%', top: '52%', size: 10, opacity: 0.34, color: PINK_TONES[0], rotate: -12, depth: 'back' },
  { left: '56%', top: '52%', size: 10, opacity: 0.34, color: PINK_TONES[4], rotate: 14, depth: 'back' },
  { left: '38%', top: '58%', size: 10, opacity: 0.32, color: PINK_DEEP[2], rotate: 20, depth: 'back' },
  { left: '62%', top: '58%', size: 10, opacity: 0.32, color: PINK_DEEP[3], rotate: -18, depth: 'back' },
  { left: '48%', top: '50%', size: 15, opacity: 0.5, color: PINK_TONES[6], rotate: -4, depth: 'front' },
  { left: '54%', top: '50%', size: 14, opacity: 0.47, color: PINK_TONES[1], rotate: 6, depth: 'mid' },
  { left: '42%', top: '54%', size: 9, opacity: 0.33, color: PINK_TONES[2], rotate: 24, depth: 'back' },
  { left: '58%', top: '54%', size: 9, opacity: 0.33, color: PINK_TONES[5], rotate: -22, depth: 'back' },
  { left: '50%', top: '58%', size: 9, opacity: 0.3, color: PINK_DEEP[0], rotate: 2, depth: 'back' },
  { left: '36%', top: '54%', size: 8, opacity: 0.3, color: PINK_TONES[3], rotate: 30, depth: 'back' },
  { left: '64%', top: '54%', size: 8, opacity: 0.3, color: PINK_TONES[7], rotate: -28, depth: 'back' },
  { left: '46%', top: '56%', size: 8, opacity: 0.28, color: PINK_TONES[4], rotate: -14, depth: 'back' },
  { left: '54%', top: '56%', size: 8, opacity: 0.28, color: PINK_TONES[0], rotate: 12, depth: 'back' },
  { left: '32%', top: '22%', size: 14, opacity: 0.5, color: PINK_TONES[0], rotate: -18, depth: 'front' },
  { left: '72%', top: '22%', size: 14, opacity: 0.5, color: PINK_TONES[4], rotate: 16, depth: 'front' },
  { left: '50%', top: '24%', size: 16, opacity: 0.52, color: PINK_TONES[2], rotate: 6, depth: 'front' },
  { left: '40%', top: '24%', size: 12, opacity: 0.44, color: PINK_TONES[5], rotate: 22, depth: 'mid' },
  { left: '60%', top: '24%', size: 12, opacity: 0.44, color: PINK_TONES[1], rotate: -20, depth: 'mid' },
  { left: '28%', top: '26%', size: 11, opacity: 0.4, color: PINK_DEEP[1], rotate: 28, depth: 'back' },
  { left: '76%', top: '26%', size: 11, opacity: 0.4, color: PINK_DEEP[0], rotate: -26, depth: 'back' },
  { left: '18%', top: '24%', size: 13, opacity: 0.46, color: PINK_TONES[6], rotate: 14, depth: 'mid' },
  { left: '86%', top: '24%', size: 13, opacity: 0.46, color: PINK_TONES[3], rotate: -12, depth: 'mid' },
  { left: '46%', top: '28%', size: 15, opacity: 0.48, color: PINK_TONES[7], rotate: -8, depth: 'front' },
  { left: '54%', top: '28%', size: 14, opacity: 0.47, color: PINK_TONES[0], rotate: 10, depth: 'mid' },
  { left: '38%', top: '30%', size: 13, opacity: 0.45, color: PINK_TONES[4], rotate: 18, depth: 'mid' },
  { left: '66%', top: '30%', size: 13, opacity: 0.45, color: PINK_TONES[2], rotate: -16, depth: 'mid' },
  { left: '24%', top: '30%', size: 10, opacity: 0.38, color: PINK_DEEP[2], rotate: 24, depth: 'back' },
  { left: '80%', top: '30%', size: 10, opacity: 0.38, color: PINK_DEEP[3], rotate: -22, depth: 'back' },
  { left: '50%', top: '30%', size: 12, opacity: 0.43, color: PINK_TONES[5], rotate: 4, depth: 'mid' },
  { left: '42%', top: '32%', size: 11, opacity: 0.4, color: PINK_TONES[1], rotate: -14, depth: 'mid' },
  { left: '58%', top: '32%', size: 11, opacity: 0.4, color: PINK_TONES[6], rotate: 12, depth: 'mid' },
  { left: '32%', top: '32%', size: 9, opacity: 0.36, color: PINK_TONES[3], rotate: 20, depth: 'back' },
  { left: '72%', top: '32%', size: 9, opacity: 0.36, color: PINK_TONES[7], rotate: -18, depth: 'back' },
  { left: '14%', top: '28%', size: 12, opacity: 0.42, color: PINK_TONES[0], rotate: 30, depth: 'mid' },
  { left: '90%', top: '28%', size: 12, opacity: 0.42, color: PINK_TONES[4], rotate: -28, depth: 'mid' },
  { left: '36%', top: '34%', size: 14, opacity: 0.48, color: PINK_TONES[2], rotate: -10, depth: 'front' },
  { left: '68%', top: '34%', size: 14, opacity: 0.48, color: PINK_TONES[5], rotate: 8, depth: 'front' },
  { left: '50%', top: '34%', size: 13, opacity: 0.46, color: PINK_TONES[1], rotate: 2, depth: 'mid' },
  { left: '44%', top: '36%', size: 12, opacity: 0.44, color: PINK_TONES[6], rotate: 16, depth: 'mid' },
  { left: '56%', top: '36%', size: 12, opacity: 0.44, color: PINK_TONES[3], rotate: -14, depth: 'mid' },
  { left: '26%', top: '34%', size: 10, opacity: 0.38, color: PINK_DEEP[0], rotate: 26, depth: 'back' },
  { left: '78%', top: '34%', size: 10, opacity: 0.38, color: PINK_DEEP[1], rotate: -24, depth: 'back' },
  { left: '20%', top: '32%', size: 11, opacity: 0.4, color: PINK_TONES[7], rotate: 22, depth: 'mid' },
  { left: '84%', top: '32%', size: 11, opacity: 0.4, color: PINK_TONES[0], rotate: -20, depth: 'mid' },
  { left: '40%', top: '38%', size: 13, opacity: 0.45, color: PINK_TONES[4], rotate: 12, depth: 'mid' },
  { left: '64%', top: '38%', size: 13, opacity: 0.45, color: PINK_TONES[2], rotate: -10, depth: 'mid' },
  { left: '48%', top: '38%', size: 11, opacity: 0.42, color: PINK_TONES[5], rotate: 6, depth: 'mid' },
  { left: '54%', top: '38%', size: 10, opacity: 0.4, color: PINK_TONES[1], rotate: -6, depth: 'mid' },
  { left: '30%', top: '38%', size: 9, opacity: 0.35, color: PINK_DEEP[2], rotate: 18, depth: 'back' },
  { left: '74%', top: '38%', size: 9, opacity: 0.35, color: PINK_DEEP[3], rotate: -16, depth: 'back' },
  { left: '16%', top: '36%', size: 12, opacity: 0.43, color: PINK_TONES[6], rotate: 32, depth: 'mid' },
  { left: '88%', top: '36%', size: 12, opacity: 0.43, color: PINK_TONES[3], rotate: -30, depth: 'mid' },
  { left: '52%', top: '40%', size: 14, opacity: 0.47, color: PINK_TONES[0], rotate: 8, depth: 'front' },
  { left: '46%', top: '40%', size: 13, opacity: 0.45, color: PINK_TONES[7], rotate: -12, depth: 'mid' },
  { left: '34%', top: '40%', size: 10, opacity: 0.38, color: PINK_TONES[2], rotate: 24, depth: 'back' },
  { left: '70%', top: '40%', size: 10, opacity: 0.38, color: PINK_TONES[4], rotate: -22, depth: 'back' },
  { left: '38%', top: '42%', size: 11, opacity: 0.4, color: PINK_TONES[5], rotate: 14, depth: 'mid' },
  { left: '66%', top: '42%', size: 11, opacity: 0.4, color: PINK_TONES[1], rotate: -12, depth: 'mid' },
  { left: '50%', top: '42%', size: 10, opacity: 0.39, color: PINK_TONES[6], rotate: 4, depth: 'mid' },
  { left: '22%', top: '38%', size: 9, opacity: 0.34, color: PINK_DEEP[1], rotate: 28, depth: 'back' },
  { left: '82%', top: '38%', size: 9, opacity: 0.34, color: PINK_DEEP[0], rotate: -26, depth: 'back' },
  { left: '44%', top: '30%', size: 9, opacity: 0.37, color: PINK_TONES[3], rotate: -20, depth: 'back' },
  { left: '58%', top: '30%', size: 9, opacity: 0.37, color: PINK_TONES[7], rotate: 18, depth: 'back' },
  { left: '52%', top: '22%', size: 11, opacity: 0.44, color: PINK_TONES[4], rotate: -6, depth: 'mid' },
  { left: '48%', top: '20%', size: 10, opacity: 0.42, color: PINK_TONES[1], rotate: 8, depth: 'mid' },
];

const EXTRA_GAP_HEARTS: DecorHeart[] = [
  { left: '12%', top: '26%', size: 10, opacity: 0.38, color: PINK_TONES[0], rotate: 22, depth: 'mid' },
  { left: '88%', top: '26%', size: 10, opacity: 0.38, color: PINK_TONES[1], rotate: -20, depth: 'mid' },
  { left: '24%', top: '34%', size: 11, opacity: 0.4, color: PINK_TONES[2], rotate: 18, depth: 'mid' },
  { left: '76%', top: '34%', size: 11, opacity: 0.4, color: PINK_TONES[3], rotate: -18, depth: 'mid' },
  { left: '36%', top: '26%', size: 9, opacity: 0.35, color: PINK_DEEP[1], rotate: 26, depth: 'back' },
  { left: '64%', top: '26%', size: 9, opacity: 0.35, color: PINK_DEEP[0], rotate: -24, depth: 'back' },
  { left: '30%', top: '40%', size: 10, opacity: 0.38, color: PINK_TONES[4], rotate: 14, depth: 'mid' },
  { left: '70%', top: '40%', size: 10, opacity: 0.38, color: PINK_TONES[5], rotate: -14, depth: 'mid' },
  { left: '42%', top: '30%', size: 11, opacity: 0.4, color: PINK_TONES[0], rotate: -10, depth: 'mid' },
  { left: '58%', top: '30%', size: 11, opacity: 0.4, color: PINK_TONES[2], rotate: 10, depth: 'mid' },
  { left: '50%', top: '34%', size: 12, opacity: 0.42, color: PINK_TONES[3], rotate: 4, depth: 'front' },
  { left: '18%', top: '42%', size: 9, opacity: 0.34, color: PINK_DEEP[2], rotate: 30, depth: 'back' },
  { left: '82%', top: '42%', size: 9, opacity: 0.34, color: PINK_DEEP[3], rotate: -28, depth: 'back' },
  { left: '40%', top: '46%', size: 9, opacity: 0.34, color: PINK_DEEP[0], rotate: 18, depth: 'back' },
  { left: '60%', top: '46%', size: 9, opacity: 0.34, color: PINK_DEEP[1], rotate: -16, depth: 'back' },
  { left: '26%', top: '22%', size: 10, opacity: 0.38, color: PINK_TONES[0], rotate: 24, depth: 'mid' },
  { left: '74%', top: '22%', size: 10, opacity: 0.38, color: PINK_TONES[1], rotate: -22, depth: 'mid' },
  { left: '34%', top: '24%', size: 9, opacity: 0.34, color: PINK_DEEP[0], rotate: 18, depth: 'back' },
  { left: '66%', top: '24%', size: 9, opacity: 0.34, color: PINK_DEEP[1], rotate: -18, depth: 'back' },
  { left: '22%', top: '30%', size: 10, opacity: 0.39, color: PINK_TONES[2], rotate: 26, depth: 'mid' },
  { left: '78%', top: '30%', size: 10, opacity: 0.39, color: PINK_TONES[3], rotate: -24, depth: 'mid' },
  { left: '28%', top: '38%', size: 9, opacity: 0.36, color: PINK_TONES[4], rotate: 20, depth: 'back' },
  { left: '72%', top: '38%', size: 9, opacity: 0.36, color: PINK_TONES[5], rotate: -20, depth: 'back' },
  { left: '36%', top: '42%', size: 8, opacity: 0.33, color: PINK_DEEP[2], rotate: 14, depth: 'back' },
  { left: '64%', top: '42%', size: 8, opacity: 0.33, color: PINK_DEEP[3], rotate: -14, depth: 'back' },
  { left: '30%', top: '46%', size: 9, opacity: 0.35, color: PINK_TONES[0], rotate: 28, depth: 'mid' },
  { left: '70%', top: '46%', size: 9, opacity: 0.35, color: PINK_TONES[1], rotate: -26, depth: 'mid' },
  { left: '24%', top: '52%', size: 8, opacity: 0.3, color: PINK_DEEP[0], rotate: 24, depth: 'back' },
  { left: '76%', top: '52%', size: 8, opacity: 0.3, color: PINK_DEEP[1], rotate: -22, depth: 'back' },
  { left: '42%', top: '54%', size: 8, opacity: 0.3, color: PINK_DEEP[2], rotate: 12, depth: 'back' },
  { left: '58%', top: '54%', size: 8, opacity: 0.3, color: PINK_DEEP[3], rotate: -12, depth: 'back' },
  { left: '46%', top: '26%', size: 10, opacity: 0.38, color: PINK_TONES[2], rotate: 10, depth: 'mid' },
  { left: '54%', top: '26%', size: 10, opacity: 0.38, color: PINK_TONES[3], rotate: -10, depth: 'mid' },
  { left: '40%', top: '34%', size: 9, opacity: 0.36, color: PINK_TONES[4], rotate: 16, depth: 'mid' },
  { left: '60%', top: '34%', size: 9, opacity: 0.36, color: PINK_TONES[5], rotate: -16, depth: 'mid' },
  { left: '48%', top: '56%', size: 8, opacity: 0.29, color: PINK_DEEP[0], rotate: 8, depth: 'back' },
  { left: '52%', top: '56%', size: 8, opacity: 0.29, color: PINK_DEEP[1], rotate: -8, depth: 'back' },
];

/** Centro hacia la izquierda: relleno entre hojas grandes */
const LEFT_CENTER_GAP_HEARTS: DecorHeart[] = [
  { left: '46%', top: '28%', size: 10, opacity: 0.4, color: PINK_TONES[0], rotate: -12, depth: 'mid' },
  { left: '44%', top: '32%', size: 9, opacity: 0.38, color: PINK_TONES[2], rotate: 14, depth: 'mid' },
  { left: '42%', top: '36%', size: 10, opacity: 0.39, color: PINK_TONES[4], rotate: -8, depth: 'mid' },
  { left: '40%', top: '30%', size: 9, opacity: 0.37, color: PINK_DEEP[1], rotate: 20, depth: 'back' },
  { left: '38%', top: '34%', size: 11, opacity: 0.42, color: PINK_TONES[1], rotate: -16, depth: 'mid' },
  { left: '36%', top: '38%', size: 9, opacity: 0.36, color: PINK_TONES[5], rotate: 22, depth: 'back' },
  { left: '34%', top: '32%', size: 10, opacity: 0.4, color: PINK_TONES[3], rotate: 18, depth: 'mid' },
  { left: '32%', top: '36%', size: 8, opacity: 0.34, color: PINK_DEEP[0], rotate: -24, depth: 'back' },
  { left: '30%', top: '40%', size: 9, opacity: 0.37, color: PINK_TONES[6], rotate: 12, depth: 'mid' },
  { left: '28%', top: '34%', size: 8, opacity: 0.35, color: PINK_DEEP[2], rotate: 26, depth: 'back' },
  { left: '44%', top: '40%', size: 9, opacity: 0.38, color: PINK_TONES[0], rotate: 6, depth: 'mid' },
  { left: '46%', top: '44%', size: 8, opacity: 0.35, color: PINK_DEEP[3], rotate: -14, depth: 'back' },
  { left: '42%', top: '44%', size: 10, opacity: 0.4, color: PINK_TONES[2], rotate: 10, depth: 'mid' },
  { left: '38%', top: '42%', size: 9, opacity: 0.37, color: PINK_TONES[4], rotate: -18, depth: 'mid' },
  { left: '36%', top: '46%', size: 8, opacity: 0.33, color: PINK_DEEP[1], rotate: 16, depth: 'back' },
  { left: '34%', top: '44%', size: 8, opacity: 0.34, color: PINK_TONES[5], rotate: -20, depth: 'back' },
  { left: '32%', top: '48%', size: 9, opacity: 0.36, color: PINK_TONES[1], rotate: 24, depth: 'mid' },
  { left: '40%', top: '48%', size: 8, opacity: 0.32, color: PINK_DEEP[0], rotate: -10, depth: 'back' },
  { left: '44%', top: '24%', size: 9, opacity: 0.39, color: PINK_TONES[3], rotate: 8, depth: 'mid' },
  { left: '38%', top: '28%', size: 8, opacity: 0.36, color: PINK_DEEP[2], rotate: -22, depth: 'back' },
];

/** Lado izquierdo de la copa (borde y huecos laterales) */
const LEFT_SIDE_GAP_HEARTS: DecorHeart[] = [
  { left: '8%', top: '32%', size: 10, opacity: 0.38, color: PINK_TONES[0], rotate: 28, depth: 'mid' },
  { left: '6%', top: '36%', size: 9, opacity: 0.35, color: PINK_DEEP[1], rotate: 32, depth: 'back' },
  { left: '10%', top: '38%', size: 9, opacity: 0.37, color: PINK_TONES[2], rotate: -26, depth: 'mid' },
  { left: '4%', top: '40%', size: 8, opacity: 0.32, color: PINK_DEEP[0], rotate: 34, depth: 'back' },
  { left: '12%', top: '40%', size: 10, opacity: 0.4, color: PINK_TONES[4], rotate: 22, depth: 'mid' },
  { left: '8%', top: '44%', size: 8, opacity: 0.34, color: PINK_DEEP[2], rotate: 30, depth: 'back' },
  { left: '14%', top: '44%', size: 9, opacity: 0.38, color: PINK_TONES[5], rotate: -20, depth: 'mid' },
  { left: '6%', top: '48%', size: 8, opacity: 0.33, color: PINK_TONES[1], rotate: 26, depth: 'back' },
  { left: '16%', top: '48%', size: 9, opacity: 0.36, color: PINK_TONES[3], rotate: 18, depth: 'mid' },
  { left: '10%', top: '52%', size: 8, opacity: 0.32, color: PINK_DEEP[3], rotate: -28, depth: 'back' },
  { left: '18%', top: '52%', size: 8, opacity: 0.34, color: PINK_DEEP[1], rotate: 24, depth: 'back' },
  { left: '14%', top: '32%', size: 9, opacity: 0.39, color: PINK_TONES[6], rotate: -22, depth: 'mid' },
  { left: '20%', top: '34%', size: 10, opacity: 0.41, color: PINK_TONES[0], rotate: 20, depth: 'mid' },
  { left: '16%', top: '28%', size: 9, opacity: 0.38, color: PINK_TONES[2], rotate: 16, depth: 'mid' },
  { left: '22%', top: '28%', size: 8, opacity: 0.36, color: PINK_DEEP[0], rotate: -18, depth: 'back' },
  { left: '18%', top: '24%', size: 8, opacity: 0.37, color: PINK_TONES[4], rotate: 24, depth: 'mid' },
  { left: '12%', top: '24%', size: 9, opacity: 0.38, color: PINK_TONES[5], rotate: -24, depth: 'mid' },
  { left: '24%', top: '32%', size: 9, opacity: 0.39, color: PINK_TONES[1], rotate: 14, depth: 'mid' },
  { left: '20%', top: '38%', size: 8, opacity: 0.35, color: PINK_DEEP[2], rotate: -16, depth: 'back' },
  { left: '26%', top: '40%', size: 9, opacity: 0.37, color: PINK_TONES[3], rotate: 22, depth: 'mid' },
  { left: '22%', top: '44%', size: 8, opacity: 0.34, color: PINK_TONES[6], rotate: -14, depth: 'back' },
  { left: '24%', top: '48%', size: 8, opacity: 0.33, color: PINK_DEEP[3], rotate: 20, depth: 'back' },
  { left: '28%', top: '44%', size: 9, opacity: 0.36, color: PINK_TONES[0], rotate: -12, depth: 'mid' },
  { left: '26%', top: '36%', size: 8, opacity: 0.35, color: PINK_TONES[4], rotate: 18, depth: 'mid' },
  { left: '8%', top: '28%', size: 8, opacity: 0.36, color: PINK_DEEP[1], rotate: 30, depth: 'back' },
];

/** Acentos rojos puntuales en la copa */
const RED_ACCENT_HEARTS: DecorHeart[] = [
  {
    left: '52%',
    top: '36%',
    size: 11,
    opacity: 0.52,
    color: RED_TONES[0],
    rotate: -10,
    depth: 'front',
    preserveColor: true,
  },
  {
    left: '48%',
    top: '42%',
    size: 10,
    opacity: 0.48,
    color: RED_TONES[1],
    rotate: 14,
    depth: 'mid',
    preserveColor: true,
  },
  {
    left: '70%',
    top: '38%',
    size: 10,
    opacity: 0.5,
    color: RED_TONES[2],
    rotate: 18,
    depth: 'mid',
    preserveColor: true,
  },
  {
    left: '62%',
    top: '46%',
    size: 9,
    opacity: 0.46,
    color: RED_TONES[3],
    rotate: -16,
    depth: 'back',
    preserveColor: true,
  },
  {
    left: '36%',
    top: '30%',
    size: 10,
    opacity: 0.5,
    color: RED_TONES[4],
    rotate: 22,
    depth: 'mid',
    preserveColor: true,
  },
  {
    left: '24%',
    top: '26%',
    size: 9,
    opacity: 0.47,
    color: RED_TONES[0],
    rotate: -20,
    depth: 'back',
    preserveColor: true,
  },
  {
    left: '14%',
    top: '36%',
    size: 10,
    opacity: 0.48,
    color: RED_TONES[1],
    rotate: 26,
    depth: 'mid',
    preserveColor: true,
  },
  {
    left: '50%',
    top: '48%',
    size: 11,
    opacity: 0.5,
    color: RED_TONES[2],
    rotate: 6,
    depth: 'front',
    preserveColor: true,
  },
  {
    left: '44%',
    top: '52%',
    size: 9,
    opacity: 0.44,
    color: RED_TONES[3],
    rotate: -12,
    depth: 'back',
    preserveColor: true,
  },
  {
    left: '58%',
    top: '32%',
    size: 9,
    opacity: 0.49,
    color: RED_TONES[4],
    rotate: 12,
    depth: 'mid',
    preserveColor: true,
  },
  {
    left: '32%',
    top: '42%',
    size: 9,
    opacity: 0.46,
    color: RED_TONES[0],
    rotate: -18,
    depth: 'back',
    preserveColor: true,
  },
  {
    left: '76%',
    top: '44%',
    size: 10,
    opacity: 0.48,
    color: RED_TONES[1],
    rotate: 20,
    depth: 'mid',
    preserveColor: true,
  },
];

function parsePercent(value: `${number}%`): number {
  return Number(value.replace('%', ''));
}

function toPercent(value: number): `${number}%` {
  return `${value}%` as const;
}

function normalizeHeartColor(depth: LeafDepth, idx: number): string {
  if (depth === 'back') return PINK_DEEP[idx % PINK_DEEP.length];
  return PINK_TONES[idx % PINK_TONES.length];
}

function buildBalancedHearts(): DecorHeart[] {
  const merged = [
    ...DECOR_HEARTS,
    ...EXTRA_GAP_HEARTS,
    ...LEFT_CENTER_GAP_HEARTS,
    ...LEFT_SIDE_GAP_HEARTS,
    ...RED_ACCENT_HEARTS,
  ];
  const cellCounter = new Map<string, number>();
  const balanced: DecorHeart[] = [];

  for (let i = 0; i < merged.length; i++) {
    const heart = merged[i];
    const left = parsePercent(heart.left);
    const top = parsePercent(heart.top);

    // Mantener toda la decoración dentro de la copa definida.
    if (left < 2 || left > 98 || top < 18 || top > 60) continue;

    const cellX = Math.floor(left / 8);
    const cellY = Math.floor((top - 18) / 6);
    const key = `${cellX}-${cellY}`;
    const inLeftCenter = left >= 26 && left <= 50;
    const onLeftSide = left < 30;
    const maxPerCell =
      (top > 46 ? 5 : 4) + (inLeftCenter ? 1 : 0) + (onLeftSide ? 1 : 0);
    const count = cellCounter.get(key) ?? 0;
    if (count >= maxPerCell) continue;

    cellCounter.set(key, count + 1);
    balanced.push({
      ...heart,
      left: toPercent(left),
      top: toPercent(top),
      color: heart.preserveColor ? heart.color : normalizeHeartColor(heart.depth, i),
    });
  }

  return balanced;
}

function depthZIndex(depth: LeafDepth): number {
  if (depth === 'back') return 0;
  if (depth === 'mid') return 1;
  return 2;
}

function depthScale(depth: LeafDepth): number {
  if (depth === 'back') return 0.88;
  if (depth === 'mid') return 0.96;
  return 1;
}

/** Corazón de texto más redondo (menos alargado verticalmente) */
function heartGlyphTransform(rotate: number, depth: LeafDepth) {
  const s = depthScale(depth);
  return [
    { rotate: `${rotate}deg` },
    { scaleX: s * 1.1 },
    { scaleY: s * 0.9 },
  ];
}

function quadPoint(t: number, c: BranchCurve) {
  const u = 1 - t;
  return {
    x: u * u * c.x0 + 2 * u * t * c.cx + t * t * c.x2,
    y: u * u * c.y0 + 2 * u * t * c.cy + t * t * c.y2,
  };
}

function sampleCurve(c: BranchCurve, count: number) {
  return Array.from({ length: count + 1 }, (_, i) => quadPoint(i / count, c));
}

/** Grosor del tronco: base ancha, se mantiene grueso y afina poco hacia la copa */
function trunkWidthAt(t: number): number {
  const eased = Math.pow(t, 0.48);
  return TRUNK_BASE_WIDTH - (TRUNK_BASE_WIDTH - TRUNK_TOP_WIDTH) * eased;
}

function curveTangent(curve: BranchCurve, t: number) {
  const p = quadPoint(t, curve);
  const q = quadPoint(Math.min(t + 0.05, 1), curve);
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const mag = Math.hypot(dx, dy) || 1;
  return { p, tx: dx / mag, ty: dy / mag, px: -dy / mag, py: dx / mag };
}

/** Tronco con base ensanchada y vetas de corteza */
function renderTrunk(curve: BranchCurve) {
  const pts = sampleCurve(curve, SMOOTH_SAMPLES);
  const segments = pts.slice(0, -1).map((a, i) => {
    const b = pts[i + 1];
    const t = (i + 0.5) / SMOOTH_SAMPLES;
    const w = trunkWidthAt(t);
    return (
      <Line
        key={`trunk-${i}`}
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke={TRUNK_COLOR}
        strokeOpacity={TRUNK_OPACITY}
        strokeWidth={w}
        strokeLinecap="round"
      />
    );
  });

  const base = quadPoint(0, curve);
  const flare = (
    <Line
      key="trunk-flare"
      x1={base.x - 16}
      y1={base.y + 1}
      x2={base.x + 16}
      y2={base.y + 1}
      stroke={TRUNK_COLOR}
      strokeOpacity={TRUNK_OPACITY}
      strokeWidth={10}
      strokeLinecap="round"
    />
  );

  const barkTs = [0.14, 0.26, 0.4, 0.54, 0.68, 0.82];
  const bark = barkTs.flatMap((t, bi) => {
    const { p, tx, ty, px, py } = curveTangent(curve, t);
    const streakLen = 14 + (1 - t) * 10;
    const sides = [-1, 1] as const;
    return sides.map((side, si) => {
      const off = (3.5 + (bi % 3) * 1.2) * side;
      const cx = p.x + px * off;
      const cy = p.y + py * off;
      return (
        <Line
          key={`bark-${bi}-${si}`}
          x1={cx - tx * streakLen * 0.5}
          y1={cy - ty * streakLen * 0.5}
          x2={cx + tx * streakLen * 0.5}
          y2={cy + ty * streakLen * 0.5}
          stroke={TRUNK_BARK}
          strokeOpacity={0.28 + (bi % 2) * 0.08}
          strokeWidth={1.4}
          strokeLinecap="round"
        />
      );
    });
  });

  const edgeTs = [0.08, 0.22, 0.38, 0.55, 0.72, 0.88];
  const highlight = edgeTs.map((t, i) => {
    const { p, tx, ty, px, py } = curveTangent(curve, t);
    const len = 10 + (1 - t) * 6;
    const off = -trunkWidthAt(t) * 0.22;
    const cx = p.x + px * off;
    const cy = p.y + py * off;
    return (
      <Line
        key={`trunk-hi-${i}`}
        x1={cx - tx * len * 0.5}
        y1={cy - ty * len * 0.5}
        x2={cx + tx * len * 0.5}
        y2={cy + ty * len * 0.5}
        stroke={TRUNK_HIGHLIGHT}
        strokeOpacity={0.38}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
    );
  });

  const shadow = edgeTs.map((t, i) => {
    const { p, tx, ty, px, py } = curveTangent(curve, t);
    const len = 10 + (1 - t) * 6;
    const off = trunkWidthAt(t) * 0.2;
    const cx = p.x + px * off;
    const cy = p.y + py * off;
    return (
      <Line
        key={`trunk-sh-${i}`}
        x1={cx - tx * len * 0.5}
        y1={cy - ty * len * 0.5}
        x2={cx + tx * len * 0.5}
        y2={cy + ty * len * 0.5}
        stroke={TRUNK_SHADOW}
        strokeOpacity={0.32}
        strokeWidth={1.3}
        strokeLinecap="round"
      />
    );
  });

  return [...segments, flare, ...bark, ...highlight, ...shadow];
}

/** Ramita que nace en un punto real de la rama padre */
function makeTwig(parent: BranchCurve, attachT: number, angleDeg: number, length: number): BranchCurve {
  const start = quadPoint(attachT, parent);
  const near = quadPoint(Math.min(attachT + 0.06, 0.99), parent);
  let tx = near.x - start.x;
  let ty = near.y - start.y;
  const mag = Math.hypot(tx, ty) || 1;
  tx /= mag;
  ty /= mag;
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dirX = tx * cos - ty * sin;
  const dirY = tx * sin + ty * cos;
  const endX = start.x + dirX * length;
  const endY = start.y + dirY * length;
  const ctrlX = start.x + dirX * length * 0.5 + dirY * length * 0.12;
  const ctrlY = start.y + dirY * length * 0.5 - dirX * length * 0.12;
  return { x0: start.x, y0: start.y, cx: ctrlX, cy: ctrlY, x2: endX, y2: endY };
}

const TWIG_BRANCHES: BranchCurve[] = TWIG_SPECS.map((spec) =>
  makeTwig(MAIN_BRANCHES[spec.parentIndex], spec.attachT, spec.angleDeg, spec.length),
);

/** Trazo suave: muchos segmentos cortos con grosor gradual */
function renderSmoothTaperedBranch(
  curve: BranchCurve,
  keyPrefix: string,
  maxW: number,
  minW: number,
  stroke = BRANCH_COLOR,
  strokeOpacity = BRANCH_OPACITY,
) {
  const pts = sampleCurve(curve, SMOOTH_SAMPLES);
  return pts.slice(0, -1).map((a, i) => {
    const b = pts[i + 1];
    const t = (i + 0.5) / SMOOTH_SAMPLES;
    const w = maxW - (maxW - minW) * t;
    return (
      <Line
        key={`${keyPrefix}-${i}`}
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke={stroke}
        strokeOpacity={strokeOpacity}
        strokeWidth={w}
        strokeLinecap="round"
      />
    );
  });
}

function heartsForEmptySlot(slotIndex: number) {
  const patterns = [
    { dx: 0, dy: 0, size: 20, rotate: -10 },
    { dx: -14, dy: -8, size: 14, rotate: 22 },
    { dx: 12, dy: -10, size: 12, rotate: -18 },
    { dx: -8, dy: 10, size: 11, rotate: 28 },
    { dx: 14, dy: 8, size: 13, rotate: -24 },
    { dx: 0, dy: 14, size: 10, rotate: 8 },
    { dx: -16, dy: 4, size: 9, rotate: -32 },
    { dx: 10, dy: 12, size: 10, rotate: 16 },
  ];
  return patterns.map((p, i) => ({
    ...p,
    color:
      i % 3 === 0
        ? PINK_DEEP[i % PINK_DEEP.length]
        : PINK_TONES[(slotIndex + i) % PINK_TONES.length],
    opacity: 0.38 + ((slotIndex + i) % 5) * 0.11,
  }));
}

function EmptyHeartCluster({ slotIndex, boxSize }: { slotIndex: number; boxSize: number }) {
  const hearts = heartsForEmptySlot(slotIndex);
  return (
    <View style={[styles.emptyCluster, { width: boxSize, height: boxSize }]}>
      {hearts.map((h, i) => (
        <Text
          key={i}
          style={[
            styles.clusterHeart,
            {
              left: boxSize / 2 + h.dx - h.size / 2,
              top: boxSize / 2 + h.dy - h.size / 2,
              fontSize: h.size,
              color: h.color,
              opacity: h.opacity,
              transform: heartGlyphTransform(h.rotate, 'mid'),
            },
          ]}
        >
          ♥
        </Text>
      ))}
      <View style={styles.emptyBadge}>
        <Text style={styles.emptyPlus}>+</Text>
      </View>
    </View>
  );
}

type Props = {
  leaves: MemoryTreeLeaf[];
  loading?: boolean;
};

function buildDisplayLeaves(leaves: MemoryTreeLeaf[]): MemoryTreeLeaf[] {
  const slots: MemoryTreeLeaf[] = [];
  for (let i = 0; i < LEAF_LAYOUT.length; i++) {
    slots.push(leaves[i] ?? { photoUri: null });
  }
  while (slots.length < MEMORY_TREE_LEAF_COUNT && slots.length < LEAF_LAYOUT.length) {
    slots.push({ photoUri: null });
  }
  return slots;
}

export function MemoryLoveTree({ leaves, loading }: Props) {
  const displayLeaves = useMemo(() => buildDisplayLeaves(leaves), [leaves]);
  const balancedDecorHearts = useMemo(() => buildBalancedHearts(), []);

  const onLeafPress = (leaf: MemoryTreeLeaf) => {
    if (leaf.eventDate) {
      router.push({
        pathname: '/calendar/day-detail',
        params: { date: leaf.eventDate, fromHome: '1' },
      });
      return;
    }
    router.push('/calendar/add-event');
  };

  return (
    <View style={styles.wrap}>
      <Svg width="100%" height="100%" viewBox="0 0 280 300" style={styles.treeSvg} pointerEvents="none">
        {renderTrunk(TRUNK_CURVE)}
        {MAIN_BRANCHES.map((curve, bi) =>
          renderSmoothTaperedBranch(curve, `main-${bi}`, MAIN_MAX_WIDTH, MAIN_MIN_WIDTH),
        )}
        {TWIG_BRANCHES.map((curve, ti) =>
          renderSmoothTaperedBranch(curve, `twig-${ti}`, TWIG_MAX_WIDTH, TWIG_MIN_WIDTH),
        )}
      </Svg>

      {balancedDecorHearts.map((h, i) => (
        <View
          key={`decor-${i}`}
          pointerEvents="none"
          style={[
            styles.decorHeartWrap,
            {
              left: h.left,
              top: h.top,
              zIndex: depthZIndex(h.depth),
              transform: heartGlyphTransform(h.rotate, h.depth),
            },
          ]}
        >
          <Text
            style={{
              fontSize: h.size,
              opacity: h.opacity,
              color: h.color,
              includeFontPadding: false,
            }}
          >
            ♥
          </Text>
        </View>
      ))}

      {displayLeaves.map((leaf, index) => {
        const pos = LEAF_LAYOUT[index];
        if (!pos) return null;
        const box = pos.size + 14;
        return (
          <Pressable
            key={`leaf-${index}-${leaf.eventId ?? 'empty'}`}
            style={[
              styles.leaf,
              {
                left: pos.left,
                top: pos.top,
                width: box,
                height: box,
                zIndex: 3 + depthZIndex(pos.depth),
                transform: [{ rotate: `${pos.rotate}deg` }, { scale: depthScale(pos.depth) }],
              },
              loading && styles.leafLoading,
            ]}
            onPress={() => onLeafPress(leaf)}
            accessibilityLabel={
              leaf.photoUri
                ? `Recuerdo ${leaf.eventTitle ?? ''}`
                : 'Hojas de corazón vacías, agregar foto favorita'
            }
          >
            {leaf.photoUri ? (
              <HeartPhoto uri={leaf.photoUri} size={pos.size} minimal />
            ) : (
              <EmptyHeartCluster slotIndex={index} boxSize={box} />
            )}
          </Pressable>
        );
      })}

      {loading ? (
        <View style={styles.loaderPill}>
          <ActivityIndicator size="small" color={colors.primaryPinkDark} />
        </View>
      ) : null}

      <Text style={styles.caption}>
        Toca una hoja para ver el recuerdo o marcar su foto favorita
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 380,
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
    marginTop: -spacing.lg,
    marginBottom: spacing.xs,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  treeSvg: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 36,
    zIndex: 0,
  },
  decorHeartWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderPill: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: radii.pill,
    padding: spacing.xs,
  },
  leaf: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    marginLeft: -7,
    marginTop: -7,
  },
  leafLoading: {
    opacity: 0.85,
  },
  emptyCluster: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterHeart: {
    position: 'absolute',
    includeFontPadding: false,
  },
  emptyBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primaryPinkDark,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  emptyPlus: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
    marginTop: -1,
  },
  caption: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.md,
    right: spacing.md,
    textAlign: 'center',
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
    zIndex: 3,
  },
});
