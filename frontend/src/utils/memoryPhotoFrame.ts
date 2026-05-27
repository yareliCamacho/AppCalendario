import { contentMaxWidth, spacing } from '../config/theme';

/** Misma proporción que el carrusel de Recuerdos del día (alto / ancho). */
export const MEMORY_PHOTO_HEIGHT_RATIO = 0.88;

export type PhotoFrameSize = { width: number; height: number };

/** Marco visible al recortar y en el carrusel (mismas dimensiones en pantalla). */
export function getMemoryPhotoFrameSize(
  screenWidth: number,
  screenHeight: number,
): PhotoFrameSize {
  const width = Math.min(screenWidth - spacing.md * 2, contentMaxWidth);
  const byRatio = Math.round(width * MEMORY_PHOTO_HEIGHT_RATIO);
  const maxH = Math.round(screenHeight * 0.38);
  const height = Math.min(byRatio, maxH, 300);
  return { width, height };
}
