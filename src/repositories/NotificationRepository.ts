import { BaseRepository } from './BaseRepository';
import type { Notification } from '../types/database';

export class NotificationRepository extends BaseRepository {
  async listForUser(userId: string, page = 0, pageSize = 20) {
    const from = page * pageSize;
    const { data, error } = await this.client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    return (data ?? []) as Notification[];
  }

  async markRead(notificationId: string, userId: string) {
    const { error } = await this.client
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId);
    if (error) throw error;
  }

  async create(payload: Omit<Notification, 'id' | 'read_at' | 'push_sent_at' | 'created_at'>) {
    const { data, error } = await this.client
      .from('notifications')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as Notification;
  }
}

export const notificationRepository = new NotificationRepository();
