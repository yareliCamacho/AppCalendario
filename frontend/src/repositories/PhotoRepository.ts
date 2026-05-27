import { BaseRepository } from './BaseRepository';
import type { EventPhoto } from '../types/database';
import { readFileAsArrayBuffer } from '../utils/readFileBytes';
import { optimizeImage } from '../utils/imageOptimize';
import { generateUuid } from '../utils/uuid';

const BUCKET = 'couple-photos';
const PAGE_SIZE = 20;

export class PhotoRepository extends BaseRepository {
  async listAllByEvent(eventId: string, coupleId: string, userId: string): Promise<EventPhoto[]> {
    const all: EventPhoto[] = [];
    let page = 0;
    for (;;) {
      const batch = await this.listByEvent(eventId, coupleId, userId, page);
      if (!batch.length) break;
      all.push(...batch);
      if (batch.length < PAGE_SIZE) break;
      page += 1;
    }
    return all;
  }

  async removeStoragePaths(paths: string[]): Promise<void> {
    if (!paths.length) return;
    const unique = [...new Set(paths)];
    const { error } = await this.client.storage.from(BUCKET).remove(unique);
    if (error) throw error;
  }

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
    const photoId = generateUuid();
    const path = `${coupleId}/events/${eventId}/${photoId}.jpg`;

    onProgress?.(5);
    const bytes = await readFileAsArrayBuffer(localUri);
    onProgress?.(25);

    const { error: upErr } = await this.client.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
    if (upErr) throw upErr;
    onProgress?.(80);

    const { data: lastPhoto } = await this.client
      .from('event_photos')
      .select('sort_order')
      .eq('event_id', eventId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const sortOrder = (lastPhoto?.sort_order ?? 0) + 1;

    const { data, error } = await this.client
      .from('event_photos')
      .insert({
        id: photoId,
        event_id: eventId,
        couple_id: coupleId,
        storage_path: path,
        uploaded_by: userId,
        sort_order: sortOrder,
      })
      .select()
      .single();
    if (error) throw error;
    onProgress?.(100);
    return data as EventPhoto;
  }

  async uploadMilestonePhoto(
    localUri: string,
    coupleId: string,
    milestoneType: string,
    userId: string,
    milestoneId?: string,
  ): Promise<string> {
    await this.assertCoupleAccess(coupleId, userId);
    const photoId = generateUuid();
    const folder = milestoneId ?? milestoneType;
    const path = `${coupleId}/milestones/${folder}/${photoId}.jpg`;
    const bytes = await readFileAsArrayBuffer(localUri);

    const { error } = await this.client.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
    if (error) throw error;
    return path;
  }

  async replaceEventPhoto(
    photoId: string,
    eventId: string,
    coupleId: string,
    userId: string,
    localUri: string,
  ): Promise<EventPhoto> {
    await this.assertCoupleAccess(coupleId, userId);
    const { data: existing, error: fetchErr } = await this.client
      .from('event_photos')
      .select('*')
      .eq('id', photoId)
      .eq('event_id', eventId)
      .eq('couple_id', coupleId)
      .single();
    if (fetchErr) throw fetchErr;

    const optimized = await optimizeImage(localUri);
    const bytes = await readFileAsArrayBuffer(optimized);
    const { error: upErr } = await this.client.storage
      .from(BUCKET)
      .upload(existing.storage_path, bytes, { contentType: 'image/jpeg', upsert: true });
    if (upErr) throw upErr;
    return existing as EventPhoto;
  }

  async updatePhotoLocation(
    photoId: string,
    eventId: string,
    coupleId: string,
    userId: string,
    locationId: string | null,
  ): Promise<EventPhoto> {
    await this.assertCoupleAccess(coupleId, userId);
    const { data, error } = await this.client
      .from('event_photos')
      .update({ location_id: locationId })
      .eq('id', photoId)
      .eq('event_id', eventId)
      .eq('couple_id', coupleId)
      .select()
      .single();
    if (error) throw error;
    return data as EventPhoto;
  }

