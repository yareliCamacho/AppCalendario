import { BaseRepository } from './BaseRepository';
import type { Couple, CoupleMember } from '../types/database';
import { generateUuid } from '../utils/uuid';

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
    const { data: rpcCoupleId, error: rpcErr } = await this.client.rpc(
      'create_couple_for_current_user',
      { p_theme_id: themeId ?? null },
    );

    if (!rpcErr && rpcCoupleId) {
      const fromRpc = await this.getCouple(String(rpcCoupleId), userId);
      if (fromRpc) return fromRpc;
    }

    // Sin RPC o sin políticas 006: insert sin .select() (evita RLS en RETURNING)
    const coupleId = generateUuid();
    const today = new Date().toISOString().slice(0, 10);
    const { error: cErr } = await this.client.from('couples').insert({
      id: coupleId,
      tagline: 'Nosotros',
      relationship_start_date: today,
      theme_id: themeId ?? null,
    });
    if (cErr) throw cErr;

    const { error: mErr } = await this.client.from('couple_members').insert({
      couple_id: coupleId,
      user_id: userId,
      role: 'owner',
    });
    if (mErr) throw mErr;

    const couple = await this.getCouple(coupleId, userId);
    if (!couple) {
      throw new Error(
        'Espacio creado pero no se pudo leer. Ejecuta backend/supabase/REPARAR-RLS-COUPLES.sql en Supabase.',
      );
    }
    return couple;
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
