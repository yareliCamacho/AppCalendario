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
  'email rate limit exceeded': 'Demasiados intentos de registro. Espera unos minutos antes de intentar de nuevo.',
  'rate limit exceeded': 'Demasiados intentos en poco tiempo. Espera unos minutos e inténtalo nuevamente.',
  over_email_send_rate_limit:
    'Se alcanzó el límite de envío de correos. Espera unos minutos antes de crear otra cuenta.',
  FORBIDDEN: 'No tienes permiso para esta acción',
  invalid_or_expired_code: 'Código inválido o expirado. Pide uno nuevo a tu pareja',
  couple_full: 'Esta pareja ya tiene dos miembros',
  user_already_in_couple: 'Ya perteneces a un espacio de pareja',
  SUPABASE_NOT_CONFIGURED:
    'Configura EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY en frontend/.env (Supabase → Settings → API)',
};

export function mapError(error: unknown): string {
  if (error instanceof AppError) return error.message;
  if (error && typeof error === 'object') {
    const auth = error as { message?: string; code?: string; status?: number };
    const msg = String(auth.message ?? '');
    const normalizedMsg = msg.toLowerCase();
    const code = String(auth.code ?? '').toLowerCase();

    if (code === 'invalid_credentials' || normalizedMsg.includes('invalid login credentials')) {
      return ErrorMessages.INVALID_CREDENTIALS;
    }
    if (normalizedMsg.includes('email not confirmed')) {
      return 'Tu correo aún no está confirmado. Revisa tu bandeja o desactiva la confirmación en Supabase (desarrollo).';
    }
    if (normalizedMsg.includes('password') && normalizedMsg.includes('least')) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }

    for (const [key, text] of Object.entries(ErrorMessages)) {
      if (normalizedMsg.includes(key.toLowerCase()) || code.includes(key.toLowerCase())) return text;
    }
    if (msg) return msg;
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Ocurrió un error inesperado';
}
