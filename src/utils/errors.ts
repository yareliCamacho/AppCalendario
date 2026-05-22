export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const ErrorMessages: Record<string, string> = {
  INVALID_CREDENTIALS: 'Correo o contraseña incorrectos',
  EMAIL_IN_USE: 'Este correo ya está registrado',
  FORBIDDEN: 'No tienes permiso para esta acción',
  invalid_or_expired_code: 'Código inválido o expirado. Pide uno nuevo a tu pareja',
  couple_full: 'Esta pareja ya tiene dos miembros',
  user_already_in_couple: 'Ya perteneces a un espacio de pareja',
  SUPABASE_NOT_CONFIGURED: 'Configura EXPO_PUBLIC_SUPABASE_URL y ANON_KEY en .env',
};

export function mapError(error: unknown): string {
  if (error instanceof AppError) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = String((error as { message: string }).message);
    for (const [key, text] of Object.entries(ErrorMessages)) {
      if (msg.includes(key)) return text;
    }
    return msg;
  }
  return 'Ocurrió un error inesperado';
}
