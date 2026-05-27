import { BaseRepository } from './BaseRepository';
import type { Wish } from '../types/database';

export class WishRepository extends BaseRepository {
  async list(coupleId: string, userId: string, status?: Wish['status']) {
    await this.assertCoupleAccess(coupleId, userId);
    let q = this.client.from('wishes').select('*').eq('couple_id', coupleId);
    if (status) q = q.eq('status', status);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Wish[];
  }

  async create(coupleId: string, userId: string, payload: Omit<Wish, 'id' | 'couple_id' | 'status' | 'fulfilled_at' | 'created_by'>) {
    await this.assertCoupleAccess(coupleId, userId);
    const { data, error } = await this.client
      .from('wishes')
      .insert({ ...payload, couple_id: coupleId, created_by: userId, status: 'pending' })
      .select()
      .single();
    if (error) throw error;
    return data as Wish;
  }

  async markFulfilled(wishId: string, coupleId: string, userId: string) {
    await this.assertCoupleAccess(coupleId, userId);
    const { data, error } = await this.client
      .from('wishes')
      .update({ status: 'fulfilled', fulfilled_at: new Date().toISOString() })
      .eq('id', wishId)
      .select()
      .single();
    if (error) throw error;
    return data as Wish;
  }
}

export const wishRepository = new WishRepository();
