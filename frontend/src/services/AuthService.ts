import { authRepository } from '../repositories/AuthRepository';
import { AppError } from '../utils/errors';
import { signInSchema, signUpSchema } from '../types/schemas';

function firstZodMessage(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? 'Datos inválidos';
}

export class AuthService {
  async signUp(email: string, password: string, displayName: string) {
    const parsed = signUpSchema.safeParse({ email, password, displayName });
    if (!parsed.success) {
      throw new AppError(firstZodMessage(parsed.error), 'VALIDATION');
    }
    try {
      const data = await authRepository.signUp(
        parsed.data.email,
        parsed.data.password,
        parsed.data.displayName,
      );
      if (!data.session) {
        throw new AppError(
          'Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión. (En desarrollo puedes desactivar la confirmación en Supabase → Auth → Email.)',
          'EMAIL_NOT_CONFIRMED',
        );
      }
      return data;
    } catch (e: unknown) {
      if (e instanceof AppError) throw e;
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('already') || msg.includes('registered')) {
        throw new AppError('Este correo ya está registrado', 'EMAIL_IN_USE');
      }
      throw e;
    }
  }

  async signIn(email: string, password: string) {
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      throw new AppError(firstZodMessage(parsed.error), 'VALIDATION');
    }
    try {
      return await authRepository.signIn(parsed.data.email, parsed.data.password);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message.toLowerCase() : '';

      if (msg.includes('email not confirmed')) {
        throw new AppError(
          'Tu correo aún no está confirmado. Revisa tu bandeja o desactiva confirmación por email en desarrollo.',
          'EMAIL_NOT_CONFIRMED',
        );
      }

      if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
        throw new AppError('Correo o contraseña incorrectos', 'INVALID_CREDENTIALS');
      }

      if (msg.includes('rate limit') || msg.includes('too many requests')) {
        throw new AppError(
          'Demasiados intentos de inicio de sesión. Espera unos minutos e intenta nuevamente.',
          'LOGIN_RATE_LIMIT',
        );
      }

      throw e;
    }
  }

  async signOut() {
    return authRepository.signOut();
  }

  getSession() {
    return authRepository.getSession();
  }

  getUser() {
    return authRepository.getUser();
  }
}

export const authService = new AuthService();
