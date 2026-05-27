import { coupleRepository } from '../repositories/CoupleRepository';
import { eventRepository } from '../repositories/EventRepository';
import { photoRepository } from '../repositories/PhotoRepository';
import { goalRepository } from '../repositories/GoalRepository';
import { wishRepository } from '../repositories/WishRepository';
import { locationRepository } from '../repositories/LocationRepository';
import {
  MEMORY_TREE_LEAF_COUNT,
  type MemoryTreeLeaf,
} from '../types/memoryTree';
import { supabase } from '../config/supabase';
import { shouldRotateHomeMessage } from '../utils/homeMessage';
import { calculateDaysTogether } from '../utils/daysTogether';
import { getUpcomingSpecialDates, pickRecentMemory } from '../utils/specialDates';

export class HomeService {
  /** Hojas del árbol: favorita por día de recuerdo + corazones vacíos de reserva */
  async getMemoryTreeLeaves(coupleId: string, userId: string): Promise<MemoryTreeLeaf[]> {
    const events = await eventRepository.listRecent(coupleId, userId, MEMORY_TREE_LEAF_COUNT);
    const leaves: MemoryTreeLeaf[] = [];

    for (const event of events) {
      const photo = await photoRepository.getFavoriteForEvent(event.id, coupleId, userId);
      let photoUri: string | null = null;
      if (photo) {
        try {
          photoUri = await photoRepository.getSignedUrl(photo.storage_path);
        } catch {
          photoUri = null;
        }
      }
      leaves.push({
        eventId: event.id,
        eventDate: event.event_date,
        eventTitle: event.title,
        photoUri,
      });
    }

    while (leaves.length < MEMORY_TREE_LEAF_COUNT) {
      leaves.push({ photoUri: null });
    }

    return leaves.slice(0, MEMORY_TREE_LEAF_COUNT);
  }

  async getDashboard(coupleId: string, userId: string) {
    const couple = await coupleRepository.getCouple(coupleId, userId);
    if (!couple) throw new Error('Pareja no encontrada');
    const now = new Date();
    const todayIso = now.toISOString().slice(0, 10);
    const events = await eventRepository.listByMonth(
      coupleId,
      userId,
      now.getFullYear(),
      now.getMonth() + 1,
    );
    const futureEvents = await eventRepository.listFromDate(coupleId, userId, todayIso);
    const upcomingSpecial = getUpcomingSpecialDates(
      couple.relationship_start_date,
      futureEvents,
      todayIso,
    );

    const pastEvents = await eventRepository.listBeforeDate(coupleId, userId, todayIso, 24);
    const photoFlags = new Map<string, boolean>();
    await Promise.all(
      pastEvents.map(async (e) => {
        const photos = await photoRepository.listByEvent(e.id, coupleId, userId, 0);
        photoFlags.set(e.id, photos.length > 0);
      }),
    );
    const recentEvent = pickRecentMemory(pastEvents, (id) => photoFlags.get(id) ?? false);

    const goals = await goalRepository.list(coupleId, userId);
    const wishes = await wishRepository.list(coupleId, userId, 'pending');

    let homeMessage = 'Cada día contigo es un regalo.';
    if (shouldRotateHomeMessage(couple.home_message_shown_at)) {
      const { data: messages } = await supabase
        .from('romance_messages')
        .select('id, body')
        .eq('kind', 'home')
        .limit(20);
      if (messages?.length) {
        const pick = messages[Math.floor(Math.random() * messages.length)];
        const safeBody = pick?.body?.trim();
        if (safeBody) {
          homeMessage = safeBody;
          await coupleRepository.updateCouple(coupleId, userId, {
            home_message_id: pick.id,
            home_message_shown_at: new Date().toISOString(),
          });
        }
      }
    }

    const locationsCount = recentEvent
      ? (await locationRepository.listByEvent(recentEvent.id, coupleId, userId)).length
      : 0;

    return {
      homeMessage,
      daysTogether: calculateDaysTogether(couple.relationship_start_date),
      upcomingSpecial,
      upcomingEvent: upcomingSpecial?.sourceEvent ?? null,
      recentEvent,
      eventsCount: events.length,
      goalsCount: goals.length,
      wishesCount: wishes.length,
      locationsCount,
      couple,
    };
  }
}

export const homeService = new HomeService();
