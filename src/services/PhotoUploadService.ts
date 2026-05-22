import { optimizeImage } from '../utils/imageOptimize';
import { photoRepository } from '../repositories/PhotoRepository';
import { notificationService } from './NotificationService';

export class PhotoUploadService {
  async uploadEventPhoto(params: {
    localUri: string;
    coupleId: string;
    eventId: string;
    userId: string;
    partnerUserId: string;
    onProgress?: (percent: number) => void;
  }) {
    const optimized = await optimizeImage(params.localUri);
    params.onProgress?.(15);

    const photo = await photoRepository.upload(
      optimized,
      params.coupleId,
      params.eventId,
      params.userId,
      (p) => params.onProgress?.(15 + Math.round(p * 0.85)),
    );

    await notificationService.notifyPartner({
      coupleId: params.coupleId,
      actorId: params.userId,
      recipientId: params.partnerUserId,
      type: 'photo',
      title: 'Nueva foto',
      body: 'Tu pareja agregó una foto a un recuerdo',
      entityId: photo.id,
    });

    return photo;
  }
}

export const photoUploadService = new PhotoUploadService();
