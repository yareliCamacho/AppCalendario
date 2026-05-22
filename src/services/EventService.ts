import { eventRepository } from '../repositories/EventRepository';
import { notificationService } from './NotificationService';
import { reminderScheduler } from './ReminderScheduler';
import type { Event } from '../types/database';
import { colors } from '../config/theme';

export class EventService {
  async ensureEventForDate(
    coupleId: string,
    userId: string,
    date: string,
    partnerUserId: string,
  ): Promise<Event> {
    const existing = await eventRepository.getByDate(coupleId, userId, date);
    if (existing) return existing;

    const event = await eventRepository.create(coupleId, userId, {
      event_date: date,
      title: `Recuerdo ${date}`,
      description: null,
      color: colors.primaryPink,
      icon: 'heart',
      reminder_days: 3,
      romantic_note: null,
    });

    await notificationService.notifyPartner({
      coupleId,
      actorId: userId,
      recipientId: partnerUserId,
      type: 'event',
      title: 'Nueva fecha',
      body: `Se creó un recuerdo para el ${date}`,
      entityId: event.id,
    });

    return event;
  }

  async createEvent(
    coupleId: string,
    userId: string,
    partnerUserId: string,
    payload: Parameters<typeof eventRepository.create>[2],
  ) {
    const event = await eventRepository.create(coupleId, userId, payload);
    await reminderScheduler.scheduleEventReminder(event);
    await notificationService.notifyPartner({
      coupleId,
      actorId: userId,
      recipientId: partnerUserId,
      type: 'event',
      title: 'Nueva fecha especial',
      body: event.title,
      entityId: event.id,
    });
    return event;
  }
}

export const eventService = new EventService();
