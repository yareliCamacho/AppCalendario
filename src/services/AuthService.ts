import { authRepository } from '../repositories/AuthRepository';
import { AppError } from '../utils/errors';
import { signInSchema, signUpSchema } from '../types/schemas';

export class AuthService {
  async signUp(email: string, password: string, displayName: string) {
    const parsed = signUpSchema.safeParse({ email, password, displayName });
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0]?.message ?? 'Datos inválidos', 'VALIDATION');
    }
    try {
      return await authRepository.signUp(
        parsed.data.email,
        parsed.data.password,
        parsed.data.displayName,
      );
    } catch (e: unknown) {
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
      throw new AppError(parsed.error.errors[0]?.message ?? 'Datos inválidos', 'VALIDATION');
    }
    try {
      return await authRepository.signIn(parsed.data.email, parsed.data.password);
    } catch {
      throw new AppError('Correo o contraseña incorrectos', 'INVALID_CREDENTIALS');
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
