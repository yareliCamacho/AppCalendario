import { z } from 'zod';

export const signUpSchema = z.object({
  email: z.string().trim().toLowerCase().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  displayName: z.string().trim().min(1, 'Nombre requerido'),
});

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email('Correo inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

export const pairCodeSchema = z
  .string()
  .length(6, 'El código debe tener 6 dígitos')
  .regex(/^\d{6}$/, 'Solo números');

export const eventSchema = z.object({
  title: z.string().min(1, 'Título requerido'),
  event_date: z.string(),
  description: z.string().optional(),
  color: z.string(),
  icon: z.string(),
  reminder_days: z.number().int().min(1).max(15),
  romantic_note: z.string().optional(),
});

export const wishSchema = z.object({
  type: z.enum(['place', 'purchase']),
  title: z.string().min(1),
  description: z.string().optional(),
});

export const goalSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  target_amount: z.number().positive(),
  saved_amount: z.number().min(0),
});
