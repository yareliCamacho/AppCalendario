import { BaseRepository } from './BaseRepository';
import type { EventLocation } from '../types/database';

export class LocationRepository extends BaseRepository {
  async listByEvent(eventId: string, coupleId: string, userId: string) {
    await this.assertCoupleAccess(coupleId, userId);
    const { data, error } = await this.client
      .from('event_locations')
      .select('*')
      .eq('event_id', eventId);
    if (error) throw error;
    return (data ?? []) as EventLocation[];
  }

  async create(
    eventId: string,
    coupleId: string,
    userId: string,
    payload: Omit<EventLocation, 'id' | 'event_id'>,
  ) {
    await this.assertCoupleAccess(coupleId, userId);
    const { data, error } = await this.client
      .from('event_locations')
      .insert({ ...payload, event_id: eventId })
      .select()
      .single();
    if (error) throw error;
    return data as EventLocation;
  }
}

export const locationRepository = new LocationRepository();
