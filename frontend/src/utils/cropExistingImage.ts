/** Tipos compartidos para recorte de fotos ya cargadas (ver PhotoCropModal). */
export type CropExistingResult =
  | { ok: true; uri: string }
  | { ok: false; reason: 'canceled' | 'unsupported' | 'failed' };

export function cropExistingErrorMessage(
  reason: Exclude<CropExistingResult, { ok: true }>['reason'],
): string {
  switch (reason) {
    case 'unsupported':
      return 'El recorte está disponible en la app del teléfono, no en el navegador.';
    case 'failed':
      return 'No se pudo aplicar el recorte.';
    default:
      return '';
  }
}