  async deleteEventPhoto(
    photoId: string,
    eventId: string,
    coupleId: string,
    userId: string,
  ): Promise<void> {
    await this.assertCoupleAccess(coupleId, userId);
    const { data: photo, error: fetchErr } = await this.client
      .from('event_photos')
      .select('*')
      .eq('id', photoId)
      .eq('event_id', eventId)
      .eq('couple_id', coupleId)
      .single();
    if (fetchErr) throw fetchErr;

    await this.removeStoragePaths([photo.storage_path]);
    const { error: delErr } = await this.client
      .from('event_photos')
      .delete()
      .eq('id', photoId);
    if (delErr) throw delErr;

    const { data: couple } = await this.client
      .from('couples')
      .select('display_photo_path')
      .eq('id', coupleId)
      .maybeSingle();
    if (couple?.display_photo_path === photo.storage_path) {
      await this.client
        .from('couples')
        .update({ display_photo_path: null })
        .eq('id', coupleId);
    }
  }

  async setFavorite(
    photoId: string,
    eventId: string,
    coupleId: string,
    userId: string,
  ): Promise<EventPhoto> {
    await this.assertCoupleAccess(coupleId, userId);

    const { error: clearErr } = await this.client
      .from('event_photos')
      .update({ is_favorite: false })
      .eq('event_id', eventId)
      .eq('couple_id', coupleId);
    if (clearErr) throw clearErr;

    const { data, error } = await this.client
      .from('event_photos')
      .update({ is_favorite: true })
      .eq('id', photoId)
      .eq('event_id', eventId)
      .select()
      .single();
    if (error) throw error;

    await this.client
      .from('couples')
      .update({ display_photo_path: data.storage_path })
      .eq('id', coupleId);

    return data as EventPhoto;
  }

  /** Solo la foto marcada como favorita del evento */
  async getFavoriteForEvent(
    eventId: string,
    coupleId: string,
    userId: string,
  ): Promise<EventPhoto | null> {
    await this.assertCoupleAccess(coupleId, userId);
    const { data, error } = await this.client
      .from('event_photos')
      .select('*')
      .eq('event_id', eventId)
      .eq('couple_id', coupleId)
      .eq('is_favorite', true)
      .maybeSingle();
    if (error) throw error;
    return (data as EventPhoto | null) ?? null;
  }

  /** Favorita del día; si no hay, la primera foto del evento */
  async getFeaturedForEvent(
    eventId: string,
    coupleId: string,
    userId: string,
  ): Promise<EventPhoto | null> {
    await this.assertCoupleAccess(coupleId, userId);
    const { data: favorite, error: favErr } = await this.client
      .from('event_photos')
      .select('*')
      .eq('event_id', eventId)
      .eq('couple_id', coupleId)
      .eq('is_favorite', true)
      .maybeSingle();
    if (favErr) throw favErr;
    if (favorite) return favorite as EventPhoto;

    const { data: first, error } = await this.client
      .from('event_photos')
      .select('*')
      .eq('event_id', eventId)
      .eq('couple_id', coupleId)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return (first as EventPhoto | null) ?? null;
  }

  async listRecentForCouple(coupleId: string, userId: string, limit = 40): Promise<EventPhoto[]> {
    await this.assertCoupleAccess(coupleId, userId);
    const { data, error } = await this.client
      .from('event_photos')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as EventPhoto[];
  }

  async uploadCoupleDisplayPhoto(
    localUri: string,
    coupleId: string,
    userId: string,
  ): Promise<string> {
    await this.assertCoupleAccess(coupleId, userId);
    const photoId = generateUuid();
    const path = `${coupleId}/profile/${photoId}.jpg`;
    const bytes = await readFileAsArrayBuffer(localUri);

    const { error: upErr } = await this.client.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
    if (upErr) throw upErr;

    const { error } = await this.client
      .from('couples')
      .update({ display_photo_path: path })
      .eq('id', coupleId);
    if (error) throw error;
    return path;
  }

  async setCoupleDisplayPhoto(
    storagePath: string,
    coupleId: string,
    userId: string,
  ): Promise<void> {
    await this.assertCoupleAccess(coupleId, userId);
    const { error } = await this.client
      .from('couples')
      .update({ display_photo_path: storagePath })
      .eq('id', coupleId);
    if (error) throw error;
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
