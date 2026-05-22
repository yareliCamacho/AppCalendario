import { coupleRepository } from '../repositories/CoupleRepository';
import { pairingRepository } from '../repositories/PairingRepository';
import { themeRepository } from '../repositories/ThemeRepository';
import { pairCodeSchema } from '../types/schemas';
import { AppError } from '../utils/errors';

const CODE_TTL_MS = 24 * 60 * 60 * 1000;

function generateSixDigitCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export class PairingService {
  async ensureCoupleForOwner(userId: string) {
    const existing = await coupleRepository.getMembership(userId);
    if (existing) return existing.couple_id;

    const theme = await themeRepository.getDefault();
    const couple = await coupleRepository.createCouple(userId, theme?.id);
    return couple.id;
  }

  async createInviteCode(userId: string, coupleId: string) {
    const code = generateSixDigitCode();
    const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();
    const qrPayload = JSON.stringify({ type: 'couple_pair', code, coupleId });
    return pairingRepository.createPairCode(coupleId, userId, code, qrPayload, expiresAt);
  }

  async joinByCode(code: string) {
    const parsed = pairCodeSchema.safeParse(code);
    if (!parsed.success) {
      throw new AppError('El código debe tener 6 dígitos', 'VALIDATION');
    }
    return pairingRepository.joinByCode(parsed.data);
  }

  getActiveCode(coupleId: string, userId: string) {
    return pairingRepository.getActiveCode(coupleId, userId);
  }
}

export const pairingService = new PairingService();
