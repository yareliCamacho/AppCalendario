import { BaseRepository } from './BaseRepository';
import type { Milestone } from '../types/database';

export class MilestoneRepository extends BaseRepository {
  async list(coupleId: string, userId: string) {
    await this.assertCoupleAccess(coupleId, userId);
    const { data, error } = await this.client
      .from('milestones')
      .select('*')
      .eq('couple_id', coupleId)
      .order('milestone_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Milestone[];
  }

  async listByType(coupleId: string, userId: string, type: Milestone['type']) {
    await this.assertCoupleAccess(coupleId, userId);
    const { data, error } = await this.client
      .from('milestones')
      .select('*')
      .eq('couple_id', coupleId)
      .eq('type', type)
      .order('milestone_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Milestone[];
  }

  async update(
    coupleId: string,
    userId: string,
    id: string,
    payload: Partial<Omit<Milestone, 'id' | 'couple_id'>>,
  ) {
    await this.assertCoupleAccess(coupleId, userId);
    const { data, error } = await this.client
      .from('milestones')
      .update(payload)
      .eq('id', id)
      .eq('couple_id', coupleId)
      .select()
      .single();
    if (error) throw error;
    return data as Milestone;
  }

  async upsert(coupleId: string, userId: string, payload: Omit<Milestone, 'id' | 'couple_id'>) {
    await this.assertCoupleAccess(coupleId, userId);
    if (payload.type === 'last_trip') {
      const { data, error } = await this.client
        .from('milestones')
        .insert({ ...payload, couple_id: coupleId })
        .select()
        .single();
      if (error) throw error;
      return data as Milestone;
    }

    const { data: existing, error: exError } = await this.client
      .from('milestones')
      .select('id')
      .eq('couple_id', coupleId)
      .eq('type', payload.type)
      .maybeSingle();
    if (exError) throw exError;

    if (existing?.id) {
      const { data, error } = await this.client
        .from('milestones')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return data as Milestone;
    }

    const { data, error } = await this.client
      .from('milestones')
      .insert({ ...payload, couple_id: coupleId })
      .select()
      .single();
    if (error) throw error;
    return data as Milestone;
  }
}

export const milestoneRepository = new MilestoneRepository();
