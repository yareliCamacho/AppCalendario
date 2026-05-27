import { BaseRepository } from './BaseRepository';
import type { Goal } from '../types/database';

export class GoalRepository extends BaseRepository {
  async list(coupleId: string, userId: string) {
    await this.assertCoupleAccess(coupleId, userId);
    const { data, error } = await this.client
      .from('goals')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Goal[];
  }

  async create(coupleId: string, userId: string, payload: Omit<Goal, 'id' | 'couple_id' | 'created_by'>) {
    await this.assertCoupleAccess(coupleId, userId);
    const { data, error } = await this.client
      .from('goals')
      .insert({ ...payload, couple_id: coupleId, created_by: userId })
      .select()
      .single();
    if (error) throw error;
    return data as Goal;
  }

  async updateSaved(goalId: string, coupleId: string, userId: string, savedAmount: number) {
    await this.assertCoupleAccess(coupleId, userId);
    const { data, error } = await this.client
      .from('goals')
      .update({ saved_amount: savedAmount })
      .eq('id', goalId)
      .select()
      .single();
    if (error) throw error;
    return data as Goal;
  }
}

export const goalRepository = new GoalRepository();
