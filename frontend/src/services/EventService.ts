import { eventRepository } from '../repositories/EventRepository';
import { photoRepository } from '../repositories/PhotoRepository';
import { coupleRepository } from '../repositories/CoupleRepository';
import { notificationRepository } from '../repositories/NotificationRepository';
import { notificationService } from './NotificationService';
import { reminderScheduler } from './ReminderScheduler';
import type { Event } from '../types/database';
import { colors } from '../config/theme';
import { isReminderOnlyEvent } from '../utils/eventKind';

export class EventService {
  async ensureEventForDate(
    coupleId: string,
    userId: string,
    date: string,
    partnerUserId: string | null,
  ): Promise<Event> {
    const existing = await eventRepository.getByDate(coupleId, userId, date);
    if (existing) {
      if (isReminderOnlyEvent(existing)) {
        throw new Error(
          'Este día es un recordatorio. No puedes agregar fotos ni ubicación aquí.',
        );
      }
      return existing;
    }

    return this.createEvent(coupleId, userId, partnerUserId, {
      event_date: date,
      title: `Recuerdo ${date}`,
      description: null,
      color: colors.primaryPink,
      icon: 'heart',
      reminder_days: 3,
      romantic_note: null,
      reminder_only: false,
    });
  }

  async createEvent(
    coupleId: string,
    userId: string,
    partnerUserId: string | null,
    payload: Parameters<typeof eventRepository.create>[2],
  ) {
    const event = await eventRepository.create(coupleId, userId, payload);

    if (event.reminder_only) {
      try {
        await reminderScheduler.scheduleEventReminder(event);
      } catch {
        // Permisos de notificaciones locales no deben bloquear el guardado
      }
    }

    if (partnerUserId) {
      try {
        await notificationService.notifyPartner({
          coupleId,
          actorId: userId,
          recipientId: partnerUserId,
          type: 'event',
          title: 'Nueva fecha especial',
          body: event.title,
          entityId: event.id,
        });
      } catch {
        // La notificación en BD es opcional; el evento ya está guardado
      }
    }

    return event;
  }

  /**
   * Elimina el evento y todo lo enlazado: fotos (BD + Storage), ubicaciones,
   * notificaciones y referencia en foto principal de la pareja si aplica.
   */
  async deleteEvent(coupleId: string, userId: string, eventId: string) {
    const photos = await photoRepository.listAllByEvent(eventId, coupleId, userId);
    const storagePaths = photos.map((p) => p.storage_path);

    const couple = await coupleRepository.getCouple(coupleId, userId);

    await notificationRepository.deleteByEntityId(eventId, coupleId);
    await eventRepository.delete(eventId, coupleId, userId);

    if (couple?.display_photo_path && storagePaths.includes(couple.display_photo_path)) {
      await coupleRepository.updateCouple(coupleId, userId, { display_photo_path: null });
    }

    try {
      await photoRepository.removeStoragePaths(storagePaths);
    } catch {
      // El evento ya no existe en BD; intentar limpiar archivos huérfanos sin bloquear
    }
  }
}

export const eventService = new EventService();
