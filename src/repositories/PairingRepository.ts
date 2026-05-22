import { BaseRepository } from './BaseRepository';
import type { PairCode } from '../types/database';

export class PairingRepository extends BaseRepository {
  async createPairCode(
    coupleId: string,
    userId: string,
    code: string,
    qrPayload: string,
    expiresAt: string,
  ): Promise<PairCode> {
    await this.assertCoupleAccess(coupleId, userId);
    const { data, error } = await this.client
      .from('pair_codes')
      .insert({
        couple_id: coupleId,
        code,
        qr_payload: qrPayload,
        created_by: userId,
        expires_at: expiresAt,
      })
      .select()
      .single();
    if (error) throw error;
    return data as PairCode;
  }

  async joinByCode(code: string): Promise<string> {
    const { data, error } = await this.client.rpc('join_couple_by_code', {
      p_code: code,
    });
    if (error) throw error;
    return data as string;
  }

  async getActiveCode(coupleId: string, userId: string): Promise<PairCode | null> {
    await this.assertCoupleAccess(coupleId, userId);
    const { data, error } = await this.client
      .from('pair_codes')
      .select('*')
      .eq('couple_id', coupleId)
      .is('consumed_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as PairCode | null;
  }
}

export const pairingRepository = new PairingRepository();
