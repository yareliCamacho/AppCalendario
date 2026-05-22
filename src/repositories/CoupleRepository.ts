import { BaseRepository } from './BaseRepository';
import type { Couple, CoupleMember } from '../types/database';

export class CoupleRepository extends BaseRepository {
  async getMembership(userId: string): Promise<CoupleMember | null> {
    const { data, error } = await this.client
      .from('couple_members')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data as CoupleMember | null;
  }

  async getCouple(coupleId: string, userId: string): Promise<Couple | null> {
    await this.assertCoupleAccess(coupleId, userId);
    const { data, error } = await this.client
      .from('couples')
      .select('*')
      .eq('id', coupleId)
      .single();
    if (error) throw error;
    return data as Couple;
  }

  async createCouple(userId: string, themeId?: string): Promise<Couple> {
    const { data: couple, error: cErr } = await this.client
      .from('couples')
      .insert({
        tagline: 'Nosotros',
        relationship_start_date: new Date().toISOString().slice(0, 10),
        theme_id: themeId ?? null,
      })
      .select()
      .single();
    if (cErr) throw cErr;

    const { error: mErr } = await this.client.from('couple_members').insert({
      couple_id: couple.id,
      user_id: userId,
      role: 'owner',
    });
    if (mErr) throw mErr;

    return couple as Couple;
  }

  async updateCouple(coupleId: string, userId: string, updates: Partial<Couple>) {
    await this.assertCoupleAccess(coupleId, userId);
    const { data, error } = await this.client
      .from('couples')
      .update(updates)
      .eq('id', coupleId)
      .select()
      .single();
    if (error) throw error;
    return data as Couple;
  }

  async getMembers(coupleId: string, userId: string): Promise<CoupleMember[]> {
    await this.assertCoupleAccess(coupleId, userId);
    const { data, error } = await this.client
      .from('couple_members')
      .select('*')
      .eq('couple_id', coupleId);
    if (error) throw error;
    return (data ?? []) as CoupleMember[];
  }
}

export const coupleRepository = new CoupleRepository();
