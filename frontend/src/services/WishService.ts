import { wishRepository } from '../repositories/WishRepository';
import { notificationService } from './NotificationService';
import type { Wish } from '../types/database';

export class WishService {
  async create(
    coupleId: string,
    userId: string,
    partnerUserId: string,
    payload: Omit<Wish, 'id' | 'couple_id' | 'status' | 'fulfilled_at' | 'created_by'>,
  ) {
    const wish = await wishRepository.create(coupleId, userId, payload);
    await notificationService.notifyPartner({
      coupleId,
      actorId: userId,
      recipientId: partnerUserId,
      type: 'wish',
      title: 'Nuevo deseo',
      body: wish.title,
      entityId: wish.id,
    });
    return wish;
  }

  async fulfill(wishId: string, coupleId: string, userId: string, partnerUserId: string) {
    const wish = await wishRepository.markFulfilled(wishId, coupleId, userId);
    await notificationService.notifyPartner({
      coupleId,
      actorId: userId,
      recipientId: partnerUserId,
      type: 'wish',
      title: 'Deseo cumplido ♥',
      body: wish.title,
      entityId: wish.id,
    });
    return wish;
  }
}

export const wishService = new WishService();
