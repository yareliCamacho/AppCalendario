import { BaseRepository } from './BaseRepository';
import type { EventPhoto } from '../types/database';

const BUCKET = 'couple-photos';
const PAGE_SIZE = 20;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export class PhotoRepository extends BaseRepository {
  async listByEvent(
    eventId: string,
    coupleId: string,
    userId: string,
    page = 0,
  ): Promise<EventPhoto[]> {
    await this.assertCoupleAccess(coupleId, userId);
    const from = page * PAGE_SIZE;
    const { data, error } = await this.client
      .from('event_photos')
      .select('*')
      .eq('event_id', eventId)
      .order('sort_order')
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    return (data ?? []) as EventPhoto[];
  }

  async upload(
    localUri: string,
    coupleId: string,
    eventId: string,
    userId: string,
    onProgress?: (percent: number) => void,
  ): Promise<EventPhoto> {
    await this.assertCoupleAccess(coupleId, userId);
    const photoId = generateId();
    const path = `${coupleId}/events/${eventId}/${photoId}.jpg`;

    onProgress?.(5);
    const response = await fetch(localUri);
    const blob = await response.blob();
    onProgress?.(25);

    const { error: upErr } = await this.client.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: 'image/jpeg', upsert: false });
    if (upErr) throw upErr;
    onProgress?.(80);

    const { data, error } = await this.client
      .from('event_photos')
      .insert({
        id: photoId,
        event_id: eventId,
        couple_id: coupleId,
        storage_path: path,
        uploaded_by: userId,
        sort_order: Date.now(),
      })
      .select()
      .single();
    if (error) throw error;
    onProgress?.(100);
    return data as EventPhoto;
  }

  async getSignedUrl(storagePath: string): Promise<string> {
    const { data, error } = await this.client.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 3600);
    if (error) throw error;
    return data.signedUrl;
  }
}

export const photoRepository = new PhotoRepository();
