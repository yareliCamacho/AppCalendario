import { BaseRepository } from './BaseRepository';
import type { Milestone } from '../types/database';

export class MilestoneRepository extends BaseRepository {
  async list(coupleId: string, userId: string) {
    await this.assertCoupleAccess(coupleId, userId);
    const { data, error } = await this.client
      .from('milestones')
      .select('*')
      .eq('couple_id', coupleId);
    if (error) throw error;
    return (data ?? []) as Milestone[];
  }

  async upsert(coupleId: string, userId: string, payload: Omit<Milestone, 'id' | 'couple_id'>) {
    await this.assertCoupleAccess(coupleId, userId);
    const { data, error } = await this.client
      .from('milestones')
      .upsert({ ...payload, couple_id: coupleId }, { onConflict: 'couple_id,type' })
      .select()
      .single();
    if (error) throw error;
    return data as Milestone;
  }
}

export const milestoneRepository = new MilestoneRepository();
