import { BaseRepository } from './BaseRepository';
import type { Event } from '../types/database';
import { pickPreferredDayEvent } from '../utils/eventKind';

export class EventRepository extends BaseRepository {
  async listRecent(coupleId: string, userId: string, limit = 30) {
    await this.assertCoupleAccess(coupleId, userId);
    const { data, error } = await this.client
      .from('events')
      .select('*')
      .eq('couple_id', coupleId)
      .order('event_date', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as Event[];
  }

  async listFromDate(coupleId: string, userId: string, fromDate: string, limit = 60) {
    await this.assertCoupleAccess(coupleId, userId);
    const { data, error } = await this.client
      .from('events')
      .select('*')
      .eq('couple_id', coupleId)
      .gte('event_date', fromDate)
      .order('event_date', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as Event[];
  }

  async listBeforeDate(coupleId: string, userId: string, beforeDate: string, limit = 30) {
    await this.assertCoupleAccess(coupleId, userId);
    const { data, error } = await this.client
      .from('events')
      .select('*')
      .eq('couple_id', coupleId)
      .lt('event_date', beforeDate)
      .order('event_date', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as Event[];
  }

  async listByMonth(coupleId: string, userId: string, year: number, month: number) {
    await this.assertCoupleAccess(coupleId, userId);
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const end = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

    const { data, error } = await this.client
      .from('events')
      .select('*')
      .eq('couple_id', coupleId)
      .gte('event_date', start)
      .lt('event_date', end)
      .order('event_date');
    if (error) throw error;
    return (data ?? []) as Event[];
  }

  async getById(eventId: string, coupleId: string, userId: string) {
    await this.assertCoupleAccess(coupleId, userId);
    const { data, error } = await this.client
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('couple_id', coupleId)
      .maybeSingle();
    if (error) throw error;
    return data as Event | null;
  }

  async getByDate(coupleId: string, userId: string, date: string) {
    await this.assertCoupleAccess(coupleId, userId);
    const { data, error } = await this.client
      .from('events')
      .select('*')
      .eq('couple_id', coupleId)
      .eq('event_date', date)
      .order('created_at', { ascending: false });
    if (error) throw error;
    const rows = (data ?? []) as Event[];
    return pickPreferredDayEvent(rows) ?? null;
  }

  async create(coupleId: string, userId: string, payload: Omit<Event, 'id' | 'couple_id' | 'created_by'>) {
    await this.assertCoupleAccess(coupleId, userId);
    const { data, error } = await this.client
      .from('events')
      .insert({ ...payload, couple_id: coupleId, created_by: userId })
      .select()
      .single();
    if (error) throw error;
    return data as Event;
  }

  async update(eventId: string, coupleId: string, userId: string, updates: Partial<Event>) {
    await this.assertCoupleAccess(coupleId, userId);
    const { data, error } = await this.client
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .eq('couple_id', coupleId)
      .select()
      .single();
    if (error) throw error;
    return data as Event;
  }

  async delete(eventId: string, coupleId: string, userId: string) {
    await this.assertCoupleAccess(coupleId, userId);
    const { error } = await this.client
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('couple_id', coupleId);
    if (error) throw error;
  }
}

export const eventRepository = new EventRepository();
