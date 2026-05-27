import { notificationRepository } from '../repositories/NotificationRepository';
import { coupleRepository } from '../repositories/CoupleRepository';

export type NotificationPrefs = {
  event: boolean;
  photo: boolean;
  location: boolean;
  wish: boolean;
  goal: boolean;
  memory: boolean;
};

const DEFAULT_PREFS: NotificationPrefs = {
  event: true,
  photo: true,
  location: true,
  wish: true,
  goal: true,
  memory: true,
};

let prefsCache: NotificationPrefs = { ...DEFAULT_PREFS };

export class NotificationService {
  setPreferences(prefs: Partial<NotificationPrefs>) {
    prefsCache = { ...prefsCache, ...prefs };
  }

  getPreferences() {
    return prefsCache;
  }

  async notifyPartner(params: {
    coupleId: string;
    actorId: string;
    recipientId: string;
    type: keyof NotificationPrefs;
    title: string;
    body: string;
    entityId?: string;
  }) {
    if (!prefsCache[params.type]) return null;

    const members = await coupleRepository.getMembers(params.coupleId, params.actorId);
    if (members.length < 1) return null;

    return notificationRepository.create({
      couple_id: params.coupleId,
      user_id: params.recipientId,
      actor_id: params.actorId,
      type: params.type,
      title: params.title,
      body: params.body,
      entity_id: params.entityId ?? null,
    });
  }
}

export const notificationService = new NotificationService();
